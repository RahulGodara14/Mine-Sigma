"""
Imagery router for handling satellite imagery operations.
Currently provides mock responses but is structured to later
integrate real Earth Engine / Copernicus data.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Optional
import uuid

from app.schemas import ImageryResponse, ImageryMetadata, ErrorResponse
from app.services.geospatial_service import get_geospatial_service
from app.services.earth_engine_service import get_earth_engine_service

router = APIRouter(prefix="/api/imagery", tags=["imagery"])

# Mock imagery storage (in-memory). In production, use persistent storage or DB.
imagery_store: Dict[str, ImageryResponse] = {}

geospatial_service = get_geospatial_service()
ee_service = get_earth_engine_service()


@router.get("/{analysis_id}/results", response_model=ImageryResponse, responses={404: {"model": ErrorResponse}})
async def get_analysis_results(analysis_id: str):
    """Get imagery results for a completed analysis.

    For now this returns a mock Sentinel-2 record. Later you can
    connect this to your `ai_engine` outputs or Earth Engine exports.
    """

    imagery_id = str(uuid.uuid4())

    imagery_response = ImageryResponse(
        imagery_id=imagery_id,
        aoi_id="mock_aoi_id",
        metadata=ImageryMetadata(
            satellite="Sentinel-2",
            acquisition_date="2024-01-15T10:30:00Z",
            cloud_coverage=5.2,
            resolution="10m",
            bands=["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B8A", "B11", "B12"],
        ),
        download_url=f"/api/imagery/{imagery_id}/download",
        thumbnail_url=f"/api/imagery/{imagery_id}/thumbnail",
    )

    imagery_store[imagery_id] = imagery_response

    return imagery_response


@router.get("/{imagery_id}/download")
async def download_imagery(imagery_id: str):
    """Download processed imagery file.

    Currently returns a placeholder JSON message.
    """

    if imagery_id not in imagery_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagery {imagery_id} not found",
        )

    return {
        "message": f"Download would start for imagery {imagery_id}",
        "note": "This is a placeholder response. In production, this would return the actual imagery file.",
    }


@router.get("/{imagery_id}/thumbnail")
async def get_imagery_thumbnail(imagery_id: str):
    """Get thumbnail preview of imagery.

    Currently returns a placeholder JSON message.
    """

    if imagery_id not in imagery_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagery {imagery_id} not found",
        )

    return {
        "message": f"Thumbnail would be displayed for imagery {imagery_id}",
        "note": "This is a placeholder response. In production, this would return the actual thumbnail image.",
    }


@router.get("/{aoi_id}/available")
async def get_available_imagery(aoi_id: str):
    """Get list of available imagery for an AOI.

    This validates that the AOI exists and returns a mock time series
    of Sentinel-2 scenes for UI development.
    """

    aoi = geospatial_service.get_aoi(aoi_id)
    if not aoi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AOI {aoi_id} not found",
        )

    available_imagery = [
        {
            "date": "2024-01-15",
            "satellite": "Sentinel-2",
            "cloud_coverage": 5.2,
            "available_bands": [
                "B02",
                "B03",
                "B04",
                "B05",
                "B06",
                "B07",
                "B08",
                "B8A",
                "B11",
                "B12",
            ],
        },
        {
            "date": "2024-01-10",
            "satellite": "Sentinel-2",
            "cloud_coverage": 12.8,
            "available_bands": [
                "B02",
                "B03",
                "B04",
                "B05",
                "B06",
                "B07",
                "B08",
                "B8A",
                "B11",
                "B12",
            ],
        },
        {
            "date": "2024-01-05",
            "satellite": "Sentinel-2",
            "cloud_coverage": 2.1,
            "available_bands": [
                "B02",
                "B03",
                "B04",
                "B05",
                "B06",
                "B07",
                "B08",
                "B8A",
                "B11",
                "B12",
            ],
        },
    ]

    return {
        "aoi_id": aoi_id,
        "available_imagery": available_imagery,
        "total_count": len(available_imagery),
    }


@router.post("/{aoi_id}/sentinel2", response_model=ImageryResponse, responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}})
async def fetch_sentinel2_for_aoi(
    aoi_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    max_cloud_cover: float = 20.0,
):
    """Fetch real Sentinel-2 mosaic for an AOI using Earth Engine.

    This uses the polygon stored in /api/aoi and returns a downloadable
    GeoTIFF URL plus basic metadata. Existing mock endpoints are unchanged.
    """

    aoi = geospatial_service.get_aoi(aoi_id)
    if not aoi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AOI {aoi_id} not found",
        )

    geometry = aoi.get("geometry") or {}
    try:
        url, meta = ee_service.fetch_sentinel2_imagery(
            geometry,
            start_date=start_date,
            end_date=end_date,
            max_cloud_cover=max_cloud_cover,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching Sentinel-2 imagery: {exc}",
        ) from exc

    imagery_id = str(uuid.uuid4())
    metadata = ImageryMetadata(
        satellite=meta.get("satellite", "Sentinel-2"),
        acquisition_date=meta.get("date_acquired", ""),
        cloud_coverage=float(meta.get("cloud_coverage", 0.0)),
        resolution=str(meta.get("resolution", "")),
        bands=meta.get("bands", []),
        processing_level=meta.get("processing_level", "L2A"),
    )

    response = ImageryResponse(
        imagery_id=imagery_id,
        aoi_id=aoi_id,
        metadata=metadata,
        download_url=url,
        thumbnail_url=meta.get("thumbnail_url"),
    )

    imagery_store[imagery_id] = response
    return response
