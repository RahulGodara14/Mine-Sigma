const DEFAULT_API_BASE =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:8000/api`
    : "http://localhost:8000/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE;

/**
 * Get the JWT token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

/**
 * Get authorization headers with JWT token
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function getItems() {
  const res = await fetch(`${API_BASE}/items/`);
  if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
  return res.json();
}

export async function getComplaint(complaintId: string) {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to fetch complaint: ${res.status}`);
  }
  return res.json() as Promise<{
    id: string;
    title: string;
    description: string;
    category?: string | null;
    submitted_by?: string | null;
    location?: any;
    transaction_hash?: string | null;
    status: ComplaintStatus | string;
    assigned_officer_id?: string | null;
    created_at: string;
  }>;
}

export async function getAlert(alertId: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to fetch alert: ${res.status}`);
  }
  return res.json() as Promise<{
    id: string;
    mine_name: string;
    district?: string | null;
    description?: string | null;
    location?: any;
    coordinates?: any;
    severity: string;
    status: string;
    created_at: string;
    due_date?: string | null;
    assigned_officer_id?: string | null;

    latitude?: number | null;
    longitude?: number | null;
    lease_id?: string | null;
    legal_ha?: number | null;
    illegal_ha?: number | null;
    analysis_run_id?: string | null;
  }>;
}

export async function updateAlertStatus(alertId: string, status: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to update alert status: ${res.status}`);
  }
  return res.json();
}

export async function getLatestAnalysis() {
  const res = await fetch(`${API_BASE}/analysis/latest`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch latest analysis: ${res.status}`);
  }
  return res.json();
}

export async function getOfficerOverview() {
  const res = await fetch(`${API_BASE}/officer/overview`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch officer overview: ${res.status}`);
  }
  return res.json();
}

export async function getAdminAnalytics() {
  const res = await fetch(`${API_BASE}/admin/analytics`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
  return res.json() as Promise<{
    total_analyses: number;
    legal_mining_area: number;
    illegal_mining_area: number;
    compliance_rate: number;
    alerts_generated: number;
    reports_generated: number;
    active_monitoring: number;
    officers_count: number;
    complaints_count: number;
    monthly_trends: Array<{ month: string; analyses: number; alerts: number; reports: number }>;
    recent_alerts: Array<{ id: string; location: string; type: string; severity: string; time: string }>;
  }>;
}

export async function getAdminActivity() {
  const res = await fetch(`${API_BASE}/admin/activity`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch activity: ${res.status}`);
  return res.json() as Promise<
    Array<{
      id: string;
      actor_email?: string | null;
      action: string;
      entity_type?: string | null;
      entity_id?: string | null;
      status?: string | null;
      created_at: string;
      details?: any;
    }>
  >;
}

export async function getOfficers() {
  const res = await fetch(`${API_BASE}/admin/officers`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch officers: ${res.status}`);
  return res.json() as Promise<
    Array<{
      id: string;
      email: string;
      full_name?: string | null;
      phone?: string | null;
      location?: string | null;
      is_active: boolean;
      created_at: string;
    }>
  >;
}

export async function createOfficer(payload: {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  location?: string;
}) {
  const res = await fetch(`${API_BASE}/admin/officers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to create officer: ${res.status}`);
  }
  return res.json();
}

export async function updateOfficer(
  officerId: string,
  payload: { full_name?: string; phone?: string; location?: string; is_active?: boolean },
) {
  const res = await fetch(`${API_BASE}/admin/officers/${officerId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to update officer: ${res.status}`);
  }
  return res.json();
}

export async function deactivateOfficer(officerId: string) {
  const res = await fetch(`${API_BASE}/admin/officers/${officerId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to deactivate officer: ${res.status}`);
  }
  return res.json();
}

export async function getAlerts() {
  const res = await fetch(`${API_BASE}/alerts`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);
  return res.json() as Promise<
    Array<{
      id: string;
      mine_name: string;
      district?: string | null;
      description?: string | null;
      location?: any;
      coordinates?: any;
      severity: string;
      status: string;
      created_at: string;
      due_date?: string | null;
      assigned_officer_id?: string | null;

      latitude?: number | null;
      longitude?: number | null;
      lease_id?: string | null;
      legal_ha?: number | null;
      illegal_ha?: number | null;
      analysis_run_id?: string | null;
    }>
  >;
}

export async function createAlert(payload: {
  mine_name: string;
  district?: string;
  description?: string;
  severity?: string;
  status?: string;
  due_date?: string;
}) {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to create alert: ${res.status}`);
  }
  return res.json();
}

export async function assignAlert(alertId: string, officerId: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/assign`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ officer_id: officerId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to assign alert: ${res.status}`);
  }
  return res.json();
}

export async function getZones() {
  const res = await fetch(`${API_BASE}/zones`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch zones: ${res.status}`);
  return res.json() as Promise<
    Array<{
      id: string;
      name: string;
      district?: string | null;
      state?: string | null;
      area_km2?: number | null;
      risk_level?: string | null;
      status?: string | null;
      last_scan_at?: string | null;
    }>
  >;
}

export type ComplaintStatus = "submitted" | "under_review" | "in_progress" | "resolved" | "rejected";

export async function getOfficerComplaintInbox() {
  const res = await fetch(`${API_BASE}/complaints/inbox`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch complaints inbox: ${res.status}`);
  return res.json() as Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      category?: string | null;
      submitted_by?: string | null;
      location?: any;
      transaction_hash?: string | null;
      status: ComplaintStatus | string;
      assigned_officer_id?: string | null;
      created_at: string;
    }>
  >;
}

export async function claimComplaint(complaintId: string) {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}/claim`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to claim complaint: ${res.status}`);
  }
  return res.json();
}

export async function updateComplaint(
  complaintId: string,
  payload: { status?: ComplaintStatus; resolution_notes?: string },
) {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to update complaint: ${res.status}`);
  }
  return res.json();
}

export async function createZone(payload: {
  name: string;
  district?: string;
  state?: string;
  area_km2?: number;
  risk_level?: string;
  status?: string;
}) {
  const res = await fetch(`${API_BASE}/zones`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.detail ?? `Failed to create zone: ${res.status}`);
  }
  return res.json();
}

export async function deleteZone(zoneId: string) {
  const res = await fetch(`${API_BASE}/zones/${zoneId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to delete zone: ${res.status}`)
  return res.json()
}

export async function updateZone(
  zoneId: string,
  payload: {
    name?: string
    district?: string
    state?: string
    area_km2?: number
    risk_level?: string
    status?: string
    last_scan_at?: string
    geometry?: any
  },
) {
  const res = await fetch(`${API_BASE}/zones/${zoneId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any)?.detail ?? `Failed to update zone: ${res.status}`)
  }
  return res.json()
}

export async function getReports() {
  const res = await fetch(`${API_BASE}/reports`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`)
  return res.json() as Promise<
    Array<{
      id: string
      title: string
      description?: string | null
      report_type: string
      status: string
      created_at: string
      created_by_user_id?: string | null
    }>
  >
}
export async function createReport(payload: {
  title: string
  description?: string
  report_type?: string
  status?: string
  related_alert_id?: string
  file_urls?: any
}) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any)?.detail ?? `Failed to create report: ${res.status}`)
  }
  return res.json()
}
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any)?.message ?? (res.status === 401 ? "Invalid credentials" : `Login failed: ${res.status}`));
  }
  return res.json() as Promise<{ username: string; full_name: string; role: "admin" | "officer"; access_token: string; token_type: string }>;
}

export async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ email: string; full_name: string; role: string; is_active: boolean }>;
}