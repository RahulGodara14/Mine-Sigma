"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Map, Satellite, Database, Maximize2 } from "lucide-react"

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/?api\/?$/, "") ??
  (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://127.0.0.1:8000")

interface AoiFeature {
  geometry: {
    type: string
    coordinates: any
  }
  properties: {
    name?: string
    description?: string
    area_km2?: number | null
    source?: string | null
  }
}

interface AoiResponse {
  id: string
  feature: AoiFeature
  bounding_box: {
    west: number
    south: number
    east: number
    north: number
  }
  status: string
  message?: string
}

interface ImageryMetadata {
  satellite: string
  acquisition_date: string
  cloud_coverage: number
  resolution: string
  bands: string[]
  processing_level?: string
}

interface ImageryResponse {
  imagery_id: string
  aoi_id: string
  metadata: ImageryMetadata
  download_url: string
  thumbnail_url?: string | null
}

interface QuantSummary {
  totalVolumeCubicMeters: number
  totalAreaHectares: number
  blockCount: number
  averageMaxDepthMeters: number
  averageMeanDepthMeters: number
}

interface QuantResult {
  analysisId: string
  status: string
  summary: QuantSummary
}

interface AoiToolsPanelProps {
  onQuantSummaryChange?: (summary: QuantSummary | null) => void
}

export function AoiToolsPanel({ onQuantSummaryChange }: AoiToolsPanelProps) {
  const [aois, setAois] = useState<AoiResponse[]>([])
  const [selectedAoiId, setSelectedAoiId] = useState<string | null>(null)
  const [loadingAois, setLoadingAois] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageryLoading, setImageryLoading] = useState(false)
  const [imagery, setImagery] = useState<ImageryResponse | null>(null)
  const [quantLoading, setQuantLoading] = useState(false)
  const [quantResult, setQuantResult] = useState<QuantResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const loadAois = async () => {
    try {
      setLoadingAois(true)
      setError(null)
      const res = await fetch(`${BACKEND_BASE_URL}/api/aoi/`)
      if (!res.ok) throw new Error(`AOI list failed: ${res.status}`)
      const data = await res.json()
      const list: AoiResponse[] = Object.values(data)
      setAois(list)
      if (!selectedAoiId && list.length > 0) {
        setSelectedAoiId(list[0].id)
      }
    } catch (e: any) {
      setError(e.message || "Failed to load AOIs")
    } finally {
      setLoadingAois(false)
    }
  }

  useEffect(() => {
    loadAois()
  }, [])

  const handleUploadSubmit = async (files: File[]) => {
    if (!files.length) return
    const file = files[0]
    try {
      setUploading(true)
      setError(null)
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`${BACKEND_BASE_URL}/api/aoi/upload`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Upload failed: ${res.status}`)
      }
      const created: AoiResponse = await res.json()
      setAois((prev) => [created, ...prev])
      setSelectedAoiId(created.id)
    } catch (e: any) {
      setError(e.message || "Failed to upload AOI file")
    } finally {
      setUploading(false)
    }
  }

  const handleFetchImagery = async () => {
    if (!selectedAoiId) return
    try {
      setImageryLoading(true)
      setError(null)
      setImagery(null)
      const url = `${BACKEND_BASE_URL}/api/imagery/${selectedAoiId}/sentinel2?max_cloud_cover=20`
      const res = await fetch(url, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Imagery request failed: ${res.status}`)
      }
      const data: ImageryResponse = await res.json()
      setImagery(data)
    } catch (e: any) {
      setError(e.message || "Failed to fetch Sentinel-2 imagery")
    } finally {
      setImageryLoading(false)
    }
  }

  const handleRunQuantitative = async () => {
    if (!selectedAoiId) return
    const selected = aois.find((a) => a.id === selectedAoiId)
    if (!selected) return

    try {
      setQuantLoading(true)
      setError(null)
      setQuantResult(null)
      onQuantSummaryChange?.(null)

      const analysisId = `aoi-${selected.id}`
      const resultsPayload = {
        results: {
          merged_blocks: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: selected.feature.geometry,
                properties: {
                  block_id: selected.id,
                  name: selected.feature.properties.name || "AOI Block",
                },
              },
            ],
          },
        },
      }

      const res = await fetch(`${BACKEND_BASE_URL}/api/analysis/${analysisId}/quantitative`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultsPayload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Quantitative analysis failed: ${res.status}`)
      }

      const data = await res.json()
      const summary: QuantSummary = data.summary
      setQuantResult({
        analysisId: data.analysisId,
        status: data.status,
        summary,
      })
      onQuantSummaryChange?.(summary)
    } catch (e: any) {
      setError(e.message || "Failed to run quantitative analysis")
      onQuantSummaryChange?.(null)
    } finally {
      setQuantLoading(false)
    }
  }

  return (
    <Card className="mt-4 border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Map className="h-4 w-4 text-emerald-400" />
          AOI & Satellite Tools
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Upload lease boundary files (KML/GeoJSON/Shapefile), fetch Sentinel-2 imagery, and run DEM-based volume estimates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AOI Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Upload AOI Boundary</span>
            <span className="text-slate-500">KML / GeoJSON / Shapefile ZIP</span>
          </div>
          <FileUpload
            onSubmit={handleUploadSubmit}
            maxSize={10}
            multiple={false}
            accept=".kml,.geojson,.json,.zip"
          />
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading AOI...
            </div>
          )}
        </div>

        {/* AOI List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Saved AOIs</span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={loadAois} disabled={loadingAois}>
              {loadingAois ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          {aois.length === 0 && !loadingAois && (
            <p className="text-xs text-slate-500">No AOIs yet. Upload a boundary file above.</p>
          )}
          {aois.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-auto rounded-md border border-slate-800 bg-slate-950/40 p-1">
              {aois.map((aoi) => (
                <button
                  key={aoi.id}
                  onClick={() => setSelectedAoiId(aoi.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    selectedAoiId === aoi.id ? "bg-emerald-500/10 border border-emerald-500/40" : "hover:bg-slate-800/60"
                  }`}
                >
                  <span className="truncate">
                    {aoi.feature.properties.name || aoi.id}
                    {typeof aoi.feature.properties.area_km2 === "number" && (
                      <span className="ml-1 text-[10px] text-slate-500">
                        · {aoi.feature.properties.area_km2.toFixed(2)} km²
                      </span>
                    )}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {aoi.feature.geometry.type}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sentinel-2 Imagery */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Sentinel-2 Imagery</span>
            {imagery && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {imagery.metadata.acquisition_date}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            className="w-full justify-center bg-emerald-600/90 hover:bg-emerald-700"
            onClick={handleFetchImagery}
            disabled={!selectedAoiId || imageryLoading}
          >
            {imageryLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching Sentinel-2 Mosaic
              </>
            ) : (
              <>
                <Satellite className="h-4 w-4 mr-2" /> Fetch Latest Sentinel-2 for AOI
              </>
            )}
          </Button>
          {imagery && (
            <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/40 p-2 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Cloud Cover</span>
                <span className="font-medium text-emerald-400">{imagery.metadata.cloud_coverage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resolution</span>
                <span className="font-medium text-slate-200">{imagery.metadata.resolution}</span>
              </div>
              {imagery.thumbnail_url && (
                <button
                  type="button"
                  onClick={() => setImageDialogOpen(true)}
                  className="mt-2 w-full rounded overflow-hidden border border-slate-800/60 bg-slate-950/60 relative group focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                >
                  <img
                    src={imagery.thumbnail_url}
                    alt="Sentinel-2 preview"
                    className="w-full h-40 object-cover group-hover:brightness-110 transition"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-100">
                      <Maximize2 className="h-4 w-4" />
                      <span>View full screen</span>
                    </div>
                  </div>
                </button>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="text-slate-400">Download</span>
                <a
                  href={imagery.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline"
                >
                  GeoTIFF Link
                </a>
              </div>
            </div>
          )}
        </div>

        {imagery?.thumbnail_url && (
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle className="text-sm">Sentinel-2 Mosaic Preview</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <img
                  src={imagery.thumbnail_url}
                  alt="Sentinel-2 full preview"
                  className="w-full h-auto rounded-md object-contain max-h-[80vh]"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Quantitative DEM Analysis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">DEM Volume Estimate</span>
            {quantResult && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {quantResult.status}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-center border-emerald-600/60 text-emerald-400 hover:bg-emerald-900/20"
            onClick={handleRunQuantitative}
            disabled={!selectedAoiId || quantLoading}
          >
            {quantLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Computing DEM-based Volume
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" /> Run Quantitative Analysis for AOI
              </>
            )}
          </Button>
          {quantResult && (
            <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/40 p-2 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Volume</span>
                <span className="font-medium text-emerald-400">{quantResult.summary.totalVolumeCubicMeters.toFixed(0)} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Area</span>
                <span className="font-medium text-slate-200">{quantResult.summary.totalAreaHectares.toFixed(2)} ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Depth</span>
                <span className="font-medium text-slate-200">{quantResult.summary.averageMeanDepthMeters.toFixed(1)} m</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-rose-400 mt-1">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}
