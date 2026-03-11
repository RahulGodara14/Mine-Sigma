import rasterio
import numpy as np
from scipy.ndimage import median_filter

def analyze_image(dem_path: str, sat_path: str):
    """
    Processes DEM and Satellite images to detect mining activity.
    Returns a dictionary of analysis results.
    """
    # 1. Calculate NDVI and Mining Mask
    with rasterio.open(sat_path) as src:
        red = src.read(1).astype(float)
        nir = src.read(2).astype(float)
        
        # Avoid division by zero
        ndvi = (nir - red) / (nir + red + 1e-5)
        
        # Simple thresholding for "mining" (bare soil/rock)
        # NDVI < 0.2 usually indicates non-vegetated areas
        mine_mask = np.zeros_like(ndvi)
        mine_mask[ndvi < 0.2] = 1
        
        # Clean up noise
        mine_mask = median_filter(mine_mask, size=5)
        
        # Calculate area (approximate based on pixel count and 30m resolution)
        # Each pixel is 30x30 = 900 sqm
        pixel_area_sqm = 900
        total_pixels = mine_mask.size
        mining_pixels = np.sum(mine_mask)
        
        mining_area_sqm = mining_pixels * pixel_area_sqm
        total_area_sqm = total_pixels * pixel_area_sqm
        
        encroachment_percentage = (mining_pixels / total_pixels) * 100

    # 2. Estimate Volume from DEM (Very rough approximation)
    with rasterio.open(dem_path) as src:
        elevation = src.read(1)
        # Assume mining depth is relative to a baseline (e.g., max elevation in the area)
        # This is a simplification for the hackathon
        max_elev = np.max(elevation)
        depth_map = max_elev - elevation
        
        # Only consider depth in mining areas
        mining_depth_map = depth_map * mine_mask
        
        avg_depth = np.mean(mining_depth_map[mining_depth_map > 0]) if np.sum(mining_depth_map) > 0 else 0
        total_volume = np.sum(mining_depth_map) * pixel_area_sqm

    return {
        "depth": f"{avg_depth:.1f}m",
        "volume": f"{total_volume:,.0f} m³",
        "encroachment": round(encroachment_percentage, 1),
        "status": "Illegal Activity Detected" if encroachment_percentage > 10 else "Compliant"
    }
