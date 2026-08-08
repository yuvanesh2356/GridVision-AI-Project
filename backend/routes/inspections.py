"""
GridVision AI - routes/inspections.py
Only validates requests and returns responses. Calls inspection_service for
all pipeline orchestration - no business logic here.
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Inspection
from schemas import InspectionOut, InspectionResult
from services import inspection_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inspections", tags=["inspections"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@router.post("/upload", response_model=InspectionResult)
async def upload_inspection(
    file: UploadFile = File(...),
    asset_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Please upload a JPG, PNG, or WEBP image.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if asset_id is not None:
        from models import Asset

        if not db.query(Asset).filter(Asset.id == asset_id).first():
            raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found.")

    logger.info(
        "Inspection upload received: filename=%s size=%d bytes asset_id=%s",
        file.filename,
        len(file_bytes),
        asset_id,
    )

    try:
        inspection = inspection_service.run_inspection_pipeline(
            db=db,
            file_bytes=file_bytes,
            original_filename=file.filename or "upload.jpg",
            asset_id=asset_id,
        )
    except ValueError as exc:
        # Raised by the pipeline for a decodable-but-invalid image (e.g. a
        # non-image file with an image-like extension).
        logger.warning("Rejected upload '%s': %s", file.filename, exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Inspection pipeline failed for upload '%s'", file.filename)
        raise HTTPException(
            status_code=500,
            detail="The Vision Intelligence Engine could not process this image. Please try a different photo.",
        ) from exc

    logger.info(
        "Inspection #%d complete: severity=%s health_score=%.1f",
        inspection.id,
        inspection.overall_severity,
        inspection.grid_health_score,
    )
    return inspection


@router.get("", response_model=List[InspectionOut])
def list_inspections(
    asset_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Inspection)
    if asset_id is not None:
        query = query.filter(Inspection.asset_id == asset_id)
    if severity is not None:
        query = query.filter(Inspection.overall_severity == severity)
    return query.order_by(Inspection.created_at.desc()).all()


@router.get("/{inspection_id}", response_model=InspectionResult)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    return inspection
