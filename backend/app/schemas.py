"""
Pydantic schemas for geospatial and analysis operations.
Extends the basic models with comprehensive data structures.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum


# ============ COORDINATE & GEOMETRY SCHEMAS ============

class Coordinates(BaseModel):
    """Represents a single coordinate pair [longitude, latitude]"""
    longitude: float = Field(..., ge=-180, le=180)
    latitude: float = Field(..., ge=-90, le=90)


class BoundingBox(BaseModel):
    """Bounding box in WGS84 coordinates"""
    west: float = Field(..., ge=-180, le=180)
    south: float = Field(..., ge=-90, le=90)
    east: float = Field(..., ge=-180, le=180)
    north: float = Field(..., ge=-90, le=90)


class AOIGeometry(BaseModel):
    """GeoJSON-like geometry for Area of Interest"""
    type: str = Field(..., pattern="^(Polygon|MultiPolygon)$")
    coordinates: List[Any]  # Nested list structure for polygon/multipolygon


class AOIProperties(BaseModel):
    """Properties associated with an AOI"""
    name: Optional[str] = None
    description: Optional[str] = None
    area_km2: Optional[float] = None
    source: Optional[str] = None
    created_at: Optional[str] = None
    tags: List[str] = []


class AOIFeature(BaseModel):
    """Complete AOI feature with geometry and properties"""
    geometry: AOIGeometry
    properties: AOIProperties


class AOIRequest(BaseModel):
    """Request body for creating an AOI"""
    geometry: AOIGeometry
    properties: Optional[AOIProperties] = None


class AOIResponse(BaseModel):
    """Response for AOI operations"""
    id: str
    feature: AOIFeature
    bounding_box: BoundingBox
    status: str
    message: Optional[str] = None


# ============ IMAGERY SCHEMAS ============

class ImageryMetadata(BaseModel):
    """Metadata for satellite imagery"""
    satellite: str
    acquisition_date: str
    cloud_coverage: float
    resolution: str
    bands: List[str]
    processing_level: Optional[str] = "L2A"


class ImageryResponse(BaseModel):
    """Response for imagery queries"""
    imagery_id: str
    aoi_id: str
    metadata: ImageryMetadata
    download_url: str
    thumbnail_url: Optional[str] = None


class ImageryAvailable(BaseModel):
    """Available imagery for an AOI"""
    date: str
    satellite: str
    cloud_coverage: float
    available_bands: List[str]


# ============ FILE UPLOAD SCHEMAS ============

class FileType(str, Enum):
    """Supported geospatial file types"""
    SHAPEFILE = "shapefile"
    GEOJSON = "geojson"
    KML = "kml"


# ============ ANALYSIS SCHEMAS ============

class VisualizationGrid(BaseModel):
    """3D visualization grid data"""
    x: List[float]
    y: List[float]
    elevation: List[List[Optional[float]]]
    depth: List[List[Optional[float]]]
    rimElevation: float
    resolutionX: float
    resolutionY: float
    unit: str = "meters"


class VisualizationStats(BaseModel):
    """Statistics for visualization"""
    minElevation: Optional[float] = None
    maxElevation: Optional[float] = None
    minDepth: Optional[float] = None
    maxDepth: Optional[float] = None


class BlockMetrics(BaseModel):
    """Volumetric metrics for a detected mine block"""
    blockLabel: str
    blockId: str
    areaSquareMeters: float
    areaHectares: float
    rimElevationMeters: float
    maxDepthMeters: float
    meanDepthMeters: float
    medianDepthMeters: float
    volumeCubicMeters: float
    volumePrismoidalCubicMeters: float
    volumeSimpsonCubicMeters: float
    volumeTrapezoidalCubicMeters: float
    centroid: Dict[str, float]
    visualization: Optional[Dict[str, Any]] = None


class QuantitativeSummary(BaseModel):
    """Summary of quantitative analysis"""
    totalVolumeCubicMeters: float
    totalAreaSquareMeters: float
    totalAreaHectares: float
    averageMaxDepthMeters: float
    averageMeanDepthMeters: float
    blockCount: int
    deepestBlock: Optional[Dict[str, Any]] = None
    largestBlock: Optional[Dict[str, Any]] = None


class QuantitativeAnalysisRequest(BaseModel):
    """Request for quantitative analysis"""
    results: Dict[str, Any] = Field(..., description="Full analysis results including tiles and merged blocks")


class QuantitativeAnalysisResponse(BaseModel):
    """Response from quantitative analysis"""
    analysisId: str
    status: str
    blockCount: int
    summary: QuantitativeSummary
    blocks: List[BlockMetrics]
    metadata: Dict[str, Any]


# ============ SEARCH SCHEMAS ============

class SearchLocation(BaseModel):
    """Geographic location search result"""
    name: str
    coordinates: Dict[str, float]
    country: str
    admin_area: Optional[str] = None


class OfficerAssignedAlert(BaseModel):
    id: str
    mine_name: str
    district: str
    severity: str
    status: str
    due_in_hours: int


class OfficerSiteVisit(BaseModel):
    id: str
    site_name: str
    district: str
    scheduled_for: str
    priority: str


class OfficerAaiFlag(BaseModel):
    id: str
    mine_name: str
    flag_type: str
    confidence_percent: int
    detected_at: str


class CitizenComplaint(BaseModel):
    id: str
    category: str
    location: str
    submitted_at: str
    status: str


class OfficerOverviewResponse(BaseModel):
    assigned_alerts: List[OfficerAssignedAlert]
    pending_site_visits: List[OfficerSiteVisit]
    recent_aai_flags: List[OfficerAaiFlag]
    citizen_complaints: List[CitizenComplaint]


# ============ ERROR SCHEMAS ============

class ErrorResponse(BaseModel):
    """Standard error response"""
    status: str = "error"
    message: str
    detail: Optional[str] = None
    code: Optional[str] = None
