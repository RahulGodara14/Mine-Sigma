"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getComplaint, claimComplaint, getOfficerComplaintInbox, updateComplaint, type ComplaintStatus } from "@/lib/api"

const statusLabel = (s: string) => {
  const v = (s ?? "").toString()
  return v.replaceAll("_", " ").toUpperCase()
}

export default function OfficerComplaintsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [dossierOpen, setDossierOpen] = useState(false)
  const [dossierId, setDossierId] = useState<string | null>(null)
  const [dossierLoading, setDossierLoading] = useState(false)
  const [dossier, setDossier] = useState<any | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getOfficerComplaintInbox()
      setItems(data ?? [])
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load complaints")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadDossier() {
      if (!dossierOpen || !dossierId) return
      try {
        setDossierLoading(true)
        const data = await getComplaint(dossierId)
        if (!mounted) return
        setDossier(data)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? "Failed to load dossier")
      } finally {
        if (mounted) setDossierLoading(false)
      }
    }
    loadDossier()
    return () => {
      mounted = false
    }
  }, [dossierOpen, dossierId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter((c) => {
        if (statusFilter === "all") return true
        return String(c.status ?? "").toLowerCase() === statusFilter
      })
      .filter((c) => {
        if (!q) return true
        const loc = c.location
        const locText =
          typeof loc === "string"
            ? loc
            : typeof loc === "object" && loc
              ? `${loc.address ?? ""} ${loc.name ?? ""} ${loc.latitude ?? ""} ${loc.longitude ?? ""}`
              : ""
        const hay = `${c.id ?? ""} ${c.transaction_hash ?? ""} ${c.title ?? ""} ${c.description ?? ""} ${c.category ?? ""} ${c.submitted_by ?? ""} ${locText}`.toLowerCase()
        return hay.includes(q)
      })
  }, [items, search, statusFilter])

  const total = items.length

  const formatLocation = (loc: any) => {
    if (!loc) return ""
    if (typeof loc === "string") return loc
    if (typeof loc === "object") {
      return loc.address || loc.name || [loc.latitude, loc.longitude].filter(Boolean).join(", ")
    }
    return String(loc)
  }

  const shortRef = (c: any) => {
    const tx = c.transaction_hash
    if (tx && typeof tx === "string" && tx.length > 14) return `${tx.slice(0, 10)}...${tx.slice(-4)}`
    const id = String(c.id ?? "")
    return id.length > 14 ? `${id.slice(0, 10)}...${id.slice(-4)}` : id
  }

  const onClaim = async (id: string) => {
    try {
      setError(null)
      await claimComplaint(id)
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Failed to claim")
    }
  }

  const onSetStatus = async (id: string, status: ComplaintStatus) => {
    try {
      setError(null)
      await updateComplaint(id, { status })
      await load()
    } catch (e: any) {
      setError(e?.message ?? "Failed to update status")
    }
  }

  const openDossier = (id: string) => {
    setDossierId(id)
    setDossier(null)
    setDossierOpen(true)
  }

  const closeDossier = () => {
    setDossierOpen(false)
  }

  const dossierLoc = dossier ? formatLocation(dossier.location) : ""

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Citizen Complaints</h1>
          <p className="text-muted-foreground">Latest citizen complaints coming from the Mine Guard app.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-slate-800 bg-slate-950/50">
            {total} total
          </Badge>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>

      {loading && <p className="text-slate-400">Loading complaints...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <Card className="border-slate-800 bg-slate-950/40">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Complaints Queue</CardTitle>
              <CardDescription>Latest citizen complaints ordered by submission time.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-[360px]">
                <Input
                  type="search"
                  placeholder="Search by ID, category, location..."
                  className="bg-slate-900 border-slate-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 bg-slate-900 border-slate-800">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="submitted">SUBMITTED</SelectItem>
                  <SelectItem value="under_review">UNDER REVIEW</SelectItem>
                  <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                  <SelectItem value="resolved">RESOLVED</SelectItem>
                  <SelectItem value="rejected">REJECTED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-slate-400">Loading complaints...</p>}
          {!loading && filtered.length === 0 && <p className="text-slate-400">No complaints found.</p>}

          {!loading && filtered.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-300">Reference</TableHead>
                  <TableHead className="text-slate-300">Title / Category</TableHead>
                  <TableHead className="text-slate-300">Location</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Submitted</TableHead>
                  <TableHead className="text-right text-slate-300">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const assigned = !!c.assigned_officer_id
                  const status = (c.status ?? "submitted").toString() as ComplaintStatus
                  const loc = formatLocation(c.location)
                  return (
                    <TableRow key={c.id} className="border-slate-800">
                      <TableCell className="font-mono text-xs text-slate-300">
                        {shortRef(c)}
                      </TableCell>
                      <TableCell className="min-w-[280px]">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-slate-50">{c.category || c.title}</div>
                          <div className="text-xs text-slate-400">{c.title}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="text-xs text-slate-300 truncate" title={loc}>{loc}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            status === "submitted"
                              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
                              : status === "resolved"
                                ? "bg-slate-500/20 text-slate-200 border-slate-500/40"
                                : status === "rejected"
                                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                                  : "bg-yellow-500/20 text-yellow-200 border-yellow-500/40"
                          }
                        >
                          {statusLabel(status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => openDossier(c.id)}>
                            View Dossier
                          </Button>

                          {!assigned ? (
                            <Button size="sm" onClick={() => onClaim(c.id)}>
                              Claim
                            </Button>
                          ) : (
                            <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-500/30">Assigned</Badge>
                          )}

                          <Select value={status} onValueChange={(v) => onSetStatus(c.id, v as ComplaintStatus)}>
                            <SelectTrigger className="w-40 bg-slate-950 border-slate-800">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          <div className="pt-4">
            <Link href="/officer" className="text-xs text-cyan-300 hover:underline">
              Back to Overview
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dossierOpen} onOpenChange={closeDossier}>
        <DialogContent className="sm:max-w-2xl bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Complaint Dossier</DialogTitle>
            <DialogDescription className="text-slate-400">
              Full complaint details and officer actions.
            </DialogDescription>
          </DialogHeader>

          {dossierLoading && <p className="text-slate-400">Loading dossier...</p>}

          {!dossierLoading && dossier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Reference</div>
                  <div className="text-xs font-mono text-slate-200">{dossier.transaction_hash || dossier.id}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Submitted By</div>
                  <div className="text-sm text-slate-200">{dossier.submitted_by || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Category</div>
                  <div className="text-sm text-slate-200">{dossier.category || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Submitted</div>
                  <div className="text-sm text-slate-200">{dossier.created_at ? new Date(dossier.created_at).toLocaleString() : "-"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Title</div>
                <div className="text-sm text-slate-100 font-semibold">{dossier.title}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Description</div>
                <div className="text-sm text-slate-200 whitespace-pre-wrap">{dossier.description}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Location</div>
                <div className="text-sm text-slate-200">{dossierLoc || "-"}</div>
                {dossier?.location?.latitude !== undefined && dossier?.location?.longitude !== undefined && (
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {dossier.location.latitude}, {dossier.location.longitude}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {!dossier.assigned_officer_id ? (
                  <Button
                    onClick={async () => {
                      if (!dossierId) return
                      await onClaim(dossierId)
                      const refreshed = await getComplaint(dossierId)
                      setDossier(refreshed)
                    }}
                  >
                    Claim
                  </Button>
                ) : (
                  <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-500/30">Assigned</Badge>
                )}

                <Select
                  value={(dossier.status ?? "submitted").toString()}
                  onValueChange={async (v) => {
                    if (!dossierId) return
                    await onSetStatus(dossierId, v as ComplaintStatus)
                    const refreshed = await getComplaint(dossierId)
                    setDossier(refreshed)
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

                <Button variant="outline" onClick={closeDossier}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
