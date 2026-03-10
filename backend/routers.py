from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

import os
import json
import sys
import shutil
from datetime import datetime, timedelta
import ee
import geemap

from app.database import async_session
from app.models.analysis_run import AnalysisRun
from app.models import ActivityLog, Alert, AlertSeverity, AlertStatus

# New modular routers for AOI, imagery & quantitative analysis are mounted in app.main.
# This router should only expose legacy analysis endpoints.

# --- PATH FIX: Point to Root Folder ---
# Go up 1 level (from 'backend' to 'root') to find 'ai_engine'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

try:
    from ai_engine.gemini_parser import extract_mining_params
    from ai_engine.audit_engine import run_audit_pipeline, initialize_gee
except ImportError as e:
    print(f" Import Error: {e} (Check if ai_engine folder exists in root)")
    # Mock for safety
    def extract_mining_params(p): return {}
    def run_audit_pipeline(p, output_base_path): return {"html_file": "", "png_file": "", "pdf_file": ""}
    def initialize_gee(): pass

router = APIRouter()

# GLOBAL STATE (For Dashboard)
last_analysis_result = {
    "status": "waiting",
    "message": "No analysis run yet."
}

@router.post("/analyze-mine")
async def analyze_mine(file: UploadFile = File(...)):
    global last_analysis_result
    run_id = None
    try:
        # 1. Save Uploaded File Locally
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Run Gemini
        print(" SERVER: Calling Gemini...")
        params = extract_mining_params(temp_path)
        
        # Check if parameters were extracted
        if not params:
            print(" ERROR: Could not extract mining parameters from document")
            if os.path.exists(temp_path): os.remove(temp_path)
            raise HTTPException(status_code=400, detail="Could not extract mining parameters from the uploaded document. Please ensure the document contains valid mining site information.")
        
        # Create AnalysisRun record (running)
        async with async_session() as session:
            run = AnalysisRun(
                project_name=params.get("project_name"),
                latitude=str(params.get("lat")) if params.get("lat") is not None else None,
                longitude=str(params.get("lon")) if params.get("lon") is not None else None,
                status="running",
                result=None,
            )
            session.add(run)
            await session.commit()
            await session.refresh(run)
            run_id = run.id

        # 3. Run Audit Engine
        # Save to 'backend/public'
        public_dir = os.path.join(os.path.dirname(__file__), "public")
        os.makedirs(public_dir, exist_ok=True)
        
        result = run_audit_pipeline(params, output_base_path=public_dir)
        
        # Cleanup Input
        if os.path.exists(temp_path): os.remove(temp_path)

        # 4. UPDATE DASHBOARD DATA
        safe_name = params.get('project_name', 'Project').replace(" ", "_")
        
        # Construct Local URLs (Assuming backend runs on port 8000)
        base_url = "http://127.0.0.1:8000/static"
        
        last_analysis_result = {
            "status": "success",
            "project": params.get('project_name'),
            "location": f"{params.get('lat')}, {params.get('lon')}",
            "compliance": "Analysis Complete",
            "stats": result.get('stats', {}),
            "urls": {
                "model_3d": f"{base_url}/audit_{safe_name}/{safe_name}_3D_Model.html",
                "map_2d": f"{base_url}/audit_{safe_name}/{safe_name}_Evidence_Map.png",
                "report": f"{base_url}/audit_{safe_name}/{safe_name}_Report.pdf"
            }
        }

        # Persist final result
        stats = result.get("stats") or {}
        persist_result = {
            **last_analysis_result,
            "legal_mining_area_ha": stats.get("legal_ha"),
            "illegal_mining_area_ha": stats.get("illegal_ha"),
        }
        if run_id is not None:
            async with async_session() as session:
                db_run = await session.get(AnalysisRun, run_id)
                if db_run is not None:
                    db_run.status = "success"
                    db_run.result = persist_result
                    await session.commit()

        illegal_ha = stats.get("illegal_ha")
        legal_ha = stats.get("legal_ha")

        def _coerce_float(v):
            try:
                if v is None:
                    return None
                return float(v)
            except Exception:
                return None

        illegal_val = _coerce_float(illegal_ha) or 0.0
        legal_val = _coerce_float(legal_ha) or 0.0

        severity = (
            AlertSeverity.CRITICAL if illegal_val >= 1000.0 else
            AlertSeverity.HIGH if illegal_val >= 100.0 else
            AlertSeverity.MEDIUM if illegal_val >= 10.0 else
            AlertSeverity.LOW
        )

        if illegal_val > 0.0:
            async with async_session() as session:
                extra = {
                    "mine_name": params.get("project_name"),
                    "district": params.get("district"),
                    "lease_id": params.get("lease_id"),
                    "latitude": params.get("lat"),
                    "longitude": params.get("lon"),
                    "legal_ha": legal_val,
                    "illegal_ha": illegal_val,
                    "analysis_run_id": str(run_id) if run_id is not None else None,
                }

                alert = Alert(
                    title=params.get("project_name") or "Mining Alert",
                    description=(
                        f"Automated compliance alert from lease analysis. "
                        f"Illegal area: {illegal_val:.2f} Ha. Legal area: {legal_val:.2f} Ha."
                    ),
                    status=AlertStatus.OPEN,
                    severity=severity,
                    extra_data=extra,
                )
                session.add(alert)
                await session.flush()

                session.add(
                    ActivityLog(
                        actor_email=None,
                        actor_user_id=None,
                        action="alert_created_auto",
                        entity_type="alert",
                        entity_id=str(alert.id),
                        status="success",
                        details=extra,
                    )
                )
                await session.commit()

        return JSONResponse(content=last_analysis_result)

    except Exception as e:
        print(f" ERROR: {e}")
        if run_id is not None:
            try:
                async with async_session() as session:
                    db_run = await session.get(AnalysisRun, run_id)
                    if db_run is not None:
                        db_run.status = "failed"
                        db_run.error_message = str(e)
                        await session.commit()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/analysis/latest")
