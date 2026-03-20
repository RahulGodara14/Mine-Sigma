"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign, Mountain, Users, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAdminAnalytics, getAlerts, getZones } from "@/lib/api"

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [alertsRes, zonesRes, analyticsRes] = await Promise.all([
          getAlerts().catch(() => []),
          getZones().catch(() => []),
          getAdminAnalytics().catch(() => null),
        ])
        if (!mounted) return
        setAlerts(alertsRes ?? [])
        setZones(zonesRes ?? [])
        setAnalytics(analyticsRes)
        setLastUpdatedAt(new Date())
      } catch (e: any) {
        setError(String(e?.message ?? e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    const intervalId = window.setInterval(() => {
      load()
    }, 10_000)
    return () => {
      window.clearInterval(intervalId)
      mounted = false
    }
  }, [])

  // Build stats using backend data (with sensible fallbacks)
  const totalMines = zones?.length ?? 0
  const highAlerts = (alerts ?? []).filter((a) => (a.severity ?? "").toString().toLowerCase() === "high").length
  const legalAreaHa = analytics?.legal_mining_area != null ? Number(analytics.legal_mining_area) : 0
  const illegalAreaHa = analytics?.illegal_mining_area != null ? Number(analytics.illegal_mining_area) : 0
  const revenueLossCrore = illegalAreaHa * 0.05
  const lossDisplay = `₹${Number.isFinite(revenueLossCrore) ? revenueLossCrore.toFixed(2) : "0.00"}`
  const activeOfficers = analytics?.officers_count != null ? String(analytics.officers_count) : "—"

  const stats = [
    { title: "Total Monitored Mines", value: String(totalMines), icon: Mountain, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { title: "High Severity Alerts", value: String(highAlerts), icon: AlertTriangle, color: "text-rose-500", bgColor: "bg-rose-500/10" },
    { title: "Revenue Loss (Crore)", value: String(lossDisplay), icon: DollarSign, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { title: "Active Officers", value: String(activeOfficers), icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  ]

  const recentAlerts = (alerts ?? []).slice(0, 10).map((a) => {
    const severity = (a.severity ?? "medium").toString()
    const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1)
    const status = (a.status ?? "open").toString()
    const district = (a.district ?? "").toString()
    const lat = a.latitude ?? null
    const lon = a.longitude ?? null
    const locationText = district
      ? district
      : lat != null && lon != null
        ? `${lat}, ${lon}`
        : ""
    return {
      id: a.id,
      name: a.mine_name ?? a.title ?? "Alert",
      district: locationText,
      severity: severityLabel,
      status,
      detectedDate: a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : "",
    }
  })

  const chartData = {
    labels: ["Now"],
    illegal: [Math.max(illegalAreaHa * 0.01, 0)],
    legal: [Math.max(legalAreaHa * 0.01, 0)],
  }

  const maxValue = Math.max(...chartData.illegal, ...chartData.legal, 1)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Oversight and monitoring control center</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {loading ? "Loading..." : `Last Updated: ${(lastUpdatedAt ?? new Date()).toLocaleTimeString()}`}
        </Badge>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Critical illegal mining detections requiring action</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mine Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell className="font-medium">No alerts</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ) : (
                  recentAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell>{alert.district}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.severity === "High"
                              ? "destructive"
                              : alert.severity === "Medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{alert.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Area Trends (km²)</CardTitle>
            <CardDescription>Illegal vs Legal mining area over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                  <span className="text-muted-foreground">Legal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded"></div>
                  <span className="text-muted-foreground">Illegal</span>
                </div>
              </div>

              <div className="space-y-2">
                {chartData.labels.map((label, i) => (
                  <div key={label} className="space-y-1">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="flex gap-1 h-8">
                      <div
                        className="bg-emerald-500/80 rounded flex items-center justify-center text-xs font-medium overflow-visible whitespace-nowrap"
                        style={{ width: `${(chartData.legal[i] / maxValue) * 100}%` }}
                      >
                        {chartData.legal[i].toFixed(2)}
                      </div>
                      <div
                        className="bg-rose-500/80 rounded flex items-center justify-center text-xs font-medium overflow-visible whitespace-nowrap"
                        style={{ width: `${(chartData.illegal[i] / maxValue) * 100}%` }}
                      >
                        {chartData.illegal[i].toFixed(2)}
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Legal: {chartData.legal[i].toFixed(2)} km²</span>
                      <span>Illegal: {chartData.illegal[i].toFixed(2)} km²</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
