"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ClipboardList, Flag, Users, ArrowRight, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAlert, getComplaint, getOfficerOverview, updateAlertStatus, claimComplaint, updateComplaint } from "@/lib/api"

interface OfficerAssignedAlert {
  id: string
  mine_name: string
  district: string
  severity: string
  status: string
  due_in_hours: number
}

interface OfficerSiteVisit {
  id: string
  site_name: string
  district: string
  scheduled_for: string
  priority: string
}

interface OfficerAaiFlag {
  id: string
  mine_name: string
  flag_type: string
  confidence_percent: number
  detected_at: string
}

interface CitizenComplaint {
  id: string
  category: string
  location: string
  submitted_at: string
  status: string
}

interface OfficerOverviewData {
  assigned_alerts: OfficerAssignedAlert[]
  pending_site_visits: OfficerSiteVisit[]
  recent_aai_flags: OfficerAaiFlag[]
  citizen_complaints: CitizenComplaint[]
}

export function OfficerOverviewDashboard() {
  const [data, setData] = useState<OfficerOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [alertDossierOpen, setAlertDossierOpen] = useState(false)
  const [alertDossierId, setAlertDossierId] = useState<string | null>(null)
  const [alertDossierLoading, setAlertDossierLoading] = useState(false)
  const [alertDossier, setAlertDossier] = useState<any | null>(null)

  const [complaintDossierOpen, setComplaintDossierOpen] = useState(false)
  const [complaintDossierId, setComplaintDossierId] = useState<string | null>(null)
  const [complaintDossierLoading, setComplaintDossierLoading] = useState(false)
  const [complaintDossier, setComplaintDossier] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    let timer: any
    async function load(isBackground?: boolean) {
      try {
        if (!isBackground) setLoading(true)
        const res = await getOfficerOverview()
        if (!mounted) return
        setData(res)
        setError(null)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? "Failed to load officer overview")
      } finally {
        if (mounted && !isBackground) setLoading(false)
      }
    }
    load(false)
    timer = setInterval(() => load(true), 10000)
    return () => {
      mounted = false
      if (timer) clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadAlert() {
      if (!alertDossierOpen || !alertDossierId) return
      try {
        setAlertDossierLoading(true)
        const a = await getAlert(alertDossierId)
        if (!mounted) return
        setAlertDossier(a)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? "Failed to load alert dossier")
      } finally {
        if (mounted) setAlertDossierLoading(false)
      }
    }
    loadAlert()
    return () => {
      mounted = false
    }
  }, [alertDossierOpen, alertDossierId])

  useEffect(() => {
    let mounted = true
    async function loadComplaint() {
      if (!complaintDossierOpen || !complaintDossierId) return
      try {
        setComplaintDossierLoading(true)
        const c = await getComplaint(complaintDossierId)
        if (!mounted) return
        setComplaintDossier(c)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? "Failed to load complaint dossier")
      } finally {
        if (mounted) setComplaintDossierLoading(false)
      }
    }
    loadComplaint()
    return () => {
      mounted = false
    }
  }, [complaintDossierOpen, complaintDossierId])

  const assignedAlerts = data?.assigned_alerts ?? []
  const pendingSiteVisits = data?.pending_site_visits ?? []
  const recentAaiFlags = data?.recent_aai_flags ?? []
  const citizenComplaints = data?.citizen_complaints ?? []

  const latestCitizenComplaints = citizenComplaints.slice(0, 5)

  const openAlertDossier = (id: string) => {
    setAlertDossierId(id)
    setAlertDossier(null)
    setAlertDossierOpen(true)
  }

  const openComplaintDossier = (id: string) => {
    setComplaintDossierId(id)
    setComplaintDossier(null)
    setComplaintDossierOpen(true)
  }

  const closeAlertDossier = () => setAlertDossierOpen(false)
  const closeComplaintDossier = () => setComplaintDossierOpen(false)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Officer Operations Overview</h1>
        <p className="text-muted-foreground max-w-2xl">
          Daily summary of alerts, site visits, AI intelligence and citizen complaints assigned to you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Assigned Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedAlerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              Pending Site Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSiteVisits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Flag className="w-4 h-4 text-emerald-400" />
              Recent AAI Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentAaiFlags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Citizen Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citizenComplaints.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Alerts */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Assigned Alerts
              </CardTitle>
              <CardDescription>Alerts that require your action or review.</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-200">
              Priority Queue
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {assignedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-md border border-amber-500/40 bg-slate-950/40 px-3 py-2 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-200">{alert.id}</span>
                      <Badge
                        className="text-[10px] px-1.5 py-0.5 border-amber-500/40 bg-amber-500/10 text-amber-200"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-50 mt-1">{alert.mine_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {alert.district}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{alert.status}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due in {alert.due_in_hours}h
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openAlertDossier(alert.id)}>
                      View Dossier
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
              {assignedAlerts.length === 0 && (
                <p className="text-xs text-slate-400">No alerts currently assigned.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Site Visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-cyan-400" />
                Pending Site Visits
              </CardTitle>
              <CardDescription>Upcoming field inspections to be conducted.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSiteVisits.map((visit) => (
              <div
                key={visit.id}
                className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-mono text-slate-400">{visit.id}</span>
                  <p className="text-sm font-semibold text-slate-50 mt-1">{visit.site_name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {visit.district}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Scheduled: {visit.scheduled_for}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={
                      visit.priority === "High"
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    }
                  >
                    {visit.priority} Priority
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                    View Brief
                  </Button>
                </div>
              </div>
            ))}
            {pendingSiteVisits.length === 0 && (
              <p className="text-xs text-slate-400">No pending site visits.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent AAI Flags */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-400" />
                Recent AAI Flags
              </CardTitle>
              <CardDescription>Latest AI Assistance & Intelligence detections.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAaiFlags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-mono text-emerald-200">{flag.id}</span>
                  <p className="text-sm font-semibold text-slate-50 mt-1">{flag.mine_name}</p>
                  <p className="text-xs text-slate-400 mt-1">{flag.flag_type}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/40">
                    {flag.confidence_percent}%
                  </Badge>
                  <span className="text-xs text-slate-400">{new Date(flag.detected_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {recentAaiFlags.length === 0 && (
              <p className="text-xs text-slate-400">No recent AI flags.</p>
            )}
          </CardContent>
        </Card>

        {/* Citizen Portal Complaints */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Citizen Complaints (Blockchain Secured)
              </CardTitle>
              <CardDescription>Complaints submitted via citizen portal and anchored on-chain.</CardDescription>
            </div>
            <Link href="/officer/complaints" className="text-xs text-cyan-300 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {latestCitizenComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="rounded-md border border-purple-500/30 bg-purple-500/5 px-3 py-2 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-purple-200">{complaint.id}</span>
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-slate-950/60 border-slate-700 text-slate-200">
                        Citizen Portal
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-50 mt-1">{complaint.category}</p>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {complaint.location}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Submitted: {complaint.submitted_at}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={
                        complaint.status === "submitted"
                          ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
                          : "bg-yellow-500/20 text-yellow-200 border-yellow-500/40"
                      }
                    >
                      {complaint.status}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openComplaintDossier(complaint.id)}>
                      View Dossier
                    </Button>
                  </div>
                </div>
              ))}
              {citizenComplaints.length === 0 && (
                <p className="text-xs text-slate-400">No citizen complaints assigned yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={alertDossierOpen} onOpenChange={closeAlertDossier}>
        <DialogContent className="sm:max-w-2xl bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Task Dossier</DialogTitle>
            <DialogDescription className="text-slate-400">Admin-assigned task details and actions.</DialogDescription>
          </DialogHeader>
          {alertDossierLoading && <p className="text-slate-400">Loading task...</p>}
          {!alertDossierLoading && alertDossier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Task ID</div>
                  <div className="text-xs font-mono text-slate-200">{alertDossier.id}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Severity</div>
                  <div className="text-sm text-slate-200">{String(alertDossier.severity || "").toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Mine</div>
                  <div className="text-sm text-slate-200">{alertDossier.mine_name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">District</div>
                  <div className="text-sm text-slate-200">{alertDossier.district || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Due Date</div>
                  <div className="text-sm text-slate-200">{alertDossier.due_date ? new Date(alertDossier.due_date).toLocaleString() : "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Created</div>
                  <div className="text-sm text-slate-200">{alertDossier.created_at ? new Date(alertDossier.created_at).toLocaleString() : "-"}</div>
                </div>
              </div>

              {alertDossier.description && (
                <div>
                  <div className="text-xs text-slate-500">Description</div>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap">{alertDossier.description}</div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Select
                  value={String(alertDossier.status || "open")}
                  onValueChange={async (v) => {
                    if (!alertDossierId) return
                    await updateAlertStatus(alertDossierId, v)
                    const refreshed = await getAlert(alertDossierId)
                    setAlertDossier(refreshed)
                  }}
                >
                  <SelectTrigger className="w-48 bg-slate-900 border-slate-800">
                    <SelectValue placeholder="Set status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    <SelectItem value="open">OPEN</SelectItem>
                    <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                    <SelectItem value="resolved">RESOLVED</SelectItem>
                    <SelectItem value="rejected">REJECTED</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={closeAlertDossier}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={complaintDossierOpen} onOpenChange={closeComplaintDossier}>
        <DialogContent className="sm:max-w-2xl bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Complaint Dossier</DialogTitle>
            <DialogDescription className="text-slate-400">Citizen complaint details and actions.</DialogDescription>
          </DialogHeader>
          {complaintDossierLoading && <p className="text-slate-400">Loading complaint...</p>}
          {!complaintDossierLoading && complaintDossier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Reference</div>
                  <div className="text-xs font-mono text-slate-200">{complaintDossier.transaction_hash || complaintDossier.id}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Submitted By</div>
                  <div className="text-sm text-slate-200">{complaintDossier.submitted_by || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Category</div>
                  <div className="text-sm text-slate-200">{complaintDossier.category || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Submitted</div>
                  <div className="text-sm text-slate-200">{complaintDossier.created_at ? new Date(complaintDossier.created_at).toLocaleString() : "-"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Title</div>
                <div className="text-sm text-slate-100 font-semibold">{complaintDossier.title}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Description</div>
                <div className="text-sm text-slate-200 whitespace-pre-wrap">{complaintDossier.description}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Location</div>
                <div className="text-sm text-slate-200">{
                  typeof complaintDossier.location === "string"
                    ? complaintDossier.location
                    : complaintDossier.location?.address || complaintDossier.location?.name || "-"
                }</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {!complaintDossier.assigned_officer_id ? (
                  <Button
                    onClick={async () => {
                      if (!complaintDossierId) return
                      await claimComplaint(complaintDossierId)
                      const refreshed = await getComplaint(complaintDossierId)
                      setComplaintDossier(refreshed)
                    }}
                  >
                    Claim
                  </Button>
                ) : (
                  <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-500/30">Assigned</Badge>
                )}

                <Select
                  value={String(complaintDossier.status || "submitted")}
                  onValueChange={async (v) => {
                    if (!complaintDossierId) return
                    await updateComplaint(complaintDossierId, { status: v as any })
                    const refreshed = await getComplaint(complaintDossierId)
                    setComplaintDossier(refreshed)
                  }}
                >
                  <SelectTrigger className="w-48 bg-slate-900 border-slate-800">
                    <SelectValue placeholder="Set status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    <SelectItem value="submitted">SUBMITTED</SelectItem>
                    <SelectItem value="under_review">UNDER REVIEW</SelectItem>
                    <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                    <SelectItem value="resolved">RESOLVED</SelectItem>
                    <SelectItem value="rejected">REJECTED</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={closeComplaintDossier}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
