"""
Geospatial processing service for mining site AOI management.
Handles coordinate validation, file processing, and geometry transformations.
"""

import json
import uuid
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import tempfile
import zipfile
from datetime import datetime

try:
    import geopandas as gpd
    from shapely.geometry import Polygon, MultiPolygon, mapping, shape
    from shapely.validation import make_valid
    from shapely.ops import transform
    from pyproj import Transformer
    import numpy as np
    GEOSPATIAL_AVAILABLE = True
except ImportError:
    GEOSPATIAL_AVAILABLE = False


class GeospatialService:
    """Service for geospatial operations and AOI management."""
    
    def __init__(self):
        self.aois: Dict[str, Dict[str, Any]] = {}
        if not GEOSPATIAL_AVAILABLE:
            print("⚠️  Warning: Geospatial libraries not available. Some features will be limited.")
    
    def validate_coordinates(self, coordinates: List[Any]) -> bool:
        """Validate coordinate array structure.

        Accepts both list- and tuple-based coordinates, as commonly returned by
        GeoJSON parsers and Shapely's ``mapping()``.
        """
        try:
            # Top-level must be an array of rings
            if not isinstance(coordinates, (list, tuple)) or len(coordinates) == 0:
                return False

            # For Polygon/MultiPolygon rings, each ring is a sequence of coordinate pairs
            for ring in coordinates:
                if not isinstance(ring, (list, tuple)) or len(ring) < 4:
                    return False

                first = ring[0]
                last = ring[-1]
                # Ensure ring is closed (first == last) on lon/lat even if tuples
                if (not isinstance(first, (list, tuple)) or not isinstance(last, (list, tuple)) or
                        len(first) < 2 or len(last) < 2 or
                        float(first[0]) != float(last[0]) or float(first[1]) != float(last[1])):
                    return False

                # Validate each coordinate pair
                for coord in ring:
                    if (not isinstance(coord, (list, tuple)) or
                            len(coord) < 2 or
                            not all(isinstance(x, (int, float)) for x in coord[:2])):
                        return False

                    lon, lat = float(coord[0]), float(coord[1])
                    if not (-180.0 <= lon <= 180.0) or not (-90.0 <= lat <= 90.0):
                        return False

            return True
        except Exception:
            return False
    
    def create_aoi_from_geometry(
        self, 
        geometry: Dict[str, Any],
        properties: Optional[Dict[str, Any]] = None,
        aoi_id: Optional[str] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """Create an AOI from geometry data."""
        
        # Validate coordinates
        if not self.validate_coordinates(geometry.get('coordinates', [])):
            raise ValueError("Invalid coordinate structure")
        
        # Generate unique ID
        target_aoi_id = aoi_id or str(uuid.uuid4())
        
        # Create properties if not provided
        if properties is None:
            properties = {}
        
        # Calculate area if geospatial libs available
        if GEOSPATIAL_AVAILABLE:
            try:
                shapely_geom = shape(geometry)
                transformer = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
                projected_geom = transform(transformer.transform, shapely_geom)
                area_m2 = projected_geom.area
                properties['area_km2'] = round(area_m2 / 1_000_000, 2)
            except Exception as e:
                print(f"⚠️  Warning: Could not calculate area: {e}")
                properties['area_km2'] = None
        
        # Add metadata
        properties['created_at'] = datetime.utcnow().isoformat()
        if 'source' not in properties:
            properties['source'] = 'manual'
        
        # Create AOI feature
        aoi_feature = {
            'geometry': geometry,
            'properties': properties
        }
        
        # Store AOI
        self.aois[target_aoi_id] = aoi_feature
        
        return target_aoi_id, aoi_feature
    
    def get_bounding_box(self, geometry: Dict[str, Any]) -> Dict[str, float]:
        """Calculate bounding box for geometry."""
        try:
            if GEOSPATIAL_AVAILABLE:
                shapely_geom = shape(geometry)
                bounds = shapely_geom.bounds  # (minx, miny, maxx, maxy)
                return {
                    'west': bounds[0],
                    'south': bounds[1],
                    'east': bounds[2],
                    'north': bounds[3]
                }
            else:
                # Fallback: extract from coordinates
                coords = geometry.get('coordinates', [])
                if not coords:
                    raise ValueError("No coordinates found")
                
                # Flatten all coordinates
                all_coords = []
                def flatten_coords(c):
                    if isinstance(c[0], (list, tuple)):
                        for sub in c:
                            flatten_coords(sub)
                    else:
                        all_coords.append(c)
                
                flatten_coords(coords)
                lons = [c[0] for c in all_coords]
                lats = [c[1] for c in all_coords]
                
                return {
                    'west': min(lons),
                    'south': min(lats),
                    'east': max(lons),
                    'north': max(lats)
                }
        except Exception as e:
            raise ValueError(f"Could not calculate bounding box: {e}")
    
    def process_uploaded_file(self, file_content: bytes, filename: str) -> Tuple[str, Dict[str, Any]]:
        """Process uploaded geospatial file and create AOI."""
        
        if not GEOSPATIAL_AVAILABLE:
            raise ValueError("Geospatial libraries not available. Cannot process files.")
        
        file_type = self._get_file_type(filename)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            if file_type == "shapefile":
                return self._process_shapefile(file_content, temp_path)
            elif file_type == "geojson":
                return self._process_geojson(file_content)
            elif file_type == "kml":
                return self._process_kml(file_content, temp_path)
            else:
                raise ValueError(f"Unsupported file type: {filename}")
    
    def _get_file_type(self, filename: str) -> str:
        """Determine file type from filename."""
        extension = Path(filename).suffix.lower()
        
        if extension == '.zip':
            return "shapefile"
        elif extension in ['.geojson', '.json']:
            return "geojson"
        elif extension == '.kml':
            return "kml"
        else:
            raise ValueError(f"Unsupported file extension: {extension}")
    
    def _process_shapefile(self, zip_content: bytes, temp_path: Path) -> Tuple[str, Dict[str, Any]]:
        """Process zipped shapefile."""
        zip_file = temp_path / "shapefile.zip"
        with open(zip_file, 'wb') as f:
            f.write(zip_content)
        
        # Extract zip file
        extract_dir = temp_path / "extracted"
        extract_dir.mkdir()
        
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # Find .shp file
        shp_files = list(extract_dir.glob("*.shp"))
        if not shp_files:
            raise ValueError("No .shp file found in the zip archive")
        
        shp_file = shp_files[0]
        
        # Read with geopandas
        gdf = gpd.read_file(shp_file)
        
        # Convert to WGS84 if needed
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
        
        # Get first geometry (union if multiple)
        if len(gdf) > 1:
            geometry = gdf.geometry.unary_union
        else:
            geometry = gdf.geometry.iloc[0]
        
        # Ensure valid geometry
        if not geometry.is_valid:
            geometry = make_valid(geometry)
        
        # Convert to AOI format
        return self._geometry_to_aoi(geometry, {"source": "shapefile", "filename": shp_file.name})
    
    def _process_geojson(self, content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Process GeoJSON file."""
        try:
            geojson_data = json.loads(content.decode('utf-8'))
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")
        
        # Handle different GeoJSON structures
        if geojson_data.get('type') == 'Feature':
            geometry = geojson_data['geometry']
        elif geojson_data.get('type') == 'FeatureCollection':
            if not geojson_data.get('features'):
                raise ValueError("Empty FeatureCollection")
            geometry = geojson_data['features'][0]['geometry']
        elif geojson_data.get('type') in ['Polygon', 'MultiPolygon']:
            geometry = geojson_data
        else:
            raise ValueError("Invalid GeoJSON structure")
        
        if GEOSPATIAL_AVAILABLE:
            shapely_geom = shape(geometry)
            if not shapely_geom.is_valid:
                shapely_geom = make_valid(shapely_geom)
            return self._geometry_to_aoi(shapely_geom, {"source": "geojson"})
        else:
            return self.create_aoi_from_geometry(geometry, {"source": "geojson"})
    
    def _process_kml(self, content: bytes, temp_path: Path) -> Tuple[str, Dict[str, Any]]:
        """Process KML file."""
        kml_file = temp_path / "file.kml"
        with open(kml_file, 'wb') as f:
            f.write(content)
        
        # Use geopandas to read KML
        try:
            gdf = gpd.read_file(kml_file, driver='KML')
        except Exception as e:
            raise ValueError(f"Could not read KML file: {e}")
        
        # Convert to WGS84 if needed
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
        
        # Get first geometry (union if multiple)
        if len(gdf) > 1:
            geometry = gdf.geometry.unary_union
        else:
            geometry = gdf.geometry.iloc[0]
        
        # Ensure valid geometry
        if not geometry.is_valid:
            geometry = make_valid(geometry)
        
        return self._geometry_to_aoi(geometry, {"source": "kml"})
    
    def _geometry_to_aoi(self, shapely_geom, metadata: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """Convert Shapely geometry to AOI format."""
        
        # Convert to GeoJSON-like geometry
        geom_dict = mapping(shapely_geom)
        
        geometry = {
            'type': geom_dict['type'],
            'coordinates': geom_dict['coordinates']
        }
        
        return self.create_aoi_from_geometry(geometry, metadata)
    
    def get_aoi(self, aoi_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve AOI by ID."""
        return self.aois.get(aoi_id)
    
    def list_aois(self) -> Dict[str, Dict[str, Any]]:
        """List all stored AOIs."""
        return self.aois.copy()
    
    def delete_aoi(self, aoi_id: str) -> bool:
        """Delete AOI by ID."""
        if aoi_id in self.aois:
            del self.aois[aoi_id]
            return True
        return False
    
    def update_aoi(self, aoi_id: str, properties: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update AOI properties."""
        if aoi_id not in self.aois:
            return None
        
        self.aois[aoi_id]['properties'].update(properties)
        return self.aois[aoi_id]


# Singleton instance
_geospatial_service = None

def get_geospatial_service() -> GeospatialService:
    """Get or create the geospatial service singleton."""
    global _geospatial_service
    if _geospatial_service is None:
        _geospatial_service = GeospatialService()
    return _geospatial_service
