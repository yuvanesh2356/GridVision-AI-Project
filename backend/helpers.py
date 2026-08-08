"""
GridVision AI - Shared Helpers
Image utilities, EXIF/GPS extraction, distance calculation, and PDF report
rendering. Stateless, dependency-light functions used across the backend.
"""

import io
import json
import math
import uuid
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any

import cv2
import numpy as np
from PIL import Image, ExifTags
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from config import UPLOADS_DIR, ANNOTATED_DIR, REPORTS_DIR


# ---------------------------------------------------------------------------
# Image utilities
# ---------------------------------------------------------------------------
def save_upload_bytes(file_bytes: bytes, original_filename: str) -> Path:
    """Persist an uploaded file to disk with a unique name and return its path."""
    suffix = Path(original_filename).suffix or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    dest = UPLOADS_DIR / unique_name
    with open(dest, "wb") as f:
        f.write(file_bytes)
    return dest


def load_image_bgr(path: Path) -> np.ndarray:
    """Load an image from disk as an OpenCV BGR array.

    Raises ValueError with a user-friendly message if the file cannot be
    decoded as an image by either OpenCV or PIL (e.g. a corrupt file or a
    non-image file with an image-like extension).
    """
    image = cv2.imread(str(path))
    if image is None:
        # Fall back to PIL for formats OpenCV struggles with, then convert.
        try:
            pil_img = Image.open(path).convert("RGB")
            image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as exc:
            raise ValueError(
                "This file could not be read as an image. Please upload a valid JPG, PNG, or WEBP photo."
            ) from exc
    return image


def draw_annotations(
    image: np.ndarray, detections: List[Dict[str, Any]]
) -> np.ndarray:
    """Draw bounding boxes + labels for each detection onto a copy of the image."""
    annotated = image.copy()
    color = (0, 200, 255)
    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        label = f"{det['component']} {det['confidence']:.2f}"
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        cv2.putText(
            annotated,
            label,
            (x1, max(0, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
    return annotated


def save_annotated_image(image: np.ndarray, base_name: str) -> Path:
    """Save an annotated OpenCV image to the annotated storage directory."""
    dest = ANNOTATED_DIR / f"annotated_{base_name}.jpg"
    cv2.imwrite(str(dest), image)
    return dest


# ---------------------------------------------------------------------------
# Geo utilities
# ---------------------------------------------------------------------------
def _convert_to_degrees(value) -> float:
    d, m, s = value
    return float(d) + (float(m) / 60.0) + (float(s) / 3600.0)


def extract_gps_from_exif(path: Path) -> Optional[Tuple[float, float]]:
    """
    Attempt to extract (lat, lng) from an image's EXIF metadata.
    Returns None if no GPS EXIF data is present (common for non-drone photos).
    """
    try:
        image = Image.open(path)
        exif_raw = image._getexif()
        if not exif_raw:
            return None

        exif = {ExifTags.TAGS.get(k, k): v for k, v in exif_raw.items()}
        gps_info = exif.get("GPSInfo")
        if not gps_info:
            return None

        gps = {ExifTags.GPSTAGS.get(k, k): v for k, v in gps_info.items()}

        lat = _convert_to_degrees(gps["GPSLatitude"])
        if gps.get("GPSLatitudeRef") in ("S", "s"):
            lat = -lat

        lng = _convert_to_degrees(gps["GPSLongitude"])
        if gps.get("GPSLongitudeRef") in ("W", "w"):
            lng = -lng

        return lat, lng
    except Exception:
        return None


def haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two lat/lng points, in meters."""
    r = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def nearest_asset(lat: float, lng: float, assets: List[Any]) -> Optional[Any]:
    """Given a lat/lng and a list of Asset ORM objects, return the closest one."""
    if not assets:
        return None
    return min(
        assets, key=lambda a: haversine_distance_m(lat, lng, a.lat, a.lng)
    )


# ---------------------------------------------------------------------------
# PDF report rendering
# ---------------------------------------------------------------------------
def render_inspection_report_pdf(report_data: Dict[str, Any]) -> Path:
    """
    Render a simple, clean one-page PDF report for an inspection.
    report_data expects keys: inspection_id, asset_name, created_at,
    overall_severity, grid_health_score, findings (list of dicts),
    recommendation.
    """
    dest = REPORTS_DIR / f"inspection_{report_data['inspection_id']}_report.pdf"
    c = canvas.Canvas(str(dest), pagesize=A4)
    width, height = A4

    y = height - 2 * cm
    c.setFont("Helvetica-Bold", 18)
    c.drawString(2 * cm, y, "GridVision AI - Inspection Report")
    y -= 1 * cm

    c.setFont("Helvetica", 11)
    c.drawString(2 * cm, y, f"Inspection ID: {report_data['inspection_id']}")
    y -= 0.6 * cm
    c.drawString(2 * cm, y, f"Asset: {report_data.get('asset_name', 'Unassigned')}")
    y -= 0.6 * cm
    c.drawString(2 * cm, y, f"Date: {report_data.get('created_at')}")
    y -= 0.6 * cm
    c.drawString(
        2 * cm, y, f"Overall Severity: {report_data.get('overall_severity')}"
    )
    y -= 0.6 * cm
    c.drawString(
        2 * cm, y, f"Grid Health Score: {report_data.get('grid_health_score'):.1f}/100"
    )
    y -= 0.6 * cm
    c.drawString(
        2 * cm, y, f"Recommendation: {report_data.get('recommendation')}"
    )
    y -= 1 * cm

    c.setFont("Helvetica-Bold", 13)
    c.drawString(2 * cm, y, "Findings")
    y -= 0.8 * cm

    c.setFont("Helvetica", 10)
    for finding in report_data.get("findings", []):
        line = (
            f"- [{finding['severity']}] {finding['component']}: "
            f"{finding['defect_type']} (confidence {finding['confidence']:.2f})"
        )
        c.drawString(2.2 * cm, y, line)
        y -= 0.5 * cm

        explanation = finding.get("explanation")
        if explanation:
            for wrapped_line in _wrap_text(explanation, 95):
                c.setFont("Helvetica-Oblique", 9)
                c.drawString(2.6 * cm, y, wrapped_line)
                y -= 0.42 * cm
                c.setFont("Helvetica", 10)

        y -= 0.15 * cm
        if y < 3 * cm:
            c.showPage()
            y = height - 2 * cm

    c.save()
    return dest


def _wrap_text(text: str, width: int) -> List[str]:
    words = text.split()
    lines, current = [], ""
    for word in words:
        if len(current) + len(word) + 1 <= width:
            current = f"{current} {word}".strip()
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def bbox_to_json(bbox: List[float]) -> str:
    return json.dumps([round(float(v), 2) for v in bbox])
