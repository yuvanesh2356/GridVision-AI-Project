"""
GridVision AI - services/analysis_service.py
Workflow coordination only: assembling report data, formatting maintenance
tickets, and exposing trend/timeline queries to routes. All underlying
decision logic (severity, health score, predictive maintenance,
explainability, recommendations) lives in vision_engine/intelligence.py -
this module calls into it, it does not duplicate it.
"""

from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

import config
import helpers
from models import Asset, Inspection, Finding, Alert, MaintenanceTicket
from vision_engine import intelligence


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
def build_report_data(db: Session, inspection_id: int) -> Optional[dict]:
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        return None

    asset = db.query(Asset).filter(Asset.id == inspection.asset_id).first() if inspection.asset_id else None
    findings = db.query(Finding).filter(Finding.inspection_id == inspection.id).all()

    recommendation = intelligence.recommend_maintenance_action(inspection.overall_severity)

    return {
        "inspection_id": inspection.id,
        "asset_name": asset.name if asset else "Unassigned",
        "created_at": inspection.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        "overall_severity": inspection.overall_severity,
        "grid_health_score": inspection.grid_health_score,
        "recommendation": recommendation,
        "findings": [
            {
                "component": f.component,
                "defect_type": f.defect_type,
                "confidence": f.confidence,
                "severity": f.severity,
                "explanation": f.explanation,
            }
            for f in findings
        ],
    }


def generate_report_pdf(db: Session, inspection_id: int) -> Optional[Path]:
    report_data = build_report_data(db, inspection_id)
    if report_data is None:
        return None
    return helpers.render_inspection_report_pdf(report_data)


# ---------------------------------------------------------------------------
# Maintenance tickets
# ---------------------------------------------------------------------------
def create_maintenance_ticket(
    db: Session, inspection_id: int, priority: Optional[str] = None
) -> Optional[MaintenanceTicket]:
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        return None

    resolved_priority = priority or intelligence.recommend_maintenance_action(
        inspection.overall_severity
    )

    ticket = MaintenanceTicket(
        inspection_id=inspection.id,
        priority=resolved_priority,
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
def list_alerts(db: Session, status: Optional[str] = None, severity: Optional[str] = None):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    return query.order_by(Alert.created_at.desc()).all()


def update_alert_status(db: Session, alert_id: int, status: str) -> Optional[Alert]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None
    alert.status = status
    db.commit()
    db.refresh(alert)
    return alert


# ---------------------------------------------------------------------------
# Timeline Comparison / Predictive Maintenance
# ---------------------------------------------------------------------------
def build_timeline(db: Session, asset_id: int) -> Optional[dict]:
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        return None

    inspections = (
        db.query(Inspection)
        .filter(Inspection.asset_id == asset_id)
        .order_by(Inspection.created_at.asc())
        .all()
    )

    points = []
    health_scores = []
    severities = []
    for insp in inspections:
        defect_count = (
            db.query(Finding).filter(Finding.inspection_id == insp.id).count()
        )
        points.append(
            {
                "date": insp.created_at,
                "health_score": insp.grid_health_score,
                "severity": insp.overall_severity,
                "defect_count": defect_count,
                "tilt_angle": insp.tilt_angle,
                "sag_ratio": insp.sag_ratio,
            }
        )
        health_scores.append(insp.grid_health_score)
        severities.append(insp.overall_severity)

    predicted_failure_days = intelligence.predict_failure_window_days(health_scores)

    return {
        "asset_id": asset.id,
        "asset_name": asset.name,
        "points": points,
        "health_score_trend": health_scores,
        "severity_trend": severities,
        "predicted_failure_days": predicted_failure_days,
    }


# ---------------------------------------------------------------------------
# Dashboard aggregates
# ---------------------------------------------------------------------------
def get_dashboard_summary(db: Session) -> dict:
    from datetime import datetime, timedelta

    assets = db.query(Asset).all()
    grid_health_avg = (
        round(sum(a.health_score for a in assets) / len(assets), 1) if assets else 0.0
    )

    critical_alerts = (
        db.query(Alert)
        .filter(Alert.severity == "Critical", Alert.status == "new")
        .count()
    )

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    todays_inspections = (
        db.query(Inspection).filter(Inspection.created_at >= today_start).count()
    )

    return {
        "grid_health_avg": grid_health_avg,
        "total_assets": len(assets),
        "critical_alerts": critical_alerts,
        "todays_inspections": todays_inspections,
    }


def get_risk_heatmap(db: Session) -> list:
    assets = db.query(Asset).all()
    return [
        {
            "asset_id": a.id,
            "asset_name": a.name,
            "asset_type": a.type,
            "lat": a.lat,
            "lng": a.lng,
            "risk_score": round(100.0 - a.health_score, 1),
            "health_score": round(a.health_score, 1),
        }
        for a in assets
    ]
