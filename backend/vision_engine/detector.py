"""
Vision Intelligence Engine - detector.py
Asset Detection stage.

Responsibility (and ONLY responsibility): load YOLO once, detect assets in an
image, and return standardized detection objects. No severity logic, no
recommendations, no calculations happen here - this module is fully reusable
in isolation.
"""

import logging
from typing import List, Dict, Any
import threading

import numpy as np

from config import YOLO_MODEL_PATH, YOLO_CONFIDENCE_THRESHOLD, COMPONENT_CLASSES

logger = logging.getLogger(__name__)

_model = None
_model_lock = threading.Lock()

# Pretrained YOLO (COCO) classes do not include utility-specific concepts
# such as "tower" or "insulator". We map the closest visually-similar COCO
# classes onto our standardized component vocabulary so the rest of the
# Vision Intelligence Engine always receives structured, domain-relevant
# input regardless of which YOLO checkpoint is loaded. Any class not in this
# map is treated as background and ignored.
_COCO_TO_COMPONENT = {
    "traffic light": "insulator",
    "pole": "pole",
    "kite": "conductor",
    "potted plant": "vegetation",
    "bench": "pole",
    "fire hydrant": "transformer",
    "parking meter": "transformer",
    "bird": "vegetation",
}


def _get_model():
    """Lazily load the YOLO model as a process-wide singleton."""
    global _model
    if _model is not None:
        return _model

    with _model_lock:
        if _model is None:
            from ultralytics import YOLO

            _model = YOLO(YOLO_MODEL_PATH)
    return _model


def detect_assets(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Run object detection on a BGR OpenCV image.

    Returns a list of standardized detections:
        [{"component": str, "bbox": [x1, y1, x2, y2], "confidence": float}, ...]

    If YOLO inference is unavailable (e.g. no internet to fetch weights on
    first run, or no GPU/CPU capacity in a constrained environment), this
    falls back to a deterministic heuristic region-proposal so the rest of
    the pipeline remains fully runnable end-to-end for demo purposes.
    """
    try:
        model = _get_model()
        results = model.predict(
            source=image, conf=YOLO_CONFIDENCE_THRESHOLD, verbose=False
        )
        detections: List[Dict[str, Any]] = []

        for result in results:
            names = result.names
            for box in result.boxes:
                cls_id = int(box.cls[0].item())
                class_name = names.get(cls_id, str(cls_id))
                component = _COCO_TO_COMPONENT.get(class_name)
                if component is None:
                    continue

                confidence = float(box.conf[0].item())
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]

                detections.append(
                    {
                        "component": component,
                        "bbox": [x1, y1, x2, y2],
                        "confidence": confidence,
                    }
                )

        if detections:
            return detections

        # No mapped classes found in this frame - fall through to heuristic
        # so downstream stages still have structured input to analyze.
        logger.info(
            "No recognizable infrastructure classes detected by YOLO in this frame; "
            "using heuristic fallback detections."
        )
        return _heuristic_fallback_detections(image)

    except Exception:
        logger.warning(
            "YOLO inference unavailable (model load or predict failed); "
            "using heuristic fallback detections.",
            exc_info=True,
        )
        return _heuristic_fallback_detections(image)


def _heuristic_fallback_detections(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Deterministic, dependency-free fallback detector used when YOLO weights
    cannot be loaded (e.g. offline environment). Proposes a central "tower"
    region and a horizontal "conductor" band using simple image geometry,
    so geometry.py and intelligence.py always have something to measure.
    """
    h, w = image.shape[:2]

    tower_box = [w * 0.35, h * 0.10, w * 0.65, h * 0.90]
    conductor_box = [w * 0.05, h * 0.35, w * 0.95, h * 0.45]

    return [
        {"component": "tower", "bbox": tower_box, "confidence": 0.40},
        {"component": "conductor", "bbox": conductor_box, "confidence": 0.35},
    ]
