"use client";

import { useEffect, useRef, useState } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Search, Calendar, Download, MapPin, Layers } from "lucide-react";

// Define coalfield data
const COALFIELDS = [
    { id: 1, name: "Jharia Coalfield", lat: 23.75, lng: 86.42, description: "Prime coking coal reserves" },
    { id: 2, name: "Raniganj Coalfield", lat: 23.62, lng: 87.13, description: "First coal mine in India" },
    { id: 3, name: "Bokaro Coalfield", lat: 23.78, lng: 85.96, description: "Major thermal power source" },
    { id: 4, name: "Talcher Coalfield", lat: 20.95, lng: 85.23, description: "Largest coal reserves in India" },
    { id: 5, name: "Singrauli Coalfield", lat: 24.20, lng: 82.67, description: "Energy capital of India" },
];

export default function CesiumMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const [selectedField, setSelectedField] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [is3D, setIs3D] = useState(true);

    useEffect(() => {
        if (!containerRef.current) return;

        // Set the base URL for Cesium assets
        // @ts-ignore
        window.CESIUM_BASE_URL = "/cesium";

        let isMounted = true;

        import("cesium").then(async (Cesium) => {
            if (!isMounted || !containerRef.current) return;

            Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MmNhYjc1YS05OTVjLTRlMzQtODgzNi1mYWIyZjJjM2UzNjAiLCJpZCI6MzYyMDY0LCJpYXQiOjE3NjM2MTg4ODh9.L9wtc_GcBna4XVzrB1BejWHEj9Sm_o0KMAB4b9HL6zw";

            const viewer = new Cesium.Viewer(containerRef.current, {
                terrainProvider: undefined,
                animation: false,
                timeline: false,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                sceneModePicker: false,
                navigationHelpButton: false,
                selectionIndicator: false,
                infoBox: false,
            });

            // Add 3D Buildings
            try {
                const buildings = await Cesium.createOsmBuildingsAsync();
                viewer.scene.primitives.add(buildings);
            } catch (error) {
                console.error("Failed to load OSM buildings:", error);
            }

            // Add World Terrain asynchronously
            try {
                const terrain = await Cesium.Terrain.fromWorldTerrain();
                (viewer as any).terrain = terrain;
            } catch (error) {
                console.error("Failed to load world terrain:", error);
            }

            viewerRef.current = viewer;

            // Fly to Jharia initially
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(86.42, 23.75, 50000),
                orientation: {
                    heading: Cesium.Math.toRadians(0.0),
                    pitch: Cesium.Math.toRadians(-45.0), // Start with 3D tilt
                    roll: 0.0,
                },
            });
        });

        return () => {
            isMounted = false;
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, []);

    const handleFlyTo = (field: typeof COALFIELDS[0]) => {
        setSelectedField(field.id);
        if (viewerRef.current) {
            import("cesium").then((Cesium) => {
                viewerRef.current.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(field.lng, field.lat, 30000),
                    orientation: {
                        heading: Cesium.Math.toRadians(0.0),
                        pitch: Cesium.Math.toRadians(is3D ? -45.0 : -90.0),
                        roll: 0.0,
                    },
                    duration: 2,
                });
            });
        }
    };

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim() && viewerRef.current) {
            setIsSearching(true);
            try {
                const Cesium = await import("cesium");
                const geocoder = new Cesium.IonGeocoderService({ scene: viewerRef.current.scene });
                const results = await geocoder.geocode(searchQuery);

                if (results.length > 0) {
                    const bestResult = results[0];
                    viewerRef.current.camera.flyTo({
                        destination: bestResult.destination,
                        duration: 2,
                        orientation: {
                            heading: Cesium.Math.toRadians(0.0),
                            pitch: Cesium.Math.toRadians(is3D ? -45.0 : -90.0),
                            roll: 0.0,
                        }
                    });
                } else {
                    console.warn("No results found for:", searchQuery);
                }
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const toggle3D = () => {
        const newIs3D = !is3D;
        setIs3D(newIs3D);

        if (viewerRef.current) {
            import("cesium").then((Cesium) => {
                const currentPosition = viewerRef.current.camera.position;
                const currentHeading = viewerRef.current.camera.heading;

                viewerRef.current.camera.flyTo({
                    destination: currentPosition,
                    orientation: {
                        heading: currentHeading,
                        pitch: Cesium.Math.toRadians(newIs3D ? -45.0 : -90.0),
                        roll: 0.0,
                    },
                    duration: 1,
                });
            });
        }
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Cesium Container */}
            <div ref={containerRef} className="absolute inset-0 z-0" />

            {/* Sidebar Overlay */}
            <div className="absolute left-4 top-4 bottom-4 w-80 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 flex flex-col shadow-2xl z-10 overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Active Coalfields
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Real-time monitoring & analysis</p>
                </div>

                {/* Search & Filter */}
                <div className="p-4 space-y-3 border-b border-white/10 bg-white/5">
                    <div className="relative">
                        <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isSearching ? "text-blue-400 animate-pulse" : "text-gray-400"}`} />
                        <input
                            type="text"
                            placeholder="Search location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggle3D}
                            className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-2 text-xs transition-colors ${is3D
                                ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                                : "bg-black/50 border-white/10 text-gray-300 hover:bg-white/10"
                                }`}
                        >
                            <Layers className="h-3 w-3" />
                            <span>{is3D ? "3D View" : "2D View"}</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-black/50 border border-white/10 rounded-lg py-2 text-xs hover:bg-white/10 transition-colors">
                            <Calendar className="h-3 w-3" />
                            <span>Date Filter</span>
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {COALFIELDS.map((field) => (
                        <button
                            key={field.id}
                            onClick={() => handleFlyTo(field)}
                            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${selectedField === field.id
                                ? "bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                                : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-1.5 rounded-full ${selectedField === field.id ? "bg-blue-500 text-white" : "bg-white/10 text-gray-400 group-hover:text-white"
                                    }`}>
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className={`font-medium ${selectedField === field.id ? "text-blue-400" : "text-gray-200"
                                        }`}>
                                        {field.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                                            {field.lat.toFixed(2)}°N
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                                            {field.lng.toFixed(2)}°E
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 bg-black/40 text-[10px] text-center text-gray-500">
                    Mine-Sigma Intelligence System v1.0
                </div>
            </div>
        </div>
    );
}
