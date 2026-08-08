"""
GridVision AI - Configuration
Central location for all tunable thresholds, scoring weights, and paths.
No business logic lives here - only constants.
"""

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
ANNOTATED_DIR = STORAGE_DIR / "annotated"
REPORTS_DIR = STORAGE_DIR / "reports"

for _dir in (STORAGE_DIR, UPLOADS_DIR, ANNOTATED_DIR, REPORTS_DIR):
    _dir.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'gridvision.db'}")

# ---------------------------------------------------------------------------
# Vision Intelligence Engine - model config
# ---------------------------------------------------------------------------
# Pretrained YOLO checkpoint. Ultralytics will auto-download this the first
# time detector.py runs if it isn't already present locally.
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
YOLO_CONFIDENCE_THRESHOLD = 0.25

# Standardized component classes the Vision Intelligence Engine reasons about.
# Since a generic pretrained YOLO checkpoint does not know utility-specific
# classes out of the box, detector.py maps generic COCO classes to the
# closest infrastructure concept and/or falls back to heuristic region
# proposals so the rest of the pipeline always has structured input to work
# with (see vision_engine/detector.py for the mapping).
COMPONENT_CLASSES = [
    "tower",
    "pole",
    "conductor",
    "insulator",
    "transformer",
    "vegetation",
]

# ---------------------------------------------------------------------------
# Infrastructure Measurement thresholds (geometry.py output is judged here)
# ---------------------------------------------------------------------------
MAX_SAFE_TILT_DEGREES = 5.0
MAX_SAFE_SAG_RATIO = 0.15
MIN_SAFE_VEGETATION_CLEARANCE_M = 2.0

# ---------------------------------------------------------------------------
# Severity thresholds (intelligence.py)
# ---------------------------------------------------------------------------
SEVERITY_CRITICAL_TILT = 10.0
SEVERITY_HIGH_TILT = MAX_SAFE_TILT_DEGREES
SEVERITY_CRITICAL_SAG = 0.30
SEVERITY_HIGH_SAG = MAX_SAFE_SAG_RATIO

DAMAGE_CONFIDENCE_CRITICAL = 0.85
DAMAGE_CONFIDENCE_HIGH = 0.70
DAMAGE_CONFIDENCE_MEDIUM = 0.50

CRITICAL_DEFECT_TYPES = {"broken_conductor", "bent_tower", "broken_cross_arm"}
HIGH_DEFECT_TYPES = {"crack", "broken_insulator", "loose_wire"}
MEDIUM_DEFECT_TYPES = {"rust", "corrosion", "dirty_insulator"}

# ---------------------------------------------------------------------------
# Grid Health Score weights (must sum to 1.0)
# ---------------------------------------------------------------------------
HEALTH_WEIGHT_DEFECTS = 0.30
HEALTH_WEIGHT_TILT = 0.25
HEALTH_WEIGHT_SAG = 0.20
HEALTH_WEIGHT_VEGETATION = 0.15
HEALTH_WEIGHT_AGE = 0.05
HEALTH_WEIGHT_HISTORY = 0.05

MAX_DEFECTS_FOR_FULL_PENALTY = 5
MAX_ASSET_AGE_YEARS_FOR_FULL_PENALTY = 30
MAX_PAST_FAULTS_FOR_FULL_PENALTY = 10

# ---------------------------------------------------------------------------
# Maintenance recommendation mapping
# ---------------------------------------------------------------------------
SEVERITY_TO_RECOMMENDATION = {
    "Critical": "Immediate Shutdown",
    "High": "Repair within 24 hours",
    "Medium": "Monitor",
    "Low": "Routine Maintenance",
}

# ---------------------------------------------------------------------------
# App metadata
# ---------------------------------------------------------------------------
APP_NAME = "GridVision AI"
APP_VERSION = "1.0.0"
CORS_ORIGINS = ["*"]
