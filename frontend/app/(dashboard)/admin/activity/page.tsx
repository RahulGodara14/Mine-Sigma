"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Activity, User, FileText, AlertTriangle, CheckCircle, Clock, Filter, Search, Download, TrendingUp } from "lucide-react"

import { getAdminActivity } from "@/lib/api"

const getActivityIcon = (type: string) => {
    switch(type) {
        case "upload": return "📤"
        case "analysis": return "📊"
        case "review": return "👁️"
        case "alert": return "⚠️"
        case "download": return "⬇️"
        case "admin": return "⚙️"
        case "system": return "🔧"
        default: return "📝"
    }
}

const getActivityColor = (type: string) => {
    switch(type) {
        case "upload": return "bg-blue-500/20 text-blue-300 border-blue-500/30"
        case "analysis": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        case "review": return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
        case "alert": return "bg-red-500/20 text-red-300 border-red-500/30"
        case "download": return "bg-purple-500/20 text-purple-300 border-purple-500/30"
        case "admin": return "bg-orange-500/20 text-orange-300 border-orange-500/30"
        case "system": return "bg-slate-500/20 text-slate-300 border-slate-500/30"
        default: return "bg-slate-500/20 text-slate-300 border-slate-500/30"
    }
}

const ActivityItem = ({ activity }: any) => (
    <div className="bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700/50 rounded-lg p-5 hover:border-emerald-500/30 transition-all">
        <div className="flex items-start gap-4">
            <div className="text-2xl">{getActivityIcon(activity.type)}</div>
            <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="font-semibold text-white">{activity.action}</p>
                        <p className="text-sm text-slate-400 mt-1">{activity.details}</p>
                    </div>
                    <Badge className={`${getActivityColor(activity.type)} border`}>
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-4 h-4" />
                        <span>{activity.user}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <FileText className="w-4 h-4" />
                        <span>{activity.target}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{activity.timestamp}</span>
                    </div>
                </div>
            </div>
            {activity.status === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {activity.status === "warning" && <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />}
        </div>
    </div>
)

export default function ActivityPage() {
    const [activityLog, setActivityLog] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                setLoading(true)
                const items = await getAdminActivity()
                if (!mounted) return

                const mapped = items.map((i) => {
                    const action = i.action ?? "activity"
                    const type = (() => {
                        if (action.includes("login") || action.includes("registered")) return "admin"
                        if (action.includes("alert")) return "alert"
                        if (action.includes("report")) return "analysis"
                        if (action.includes("zone")) return "admin"
                        if (action.includes("complaint")) return "alert"
                        return i.entity_type ?? "system"
                    })()

                    const detailsText = (() => {
                        if (typeof i.details === "string") return i.details
                        if (i.details && typeof i.details === "object") {
                            if (i.details.title) return String(i.details.title)
                            if (i.details.name) return String(i.details.name)
                            if (i.details.email) return String(i.details.email)
                            return JSON.stringify(i.details)
                        }
                        return ""
                    })()

                    return {
                        id: i.id,
                        user: i.actor_email ?? "System",
                        action: action,
                        type,
                        target: i.entity_type ? `${i.entity_type}:${i.entity_id ?? ""}` : (i.entity_id ?? ""),
                        timestamp: new Date(i.created_at).toLocaleString(),
                        status: i.status ?? "success",
                        details: detailsText,
                    }
                })

                setActivityLog(mapped)
            } catch (e: any) {
                if (!mounted) return
                setError(e?.message ?? "Failed to load activity")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    const activityTypes = ["upload", "analysis", "review", "alert", "download", "admin", "system"]
    
    const filteredActivity = useMemo(() => {
        return activityLog.filter((activity) =>
            (activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
             activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
             activity.target.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!filterType || activity.type === filterType)
        )
    }, [activityLog, searchTerm, filterType])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                            Activity Log
                        </h1>
                        <p className="text-slate-400 text-lg">Track all system activities and user actions</p>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Download className="mr-2 h-4 w-4" />
                        Export Log
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Total Activities</p>
                        <p className="text-3xl font-bold text-emerald-400">{activityLog.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Today</p>
                        <p className="text-3xl font-bold text-blue-400">8</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">This Week</p>
                        <p className="text-3xl font-bold text-cyan-400">24</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/20 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Success Rate</p>
                        <p className="text-3xl font-bold text-purple-400">99.2%</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <Input
                        type="search"
                        placeholder="Search activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500"
                    />
                </div>
                <Button className="bg-slate-800 hover:bg-slate-700 text-slate-300">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>

            {/* Activity Type Filters */}
            <div className="flex gap-2 mb-8 flex-wrap">
                <Button
                    onClick={() => setFilterType(null)}
                    className={`${
                        filterType === null
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                >
                    All Activities
                </Button>
                {activityTypes.map((type) => (
                    <Button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`${
                            filterType === type
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                    >
                        {getActivityIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Activity List */}
            <div className="space-y-4">
                {loading && <p className="text-slate-400">Loading activity...</p>}
                {error && <p className="text-red-400">{error}</p>}
                {filteredActivity.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                ))}
                {!loading && !error && filteredActivity.length === 0 && (
                    <p className="text-slate-400">No activity found.</p>
                )}
            </div>
        </div>
    )
}
