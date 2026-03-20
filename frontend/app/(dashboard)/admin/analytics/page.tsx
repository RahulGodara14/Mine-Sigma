"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, LineChart, MapPin, Users, FileText, RefreshCcw, Download } from "lucide-react"
import { getAdminAnalytics } from "@/lib/api"

const formatRelativeTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const diffMs = Date.now() - d.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHrs < 1) return "Just now"
  if (diffHrs < 24) return `${diffHrs} hours ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays} days ago`
}

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-xl p-6 hover:border-emerald-500/50 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-slate-400 text-sm mb-1">{label}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
)

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6m")
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getAdminAnalytics()
      setAnalytics(data)
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await load()
    })()
    return () => {
      mounted = false
    }
  }, [])

  const monthlyTrends: Array<{ month: string; analyses: number; alerts: number; reports: number }> =
    analytics?.monthly_trends ?? []

  const legalHa = Number(analytics?.legal_mining_area ?? 0)
  const illegalHa = Number(analytics?.illegal_mining_area ?? 0)
  const complianceRate = Number(analytics?.compliance_rate ?? 0)
  const officersCount = Number(analytics?.officers_count ?? 0)
  const totalReports = Number(analytics?.reports_generated ?? 0)

  // Using example conversion: 1 Ha illegal ~= 0.05 Crore loss (5 lakh/Ha)
  const revenueLossCrore = illegalHa * 0.05

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-2">
              Analytics & Insights
            </h1>
            <p className="text-slate-400 text-lg">Real-time mining activity monitoring and compliance analytics</p>
          </div>
          <div className="flex gap-2 items-center">
            {["1m", "3m", "6m", "1y"].map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`${
                  timeRange === range
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                } transition-all`}
              >
                {range}
              </Button>
            ))}
            <Button onClick={load} className="bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {loading && <p className="text-slate-400 mb-4">Loading analytics...</p>}
      {error && <p className="text-red-400 mb-4">{error}</p>}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard icon={Activity} label="Total Reports" value={String(totalReports)} trend={5} color="bg-emerald-500/20" />
        <StatCard icon={CheckCircle} label="Legal Mining Area" value={`${legalHa.toLocaleString()} Ha`} trend={3} color="bg-cyan-500/20" />
        <StatCard icon={AlertTriangle} label="Illegal Mining Area" value={`${illegalHa.toLocaleString()} Ha`} trend={-2} color="bg-red-500/20" />
        <StatCard icon={LineChart} label="Compliance Rate" value={`${complianceRate.toFixed(1)}%`} trend={2} color="bg-blue-500/20" />
        <StatCard icon={Users} label="Active Officers" value={String(officersCount)} trend={1} color="bg-orange-500/20" />
        <StatCard icon={FileText} label="Revenue Loss (Crore)" value={`₹${revenueLossCrore.toFixed(2)}`} trend={-5} color="bg-purple-500/20" />
      </div>

      {/* Summary sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Trend Analysis</h3>
              <p className="text-sm text-slate-400 mt-1">Historical data trends by date</p>
            </div>
            <LineChart className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-4">
            {monthlyTrends.map((t) => (
              <div key={t.month} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{t.month}</span>
                <span className="text-white font-semibold">{t.analyses} analyses • {t.alerts} alerts • {t.reports} reports</span>
              </div>
            ))}
            {monthlyTrends.length === 0 && <p className="text-sm text-slate-500">No trend data yet.</p>}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Summary Statistics</h3>
              <p className="text-sm text-slate-400 mt-1">Key metrics overview</p>
            </div>
            <MapPin className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400">Active Monitoring</p>
              <p className="text-2xl font-bold text-emerald-400">{analytics?.active_monitoring ?? 0}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400">Alerts Generated</p>
              <p className="text-2xl font-bold text-orange-400">{analytics?.alerts_generated ?? 0}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400">Complaints</p>
              <p className="text-2xl font-bold text-cyan-400">{analytics?.complaints_count ?? 0}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400">Total Analyses</p>
              <p className="text-2xl font-bold text-purple-400">{analytics?.total_analyses ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
