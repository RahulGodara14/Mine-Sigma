from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .db import startup_event
import os

# Import routers
from .auth_router import router as auth_router
from .officer_router import router as officer_router
from .admin_router import router as admin_router
from .alerts_router import router as alerts_router
from .zones_router import router as zones_router
from .reports_router import router as reports_router
from .complaints_router import router as complaints_router
from .aoi_router import router as aoi_router
from .imagery_router import router as imagery_router
from .quantitative_analysis import router as analysis_router

# Legacy analysis endpoints used by the website (e.g. /analyze-mine)
from routers import router as legacy_analysis_router

# Import models to ensure they are registered with SQLAlchemy
from .models import *

def create_app():
    # Create FastAPI app
    app = FastAPI(
        title="Mine-Sigma API",
        description="Backend API for Mine-Sigma application",
        version="1.0.0"
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://10.53.9.227:3000",
            "http://10.150.57.227:3000",
            "http://localhost:19006",
            "http://127.0.0.1:19006",
            "http://10.53.9.227:19006",
            "http://10.150.57.227:19006",
        ],
        allow_origin_regex=r"^https?://(localhost|127\\.0\\.0\\.1|10\\.53\\.9\\.227|10\\.150\\.57\\.227)(:\\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    # NOTE: Routers already define their own prefixes (e.g. /api/aoi). Avoid double-prefixing.
    app.include_router(auth_router)
    app.include_router(officer_router)
    app.include_router(admin_router)
    app.include_router(alerts_router)
    app.include_router(zones_router)
    app.include_router(reports_router)
    app.include_router(complaints_router)
    app.include_router(aoi_router)
    app.include_router(imagery_router)
    app.include_router(analysis_router)
    app.include_router(legacy_analysis_router)

    # Add startup event
    @app.on_event("startup")
    async def on_startup():
        await startup_event()

    # Health check endpoint
    @app.get("/api/health")
    async def health_check():
        return {"status": "ok", "database": "connected"}

    return app

# Create the application
app = create_app()
