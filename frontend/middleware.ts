import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = request.cookies.get("role")?.value

  const requireRole = (required: "admin" | "officer") => {
    if (role === required) return NextResponse.next()
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/admin")) {
    return requireRole("admin")
  }

  if (pathname.startsWith("/officer")) {
    return requireRole("officer")
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/officer/:path*", "/login", "/signup"],
}
