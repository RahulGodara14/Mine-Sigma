"use client"

import { useEffect, useMemo, useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Map, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

import { createZone, getZones, updateZone } from "@/lib/api"

export default function ZonesPage() {
    const [zones, setZones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                setLoading(true)
                const data = await getZones()
                if (!mounted) return
                setZones(data)
            } catch (e: any) {
                if (!mounted) return
                setError(e?.message ?? "Failed to load zones")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    const handleEditArea = async (zoneId: string, currentArea: any) => {
        try {
            setError(null)
            const areaRaw = prompt("Update Area (km²)?", currentArea != null ? String(currentArea) : "")
            if (areaRaw == null) return
            const trimmed = areaRaw.trim()
            const area_km2 = trimmed.length ? Number(trimmed) : undefined
            if (area_km2 != null && !Number.isFinite(area_km2)) {
                setError("Invalid area value")
                return
            }
            await updateZone(zoneId, { area_km2 })
            const data = await getZones()
            setZones(data)
        } catch (e: any) {
            setError(e?.message ?? "Failed to update zone")
        }
    }

    const filteredZones = useMemo(() => {
        if (!search) return zones
        return zones.filter((z) => (z.name ?? "").toLowerCase().includes(search.toLowerCase()))
    }, [zones, search])

    const handleAddZone = async () => {
        try {
            setError(null)
            const name = prompt("Zone name?")
            if (!name) return
            const district = prompt("District? (optional)") ?? undefined
            const state = prompt("State? (optional)") ?? undefined
            const areaRaw = prompt("Area (km²)? (optional)")
            const area_km2 = areaRaw && areaRaw.trim().length > 0 ? Number(areaRaw) : undefined
            await createZone({ name, district, state, area_km2: Number.isFinite(area_km2 as any) ? area_km2 : undefined })
            const data = await getZones()
            setZones(data)
        } catch (e: any) {
            setError(e?.message ?? "Failed to create zone")
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monitored Zones</h1>
                    <p className="text-muted-foreground">Overview of all mining zones under satellite surveillance</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddZone}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Zone
                </Button>
            </div>

            {loading && <p className="text-slate-400">Loading zones...</p>}
            {error && <p className="text-red-400">{error}</p>}

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search zones..." className="pl-8 bg-slate-900 border-slate-800" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading && filteredZones.length === 0 && (
                    <p className="text-slate-400">No zones yet. Click "Add New Zone" to create one.</p>
                )}
                {filteredZones.map((zone) => (
                    <Card key={zone.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                                    <CardDescription>{zone.district ?? ""}{zone.state ? `, ${zone.state}` : ""}</CardDescription>
                                </div>
                                <Badge
                                    variant={
                                        zone.risk_level === "Critical"
                                            ? "destructive"
                                            : zone.risk_level === "High"
                                                ? "destructive" // Use destructive for high too or create custom
                                                : zone.risk_level === "Medium"
                                                    ? "default"
                                                    : "secondary"
                                    }
                                >
                                    {zone.risk_level ?? "Unknown"} Risk
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Area:</span>
                                    <span className="font-medium">{zone.area_km2 ? `${zone.area_km2} km²` : "-"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className={zone.status === "Active Monitoring" ? "text-emerald-500" : "text-slate-400"}>
                                        {zone.status ?? "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Last Scan:</span>
                                    <span>{zone.last_scan_at ? new Date(zone.last_scan_at).toLocaleString() : "-"}</span>
                                </div>
                                <div className="pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="secondary" className="w-full">
                                            <Map className="mr-2 h-4 w-4" />
                                            View on Map
                                        </Button>
                                        <Button variant="outline" className="w-full" onClick={() => handleEditArea(zone.id, zone.area_km2)}>
                                            Edit Area
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
