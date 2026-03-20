"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Filter, Search, Eye, Calendar, FileCheck, Clock, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

import { createReport, getReports } from "@/lib/api"

const formatReportDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Finalized":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    case "Under Review":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    case "Draft":
      return "bg-slate-500/20 text-slate-300 border-slate-500/30"
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30"
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Automated":
      return "🤖"
    case "Field Visit":
      return "📍"
    case "Summary":
      return "📊"
    case "Audit":
      return "✓"
    default:
      return "📄"
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const loadReports = async (mounted?: { current: boolean }) => {
    const data = await getReports()
    if (mounted && !mounted.current) return

    const mapped = data.map((r) => {
      const status = (r.status ?? "draft").toString()
      const statusLabel =
        status === "finalized" ? "Finalized" :
        status === "under_review" ? "Under Review" :
        "Draft"

      const type = (r.report_type ?? "field_visit").toString()
      const typeLabel =
        type === "automated" ? "Automated" :
        type === "summary" ? "Summary" :
        type === "audit" ? "Audit" :
        "Field Visit"

      const date = new Date(r.created_at).toISOString().split("T")[0]

      return {
        id: r.id,
        title: r.title,
        date,
        author: "System",
        type: typeLabel,
        status: statusLabel,
        size: "-",
        description: r.description ?? "",
      }
    })

    setReports(mapped)
  }

  useEffect(() => {
    const mounted = { current: true }
    async function load() {
      try {
        setLoading(true)
        await loadReports(mounted)
      } catch (e: any) {
        if (!mounted.current) return
        setError(e?.message ?? "Failed to load reports")
      } finally {
        if (mounted.current) setLoading(false)
      }
    }
    load()
    return () => {
      mounted.current = false
    }
  }, [])

  const handleGenerate = async () => {
    try {
      setError(null)
      const title = prompt("Report title?")
      if (!title) return
      const description = prompt("Description? (optional)") ?? undefined
      await createReport({ title, description, report_type: "summary", status: "draft" })
      await loadReports()
    } catch (e: any) {
      setError(e?.message ?? "Failed to create report")
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [reports, searchTerm])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {loading && <p className="text-slate-400 mb-4">Loading reports...</p>}
      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-2">
              Reports
            </h1>
            <p className="text-slate-400 text-lg">All generated reports (admin view)</p>
          </div>
          <Button onClick={handleGenerate} className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-emerald-500/50 transition-all">
            <FileText className="mr-2 h-5 w-5" />
            Generate New Report
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Total Reports</p>
            <p className="text-3xl font-bold text-emerald-400">{reports.length}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Finalized</p>
            <p className="text-3xl font-bold text-cyan-400">{reports.filter((r) => r.status === "Finalized").length}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Under Review</p>
            <p className="text-3xl font-bold text-yellow-400">{reports.filter((r) => r.status === "Under Review").length}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-500/20 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Drafts</p>
            <p className="text-3xl font-bold text-slate-300">{reports.filter((r) => r.status === "Draft").length}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
          <Input
            type="search"
            placeholder="Search reports by title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500"
          />
        </div>
        <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-emerald-500/20 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-800/50 border-b border-slate-700/50">
              <TableRow>
                <TableHead className="text-slate-300 font-semibold">Report ID</TableHead>
                <TableHead className="text-slate-300 font-semibold">Title</TableHead>
                <TableHead className="text-slate-300 font-semibold">Type</TableHead>
                <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                <TableHead className="text-slate-300 font-semibold">Date</TableHead>
                <TableHead className="text-slate-300 font-semibold">Size</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-400">{report.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-white">{report.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(report.type)}</span>
                      <span className="text-sm text-slate-300">{report.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(report.status)} border`}>
                      {report.status === "Finalized" && <FileCheck className="w-3 h-3 mr-1" />}
                      {report.status === "Under Review" && <Clock className="w-3 h-3 mr-1" />}
                      {report.status === "Draft" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {formatReportDate(report.date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">{report.size}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors" title="Download">
                        <Download className="h-4 w-4" />
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
