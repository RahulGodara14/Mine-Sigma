"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Filter, Download, AlertTriangle, Clock, MapPin, Zap, TrendingUp, Send, Archive } from "lucide-react"

import { assignAlert, getAlert, getAlerts, getOfficers } from "@/lib/api"

const getSeverityColor = (severity: string) => {
    switch(severity) {
        case "High":
            return "bg-red-500/20 text-red-300 border-red-500/30"
        case "Medium":
            return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
        case "Low":
            return "bg-blue-500/20 text-blue-300 border-blue-500/30"
        default:
            return "bg-slate-500/20 text-slate-300 border-slate-500/30"
    }
}

const getStatusColor = (status: string) => {
    switch(status) {
        case "Pending":
            return "bg-orange-500/20 text-orange-300 border-orange-500/30"
        case "Under Review":
            return "bg-blue-500/20 text-blue-300 border-blue-500/30"
        case "Resolved":
            return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        default:
            return "bg-slate-500/20 text-slate-300 border-slate-500/30"
    }
}

const AlertCard = ({ alert, onAssign, onView }: any) => (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/30 transition-all group">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${
                    alert.severity === "High" ? "bg-red-500/20" :
                    alert.severity === "Medium" ? "bg-yellow-500/20" :
                    "bg-blue-500/20"
                }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                        alert.severity === "High" ? "text-red-400" :
                        alert.severity === "Medium" ? "text-yellow-400" :
                        "text-blue-400"
                    }`} />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-white">{alert.name}</p>
                    <p className="text-sm text-slate-400 mt-1">{alert.description}</p>
                </div>
            </div>
            <Badge className={`${getSeverityColor(alert.severity)} border`}>
                {alert.severity}
            </Badge>
        </div>

        {alert.assignedTo && (
            <div className="mb-3 text-sm text-slate-300">
                Assigned to: <span className="font-medium text-white">{alert.assignedTo}</span>
            </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>{alert.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
                <Zap className="w-4 h-4" />
                <span>{alert.confidence}% Confidence</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{alert.detectedDate}</span>
            </div>
            <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(alert.status)} border text-xs`}>
                    {alert.status}
                </Badge>
            </div>
        </div>

        <div className="flex gap-2">
            <Button
                size="sm"
                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30"
                onClick={() => onView(alert.id)}
            >
                <Eye className="w-4 h-4 mr-2" />
                View Details
            </Button>
            {alert.assignedTo ? (
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-emerald-300"
                    disabled
                    title={`Assigned to ${alert.assignedTo}`}
                >
                    Assigned
                </Button>
            ) : (
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-blue-400" onClick={() => onAssign(alert.id)}>
                    <Send className="w-4 h-4" />
                </Button>
            )}
        </div>
    </div>
)

