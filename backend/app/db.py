from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text
import os
from .database import Base, engine
import asyncio


async def _safe_exec(conn, sql: str):
    try:
        await conn.execute(text(sql))
        return True
    except Exception as e:
        print(f"[db.init_db] warning: failed to execute: {sql} :: {e}")
        return False

async def init_db():
    """Initialize database connection and create tables."""
    # Import all models to register them with SQLAlchemy
    from .models import (
        User, 
        Alert, 
        Complaint,
        Zone,
        Report,
        ActivityLog,
        AnalysisRun,
        UserRole,
        AlertStatus,
        AlertSeverity,
        ComplaintStatus
    )
    
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)",

        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS actor_email VARCHAR(255)",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS actor_user_id UUID",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'event'",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS action VARCHAR(255)",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100)",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255)",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS status VARCHAR(50)",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS details JSONB",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS message TEXT",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ",
        "ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",

        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS title VARCHAR(255)",
        "ALTER TABLE reports ALTER COLUMN title SET DEFAULT 'Untitled Report'",
        "UPDATE reports SET title = 'Untitled Report' WHERE title IS NULL",
        "ALTER TABLE reports ALTER COLUMN title SET NOT NULL",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS description TEXT",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS status VARCHAR(50)",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type VARCHAR(50)",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_by_user_id UUID",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS related_alert_id UUID",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_urls JSONB",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",

        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
        "ALTER TABLE zones ALTER COLUMN name SET DEFAULT 'Unnamed Zone'",
        "UPDATE zones SET name = 'Unnamed Zone' WHERE name IS NULL",
        "ALTER TABLE zones ALTER COLUMN name SET NOT NULL",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS district VARCHAR(255)",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS state VARCHAR(255)",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS area_km2 DOUBLE PRECISION",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50)",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS status VARCHAR(100)",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMPTZ",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS geometry JSONB",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ",
        "ALTER TABLE zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",
    ]

    async def _run_alters():
        last_err = None
        for attempt in range(1, 4):
            try:
                for sql in statements:
                    async with engine.begin() as conn:
                        await _safe_exec(conn, sql)
                return
            except Exception as e:
                last_err = e
                print(f"[db.init_db] alter attempt {attempt} failed: {e}")
                await asyncio.sleep(1.0 * attempt)
        print(f"[db.init_db] alter migrations failed after retries: {last_err}")

    # Ensure tables exist first (fast), then run alters.
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"[db.init_db] create_all warning: {e}")

    await _run_alters()

# This will be called when the application starts
async def startup_event():
    """Initialize the database when the application starts."""
    # Make startup fast: create tables synchronously, run slow alters in background.
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"[db.startup] create_all warning: {e}")

    async def _alters_only():
        # Reuse init_db alter logic without blocking startup.
        await init_db()

    asyncio.create_task(_alters_only())
