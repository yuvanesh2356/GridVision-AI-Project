"""
Vision Intelligence Engine - geometry.py
Infrastructure Measurement Engine.

Responsibility: tower tilt estimation, wire sag estimation, vegetation
clearance estimation. Returns only numerical measurements - no thresholds,
no severity, no decision-making. All judgment calls belong in intelligence.py.
"""

from typing import List, Dict, Any, Optional

import cv2
import numpy as np


def estimate_tower_tilt(image: np.ndarray, tower_bbox: List[float]) -> float:
    """
    Estimate the tower's lean angle in degrees from true vertical.

    Approach: crop the tower region, run Canny edge detection, use a
    probabilistic Hough transform to find the dominant near-vertical line,
    and measure its angular deviation from 90 degrees (true vertical).
    Returns 0.0 if no reliable line can be found (treated as "no measurable
    lean" rather than an error, keeping the pipeline fully deterministic).
    """
    x1, y1, x2, y2 = [int(max(0, v)) for v in tower_bbox]
    x2 = max(x2, x1 + 1)
    y2 = max(y2, y1 + 1)

    h, w = image.shape[:2]
    x2, y2 = min(x2, w), min(y2, h)
    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        return 0.0

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)

    lines = cv2.HoughLinesP(
        edges, 1, np.pi / 180, threshold=40, minLineLength=crop.shape[0] * 0.3, maxLineGap=10
    )

    if lines is None or len(lines) == 0:
        return 0.0

    best_deviation = None
    for line in lines:
        lx1, ly1, lx2, ly2 = line[0]
        dx = lx2 - lx1
        dy = ly2 - ly1
        if dy == 0:
            continue
        angle_from_vertical = np.degrees(np.arctan2(abs(dx), abs(dy)))

        # Only consider lines that are reasonably close to vertical -
        # these are the candidates that could represent the tower's mast.
        if angle_from_vertical > 30:
            continue

        if best_deviation is None or angle_from_vertical < best_deviation:
            best_deviation = angle_from_vertical

    return round(float(best_deviation), 2) if best_deviation is not None else 0.0


def estimate_wire_sag(
    image: np.ndarray, conductor_bbox: List[float]
) -> float:
    """
    Estimate the wire sag ratio for a conductor span.

    Approach: crop the conductor region, isolate the darkest/thinnest
    horizontal structure via edge detection, find the lowest point of the
    detected wire curve relative to its two endpoints, and express sag as
    (max_vertical_deviation / span_width) - a unitless ratio comparable
    across different image scales and span lengths.
    """
    x1, y1, x2, y2 = [int(max(0, v)) for v in conductor_bbox]
    h, w = image.shape[:2]
    x2, y2 = min(x2, w), min(y2, h)
    y1 = max(0, y1)

    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return 0.0

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 30, 100)

    span_width = max(1, x2 - x1)
    col_positions = []

    # For each column, find the topmost edge pixel - this traces the upper
    # profile of the wire across the span.
    for col in range(edges.shape[1]):
        column = edges[:, col]
        nonzero = np.nonzero(column)[0]
        if nonzero.size > 0:
            col_positions.append(nonzero[0])

    if len(col_positions) < 2:
        return 0.0

    col_positions_arr = np.array(col_positions, dtype=np.float32)
    endpoint_avg = (col_positions_arr[0] + col_positions_arr[-1]) / 2.0
    max_deviation = float(np.max(col_positions_arr) - endpoint_avg)
    max_deviation = max(0.0, max_deviation)

    sag_ratio = max_deviation / span_width
    return round(float(sag_ratio), 4)


def estimate_vegetation_clearance(
    conductor_bbox: List[float],
    vegetation_bbox: Optional[List[float]],
    reference_tower_height_px: Optional[float] = None,
    reference_tower_height_m: float = 25.0,
) -> Optional[float]:
    """
    Estimate the real-world clearance distance (in meters) between
    vegetation and the nearest conductor.

    Approach: compute the pixel gap between the conductor bounding box and
    the vegetation bounding box, then convert pixels to meters using a
    known reference scale (typically the tower height in pixels vs. its
    assumed real-world height). Returns None if no vegetation was detected
    in frame (i.e. clearance is not a concern for this image).
    """
    if vegetation_bbox is None:
        return None

    cx1, cy1, cx2, cy2 = conductor_bbox
    vx1, vy1, vx2, vy2 = vegetation_bbox

    # Pixel gap between the two boxes (0 if they overlap).
    dx = max(vx1 - cx2, cx1 - vx2, 0.0)
    dy = max(vy1 - cy2, cy1 - vy2, 0.0)
    pixel_gap = float(np.hypot(dx, dy))

    if reference_tower_height_px and reference_tower_height_px > 0:
        meters_per_pixel = reference_tower_height_m / reference_tower_height_px
    else:
        # Fallback scale assumption when no tower reference is available in
        # frame: assume the conductor bbox height roughly corresponds to a
        # 1-meter reference band, a conservative default for demo imagery.
        conductor_height_px = max(1.0, cy2 - cy1)
        meters_per_pixel = 1.0 / conductor_height_px

    clearance_m = pixel_gap * meters_per_pixel
    return round(float(clearance_m), 2)


def measure_infrastructure(
    image: np.ndarray, detections: List[Dict[str, Any]]
) -> Dict[str, Optional[float]]:
    """
    Orchestrates the three measurement functions above against a full set of
    detections for a single image, returning a flat measurement dict that
    intelligence.py consumes downstream.
    """
    tower = next((d for d in detections if d["component"] == "tower"), None)
    conductor = next((d for d in detections if d["component"] == "conductor"), None)
    vegetation = next((d for d in detections if d["component"] == "vegetation"), None)

    tilt_angle = estimate_tower_tilt(image, tower["bbox"]) if tower else None
    sag_ratio = estimate_wire_sag(image, conductor["bbox"]) if conductor else None

    reference_tower_height_px = None
    if tower:
        reference_tower_height_px = tower["bbox"][3] - tower["bbox"][1]

    vegetation_clearance_m = None
    if conductor:
        vegetation_clearance_m = estimate_vegetation_clearance(
            conductor["bbox"],
            vegetation["bbox"] if vegetation else None,
            reference_tower_height_px=reference_tower_height_px,
        )

    return {
        "tilt_angle": tilt_angle,
        "sag_ratio": sag_ratio,
        "vegetation_clearance_m": vegetation_clearance_m,
    }
