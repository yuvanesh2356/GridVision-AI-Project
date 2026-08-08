"""
GridVision AI - routes/dashboard.py
Aggregate dashboard endpoints: executive KPIs and the risk heatmap. Only
validates/returns - all aggregation logic lives in analysis_service.
"""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import DashboardSummary, HeatmapPoint
from services import analysis_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    return analysis_service.get_dashboard_summary(db)


@router.get("/heatmap", response_model=List[HeatmapPoint])
def dashboard_heatmap(db: Session = Depends(get_db)):
    return analysis_service.get_risk_heatmap(db)
