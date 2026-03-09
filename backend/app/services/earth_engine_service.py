"""
Earth Engine imagery service for fetching Sentinel-2 mosaics over AOIs.
Builds on top of existing gee_service initialization.
"""

from __future__ import annotations

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import ee
import numpy as np
import requests
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling

from app.services.gee_service import ensure_ee_initialized


class EarthEngineService:
    """Service for fetching Sentinel-2 imagery from Google Earth Engine."""

    def __init__(self) -> None:
        # defer initialization to gee_service
        pass

    @staticmethod
    def _clean_coords(coords):
        """Remove Z values (altitude) from coordinate tuples."""
        return [(x, y) for x, y, *_ in coords]

    def geometry_to_ee_polygon(self, geometry: Dict) -> ee.Geometry:
        """Convert GeoJSON geometry to Earth Engine Polygon.

        Handles both Polygon and MultiPolygon types.
        """
        gtype = geometry.get("type")
        coords = geometry.get("coordinates", [])

        if gtype == "Polygon":
            ee_coords = [self._clean_coords(ring) for ring in coords]
            return ee.Geometry.Polygon(ee_coords)

        if gtype == "MultiPolygon":
            ee_coords = []
            for poly in coords:
                for ring in poly:
                    ee_coords.append(self._clean_coords(ring))
            return ee.Geometry.Polygon(ee_coords)

        raise ValueError(f"Unsupported geometry type: {gtype}")

    def fetch_sentinel2_imagery(
        self,
        aoi_geometry: Dict,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        max_cloud_cover: float = 20.0,
        bands: Optional[List[str]] = None,
    ) -> Tuple[str, Dict]:
        """Fetch Sentinel-2 imagery for the given AOI and return download URL + metadata."""

        ensure_ee_initialized()

        if end_date is None:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")
        if start_date is None:
            start_date = (datetime.utcnow() - timedelta(days=365)).strftime("%Y-%m-%d")
        if bands is None:
            bands = ["B2", "B3", "B4", "B8", "B11", "B12"]

        ee_polygon = self.geometry_to_ee_polygon(aoi_geometry)

        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(ee_polygon)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", max_cloud_cover))
        )

        try:
            count = collection.size().getInfo()
            if count == 0:
                raise ValueError("No Sentinel-2 images found for the given AOI and date range")
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"Error querying Sentinel-2 collection: {exc}") from exc

        image = collection.select(bands).median().clip(ee_polygon)

        first_image = collection.sort("CLOUDY_PIXEL_PERCENTAGE").first()
        try:
            metadata = {
                "date_acquired": first_image.date().format("YYYY-MM-dd").getInfo(),
                "cloud_coverage": first_image.get("CLOUDY_PIXEL_PERCENTAGE").getInfo(),
                "satellite": "Sentinel-2",
                "bands": bands,
                "resolution": "10-20m",
                "processing_level": "L2A",
            }
        except Exception:  # noqa: BLE001
            metadata = {
                "satellite": "Sentinel-2",
                "bands": bands,
                "resolution": "10-20m",
            }

        # Optional quick-look thumbnail (PNG) for direct display in the UI
        thumb_url = None
        try:
            vis_image = image.visualize(bands=["B4", "B3", "B2"], min=0, max=3000)
            thumb_url = vis_image.getThumbURL(
                {
                    "region": ee_polygon.bounds().getInfo()["coordinates"],
                    "dimensions": 512,
                    "format": "png",
                }
            )
        except Exception:  # noqa: BLE001
            thumb_url = None

        # Determine AOI area to adapt scale
        bounds = ee_polygon.bounds().getInfo()["coordinates"]
        area = ee_polygon.area().getInfo()  # square meters
        area_km2 = area / 1_000_000.0

        # Heuristic scale selection
        if area_km2 > 100:
            scale = 60
        elif area_km2 > 50:
            scale = 30
        elif area_km2 > 20:
            scale = 20
        else:
            scale = 10

        max_retries = 3
        scales_to_try = [scale, scale * 2, scale * 4]
        url = None
        final_scale = scale

        for retry, try_scale in enumerate(scales_to_try):
            try:
                url = image.getDownloadURL(
                    {
                        "scale": try_scale,
                        "region": bounds,
                        "format": "GEO_TIFF",
                        "crs": "EPSG:4326",
                    }
                )
                final_scale = try_scale
                break
            except Exception as exc:  # noqa: BLE001
                msg = str(exc)
                if "Total request size" in msg and retry < len(scales_to_try) - 1:
                    continue
                raise ValueError(f"Error generating download URL: {msg}") from exc

        if not url:
            raise ValueError("Failed to generate Sentinel-2 download URL")

        metadata["scale_meters"] = final_scale
        metadata["area_km2"] = round(area_km2, 2)
        if thumb_url:
            metadata["thumbnail_url"] = thumb_url

        return url, metadata

    def download_imagery(self, url: str, output_path: str) -> str:
        """Download imagery from a GEE URL to a local GeoTIFF path."""

        resp = requests.get(url, stream=True, timeout=300)
        resp.raise_for_status()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return output_path

    def get_imagery_info(self, image_path: str) -> Dict:
        """Return basic info about a GeoTIFF file."""
        with rasterio.open(image_path) as src:
            return {
                "width": src.width,
                "height": src.height,
                "bands": src.count,
                "crs": src.crs.to_string() if src.crs else None,
                "bounds": src.bounds,
                "transform": tuple(src.transform),
                "dtype": src.dtypes[0],
            }


_ee_service_singleton: Optional[EarthEngineService] = None


def get_earth_engine_service() -> EarthEngineService:
    global _ee_service_singleton
    if _ee_service_singleton is None:
        _ee_service_singleton = EarthEngineService()
    return _ee_service_singleton
