"""
Vision Intelligence Engine - intelligence.py
The brain of the system.

Responsibility: everything that transforms raw detections and measurements
into decisions - damage interpretation, severity classification, Grid Health
Score, predictive maintenance estimation, explainable AI, and maintenance
recommendations. detector.py and geometry.py never make judgment calls;
all of it lives here.
"""

from typing import List, Dict, Any, Optional, Tuple

import numpy as np

import config


# ---------------------------------------------------------------------------
# 1. Damage interpretation
# ---------------------------------------------------------------------------
def interpret_damage(
    image: np.ndarray, detections: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Classify damage type for each detected component using lightweight,
    deterministic color/texture heuristics on the cropped region. This is a
    hackathon-appropriate stand-in for a trained damage classifier - the
    interface (component + bbox -> defect_type + confidence) is exactly what
    a trained model would return, so it can be swapped in later with no
    changes to callers.
    """
    findings: List[Dict[str, Any]] = []

    for det in detections:
        component = det["component"]
        x1, y1, x2, y2 = [int(max(0, v)) for v in det["bbox"]]
        h, w = image.shape[:2]
        x2, y2 = min(x2, w), min(y2, h)
        y1, x1 = max(0, y1), max(0, x1)
        crop = image[y1:y2, x1:x2]

        if crop.size == 0:
            continue

        defect_type, confidence = _classify_crop(component, crop)
        if defect_type is None:
            continue

        findings.append(
            {
                "component": component,
                "defect_type": defect_type,
                "confidence": confidence,
                "bbox": det["bbox"],
                "detection_confidence": det["confidence"],
            }
        )

    return findings


def _classify_crop(component: str, crop: np.ndarray) -> Tuple[Optional[str], float]:
    """
    Heuristic damage classifier: analyzes the color distribution of a
    cropped region to flag rust/corrosion (orange-brown hues) as the most
    visually detectable defect class without a trained model.
    """
    hsv = _to_hsv(crop)

    # Rust/corrosion: orange-brown hue range in HSV.
    rust_mask = (
        (hsv[:, :, 0] >= 5)
        & (hsv[:, :, 0] <= 25)
        & (hsv[:, :, 1] >= 60)
        & (hsv[:, :, 2] >= 40)
    )
    rust_ratio = float(np.mean(rust_mask))

    if rust_ratio > 0.12:
        defect = "corrosion" if component == "transformer" else "rust"
        confidence = min(0.95, 0.5 + rust_ratio)
        return defect, round(confidence, 2)

    # Dark/low-brightness regions on insulators can indicate burn marks or
    # heavy soiling ("dirty insulator").
    if component == "insulator":
        brightness = float(np.mean(crop))
        if brightness < 70:
            return "dirty_insulator", 0.60

    return None, 0.0


def _to_hsv(crop: np.ndarray) -> np.ndarray:
    import cv2

    return cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)


# ---------------------------------------------------------------------------
# 2. Severity classification (Risk Assessment)
# ---------------------------------------------------------------------------
def classify_finding_severity(defect_type: str, confidence: float) -> str:
    if defect_type in config.CRITICAL_DEFECT_TYPES and confidence >= config.DAMAGE_CONFIDENCE_CRITICAL:
        return "Critical"
    if defect_type in config.HIGH_DEFECT_TYPES and confidence >= config.DAMAGE_CONFIDENCE_HIGH:
        return "High"
    if defect_type in config.MEDIUM_DEFECT_TYPES and confidence >= config.DAMAGE_CONFIDENCE_MEDIUM:
        return "Medium"
    return "Low"


def classify_measurement_severity(
    tilt_angle: Optional[float], sag_ratio: Optional[float]
) -> str:
    if tilt_angle is not None and tilt_angle >= config.SEVERITY_CRITICAL_TILT:
        return "Critical"
    if sag_ratio is not None and sag_ratio >= config.SEVERITY_CRITICAL_SAG:
        return "Critical"
    if tilt_angle is not None and tilt_angle >= config.SEVERITY_HIGH_TILT:
        return "High"
    if sag_ratio is not None and sag_ratio >= config.SEVERITY_HIGH_SAG:
        return "High"
    return "Low"


_SEVERITY_RANK = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}


def overall_severity(severities: List[str]) -> str:
    if not severities:
        return "Low"
    return max(severities, key=lambda s: _SEVERITY_RANK.get(s, 0))


# ---------------------------------------------------------------------------
# 3. Grid Health Score (Grid Health Analysis)
# ---------------------------------------------------------------------------
def calculate_grid_health_score(
    num_defects: int,
    tilt_angle: Optional[float],
    sag_ratio: Optional[float],
    vegetation_clearance_m: Optional[float],
    asset_age_years: float = 0.0,
    past_faults_count: int = 0,
) -> float:
    """
    GridHealthScore = 100 - weighted penalties, clamped to [0, 100].
    See architecture doc section 9 for the full formula rationale.
    """
    defect_penalty = min(1.0, num_defects / config.MAX_DEFECTS_FOR_FULL_PENALTY) * 100
    tilt_penalty = (
        min(1.0, (tilt_angle or 0.0) / config.MAX_SAFE_TILT_DEGREES) * 100
    )
    sag_penalty = min(1.0, (sag_ratio or 0.0) / config.MAX_SAFE_SAG_RATIO) * 100

    if vegetation_clearance_m is None:
        vegetation_penalty = 0.0
    else:
        deficit = max(0.0, config.MIN_SAFE_VEGETATION_CLEARANCE_M - vegetation_clearance_m)
        vegetation_penalty = (
            min(1.0, deficit / config.MIN_SAFE_VEGETATION_CLEARANCE_M) * 100
        )

    age_penalty = (
        min(1.0, asset_age_years / config.MAX_ASSET_AGE_YEARS_FOR_FULL_PENALTY) * 100
    )
    history_penalty = (
        min(1.0, past_faults_count / config.MAX_PAST_FAULTS_FOR_FULL_PENALTY) * 100
    )

    weighted_penalty = (
        config.HEALTH_WEIGHT_DEFECTS * defect_penalty
        + config.HEALTH_WEIGHT_TILT * tilt_penalty
        + config.HEALTH_WEIGHT_SAG * sag_penalty
        + config.HEALTH_WEIGHT_VEGETATION * vegetation_penalty
        + config.HEALTH_WEIGHT_AGE * age_penalty
        + config.HEALTH_WEIGHT_HISTORY * history_penalty
    )

    score = max(0.0, min(100.0, 100.0 - weighted_penalty))
    return round(score, 1)


# ---------------------------------------------------------------------------
# 4. Predictive maintenance estimation (Timeline Comparison support)
# ---------------------------------------------------------------------------
def predict_failure_window_days(
    historical_health_scores: List[float],
) -> Optional[int]:
    """
    Given a chronological list of past Grid Health Scores for an asset,
    linearly extrapolate the decline rate to estimate the number of days
    until the score would cross a critical failure threshold (30/100).
    Deterministic and explainable - no ML model required.

    Returns None if there isn't a clear declining trend or insufficient data.
    """
    if len(historical_health_scores) < 2:
        return None

    scores = np.array(historical_health_scores, dtype=np.float64)
    x = np.arange(len(scores), dtype=np.float64)

    # Linear regression: score = slope * x + intercept
    slope, intercept = np.polyfit(x, scores, 1)

    if slope >= 0:
        # Health is stable or improving - no failure window to project.
        return None

    failure_threshold = 30.0
    current_score = scores[-1]
    if current_score <= failure_threshold:
        return 0

    # Assume each historical data point represents roughly 30 days
    # (monthly inspections), consistent with seed.py's seeding cadence.
    days_per_step = 30.0
    steps_to_failure = (failure_threshold - current_score) / slope
    days_to_failure = steps_to_failure * days_per_step

    return max(0, int(round(days_to_failure)))


# ---------------------------------------------------------------------------
# 5. Explainable AI
# ---------------------------------------------------------------------------
_DEFECT_EXPLANATIONS = {
    "rust": "Rust indicates surface oxidation from prolonged weather exposure, which weakens structural metal over time.",
    "corrosion": "Corrosion on transformer casing can compromise sealing and lead to oil leakage or internal damage.",
    "dirty_insulator": "Insulator contamination reduces electrical insulation performance and increases flashover risk.",
    "crack": "Cracking indicates structural fatigue and raises the risk of sudden component failure.",
    "broken_insulator": "A broken insulator can no longer safely isolate the conductor, creating a direct fault risk.",
    "loose_wire": "A loose conductor connection increases resistance, heat buildup, and disconnection risk.",
    "broken_conductor": "A broken conductor is an active safety hazard and can cause immediate power loss or fire risk.",
    "bent_tower": "A bent tower structure indicates significant mechanical stress and elevated collapse risk.",
    "broken_cross_arm": "A broken cross arm can no longer safely support conductor load, risking line collapse.",
}


def explain_finding(defect_type: str, component: str, confidence: float, severity: str) -> str:
    what = f"Detected {defect_type.replace('_', ' ')} on {component} with {confidence * 100:.0f}% confidence."
    why = _DEFECT_EXPLANATIONS.get(
        defect_type, "This defect can degrade asset performance and safety over time."
    )
    action = config.SEVERITY_TO_RECOMMENDATION.get(severity, "Monitor")
    return f"{what} {why} Recommended action: {action}."


def explain_measurement(tilt_angle: Optional[float], sag_ratio: Optional[float]) -> Optional[str]:
    parts = []
    if tilt_angle is not None and tilt_angle >= config.SEVERITY_HIGH_TILT:
        parts.append(
            f"Tower is leaning at {tilt_angle:.1f} degrees, exceeding the safe threshold of "
            f"{config.MAX_SAFE_TILT_DEGREES:.1f} degrees. Excess lean significantly raises "
            f"the risk of structural collapse."
        )
    if sag_ratio is not None and sag_ratio >= config.SEVERITY_HIGH_SAG:
        parts.append(
            f"Conductor sag ratio is {sag_ratio:.3f}, exceeding the safe limit of "
            f"{config.MAX_SAFE_SAG_RATIO:.2f}. Excess sag increases the risk of contact "
            f"with ground-level structures or vehicles."
        )
    return " ".join(parts) if parts else None


# ---------------------------------------------------------------------------
# 6. Maintenance recommendation
# ---------------------------------------------------------------------------
def recommend_maintenance_action(severity: str) -> str:
    return config.SEVERITY_TO_RECOMMENDATION.get(severity, "Monitor")
