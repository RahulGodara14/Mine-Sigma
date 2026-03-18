"use client"

import { useState, useEffect } from "react"
import {
  Home,
  FileText,
  LogOut,
  Shield,
  User,
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

interface OfficerSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

export function OfficerSidebar({ isOpen }: OfficerSidebarProps) {
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
    return "Officer"
  })()

  const mainNavItems: NavItem[] = [
    { icon: Home, label: "Overview", href: "/officer" },
    { icon: FileText, label: "AI Analysis Center", href: "/officer/analysis" },
    { icon: FileText, label: "Field Reports", href: "/officer/reports" },
    { icon: FileText, label: "Citizen Complaints", href: "/officer/complaints" },
  ]

  const NavButton = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    const button = (
      <Link href={item.href} className="w-full group">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-full h-11 rounded-lg transition-all duration-300 relative overflow-hidden",
            isActive
              ? "bg-gradient-to-r from-sky-600/30 to-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-sky-500/0 group-hover:from-cyan-500/10 group-hover:to-sky-500/10 transition-all" />
          <item.icon className="h-5 w-5 relative z-10" />
          {isOpen && (
            <>
              <span className="ml-3 text-sm font-semibold relative z-10">{item.label}</span>
            </>
          )}
        </Button>
      </Link>
    )

    if (!isOpen) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="bg-gradient-to-r from-sky-900 to-slate-800 border-sky-500/30 text-cyan-300 font-semibold">
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
          "bg-gradient-to-b from-slate-900 to-slate-950 border-r border-cyan-500/20 transition-all duration-300 flex flex-col shadow-2xl",
          isOpen ? "w-64" : "w-20",
        )}
      >
        <div className="h-16 border-b border-cyan-500/20 flex items-center justify-center px-4 bg-gradient-to-r from-sky-900/20 to-cyan-900/20 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-3 group w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:shadow-sky-500/50 transition-all group-hover:scale-110">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {isOpen && (
              <div className="flex-1">
                <h1 className="font-bold text-sm bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">Mine-Sigma</h1>
                <p className="text-xs text-slate-500 font-medium">Officer Portal</p>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-2">
          {isOpen && (
            <div className="px-2 py-2 mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Officer Navigation</p>
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
          <div className="px-4 py-3 border-t border-cyan-500/20 bg-gradient-to-b from-cyan-900/10 to-transparent">
            {isOpen ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cyan-300 truncate">Hi {displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto cursor-help">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gradient-to-r from-cyan-900 to-slate-800 border-cyan-500/30 text-cyan-300 font-semibold">
                  <div className="text-center">
                    <p>Hi {displayName}</p>
                    <p className="text-xs text-slate-400">{userEmail}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        <div className="p-4 border-t border-cyan-500/20 bg-gradient-to-t from-slate-950 to-transparent space-y-2">
          {!isOpen ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
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
                  }}
                  className="w-full h-11 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gradient-to-r from-red-900 to-slate-800 border-red-500/30 text-red-300 font-semibold">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={async () => {
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
              }}
              className="w-full h-11 justify-start rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3 text-sm font-semibold">Logout</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
