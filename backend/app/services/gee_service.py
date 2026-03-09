import ee
import geemap
import os
import json
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# Path discovery: backend/serviceAccountKey.json (adjust if needed)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SERVICE_ACCOUNT_KEY = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or os.path.join(BASE_DIR, "serviceAccountKey.json")

_ee_initialized = False

def init_ee() -> None:
    """
    Try to initialize Earth Engine non-interactively.
    Raises RuntimeError with a clear message if initialization fails.
    """
    global _ee_initialized
    if _ee_initialized:
        return

    # 1) Try service account JSON (non-interactive)
    if SERVICE_ACCOUNT_KEY and os.path.exists(SERVICE_ACCOUNT_KEY):
        try:
            with open(SERVICE_ACCOUNT_KEY, "r") as f:
                jd = json.load(f)
            sa_email = jd.get("client_email")
            if not sa_email:
                raise ValueError("Service account JSON missing 'client_email' field")

            creds = ee.ServiceAccountCredentials(sa_email, SERVICE_ACCOUNT_KEY)
            ee.Initialize(credentials=creds)
            _ee_initialized = True
            logger.info("Earth Engine initialized using service account: %s", sa_email)
            return
        except Exception as e:
            logger.exception("Failed to initialize Earth Engine with service account (%s): %s",
                             SERVICE_ACCOUNT_KEY, e)
            # fall through to trying application credentials

    # 2) Try application-default/user credentials (non-interactive if already authenticated)
    try:
        ee.Initialize()
        _ee_initialized = True
        logger.info("Earth Engine initialized using application/default or user credentials")
        return
    except Exception as e:
        # Do NOT call ee.Authenticate() here on the server (it is interactive).
        msg = (
            "Earth Engine initialization failed (no non-interactive credentials found).\n"
            "For local dev: run `earthengine authenticate` interactively once.\n"
            "For servers: create a Google Cloud service account, enable Earth Engine for your GCP project, "
            "download its JSON key and place it at `backend/serviceAccountKey.json` or set "
            "the env var `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`, then restart.\n"
            "If you are using a service account, ensure the GCP project is registered to use Earth Engine "
            "(see https://console.cloud.google.com/earth-engine/configuration?project=<YOUR_PROJECT>). "
            f"Underlying error: {e}"
        )
        logger.error(msg)
        raise RuntimeError(msg)

def ensure_ee_initialized() -> None:
    """
    Ensure EE is initialized. Call this from API handlers or functions that need EE.
    """
    if not _ee_initialized:
        init_ee()

def get_satellite_data(lat: float, lon: float, buffer_size: float = 3000) -> Tuple[str, str]:
    """
    Fetches Sentinel-2 and DEM data for the given coordinates.
    Returns paths to the downloaded GeoTIFF files.

    Note: This function will attempt to initialize Earth Engine lazily and will raise
    a RuntimeError with remediation instructions if initialization fails.
    """
    ensure_ee_initialized()

    roi = ee.Geometry.Point([lon, lat]).buffer(buffer_size).bounds()

    # Create output directory
    output_dir = "temp_data"
    os.makedirs(output_dir, exist_ok=True)

    dem_path = os.path.join(output_dir, "dem.tif")
    sat_path = os.path.join(output_dir, "sat.tif")

    # Fetch DEM
    if not os.path.exists(dem_path):
        logger.info("Fetching DEM to %s", dem_path)
        geemap.ee_export_image(
            ee.Image("USGS/SRTMGL1_003").clip(roi),
            filename=dem_path,
            scale=30,
            region=roi,
            crs='EPSG:3857',
            file_per_band=False
        )

    # Fetch Sentinel-2 (Optical)
    if not os.path.exists(sat_path):
        logger.info("Fetching Sentinel-2 to %s", sat_path)
        s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
              .filterBounds(roi)
              .sort('CLOUDY_PIXEL_PERCENTAGE')
              .first()
              .select(['B4', 'B8']))  # Red and NIR for NDVI

        geemap.ee_export_image(
            s2.clip(roi),
            filename=sat_path,
            scale=30,
            region=roi,
            crs='EPSG:3857',
            file_per_band=False
        )

    return dem_path, sat_path
