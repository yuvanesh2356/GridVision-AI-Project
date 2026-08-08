"""
GridVision AI - Seed Data
Seeds realistic demo assets with multi-month inspection history so
Timeline Comparison and Predictive Maintenance work immediately, without
any live inference. Tower 45 carries a deliberate deterioration arc that
serves as the demo centerpiece.
"""

from datetime import datetime, date, timedelta

from database import SessionLocal
from models import Asset, Inspection, Finding


def _month_ago(months_back: int) -> datetime:
    # Approximate month subtraction (30-day steps) - fine for demo seed data.
    return datetime.utcnow() - timedelta(days=30 * months_back)


def _seed_asset_with_history(db, *, type_, name, lat, lng, install_years_ago, history):
    """
    history: list of dicts, oldest first, each with keys:
        months_ago, health_score, severity, tilt_angle, sag_ratio,
        defect_count, defect_type (optional), component (optional)
    """
    asset = Asset(
        type=type_,
        name=name,
        lat=lat,
        lng=lng,
        install_date=date.today() - timedelta(days=365 * install_years_ago),
        health_score=history[-1]["health_score"],
    )
    db.add(asset)
    db.flush()  # populate asset.id

    for point in history:
        inspection = Inspection(
            asset_id=asset.id,
            image_path=None,
            annotated_image_path=None,
            lat=lat,
            lng=lng,
            overall_severity=point["severity"],
            grid_health_score=point["health_score"],
            tilt_angle=point.get("tilt_angle"),
            sag_ratio=point.get("sag_ratio"),
            vegetation_clearance_m=point.get("vegetation_clearance_m"),
            created_at=_month_ago(point["months_ago"]),
        )
        db.add(inspection)
        db.flush()

        for _ in range(point.get("defect_count", 0)):
            db.add(
                Finding(
                    inspection_id=inspection.id,
                    defect_type=point.get("defect_type", "rust"),
                    component=point.get("component", "tower"),
                    confidence=0.75,
                    severity=point["severity"],
                    bbox=None,
                    explanation=(
                        f"{point.get('defect_type', 'rust').replace('_', ' ').title()} "
                        f"detected during routine inspection."
                    ),
                )
            )

    return asset


