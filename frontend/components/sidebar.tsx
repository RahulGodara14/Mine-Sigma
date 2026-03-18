"use client"

import { useState, useEffect } from "react"
import {
  Home,
  Shield,
  Map,
  BarChart3,
  AlertTriangle,
  Settings,
  LogOut,
  FileText,
  Bell,
  Users,
  Layers,
  Activity,
  Upload,
  ChevronRight,
  Zap,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Get user info from localStorage
    if (typeof window !== "undefined") {
      const rawName = localStorage.getItem("user_name")
      const email = localStorage.getItem("user_email")

      const normalizedName = rawName && rawName.toLowerCase()
      const safeName =
        normalizedName && normalizedName !== "undefined" && normalizedName !== "null"
          ? rawName
          : null

      setUserName(safeName)
      setUserEmail(email)
    }
  }, [])

  const displayName = (() => {
    if (userName && userName.trim().length > 0) {
      return userName.split(" ")[0]
    }
    if (userEmail) {
      return userEmail.split("@")[0]
    }
    return "User"
  })()

  // Main navigation items - shown to all users
  const mainNavItems: NavItem[] = [
    { icon: Home, label: "Dashboard", href: "/admin" },
    { icon: Map, label: "Map Viewer", href: "/admin/map-viewer" },
    { icon: Upload, label: "Upload Files", href: "/admin/uploads" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: FileText, label: "Reports", href: "/admin/reports" },
    { icon: Bell, label: "Alerts", href: "/admin/alerts" },
    { icon: Layers, label: "Zones", href: "/admin/zones" },
    { icon: Users, label: "Officers", href: "/admin/officers" },
    { icon: Activity, label: "Activity", href: "/admin/activity" },
  ]

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      // ignore
    }
    // Clear JWT token, role, and user info from localStorage
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_role")
    localStorage.removeItem("user_name")
    localStorage.removeItem("user_email")
    router.push("/login")
  }

  const NavButton = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    const button = (
      <Link href={item.href} className="w-full group">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-full h-11 rounded-lg transition-all duration-300 relative overflow-hidden",
            isActive 
              ? "bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/20" 
              : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30",
            "group-hover:translate-x-1 transition-transform"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 transition-all" />
          <item.icon className="h-5 w-5 relative z-10" />
          {isOpen && (
            <>
              <span className="ml-3 text-sm font-semibold relative z-10">{item.label}</span>
              {isActive && <ChevronRight className="ml-auto h-4 w-4 relative z-10" />}
            </>
          )}
        </Button>
      </Link>
    )

    if (!isOpen) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="bg-gradient-to-r from-emerald-900 to-slate-800 border-emerald-500/30 text-emerald-300 font-semibold">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "bg-gradient-to-b from-slate-900 to-slate-950 border-r border-emerald-500/20 transition-all duration-300 flex flex-col shadow-2xl",
          isOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo/Brand Section */}
        <div className="h-16 border-b border-emerald-500/20 flex items-center justify-center px-4 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-3 group w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all group-hover:scale-110">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {isOpen && (
              <div className="flex-1">
                <h1 className="font-bold text-sm bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">Mine-Sigma</h1>
                <p className="text-xs text-slate-500 font-medium">Satellite Intel</p>
              </div>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-2">
          {isOpen && (
            <div className="px-2 py-2 mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</p>
            </div>
          )}
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href
              return <NavButton key={item.href} item={item} isActive={isActive} />
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        {(userName || userEmail) && (
          <div className="px-4 py-3 border-t border-emerald-500/20 bg-gradient-to-b from-emerald-900/10 to-transparent">
            {isOpen ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-300 truncate">Hi {displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto cursor-help">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gradient-to-r from-emerald-900 to-slate-800 border-emerald-500/30 text-emerald-300 font-semibold">
                  <div className="text-center">
                    <p>Hi {displayName}</p>
                    <p className="text-xs text-slate-400">{userEmail}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 border-t border-emerald-500/20 bg-gradient-to-t from-slate-950 to-transparent space-y-2">
          {!isOpen ? (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href="/admin/settings" className="w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full h-11 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gradient-to-r from-emerald-900 to-slate-800 border-emerald-500/30 text-emerald-300 font-semibold">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="w-full h-11 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gradient-to-r from-red-900 to-slate-800 border-red-500/30 text-red-300 font-semibold">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Link href="/admin/settings" className="w-full">
                <Button
                  variant="ghost"
                  className="w-full h-11 justify-start rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all group"
                >
                  <Settings className="h-5 w-5" />
                  <span className="ml-3 text-sm font-semibold">Settings</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full h-11 justify-start rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3 text-sm font-semibold">Logout</span>
              </Button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
