"""
GridVision AI - main.py
FastAPI application entrypoint. Creates the app, configures CORS, mounts
static storage, includes all routers, and seeds demo data on first boot.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import config
from database import init_db
from seed import seed_if_empty
from routes import inspections, assets, management, dashboard

# ---------------------------------------------------------------------------
# Logging - single, simple, production-friendly configuration. Every module
# that logs uses logging.getLogger(__name__), so log lines are traceable
# back to the exact file (routes/services/vision_engine) that emitted them.
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description=(
        "GridVision AI - Intelligent Drone-Based Power Distribution "
        "Asset Inspection System. Powered by the Vision Intelligence Engine."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory=str(config.STORAGE_DIR)), name="storage")

app.include_router(inspections.router)
app.include_router(assets.router)
app.include_router(management.router)
app.include_router(dashboard.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for anything not already turned into an HTTPException by a
    route. Ensures the frontend always receives a clean JSON error body
    (matching the {detail: str} shape axios/the UI already expects) instead
    of an opaque 500 with an HTML traceback, while the full exception is
    still logged server-side for debugging.
    """
    logger.exception("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred while processing this request."},
    )


@app.on_event("startup")
def on_startup():
    logger.info("Starting %s v%s", config.APP_NAME, config.APP_VERSION)
    init_db()
    seed_if_empty()
    logger.info("Database ready. Storage directory: %s", config.STORAGE_DIR)


@app.get("/")
def root():
    return {
        "name": config.APP_NAME,
        "version": config.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
