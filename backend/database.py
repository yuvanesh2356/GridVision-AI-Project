"""
GridVision AI - Database Layer
SQLAlchemy engine/session setup. Swapping DATABASE_URL to a Postgres URL
in config.py (or via env var) is the only change needed to migrate later.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called once at app startup."""
    # Import models here so they are registered on Base before create_all.
    import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
