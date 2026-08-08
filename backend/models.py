"""
GridVision AI - ORM Models
Asset, Inspection, Finding, Alert, MaintenanceTicket.
No auth/user tables - assets are seeded, not user-managed, in this build.
"""

from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    DateTime,
    Date,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship

from database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # tower | pole | transformer | conductor_span
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    install_date = Column(Date, nullable=True)  # placeholder input for age scoring
    health_score = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    inspections = relationship(
        "Inspection", back_populates="asset", cascade="all, delete-orphan"
    )


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True, index=True)

    image_path = Column(String, nullable=True)
    annotated_image_path = Column(String, nullable=True)

    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    overall_severity = Column(String, nullable=False, default="Low")
    grid_health_score = Column(Float, nullable=False, default=100.0)

    tilt_angle = Column(Float, nullable=True)
    sag_ratio = Column(Float, nullable=True)
    vegetation_clearance_m = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    asset = relationship("Asset", back_populates="inspections")
    findings = relationship(
        "Finding", back_populates="inspection", cascade="all, delete-orphan"
    )
    alert = relationship(
        "Alert", back_populates="inspection", uselist=False, cascade="all, delete-orphan"
    )
    ticket = relationship(
        "MaintenanceTicket",
        back_populates="inspection",
        uselist=False,
        cascade="all, delete-orphan",
    )


Index("ix_inspections_asset_created", Inspection.asset_id, Inspection.created_at)


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(
        Integer, ForeignKey("inspections.id"), nullable=False, index=True
    )

    defect_type = Column(String, nullable=False)
    component = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    bbox = Column(Text, nullable=True)  # JSON-encoded [x1, y1, x2, y2]
    explanation = Column(Text, nullable=True)

    inspection = relationship("Inspection", back_populates="findings")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(
        Integer, ForeignKey("inspections.id"), nullable=False, index=True
    )

    severity = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="new")  # new/acknowledged/resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="alert")


class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(
        Integer, ForeignKey("inspections.id"), nullable=False, index=True
    )

    priority = Column(String, nullable=False)  # Immediate/24h/Monitor/Routine
    status = Column(String, nullable=False, default="open")  # open/in_progress/closed
    created_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="ticket")
