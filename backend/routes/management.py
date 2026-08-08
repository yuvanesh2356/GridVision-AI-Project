"""
GridVision AI - routes/management.py
Merged management surface: alerts, report generation, maintenance tickets.
Only validates requests and returns responses - all logic lives in
analysis_service.
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from schemas import AlertOut, AlertUpdate, TicketCreate, TicketOut
from services import analysis_service

router = APIRouter(prefix="/api/management", tags=["management"])


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
@router.get("/alerts", response_model=List[AlertOut])
def list_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return analysis_service.list_alerts(db, status=status, severity=severity)


@router.patch("/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, payload: AlertUpdate, db: Session = Depends(get_db)):
    alert = analysis_service.update_alert_status(db, alert_id, payload.status)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return alert


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
@router.get("/reports/{inspection_id}/pdf")
def download_report(inspection_id: int, db: Session = Depends(get_db)):
    pdf_path = analysis_service.generate_report_pdf(db, inspection_id)
    if pdf_path is None:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=f"inspection_{inspection_id}_report.pdf",
    )


# ---------------------------------------------------------------------------
# Maintenance tickets
# ---------------------------------------------------------------------------
@router.post("/tickets", response_model=TicketOut)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    ticket = analysis_service.create_maintenance_ticket(
        db, payload.inspection_id, payload.priority
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    return ticket
