"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

export default function AnalysisPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<any>(null)

    const runAnalysis = () => {
        setIsAnalyzing(true)
        setProgress(0)
        setResult(null)

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setIsAnalyzing(false)
                    setResult({
                        score: 87,
                        status: "High Risk",
                        anomalies: 12,
                        vegetationLoss: "15%",
                        waterPollution: "Detected",
                    })
                    return 100
                }
                return prev + 10
            })
        }, 500)
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Analysis Center</h1>
                <p className="text-muted-foreground">Run deep learning models on satellite imagery for detailed insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Select parameters for analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Zone</label>
                                <Select defaultValue="jharia">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select zone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="jharia">Jharia Coal Block 4</SelectItem>
                                        <SelectItem value="keonjhar">Keonjhar Iron Mine</SelectItem>
                                        <SelectItem value="bailadila">Bailadila Sector 14</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Model Type</label>
                                <Select defaultValue="comprehensive">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="comprehensive">Comprehensive Scan</SelectItem>
                                        <SelectItem value="vegetation">Vegetation Index (NDVI)</SelectItem>
                                        <SelectItem value="change">Change Detection (SAR)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-800 rounded-lg bg-slate-900/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium">Satellite Feed Status</h4>
                                    <p className="text-xs text-muted-foreground">Sentinel-2 & Landsat 9 Data Stream</p>
                                </div>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Online
                                </Badge>
                            </div>
                            <div className="h-32 bg-slate-950 rounded border border-slate-800 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                                <div className="relative z-10 text-xs text-slate-500 font-mono">
                                    Waiting for analysis command...
                                </div>
                            </div>
                        </div>

                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={runAnalysis} disabled={isAnalyzing}>
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing Satellite Data... {progress}%
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Analysis
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {result && (
                        <Card className="border-emerald-500/50 bg-emerald-500/5 animate-in fade-in slide-in-from-bottom-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                    Analysis Result
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Risk Score</span>
                                    <span className="text-2xl font-bold text-rose-500">{result.score}/100</span>
                                </div>
                                <Progress value={result.score} className="h-2" />

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant="destructive">{result.status}</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Anomalies</span>
                                        <span className="font-medium">{result.anomalies} Detected</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Vegetation Loss</span>
                                        <span className="font-medium text-rose-400">{result.vegetationLoss}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Recent Scans</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                                        <ActivityIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Routine Scan #{100 + i}</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">Completed</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ActivityIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