def seed_if_empty():
    """Idempotent seeding: only runs if the assets table is empty."""
    db = SessionLocal()
    try:
        if db.query(Asset).count() > 0:
            return

        # Tower 12 - stable, healthy baseline
        _seed_asset_with_history(
            db,
            type_="tower",
            name="Tower 12",
            lat=13.0080,
            lng=79.9530,
            install_years_ago=6,
            history=[
                {"months_ago": 3, "health_score": 95, "severity": "Low", "tilt_angle": 0.8, "sag_ratio": 0.03, "defect_count": 1, "defect_type": "rust", "component": "tower"},
                {"months_ago": 2, "health_score": 94, "severity": "Low", "tilt_angle": 0.9, "sag_ratio": 0.03, "defect_count": 1, "defect_type": "rust", "component": "tower"},
                {"months_ago": 1, "health_score": 93, "severity": "Low", "tilt_angle": 0.9, "sag_ratio": 0.04, "defect_count": 1, "defect_type": "rust", "component": "tower"},
                {"months_ago": 0, "health_score": 92, "severity": "Low", "tilt_angle": 1.0, "sag_ratio": 0.04, "defect_count": 1, "defect_type": "rust", "component": "tower"},
            ],
        )

        # Tower 24 - mild, slow decline
        _seed_asset_with_history(
            db,
            type_="tower",
            name="Tower 24",
            lat=13.0125,
            lng=79.9601,
            install_years_ago=9,
            history=[
                {"months_ago": 3, "health_score": 90, "severity": "Low", "tilt_angle": 1.5, "sag_ratio": 0.05, "defect_count": 1, "defect_type": "rust", "component": "tower"},
                {"months_ago": 2, "health_score": 87, "severity": "Low", "tilt_angle": 1.8, "sag_ratio": 0.06, "defect_count": 2, "defect_type": "rust", "component": "tower"},
                {"months_ago": 1, "health_score": 84, "severity": "Medium", "tilt_angle": 2.1, "sag_ratio": 0.06, "defect_count": 2, "defect_type": "corrosion", "component": "tower"},
                {"months_ago": 0, "health_score": 81, "severity": "Medium", "tilt_angle": 2.4, "sag_ratio": 0.07, "defect_count": 2, "defect_type": "corrosion", "component": "tower"},
            ],
        )

        # Tower 31 - stable control example, contrasts with Tower 45
        _seed_asset_with_history(
            db,
            type_="tower",
            name="Tower 31",
            lat=13.0042,
            lng=79.9455,
            install_years_ago=4,
            history=[
                {"months_ago": 3, "health_score": 97, "severity": "Low", "tilt_angle": 0.5, "sag_ratio": 0.02, "defect_count": 0},
                {"months_ago": 2, "health_score": 97, "severity": "Low", "tilt_angle": 0.5, "sag_ratio": 0.02, "defect_count": 0},
                {"months_ago": 1, "health_score": 96, "severity": "Low", "tilt_angle": 0.6, "sag_ratio": 0.02, "defect_count": 0},
                {"months_ago": 0, "health_score": 96, "severity": "Low", "tilt_angle": 0.6, "sag_ratio": 0.02, "defect_count": 0},
            ],
        )

        # Tower 45 - THE demo centerpiece: deliberate deterioration arc
        _seed_asset_with_history(
            db,
            type_="tower",
            name="Tower 45",
            lat=13.0198,
            lng=79.9702,
            install_years_ago=14,
            history=[
                {"months_ago": 3, "health_score": 96, "severity": "Low", "tilt_angle": 1.3, "sag_ratio": 0.04, "defect_count": 1, "defect_type": "rust", "component": "tower"},       # March
                {"months_ago": 2, "health_score": 91, "severity": "Medium", "tilt_angle": 2.1, "sag_ratio": 0.06, "defect_count": 2, "defect_type": "rust", "component": "tower"},   # April
                {"months_ago": 1, "health_score": 82, "severity": "High", "tilt_angle": 3.6, "sag_ratio": 0.09, "defect_count": 3, "defect_type": "crack", "component": "tower"},    # May
                {"months_ago": 0, "health_score": 68, "severity": "High", "tilt_angle": 5.9, "sag_ratio": 0.13, "defect_count": 4, "defect_type": "crack", "component": "tower"},    # June
            ],
        )

        # Transformer A - stable
        _seed_asset_with_history(
            db,
            type_="transformer",
            name="Transformer A",
            lat=13.0155,
            lng=79.9488,
            install_years_ago=8,
            history=[
                {"months_ago": 3, "health_score": 94, "severity": "Low", "defect_count": 0},
                {"months_ago": 2, "health_score": 93, "severity": "Low", "defect_count": 0},
                {"months_ago": 1, "health_score": 93, "severity": "Low", "defect_count": 1, "defect_type": "rust", "component": "transformer"},
                {"months_ago": 0, "health_score": 92, "severity": "Low", "defect_count": 1, "defect_type": "rust", "component": "transformer"},
            ],
        )

        # Transformer B - minor oil-leak trend, moderate decline
        _seed_asset_with_history(
            db,
            type_="transformer",
            name="Transformer B",
            lat=13.0210,
            lng=79.9560,
            install_years_ago=11,
            history=[
                {"months_ago": 3, "health_score": 88, "severity": "Low", "defect_count": 1, "defect_type": "corrosion", "component": "transformer"},
                {"months_ago": 2, "health_score": 83, "severity": "Medium", "defect_count": 1, "defect_type": "corrosion", "component": "transformer"},
                {"months_ago": 1, "health_score": 78, "severity": "Medium", "defect_count": 2, "defect_type": "corrosion", "component": "transformer"},
                {"months_ago": 0, "health_score": 73, "severity": "Medium", "defect_count": 2, "defect_type": "corrosion", "component": "transformer"},
            ],
        )

        # Sync each asset's cached health_score to its latest inspection.
        for asset in db.query(Asset).all():
            latest = (
                db.query(Inspection)
                .filter(Inspection.asset_id == asset.id)
                .order_by(Inspection.created_at.desc())
                .first()
            )
            if latest:
                asset.health_score = latest.grid_health_score

        db.commit()
    finally:
        db.close()
