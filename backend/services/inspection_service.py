"""
GridVision AI - services/inspection_service.py
Orchestrator only: sequences calls to the Vision Intelligence Engine and
persists results. Contains zero scoring/decision logic of its own - all
technical judgment lives in vision_engine/intelligence.py.
"""

import logging
from datetime import date
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

import config
import helpers
from models import Asset, Inspection, Finding, Alert
from vision_engine import detector, geometry, intelligence

logger = logging.getLogger(__name__)


def run_inspection_pipeline(
    db: Session,
    file_bytes: bytes,
    original_filename: str,
    asset_id: Optional[int] = None,
) -> Inspection:
    """
    Full pipeline: save upload -> detect assets -> measure infrastructure ->
    interpret damage -> assess risk -> score grid health -> persist ->
    alert if needed. Returns the persisted Inspection ORM object (with
    findings and alert relationships populated).
    """
    # 1. Save upload and load image
    upload_path = helpers.save_upload_bytes(file_bytes, original_filename)
    image = helpers.load_image_bgr(upload_path)

    # 2. Resolve GPS: EXIF first, otherwise fall back to the linked asset's
    #    coordinates (if any) so every inspection has a location.
    gps = helpers.extract_gps_from_exif(upload_path)
    lat, lng = (gps if gps else (None, None))

    asset: Optional[Asset] = None
    if asset_id is not None:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
    elif lat is not None and lng is not None:
        all_assets = db.query(Asset).all()
        asset = helpers.nearest_asset(lat, lng, all_assets)

    if lat is None or lng is None:
        if asset:
            lat, lng = asset.lat, asset.lng
        else:
            lat, lng = 0.0, 0.0

    # 3. Asset Detection
    detections = detector.detect_assets(image)
    logger.info(
        "Asset Detection: %d component(s) found (%s)",
        len(detections),
        ", ".join(sorted({d["component"] for d in detections})) or "none",
    )

    # 4. Infrastructure Measurements (numbers only)
    measurements = geometry.measure_infrastructure(image, detections)
    logger.info(
        "Infrastructure Measurements: tilt=%s sag=%s vegetation_clearance_m=%s",
        measurements["tilt_angle"],
        measurements["sag_ratio"],
        measurements["vegetation_clearance_m"],
    )

    # 5. Condition Analysis (damage interpretation)
    damage_findings = intelligence.interpret_damage(image, detections)
    logger.info("Condition Analysis: %d defect(s) interpreted", len(damage_findings))

    # 6. Risk Assessment (severity per finding + per measurement)
    finding_records = []
    finding_severities = []
    for f in damage_findings:
        severity = intelligence.classify_finding_severity(
            f["defect_type"], f["confidence"]
        )
        explanation = intelligence.explain_finding(
            f["defect_type"], f["component"], f["confidence"], severity
        )
        finding_records.append(
            {
                "defect_type": f["defect_type"],
                "component": f["component"],
                "confidence": f["confidence"],
                "severity": severity,
                "bbox": helpers.bbox_to_json(f["bbox"]),
                "explanation": explanation,
            }
        )
        finding_severities.append(severity)

    measurement_severity = intelligence.classify_measurement_severity(
        measurements["tilt_angle"], measurements["sag_ratio"]
    )
    measurement_explanation = intelligence.explain_measurement(
        measurements["tilt_angle"], measurements["sag_ratio"]
    )
    if measurement_explanation:
        finding_records.append(
            {
                "defect_type": "structural_measurement",
                "component": "tower" if measurements["tilt_angle"] else "conductor",
                "confidence": 0.9,
                "severity": measurement_severity,
                "bbox": None,
                "explanation": measurement_explanation,
            }
        )
        finding_severities.append(measurement_severity)

    overall = intelligence.overall_severity(finding_severities)
    logger.info("Risk Assessment: overall severity = %s", overall)

    # 7. Grid Health Analysis
    asset_age_years = 0.0
    past_faults_count = 0
    if asset and asset.install_date:
        asset_age_years = (date.today() - asset.install_date).days / 365.0
    if asset:
        past_faults_count = (
            db.query(Finding)
            .join(Inspection)
            .filter(Inspection.asset_id == asset.id)
            .count()
        )

    grid_health_score = intelligence.calculate_grid_health_score(
        num_defects=len(finding_records),
        tilt_angle=measurements["tilt_angle"],
        sag_ratio=measurements["sag_ratio"],
        vegetation_clearance_m=measurements["vegetation_clearance_m"],
        asset_age_years=asset_age_years,
        past_faults_count=past_faults_count,
    )
    logger.info("Grid Health Analysis: score = %.1f/100", grid_health_score)

    # 8. Annotate + save image for dashboard display
    annotated = helpers.draw_annotations(image, detections)
    annotated_path = helpers.save_annotated_image(annotated, Path(upload_path).stem)

    # 9. Persist Inspection + Findings
    inspection = Inspection(
        asset_id=asset.id if asset else None,
        image_path=str(upload_path),
        annotated_image_path=str(annotated_path),
        lat=lat,
        lng=lng,
        overall_severity=overall,
        grid_health_score=grid_health_score,
        tilt_angle=measurements["tilt_angle"],
        sag_ratio=measurements["sag_ratio"],
        vegetation_clearance_m=measurements["vegetation_clearance_m"],
    )
    db.add(inspection)
    db.flush()

    for record in finding_records:
        db.add(Finding(inspection_id=inspection.id, **record))

    # Keep the asset's cached health score current.
    if asset:
        asset.health_score = grid_health_score

    # 10. Alert if severity crosses the trigger threshold
    if overall in config.ALERT_TRIGGER_SEVERITIES:
        message = (
            f"{overall} severity issue detected on "
            f"{asset.name if asset else 'an unassigned asset'}: "
            f"Grid Health Score {grid_health_score:.1f}/100."
        )
        db.add(
            Alert(
                inspection_id=inspection.id,
                severity=overall,
                message=message,
                status="new",
            )
        )
        logger.warning("Alert raised for inspection #%d: %s", inspection.id, message)

    db.commit()
    db.refresh(inspection)
    return inspection
