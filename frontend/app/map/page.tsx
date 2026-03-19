"use client";

import dynamic from "next/dynamic";

// Dynamically import the CesiumMap component with ssr: false
// This is crucial because Cesium uses window/document which are not available on the server
const CesiumMap = dynamic(() => import("@/components/CesiumMap"), {
    ssr: false,
    loading: () => <p>Loading 3D Map...</p>,
});

export default function MapPage() {
    return (
        <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            <CesiumMap />
        </main>
    );
}
