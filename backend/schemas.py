"""
GridVision AI - Pydantic Schemas
Request/response models mirroring the ORM, plus composite response shapes.
"""

from datetime import datetime, date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Asset
# ---------------------------------------------------------------------------
class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    name: str
    lat: float
    lng: float
    install_date: Optional[date] = None
    health_score: float
    created_at: datetime


# ---------------------------------------------------------------------------
# Finding
# ---------------------------------------------------------------------------
class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inspection_id: int
    defect_type: str
    component: str
    confidence: float
    severity: str
    bbox: Optional[str] = None
    explanation: Optional[str] = None


# ---------------------------------------------------------------------------
# Alert
# ---------------------------------------------------------------------------
class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inspection_id: int
    severity: str
    message: str
    status: str
    created_at: datetime


class AlertUpdate(BaseModel):
    status: str  # acknowledged | resolved


# ---------------------------------------------------------------------------
# Maintenance Ticket
# ---------------------------------------------------------------------------
class TicketCreate(BaseModel):
    inspection_id: int
    priority: Optional[str] = None  # if omitted, derived from inspection severity


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inspection_id: int
    priority: str
    status: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Inspection
# ---------------------------------------------------------------------------
class InspectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: Optional[int] = None
    image_path: Optional[str] = None
    annotated_image_path: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    overall_severity: str
    grid_health_score: float
    tilt_angle: Optional[float] = None
    sag_ratio: Optional[float] = None
    vegetation_clearance_m: Optional[float] = None
    created_at: datetime


class InspectionResult(InspectionOut):
    findings: List[FindingOut] = []
    alert: Optional[AlertOut] = None


# ---------------------------------------------------------------------------
# Timeline Comparison
# ---------------------------------------------------------------------------
class TimelinePoint(BaseModel):
    date: datetime
    health_score: float
    severity: str
    defect_count: int
    tilt_angle: Optional[float] = None
    sag_ratio: Optional[float] = None


class TimelineOut(BaseModel):
    asset_id: int
    asset_name: str
    points: List[TimelinePoint]
    health_score_trend: List[float]
    severity_trend: List[str]
    predicted_failure_days: Optional[int] = None


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
class DashboardSummary(BaseModel):
    grid_health_avg: float
    total_assets: int
    critical_alerts: int
    todays_inspections: int


class HeatmapPoint(BaseModel):
    asset_id: int
    asset_name: str
    asset_type: str
    lat: float
    lng: float
    risk_score: float
    health_score: float


class AssetDetail(AssetOut):
    inspections: List[InspectionOut] = []