async def get_latest_analysis():
    return JSONResponse(content=last_analysis_result)

@router.get("/api/timeseries/{lat}/{lon}")
async def get_timeseries(lat: float, lon: float):
    """
    Fetch available satellite imagery dates from Earth Engine for a location.
    Returns list of dates with image URLs for timeline slider.
    """
    try:
        initialize_gee()
        
        # Define time range: 2020 to current date
        start_date = '2020-01-01'
        end_date = datetime.now().strftime('%Y-%m-%d')
        
        # Create point geometry
        point = ee.Geometry.Point([lon, lat])
        
        # Get Sentinel-2 collection
        s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
              .filterBounds(point)
              .filterDate(start_date, end_date)
              .sort('system:time_start'))
        
        # Get list of available dates
        dates = s2.aggregate_array('system:time_start').getInfo()
        
        # Convert timestamps to readable dates
        available_dates = []
        for timestamp in dates:
            date_obj = datetime.fromtimestamp(timestamp / 1000)
            available_dates.append(date_obj.strftime('%Y-%m-%d'))
        
        # Remove duplicates and sort
        available_dates = sorted(list(set(available_dates)))
        
        return {
            "status": "success",
            "dates": available_dates,
            "count": len(available_dates),
            "start_date": start_date,
            "end_date": end_date
        }
    
    except Exception as e:
        print(f" Timeseries Error: {e}")
        return {"status": "error", "message": str(e), "dates": []}

@router.get("/api/satellite-image/{lat}/{lon}/{date}")
async def get_satellite_image(lat: float, lon: float, date: str):
    """
    Get satellite image for a specific date and location.
    Returns image URL and metadata.
    """
    try:
        initialize_gee()
        
        # Parse date and create date range (±1 day for cloud-free image)
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        start_date = (date_obj - timedelta(days=1)).strftime('%Y-%m-%d')
        end_date = (date_obj + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Create point geometry with buffer
        point = ee.Geometry.Point([lon, lat]).buffer(5000)
        
        # Get best cloud-free image for that date
        s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
              .filterBounds(point)
              .filterDate(start_date, end_date)
              .sort('CLOUDY_PIXEL_PERCENTAGE')
              .first())
        
        if s2 is None:
            return {"status": "error", "message": "No imagery available for this date"}
        
        # Select RGB bands and create thumbnail URL
        rgb = s2.select(['B4', 'B3', 'B2'])
        
        url = rgb.getThumbURL({
            'min': 0,
            'max': 3000,
            'dimensions': 1024,
            'region': point
        })
        
        return {
            "status": "success",
            "date": date,
            "image_url": url,
            "lat": lat,
            "lon": lon,
            "bounds": {
                "west": point.bounds().getInfo()['coordinates'][0][0][0],
                "south": point.bounds().getInfo()['coordinates'][0][0][1],
                "east": point.bounds().getInfo()['coordinates'][0][2][0],
                "north": point.bounds().getInfo()['coordinates'][0][2][1]
            }
        }
    
    except Exception as e:
        print(f" Satellite Image Error: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/api/items/")
async def get_items():
    return [{"id": 1, "name": "Jharia Mine"}, {"id": 2, "name": "Korba Mine"}]