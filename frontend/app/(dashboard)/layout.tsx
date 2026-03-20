"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { OfficerSidebar } from "@/components/officer-sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    return (
        <div className="flex h-screen bg-slate-950">
            {pathname?.startsWith("/officer") ? (
                <OfficerSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            ) : (
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            )}
            <main className="flex-1 overflow-auto relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="fixed top-4 left-4 z-50 bg-slate-900/90 backdrop-blur border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                    {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
                {children}
            </main>
        </div>
    )
}