export default function AlertsPage() {
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
    const [filterSeverity, setFilterSeverity] = useState<string | null>(null)

    const [alerts, setAlerts] = useState<any[]>([])
    const [officers, setOfficers] = useState<Array<{ id: string; email: string; full_name?: string | null }>>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [assigning, setAssigning] = useState(false)
    const [assignError, setAssignError] = useState<string | null>(null)
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
    const [selectedOfficerId, setSelectedOfficerId] = useState<string>("")

    const [detailsOpen, setDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [detailsError, setDetailsError] = useState<string | null>(null)
    const [details, setDetails] = useState<any | null>(null)

    const mapAlerts = (
        data: any[],
        officerLookup?: Map<string, string>
    ) => {
        return data.map((a) => {
            const severity = (a.severity ?? "medium").toString()
            const status = (a.status ?? "open").toString()
            const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1)
            const statusLabel =
                status === "open" ? "Pending" :
                status === "in_progress" ? "Under Review" :
                status === "resolved" ? "Resolved" :
                status

            const assignedOfficerId = a.assigned_officer_id ?? null
            const assignedTo = assignedOfficerId
                ? (officerLookup?.get(assignedOfficerId) ?? "Unknown officer")
                : null

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
                name: a.mine_name,
                district: a.district ?? "",
                severity: severityLabel,
                status: statusLabel,
                detectedDate: new Date(a.created_at).toISOString().split("T")[0],
                type: "Alert",
                location: locationText,
                confidence: 0,
                description: a.description ?? "",
                assignedOfficerId,
                assignedTo,
            }
        })
    }

    const openDetails = async (alertId: string) => {
        try {
            setDetailsOpen(true)
            setDetailsLoading(true)
            setDetailsError(null)
            const data = await getAlert(alertId)
            setDetails(data)
        } catch (e: any) {
            setDetailsError(e?.message ?? "Failed to load alert")
        } finally {
            setDetailsLoading(false)
        }
    }

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                setLoading(true)
                const [data, officerList] = await Promise.all([getAlerts(), getOfficers()])
                if (!mounted) return

                const lookup = new Map<string, string>(
                    officerList.map((o) => [o.id, (o.full_name ?? o.email) as string])
                )

                setOfficers(officerList.map((o) => ({ id: o.id, email: o.email, full_name: o.full_name ?? null })))

                setAlerts(mapAlerts(data, lookup))
            } catch (e: any) {
                if (!mounted) return
                setError(e?.message ?? "Failed to load alerts")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    const openAssignDialog = (alertId: string) => {
        setSelectedAlertId(alertId)
        setSelectedOfficerId("")
        setAssignError(null)
        setAssignDialogOpen(true)
    }

    const handleAssign = async () => {
        if (!selectedAlertId) return

        if (!selectedOfficerId) {
            setAssignError("Please select an officer")
            return
        }

        try {
            setAssigning(true)
            setAssignError(null)
            await assignAlert(selectedAlertId, selectedOfficerId)

            const data = await getAlerts()
            const lookup = new Map<string, string>(
                officers.map((o) => [o.id, (o.full_name ?? o.email) as string])
            )
            setAlerts(mapAlerts(data, lookup))
            setAssignDialogOpen(false)
        } catch (e: any) {
            setAssignError(e?.message ?? "Failed to assign alert")
        } finally {
            setAssigning(false)
        }
    }

    const highAlerts = alerts.filter(a => a.severity === "High").length
    const mediumAlerts = alerts.filter(a => a.severity === "Medium").length
    const lowAlerts = alerts.filter(a => a.severity === "Low").length
    const pendingAlerts = alerts.filter(a => a.status === "Pending").length

    const filteredAlerts = useMemo(() => {
        return filterSeverity ? alerts.filter(a => a.severity === filterSeverity) : alerts
    }, [alerts, filterSeverity])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            {loading && <p className="text-slate-400 mb-4">Loading alerts...</p>}
            {error && <p className="text-red-400 mb-4">{error}</p>}

            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="bg-slate-950 border-slate-700 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Assign Alert</DialogTitle>
                        <DialogDescription>
                            Select an officer to assign this alert.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Select value={selectedOfficerId} onValueChange={setSelectedOfficerId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select officer" />
                            </SelectTrigger>
                            <SelectContent>
                                {officers.map((o) => (
                                    <SelectItem key={o.id} value={o.id}>
                                        {o.full_name ? `${o.full_name} (${o.email})` : o.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {assignError && <p className="text-sm text-red-400">{assignError}</p>}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            className="text-slate-300"
                            onClick={() => setAssignDialogOpen(false)}
                            disabled={assigning}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleAssign}
                            disabled={assigning}
                        >
                            {assigning ? "Assigning..." : "Assign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="bg-slate-950 border-slate-700 text-slate-100 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Alert Details</DialogTitle>
                        <DialogDescription>
                            Full details for the selected alert.
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading && <p className="text-slate-400">Loading...</p>}
                    {detailsError && <p className="text-red-400">{detailsError}</p>}

                    {!detailsLoading && !detailsError && details && (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-slate-400">Mine</p>
                                    <p className="text-white font-medium">{details.mine_name}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Severity</p>
                                    <p className="text-white font-medium">{details.severity}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Status</p>
                                    <p className="text-white font-medium">{details.status}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Created</p>
                                    <p className="text-white font-medium">{new Date(details.created_at).toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-400">Location</p>
                                    <p className="text-white font-medium">
                                        {(details.district ?? "").toString() || (details.latitude != null && details.longitude != null ? `${details.latitude}, ${details.longitude}` : "—")}
                                    </p>
                                </div>
                            </div>

                            {details.description && (
                                <div>
                                    <p className="text-slate-400">Description</p>
                                    <p className="text-white">{details.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-slate-400">Lease ID</p>
                                    <p className="text-white">{details.lease_id ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Analysis Run</p>
                                    <p className="text-white">{details.analysis_run_id ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Legal Area (Ha)</p>
                                    <p className="text-white">{details.legal_ha != null ? Number(details.legal_ha).toFixed(2) : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Illegal Area (Ha)</p>
                                    <p className="text-white">{details.illegal_ha != null ? Number(details.illegal_ha).toFixed(2) : "—"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" className="text-slate-300" onClick={() => setDetailsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-red-300 to-orange-300 bg-clip-text text-transparent mb-2">
                            Alerts & Incidents
                        </h1>
                        <p className="text-slate-400 text-lg">Manage and respond to detected illegal mining activities</p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-slate-800 hover:bg-slate-700 text-slate-300">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-red-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">High Severity</p>
                        <p className="text-3xl font-bold text-red-400">{highAlerts}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Medium Severity</p>
                        <p className="text-3xl font-bold text-yellow-400">{mediumAlerts}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Low Severity</p>
                        <p className="text-3xl font-bold text-blue-400">{lowAlerts}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Pending Action</p>
                        <p className="text-3xl font-bold text-orange-400">{pendingAlerts}</p>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-8">
                <Button
                    onClick={() => setFilterSeverity(null)}
                    className={`${
                        filterSeverity === null
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                >
                    All Alerts
                </Button>
                <Button
                    onClick={() => setFilterSeverity("High")}
                    className={`${
                        filterSeverity === "High"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                >
                    High
                </Button>
                <Button
                    onClick={() => setFilterSeverity("Medium")}
                    className={`${
                        filterSeverity === "Medium"
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                >
                    Medium
                </Button>
                <Button
                    onClick={() => setFilterSeverity("Low")}
                    className={`${
                        filterSeverity === "Low"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                >
                    Low
                </Button>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onAssign={openAssignDialog} onView={openDetails} />
                ))}
            </div>

            {/* Table View */}
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-800/50 border-b border-slate-700/50">
                            <TableRow>
                                <TableHead className="text-slate-300 font-semibold">Mine Name</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Type</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Severity</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Assigned To</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Confidence</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Date</TableHead>
                                <TableHead className="text-right text-slate-300 font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAlerts.map((alert) => (
                                <TableRow key={alert.id} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                                    <TableCell className="font-semibold text-white">{alert.name}</TableCell>
                                    <TableCell className="text-slate-300">{alert.type}</TableCell>
                                    <TableCell>
                                        <Badge className={`${getSeverityColor(alert.severity)} border`}>
                                            {alert.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${getStatusColor(alert.status)} border`}>
                                            {alert.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-300">
                                        {alert.assignedTo ? (
                                            <span className="text-emerald-300">{alert.assignedTo}</span>
                                        ) : (
                                            <span className="text-slate-500">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden w-16">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full"
                                                    style={{ width: `${alert.confidence}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-slate-400">{alert.confidence}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-400">{alert.detectedDate}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-emerald-400 hover:bg-emerald-500/10"
                                                onClick={() => openDetails(alert.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {alert.assignedTo ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-emerald-300"
                                                    disabled
                                                    title={`Assigned to ${alert.assignedTo}`}
                                                >
                                                    Assigned
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-blue-400 hover:bg-blue-500/10"
                                                    onClick={() => openAssignDialog(alert.id)}
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-300">
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
