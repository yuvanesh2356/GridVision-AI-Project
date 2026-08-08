# GridVision AI
### Intelligent Drone-Based Power Distribution Asset Inspection System

A production-inspired, hackathon-buildable platform that inspects electrical
transmission infrastructure from drone imagery using a modular **Vision
Intelligence Engine** (YOLO object detection + OpenCV infrastructure
measurement + rule-based risk/health/maintenance intelligence).

This README covers the complete, locked v3 architecture: backend (Phases 1-2),
frontend (Phase 3), integration & demo polish (Phase 4), and production
readiness (Final Phase).

---

## 1. Project Structure

```
gridvision-ai/
├── README.md
├── backend/
│   ├── main.py                     # FastAPI entrypoint, CORS, logging, startup seeding
│   ├── config.py                   # All thresholds, weights, paths - single source of truth
│   ├── database.py                 # SQLAlchemy engine/session (SQLite, Postgres-ready)
│   ├── models.py                   # Asset, Inspection, Finding, Alert, MaintenanceTicket
│   ├── schemas.py                  # Pydantic request/response models
│   ├── seed.py                     # 6 demo assets with realistic multi-month history
│   ├── helpers.py                  # Image, EXIF/GPS, and PDF report utilities
│   ├── requirements.txt
│   │
│   ├── routes/                     # Only validate requests and return responses
│   │   ├── inspections.py          # Upload, list, get inspections
│   │   ├── assets.py               # Read-only asset list/detail/timeline
│   │   ├── management.py           # Alerts, report PDFs, maintenance tickets
│   │   └── dashboard.py            # Executive KPIs, risk heatmap
│   │
│   ├── services/                   # Coordinate workflows - no technical judgment
│   │   ├── inspection_service.py   # Orchestrates the Vision Intelligence Engine pipeline
│   │   └── analysis_service.py     # Reports, tickets, alerts, timeline/dashboard queries
│   │
│   ├── vision_engine/               # "Vision Intelligence Engine" - all technical analysis
│   │   ├── detector.py             # Asset Detection only (YOLO + heuristic fallback)
│   │   ├── geometry.py             # Infrastructure Measurement Engine (tilt/sag/clearance)
│   │   └── intelligence.py         # Condition analysis, risk, health score, recommendations
│   │
│   └── storage/                    # uploads/, annotated/, reports/ (gitignored contents)
│
└── frontend/
    ├── index.html, vite.config.js, tailwind.config.js, postcss.config.js, package.json
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/client.js            # Axios calls matching every backend endpoint
        ├── store/useAppStore.js     # Zustand: dashboard summary, selected asset, last inspection
        ├── pages/
        │   ├── Dashboard.jsx        # Upload + KPIs + map + findings + analytics + queue + alerts
        │   ├── InspectionDetail.jsx # Annotated image, findings, Timeline Comparison, report/ticket
        │   └── AssetList.jsx        # Read-only asset grid with per-asset Timeline Comparison
        └── components/
            ├── Navbar.jsx, MapView.jsx, HealthScoreGauge.jsx, RiskAnalyticsChart.jsx
            └── FindingsTable.jsx, AlertCard.jsx, TimelineComparison.jsx
```

**Architecture principle (enforced throughout):** Routes only validate
requests and return responses. Services coordinate workflows. The Vision
Intelligence Engine performs all technical analysis. The database stores
state. Business rules never exist inside API routes.

---

## 2. Requirements

- Python 3.12
- Node.js 18+ and npm
- ~500MB free disk for the YOLO checkpoint (auto-downloaded on first run)
- Internet access on first backend run only, to fetch `yolov8n.pt` via
  Ultralytics. If unavailable, `detector.py` automatically falls back to a
  deterministic heuristic detector (logged as a warning) so the pipeline
  still runs end-to-end.

---

## 3. Setup & Run

### Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On first boot, the app automatically:
1. Configures logging (INFO level, timestamped, per-module)
2. Creates all database tables (`gridvision.db`, SQLite)
3. Seeds 6 demo assets with historical inspections (idempotent - only runs
   if the `assets` table is empty, so it's safe to restart repeatedly)

Visit **http://localhost:8000/docs** for interactive Swagger API docs, or
**http://localhost:8000/health** for a liveness check.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**. The Vite dev server proxies `/api` and
`/storage` requests to `http://localhost:8000` (see `vite.config.js`), so
both servers must be running together.

### Quick API Test

```bash
curl http://localhost:8000/api/assets
curl http://localhost:8000/api/dashboard/summary
curl -X POST http://localhost:8000/api/inspections/upload \
  -F "file=@/path/to/tower_photo.jpg" \
  -F "asset_id=4"
```

---

## 4. API Reference

| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/api/inspections/upload` | multipart `file` + optional `asset_id` | `InspectionResult` | Runs the full Vision Intelligence Engine pipeline; rejects non-image content types (415), empty files (400), unknown `asset_id` (404), and corrupt images (422) with clean messages |
| GET | `/api/inspections` | query `asset_id?`, `severity?` | `InspectionOut[]` | |
| GET | `/api/inspections/{id}` | — | `InspectionResult` (findings + alert included) | 404 if missing |
| GET | `/api/assets` | — | `AssetOut[]` | Seeded, read-only |
| GET | `/api/assets/{id}` | — | `AssetDetail` (+ inspection history) | 404 if missing |
| GET | `/api/assets/{id}/timeline` | — | `TimelineOut` (Timeline Comparison + predicted failure window) | 404 if missing |
| GET | `/api/management/alerts` | query `status?`, `severity?` | `AlertOut[]` | |
| PATCH | `/api/management/alerts/{id}` | `{status}` | `AlertOut` | 404 if missing |
| GET | `/api/management/reports/{id}/pdf` | — | PDF stream | 404 if inspection missing |
| POST | `/api/management/tickets` | `{inspection_id, priority?}` | `TicketOut` | Priority auto-derived from severity if omitted |
| GET | `/api/dashboard/summary` | — | `DashboardSummary` | Executive KPIs |
| GET | `/api/dashboard/heatmap` | — | `HeatmapPoint[]` | Includes `asset_id`/`asset_type` for map click-through and type-specific markers |
| GET | `/health` | — | `{status: "ok"}` | Liveness check |

Every route validates only — all business logic executes in `services/` and
`vision_engine/`, per the locked architecture.

---

## 5. Vision Intelligence Engine — How It Works

```
Drone Image
    ↓
1. Asset Detection            → detector.py       (YOLO, singleton-loaded, + heuristic fallback)
    ↓
2. Infrastructure Measurements → geometry.py       (tilt°, sag ratio, vegetation clearance - numbers only)
    ↓
3. Condition Analysis          → intelligence.py   (damage interpretation via color/texture heuristics)
    ↓
4. Risk Assessment             → intelligence.py   (per-finding + per-measurement severity)
    ↓
5. Grid Health Analysis        → intelligence.py   (0-100 weighted score, see formula below)
    ↓
6. Maintenance Recommendation  → intelligence.py   (action + explainability + predicted failure window)
    ↓
Dashboard (auto-refreshes: KPIs, map, findings, charts, maintenance queue, alerts)
```

**Grid Health Score formula:**
```
GridHealthScore = 100 - (0.30·defects + 0.25·tilt + 0.20·sag + 0.15·vegetation + 0.05·age + 0.05·history)
```
All weights and thresholds live in `config.py` - nowhere else.

**Honest limitations (by design, not oversight):**
- `detector.py` maps a pretrained COCO-class YOLO checkpoint onto
  infrastructure concepts (no fine-tuned model exists yet); if YOLO can't
  load or finds nothing recognizable, it falls back to a deterministic
  heuristic region proposal (logged, never silent) so the pipeline always
  completes.
- `intelligence.py`'s damage classifier uses HSV color-heuristics (rust/corrosion
  detection via orange-brown hue ratio) rather than a trained classifier -
  the interface matches what a trained model would return, so it's a
  drop-in upgrade path.
- Predictive maintenance (`predict_failure_window_days`) is a transparent
  linear regression over historical Grid Health Scores, not ML - deliberately
  deterministic and explainable for a live demo.

---

## 6. Database Flow

`assets` → `inspections` (1:many) → `findings` (1:many); `inspections` →
`alerts` (1:0..1) and `inspections` → `maintenance_tickets` (1:0..1).

Every `POST /api/inspections/upload` call:
1. Saves the raw upload to `storage/uploads/`
2. Runs the full Vision Intelligence Engine pipeline (logged stage-by-stage)
3. Saves an annotated copy to `storage/annotated/`
4. Inserts one `Inspection` row + one `Finding` row per detected defect
   (plus a synthetic "structural_measurement" finding if tilt/sag alone
   crosses a threshold)
5. Updates the linked `Asset.health_score` cache
6. Inserts an `Alert` row if `overall_severity` is High or Critical
7. Commits everything in a single transaction (`db.commit()` at the end),
   so a failure partway through never leaves a half-written inspection

Timeline Comparison and Predictive Maintenance are **computed views** over
existing `inspections` rows grouped by `asset_id` - no separate tables, so
there's nothing to keep in sync.

---

## 7. Frontend Integration Notes

- **State management:** Zustand (`useAppStore`) holds only genuinely
  cross-page state - the cached dashboard summary, the last-created
  inspection ID, and the currently selected asset. Everything else
  (loading flags, form inputs, per-page data) stays local to its component.
- **Auto-refresh:** `Dashboard.loadAll()` is the single source that refreshes
  KPIs, the map, AI Findings, and Risk Analytics together (they're all
  derived from the same fetched inspection/heatmap/alert arrays) - it runs
  on every mount and immediately after a successful upload. Timeline
  Comparison refreshes automatically because navigating to a new
  inspection's detail page remounts `InspectionDetail`, which fetches fresh
  timeline data for that asset on every mount.
- **Upload experience:** the Dashboard's upload control shows a staged
  "Vision Intelligence Engine Processing..." animation (Asset Detection →
  Infrastructure Measurements → Condition Analysis → Grid Health Scoring)
  cycled visually while the single backend call is in flight, then
  transitions to a success/error toast before navigating to the new
  inspection.
- **Error handling:** every page that fetches data (`Dashboard`, `AssetList`,
  `InspectionDetail`) now handles fetch failures explicitly with a
  retry-capable error state, instead of hanging on an infinite spinner or
  failing silently in the console.
- **Empty states:** AI Findings shows clearly-labeled realistic sample
  detections when no real inspection exists yet; the map, asset grid, and
  alert feed all have dedicated empty-state messaging.

---

## 8. Production Readiness Notes (Final Phase)

- **Logging:** `main.py` configures `logging.basicConfig` once at startup;
  every module logs via `logging.getLogger(__name__)` so log lines are
  traceable to their exact source file. The inspection pipeline logs every
  stage (detection count, measurements, severity, health score, alert
  creation) for full auditability of a live demo run.
- **Error handling:** a global FastAPI exception handler in `main.py`
  guarantees any uncaught error returns a clean `{"detail": "..."}` JSON body
  (matching what the frontend already expects) instead of an HTML
  traceback, while the full exception is still logged server-side. The
  upload endpoint additionally validates content type, empty files, and
  unknown `asset_id` up front, and translates image-decode failures into a
  422 with a user-facing message rather than a raw 500.
- **CORS:** fixed to disable `allow_credentials` when `allow_origins=["*"]`
  - the previous combination is invalid per the CORS spec and silently
    rejected by browsers even though the server-side config looked correct.

---

## 9. Testing Checklist

Use this before a live demo or handoff:

**Backend**
- [ ] `uvicorn main:app --reload` starts with no errors; console shows
      `Starting GridVision AI v1.0.0` then `Database ready.`
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `GET /api/assets` returns 6 seeded assets (Tower 12/24/31/45,
      Transformer A/B)
- [ ] `GET /api/assets/{tower_45_id}/timeline` returns 4 historical points
      with declining health scores and a non-null `predicted_failure_days`
- [ ] `POST /api/inspections/upload` with a real photo returns a populated
      `InspectionResult` within a few seconds; console logs show all 5
      pipeline stages
- [ ] Uploading a non-image file returns `415` with a clear message, not a
      stack trace
- [ ] Uploading with an invalid `asset_id` returns `404`
- [ ] `GET /api/dashboard/summary` and `/api/dashboard/heatmap` both return
      data reflecting the assets above

**Frontend**
- [ ] `npm run dev` starts with no console errors
- [ ] Dashboard KPIs animate in on load; map shows 6 type-differentiated,
      risk-colored markers
- [ ] Drag-and-drop and click-to-upload both work; the staged processing
      animation appears and a success toast fires on completion
- [ ] After upload, you're navigated to the new inspection, and returning to
      `/` shows updated KPIs, map, findings, and maintenance queue
- [ ] AssetList shows "Sample Data" findings label on a fresh install with
      no real inspections, and per-asset Timeline Comparison expands
      correctly (Tower 45 shows a visible declining trend + failure window)
- [ ] Stopping the backend and reloading the frontend shows a retry-capable
      error state on Dashboard/AssetList/InspectionDetail, not an infinite
      spinner
- [ ] Layout holds up at both desktop (1440px) and mobile (375px) widths -
      KPI cards wrap to 2 columns, the map stays usable, action buttons wrap
      instead of overflowing

---

## 10. Demo Script (suggested)

1. Open Dashboard - point out the 5 sections (KPIs, map, findings, analytics,
   maintenance queue) and the live risk-colored map markers.
2. Upload a tower/conductor photo (or drag one onto the map panel) - narrate
   the staged Vision Intelligence Engine animation as it cycles.
3. Land on the new Inspection Detail page - walk through the annotated
   image, Grid Health Score gauge, findings with explainable-AI text, and
   the embedded Timeline Comparison.
4. Navigate to Assets, expand Tower 45 - show the deliberate March→June
   deterioration arc and the predicted failure window as the predictive
   maintenance centerpiece.
5. Return to Dashboard - show the Maintenance Queue and Active Alerts now
   reflecting the new inspection, and download the PDF report from the
   detail page.

---

## Next Steps (Not in This Package)

- Fine-tune a custom YOLO checkpoint on labeled transmission-line imagery
  to replace the COCO-class mapping in `detector.py`
- Replace the HSV-heuristic damage classifier in `intelligence.py` with a
  trained model (same function interface, no caller changes needed)
- Add authentication if this moves beyond a single-operator demo context
