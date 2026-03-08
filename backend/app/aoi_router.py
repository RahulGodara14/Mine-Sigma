"""
AOI (Area of Interest) router.
Provides endpoints to create, upload, list and manage AOIs based on polygons/KML/GeoJSON/Shapefile.
"""

from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict, List

from app.schemas import (
    AOIRequest, AOIResponse, BoundingBox, SearchLocation, ErrorResponse
)
from app.database import get_db
from app.models.zone import Zone
from app.services.geospatial_service import get_geospatial_service
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/aoi", tags=["aoi"])

geospatial_service = get_geospatial_service()


async def _sync_zone_from_aoi(
    *,
    db: AsyncSession,
    aoi_id: str,
    aoi_feature: Dict,
    default_name: str,
) -> None:
    props = (aoi_feature or {}).get("properties") or {}
    name = (props.get("name") or "").strip() or default_name
    area_km2 = props.get("area_km2")
    geometry = (aoi_feature or {}).get("geometry")

    result = await db.execute(select(Zone).where(Zone.name == name))
    zone = result.scalars().first()

    now = datetime.utcnow()

    if zone:
        if area_km2 is not None:
            zone.area_km2 = area_km2
        zone.geometry = geometry
        zone.last_scan_at = now
        if zone.status is None:
            zone.status = "Active Monitoring"
    else:
        zone = Zone(
            name=name,
            district=None,
            state=None,
            area_km2=area_km2,
            risk_level=None,
            status="Active Monitoring",
            last_scan_at=now,
            geometry=geometry,
        )
        db.add(zone)

    await db.commit()


@router.post("/create", response_model=AOIResponse, responses={400: {"model": ErrorResponse}})
async def create_aoi(aoi_request: AOIRequest, db: AsyncSession = Depends(get_db)):
    """Create a new Area of Interest from geometry."""
    try:
        aoi_id, aoi_feature = geospatial_service.create_aoi_from_geometry(
            aoi_request.geometry.dict(),
            aoi_request.properties.dict() if aoi_request.properties else None,
        )

        if aoi_feature.get("properties") is not None and not aoi_feature["properties"].get("name"):
            aoi_feature["properties"]["name"] = f"AOI {aoi_id}"

        try:
            await _sync_zone_from_aoi(
                db=db,
                aoi_id=aoi_id,
                aoi_feature=aoi_feature,
                default_name=aoi_feature.get("properties", {}).get("name") or f"AOI {aoi_id}",
            )
        except Exception:
            pass

        bbox_dict = geospatial_service.get_bounding_box(aoi_feature["geometry"])

        return AOIResponse(
            id=aoi_id,
            feature={
                "geometry": aoi_feature["geometry"],
                "properties": aoi_feature["properties"],
            },
            bounding_box=BoundingBox(**bbox_dict),
            status="created",
            message="AOI created successfully",
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.post("/upload", response_model=AOIResponse, responses={400: {"model": ErrorResponse}})
async def upload_aoi_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Upload and process a geospatial file (KML, GeoJSON, or Shapefile ZIP)."""

    allowed_extensions = [".kml", ".geojson", ".json", ".zip"]
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}",
        )

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 10MB limit",
        )

    try:
        aoi_id, aoi_feature = geospatial_service.process_uploaded_file(
            content, file.filename
        )

        if aoi_feature.get("properties") is not None and not aoi_feature["properties"].get("name"):
            aoi_feature["properties"]["name"] = Path(file.filename).stem

        try:
            await _sync_zone_from_aoi(
                db=db,
                aoi_id=aoi_id,
                aoi_feature=aoi_feature,
                default_name=Path(file.filename).stem or f"AOI {aoi_id}",
            )
        except Exception:
            pass

        bbox_dict = geospatial_service.get_bounding_box(aoi_feature["geometry"])

        return AOIResponse(
            id=aoi_id,
            feature={
                "geometry": aoi_feature["geometry"],
                "properties": aoi_feature["properties"],
            },
            bounding_box=BoundingBox(**bbox_dict),
            status="created",
            message=f"AOI created from {file.filename}",
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}",
        )


@router.get("/{aoi_id}", response_model=AOIResponse, responses={404: {"model": ErrorResponse}})
async def get_aoi(aoi_id: str):
    """Retrieve an AOI by its ID."""
    aoi_feature = geospatial_service.get_aoi(aoi_id)

    if not aoi_feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AOI with ID {aoi_id} not found",
        )

    bbox_dict = geospatial_service.get_bounding_box(aoi_feature["geometry"])

    return AOIResponse(
        id=aoi_id,
        feature={
            "geometry": aoi_feature["geometry"],
            "properties": aoi_feature["properties"],
        },
        bounding_box=BoundingBox(**bbox_dict),
        status="retrieved",
        message="AOI retrieved successfully",
    )


@router.get("/", response_model=Dict[str, AOIResponse])
async def list_aois():
    """List all stored AOIs."""
    aois = geospatial_service.list_aois()

    result: Dict[str, AOIResponse] = {}
    for aoi_id, aoi_feature in aois.items():
        bbox_dict = geospatial_service.get_bounding_box(aoi_feature["geometry"])
        result[aoi_id] = AOIResponse(
            id=aoi_id,
            feature={
                "geometry": aoi_feature["geometry"],
                "properties": aoi_feature["properties"],
            },
            bounding_box=BoundingBox(**bbox_dict),
            status="stored",
            message=None,
        )

    return result


@router.delete("/{aoi_id}")
async def delete_aoi(aoi_id: str):
    """Delete an AOI by its ID."""
    success = geospatial_service.delete_aoi(aoi_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AOI with ID {aoi_id} not found",
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": f"AOI {aoi_id} deleted successfully"},
    )


@router.get("/search/location", response_model=List[SearchLocation])
async def search_location(query: str) -> List[SearchLocation]:
    """Search for geographic locations by name.

    NOTE: Currently returns a mock response. In production you can
    integrate with Nominatim, Google Geocoding API, or Mapbox.
    """

    mock_results = [
        SearchLocation(
            name=f"Location: {query}",
            coordinates={"latitude": 40.7128, "longitude": -74.0060},
            country="Mock Country",
            admin_area="Mock State",
        )
    ]

    return mock_results
