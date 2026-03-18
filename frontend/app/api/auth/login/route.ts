import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  const proto = req.headers.get("x-forwarded-proto") ?? "http"
  const inferredBackendBase = host
    ? `${proto}://${host.split(":")[0]}:8000/api`
    : null

  const BACKEND_API_BASE =
    process.env.BACKEND_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    inferredBackendBase ??
    "http://localhost:8000/api"

  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null

  if (!body?.username || !body?.password) {
    return NextResponse.json({ message: "Missing credentials" }, { status: 400 })
  }

  const backendRes = await fetch(`${BACKEND_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!backendRes.ok) {
    const status = backendRes.status
    const message = status === 401 ? "Invalid credentials" : `Login failed: ${status}`
    return NextResponse.json({ message }, { status })
  }

  const data = (await backendRes.json()) as {
    username: string
    full_name: string
    role: "admin" | "officer"
    access_token: string
    token_type: string
  }

  const res = NextResponse.json({
    username: data.username,
    full_name: data.full_name,
    role: data.role,
    access_token: data.access_token,
    token_type: data.token_type,
  })

  const isProd = process.env.NODE_ENV === "production"
  res.cookies.set("role", data.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  })

  return res
}
