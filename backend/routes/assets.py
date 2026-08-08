"""
GridVision AI - routes/assets.py
Read-only asset endpoints. No CRUD - assets are seeded, not user-managed.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Asset
from schemas import AssetOut, AssetDetail, TimelineOut
from services import analysis_service

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=List[AssetOut])
def list_assets(db: Session = Depends(get_db)):
    return db.query(Asset).order_by(Asset.name.asc()).all()


@router.get("/{asset_id}", response_model=AssetDetail)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return asset


@router.get("/{asset_id}/timeline", response_model=TimelineOut)
def get_asset_timeline(asset_id: int, db: Session = Depends(get_db)):
    timeline = analysis_service.build_timeline(db, asset_id)
    if timeline is None:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return timeline
