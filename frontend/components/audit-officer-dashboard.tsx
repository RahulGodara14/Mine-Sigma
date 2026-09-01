"use client"

import dynamic from "next/dynamic";

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Layers, Play, Loader2, ChevronRight, Download, Eye, Mountain, TrendingDown, ExternalLink, Map, Maximize2, ChevronLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { AoiToolsPanel } from "@/components/aoi-tools"

interface DemQuantSummary {
  totalVolumeCubicMeters: number
  totalAreaHectares: number
  blockCount: number
  averageMaxDepthMeters: number
  averageMeanDepthMeters: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"

export function AuditOfficerDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"map" | "3d" | "2d" | "4d">("map")
  const [timelineData, setTimelineData] = useState<string[]>([])
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0)
  const [timelineImageUrl, setTimelineImageUrl] = useState<string>("")
  const [timelineImageBounds, setTimelineImageBounds] = useState<any>(null)
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false)
  const [timelineError, setTimelineError] = useState<string>("")
  const [layers, setLayers] = useState({
    optical: true,
    sar: false,
    ndvi: true,
    leaseBoundary: true,
  })
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [demSummary, setDemSummary] = useState<DemQuantSummary | null>(null)

  // Fetch latest analysis results on component mount
  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      try {
        const response = await fetch(`${API_BASE}/analysis/latest`)
        const data = await response.json()
        if (data.status === "success") {
          setAnalysisResult(data)
          setShowResults(true)
        }
      } catch (error) {
        console.error("Failed to fetch analysis results:", error)
      }
    }
    fetchLatestAnalysis()
  }, [])

  // Helper to extract coordinates safely (defaulting to Jharia mine)
  const getCoordinates = (): [number, number] => {
    if (analysisResult?.location) {
      try {
        const parts = analysisResult.location.split(",").map((v: string) => parseFloat(v.trim()))
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return [parts[0], parts[1]]
        }
      } catch {}
    }
    return [23.7483, 86.4172]
  }

  // Fetch timeline dates when 4D tab is active or analysisResult is loaded
  useEffect(() => {
    if (timelineData.length === 0) {
      const [lat, lon] = getCoordinates()
      fetchTimelineDates(lat, lon)
    }
  }, [analysisResult?.location, activeTab])

  // Fetch timeline image when date is selected or activeTab switches to 4d
  useEffect(() => {
    if (timelineData.length > 0 && activeTab === "4d") {
      const [lat, lon] = getCoordinates()
      const dateToFetch = timelineData[selectedDateIndex] || timelineData[0]
      if (dateToFetch) {
        fetchTimelineImage(lat, lon, dateToFetch)
      }
    }
  }, [selectedDateIndex, activeTab, timelineData.length])

  const fetchTimelineDates = async (lat: number, lon: number) => {
    try {
      setTimelineLoading(true)
      const response = await fetch(`${API_BASE}/timeseries/${lat}/${lon}`)
      const data = await response.json()
      if (data.dates && data.dates.length > 0) {
        setTimelineData(data.dates)
        setSelectedDateIndex(data.dates.length - 1)
        setTimelineError("")
      } else {
        setTimelineError("No satellite imagery available")
      }
    } catch (err) {
      setTimelineError(`Failed to fetch timeline: ${err}`)
    } finally {
      setTimelineLoading(false)
    }
  }

  const fetchTimelineImage = async (lat: number, lon: number, date: string) => {
    try {
      setTimelineLoading(true)
      const response = await fetch(`${API_BASE}/satellite-image/${lat}/${lon}/${date}`)
      const data = await response.json()
      if (data.status === "success" && data.image_url) {
        setTimelineImageUrl(data.image_url)
        setTimelineImageBounds(data.bounds)
        setTimelineError("")
      } else {
        setTimelineError(data.message || "Failed to load image")
      }
    } catch (err) {
      setTimelineError(`Failed to fetch image: ${err}`)
    } finally {
      setTimelineLoading(false)
    }
  }

  const handleAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowResults(true)
    }, 3000)
  }

  const demDepthMeters = demSummary?.averageMeanDepthMeters ?? 0
  const demVolumeCubicMeters = demSummary?.totalVolumeCubicMeters ?? 0
  const formattedDepth = `${demDepthMeters.toFixed(1)}m`
  const formattedVolume = `${demVolumeCubicMeters.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³`

  const analysisData = analysisResult ? {
    mineName: analysisResult.project || "Jharia Coal Block 4",
    district: "Dhanbad",
    depth: formattedDepth,
    volume: formattedVolume,
    encroachment: analysisResult.stats?.illegal_ha ? Math.round((analysisResult.stats.illegal_ha / (analysisResult.stats.illegal_ha + analysisResult.stats.legal_ha)) * 100) : 68,
    status: "Illegal Activity Detected",
    legalHa: analysisResult.stats?.legal_ha || 0,
    illegalHa: analysisResult.stats?.illegal_ha || 0,
  } : {
    mineName: "Jharia Coal Block 4",
    district: "Dhanbad",
    depth: formattedDepth,
    volume: formattedVolume,
    encroachment: 68,
    status: "Illegal Activity Detected",
    legalHa: 0,
    illegalHa: 0,
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row">

      {/* Center Viewer - Map and 3D Satellite Data */}
      <div className="flex-1 relative bg-slate-950 flex flex-col w-full overflow-auto">
        {/* Tab Navigation */}
        <div className="w-full bg-slate-900 border-b border-slate-800 flex">
          <button
            onClick={() => setActiveTab("map")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 border-transparent",
              activeTab === "map"
                ? "border-emerald-500 text-emerald-500"
                : "text-slate-400 hover:text-slate-300"
            )}
          >
            <Map className="h-4 w-4" />
            Map View
          </button>
          <button
            onClick={() => setActiveTab("3d")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 border-transparent",
              activeTab === "3d"
                ? "border-emerald-500 text-emerald-500"
                : "text-slate-400 hover:text-slate-300"
            )}
          >
            <Mountain className="h-4 w-4" />
            3D Satellite Data
          </button>
          <button
            onClick={() => setActiveTab("2d")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 border-transparent",
              activeTab === "2d"
                ? "border-emerald-500 text-emerald-500"
                : "text-slate-400 hover:text-slate-300"
            )}
          >
            <Eye className="h-4 w-4" />
            2D Visualization
          </button>
          <button
            onClick={() => setActiveTab("4d")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 border-transparent",
              activeTab === "4d"
                ? "border-emerald-500 text-emerald-500"
                : "text-slate-400 hover:text-slate-300"
            )}
          >
            <Calendar className="h-4 w-4" />
            4D Timeline
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 relative">
          {/* Map View */}
          {activeTab === "map" && (
            <iframe
              src="/map"
              className="w-full h-full border-0"
              title="Cesium Map View"
            />
          )}

          {/* 3D Satellite Data */}
          {activeTab === "3d" && (
            analysisResult?.urls?.model_3d ? (
              <iframe
                src={analysisResult.urls.model_3d}
                className="w-full h-full border-0"
                title="3D Satellite Model"
              />
            ) : (
              <div className="w-full h-full relative">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <Mountain className="h-16 w-16 mx-auto text-emerald-500/30" />
                    <div>
                      <h3 className="text-xl font-semibold text-slate-400">3D Satellite Data</h3>
                      <p className="text-sm text-slate-500 mt-2">Interactive 3D visualization of terrain and mining activity</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* 2D Visualization */}
          {activeTab === "2d" && (
            analysisResult?.urls?.map_2d ? (
              <div className="w-full h-full relative bg-slate-950 flex items-center justify-center p-4">
                <img
                  src={analysisResult.urls.map_2d}
                  alt="2D Evidence Map"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="w-full h-full relative">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <Eye className="h-16 w-16 mx-auto text-emerald-500/30" />
                    <div>
                      <h3 className="text-xl font-semibold text-slate-400">2D Evidence Map</h3>
                      <p className="text-sm text-slate-500 mt-2">Color-coded mining activity visualization</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* 4D Timeline */}
          {activeTab === "4d" && (
            <div className="w-full h-full relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
              {/* Top Slider Section */}
              {timelineData.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-900/30 via-cyan-900/20 to-emerald-900/30 border-b border-emerald-500/40 backdrop-blur-sm px-6 py-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Historical Timeline</p>
                        <p className="text-lg font-semibold text-emerald-400">Satellite Imagery Evolution</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Available Images</p>
                      <p className="text-2xl font-bold text-emerald-400">{timelineData.length}</p>
                    </div>
                  </div>

                  {/* Interactive Slider */}
                  <div className="space-y-3">
                    {/* Large Gradient Slider */}
                    <div className="relative group">
                      <input
                        type="range"
                        min="0"
                        max={timelineData.length - 1}
                        value={selectedDateIndex}
                        onChange={(e) => setSelectedDateIndex(parseInt(e.target.value))}
                        className="w-full h-4 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all shadow-lg"
                        style={{
                          background: `linear-gradient(to right, rgb(5, 150, 105) 0%, rgb(5, 150, 105) ${(selectedDateIndex / (timelineData.length - 1)) * 100}%, rgb(51, 65, 85) ${(selectedDateIndex / (timelineData.length - 1)) * 100}%, rgb(51, 65, 85) 100%)`
                        }}
                      />
                      {/* Tooltip */}
                      <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <div className="absolute -top-12 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-lg border border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {timelineData[selectedDateIndex]}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-600" />
                        </div>
                      </div>
                    </div>

                    {/* Date Range Labels */}
                    <div className="flex justify-between text-xs text-slate-400 px-1">
                      <span className="font-mono text-slate-500">{timelineData[0]}</span>
                      <span className="font-mono text-emerald-400 font-semibold">{timelineData[Math.floor(timelineData.length / 2)]}</span>
                      <span className="font-mono text-slate-500">{timelineData[timelineData.length - 1]}</span>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="flex gap-3 items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedDateIndex(Math.max(0, selectedDateIndex - 1))}
                          disabled={selectedDateIndex === 0}
                          size="sm"
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setSelectedDateIndex(Math.min(timelineData.length - 1, selectedDateIndex + 1))}
                          disabled={selectedDateIndex === timelineData.length - 1}
                          size="sm"
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Current</p>
                          <p className="text-sm font-bold text-emerald-400">{selectedDateIndex + 1}/{timelineData.length}</p>
                        </div>
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((selectedDateIndex + 1) / timelineData.length) * 100}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Progress</p>
                          <p className="text-sm font-bold text-cyan-400">{Math.round(((selectedDateIndex + 1) / timelineData.length) * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-emerald-900/10 to-cyan-900/10 border-b border-emerald-500/20 px-6 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Selected Date</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {timelineData.length > 0 ? timelineData[selectedDateIndex] : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {timelineError && (
                <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border-b border-red-700/50 text-red-200 px-6 py-3 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {timelineError}
                </div>
              )}

              {/* Main Image Viewer */}
              <div className="flex-1 flex relative overflow-hidden min-h-[600px]">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                                      radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
                  }} />
                </div>

                {timelineLoading ? (
                  <div className="flex flex-col items-center gap-4 z-10">
                    <div className="relative w-16 h-16">
                      <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-300 font-medium">Loading satellite imagery</p>
                      <p className="text-slate-500 text-sm mt-1">Processing Earth Engine data...</p>
                    </div>
                  </div>
                ) : timelineImageUrl ? (
                  <div className="w-full h-full">
                    <CesiumTimelineViewer
                      imageUrl={timelineImageUrl}
                      bounds={timelineImageBounds}
                      date={timelineData[selectedDateIndex]}
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-4 z-10">
                    <div className="p-4 bg-emerald-500/10 rounded-full w-fit mx-auto">
                      <Calendar className="h-12 w-12 text-emerald-400/50" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-300">4D Timeline Visualization</h3>
                      <p className="text-sm text-slate-500 mt-2">Explore satellite imagery from 2020 to 2025</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  AI Analysis in Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing satellite data...</span>
                    <span className="text-foreground">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">Analyzing {analysisData.mineName}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Right Results Panel */}
      {showResults && (
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-l border-slate-800 p-4 space-y-4 overflow-auto max-h-screen">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Analysis Results</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowResults(false)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Card className="border-rose-500/50 bg-rose-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-rose-500 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Status: {analysisData.status}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Mining Depth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{analysisData.depth}</div>
              <p className="text-xs text-muted-foreground mt-1">Below surface level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Excavated Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analysisData.volume}</div>
              <p className="text-xs text-muted-foreground mt-1">Cubic meters removed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Mining Area Analysis</CardTitle>
              <CardDescription>Legal vs Illegal mining areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Legal Area:</span>
                  <span className="font-semibold text-emerald-500">{analysisData.legalHa.toFixed(2)} Ha</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Illegal Area:</span>
                  <span className="font-semibold text-rose-500">{analysisData.illegalHa.toFixed(2)} Ha</span>
                </div>
              </div>
              {analysisData.encroachment > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-rose-500">{analysisData.encroachment}%</span>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <Progress value={analysisData.encroachment} className="h-2 [&>div]:bg-rose-500" />
                  <p className="text-xs text-muted-foreground">
                    Significant illegal mining detected outside authorized zone
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Reports Section */}
          {analysisResult?.urls?.report && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  PDF Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-muted-foreground mb-2">Mining Compliance Audit Report</p>
                  <Button className="w-full justify-center" size="sm" asChild>
                    <a href={analysisResult.urls.report} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-3 w-3" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!analysisResult && (
                <>
                  <Button className="w-full justify-start" variant="secondary" onClick={() => setReportDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Historical Data
                  </Button>
                </>
              )}
              {analysisResult && (
                <Button className="w-full justify-start" variant="secondary" onClick={() => setReportDialogOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Report Details
                </Button>
              )}
            </CardContent>
          </Card>

          {/* AOI / Imagery / DEM Tools */}
          <AoiToolsPanel onQuantSummaryChange={setDemSummary} />
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Analysis Report</DialogTitle>
            <DialogDescription>Detailed findings for {analysisData.mineName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Site:</span>
                <span className="font-medium">{analysisData.mineName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">District:</span>
                <span className="font-medium">{analysisData.district}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Legal Area:</span>
                <span className="font-medium text-emerald-500">{analysisData.legalHa.toFixed(2)} Ha</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Illegal Area:</span>
                <span className="font-medium text-rose-500">{analysisData.illegalHa.toFixed(2)} Ha</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Encroachment:</span>
                <span className="font-medium text-rose-500">{analysisData.encroachment}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="destructive" className="text-xs">
                  Illegal Activity
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Close
            </Button>
            {analysisResult?.urls?.report && (
              <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <a href={analysisResult.urls.report} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Dynamic import for Cesium component to avoid SSR issues
const CesiumTimelineViewer = dynamic(
  () => import("./CesiumTimelineViewer"),
  { ssr: false }
);
