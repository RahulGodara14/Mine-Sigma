from datetime import datetime
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .deps import require_admin
from .models import ActivityLog, Alert, AnalysisRun, Complaint, Report, User, UserRole, Zone
from .security import hash_password


router = APIRouter(prefix="/api/admin", tags=["admin"])


class OfficerCreateRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


class OfficerResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    is_active: bool
    created_at: datetime


class OfficerUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None


class ActivityResponse(BaseModel):
    id: str
    actor_email: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    details: Optional[Dict[str, Any]] = None


class AnalyticsResponse(BaseModel):
    total_analyses: int
    legal_mining_area: float
    illegal_mining_area: float
    compliance_rate: float
    alerts_generated: int
    reports_generated: int
    active_monitoring: int
    officers_count: int
    complaints_count: int
    monthly_trends: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]


def _officer_to_response(u: User) -> OfficerResponse:
    return OfficerResponse(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        phone=getattr(u, "phone", None),
        location=getattr(u, "location", None),
        is_active=u.is_active,
        created_at=u.created_at,
    )


def _coerce_details(raw: Any) -> Optional[Dict[str, Any]]:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        text_val = raw.strip()
        if not text_val:
            return None
        try:
            parsed = json.loads(text_val)
            return parsed if isinstance(parsed, dict) else {"value": parsed}
        except Exception:
            return {"raw": raw}
    return {"raw": str(raw)}


def _safe_float(val: Any) -> Optional[float]:
    try:
        if val is None:
            return None
        if isinstance(val, bool):
            return None
        return float(val)
    except Exception:
        return None


def _extract_area_ha(result: Any, keys: List[str]) -> float:
    if not isinstance(result, dict):
        return 0.0

    def _check(d: Dict[str, Any]) -> Optional[float]:
        for k in keys:
            if k not in d:
                continue
            raw = _safe_float(d.get(k))
            if raw is None:
                continue
            lk = k.lower()
            if "km" in lk:
                return float(raw) * 100.0
            return float(raw)
        return None

    top = _check(result)
    if top is not None:
        return top

    stats = result.get("stats")
    if isinstance(stats, dict):
        nested = _check(stats)
        if nested is not None:
            return nested

    return 0.0


@router.get("/officers", response_model=List[OfficerResponse])
async def list_officers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> List[OfficerResponse]:
    result = await db.execute(select(User).where(User.role == UserRole.OFFICER).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [_officer_to_response(u) for u in users]


@router.post("/officers", response_model=OfficerResponse)
async def create_officer(
    payload: OfficerCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> OfficerResponse:
    hashed = hash_password(payload.password)
    user = User(
        email=payload.email,
        hashed_password=hashed,
        full_name=payload.full_name,
        role=UserRole.OFFICER,
        is_active=True,
    )

    if hasattr(user, "phone"):
        setattr(user, "phone", payload.phone)
    if hasattr(user, "location"):
        setattr(user, "location", payload.location)

    db.add(user)
    await db.flush()

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="officer_created",
            entity_type="user",
            entity_id=str(user.id),
            status="success",
            details={"email": payload.email},
        )
    )

    await db.commit()
    await db.refresh(user)
    return _officer_to_response(user)


@router.patch("/officers/{officer_id}", response_model=OfficerResponse)
async def update_officer(
    officer_id: str,
    payload: OfficerUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> OfficerResponse:
    result = await db.execute(select(User).where(User.id == officer_id))
    user = result.scalars().first()
    if not user or user.role != UserRole.OFFICER:
        raise HTTPException(status_code=404, detail="Officer not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if hasattr(user, "phone") and payload.phone is not None:
        setattr(user, "phone", payload.phone)
    if hasattr(user, "location") and payload.location is not None:
        setattr(user, "location", payload.location)
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="officer_updated",
            entity_type="user",
            entity_id=str(user.id),
            status="success",
            details={"email": user.email},
        )
    )

    await db.commit()
    await db.refresh(user)
    return _officer_to_response(user)


@router.delete("/officers/{officer_id}")
async def deactivate_officer(
    officer_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == officer_id))
    user = result.scalars().first()
    if not user or user.role != UserRole.OFFICER:
        raise HTTPException(status_code=404, detail="Officer not found")

    user.is_active = False

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="officer_deactivated",
            entity_type="user",
            entity_id=str(user.id),
            status="success",
            details={"email": user.email},
        )
    )

    await db.commit()
    return {"ok": True}


@router.get("/activity", response_model=List[ActivityResponse])
async def get_activity(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> List[ActivityResponse]:
    result = await db.execute(select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(200))
    items = result.scalars().all()
    return [
        ActivityResponse(
            id=i.id,
            actor_email=i.actor_email,
            action=i.action,
            entity_type=i.entity_type,
            entity_id=i.entity_id,
            status=i.status,
            created_at=i.created_at,
            details=_coerce_details(i.details),
        )
        for i in items
    ]


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> AnalyticsResponse:
    total_analyses = (await db.execute(select(func.count(AnalysisRun.id)))).scalar_one()
    alerts_generated = (await db.execute(select(func.count(Alert.id)))).scalar_one()
    reports_generated = (await db.execute(select(func.count(Report.id)))).scalar_one()
    active_monitoring = (await db.execute(select(func.count(Zone.id)))).scalar_one()
    complaints_count = (await db.execute(select(func.count(Complaint.id)))).scalar_one()
    officers_count = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.OFFICER))).scalar_one()

    # --- Option B: compute areas + compliance ---
    zones_rows = await db.execute(select(Zone))
    zones = zones_rows.scalars().all()
    # area_km2 stored on zones; convert to hectares
    legal_mining_area_ha = sum(float(z.area_km2 or 0.0) * 100.0 for z in zones)

    # Try to infer illegal/legal area from analysis results when present
    analysis_rows_for_area = await db.execute(select(AnalysisRun).order_by(AnalysisRun.created_at.desc()).limit(200))
    recent_runs = analysis_rows_for_area.scalars().all()
    illegal_mining_area_ha = 0.0
    inferred_legal_from_runs_ha = 0.0
    for run in recent_runs:
        res = getattr(run, "result", None)
        illegal_mining_area_ha += _extract_area_ha(
            res,
            [
                "illegal_mining_area_ha",
                "illegal_area_ha",
                "illegal_ha",
                "illegal_area",
                "illegal_mining_area_km2",
                "illegal_area_km2",
                "encroachment_area_ha",
                "encroachment_area_km2",
            ],
        )
        inferred_legal_from_runs_ha += _extract_area_ha(
            res,
            [
                "legal_mining_area_ha",
                "legal_area_ha",
                "legal_ha",
                "legal_area",
                "legal_mining_area_km2",
                "legal_area_km2",
            ],
        )

    # Prefer zone area for legal area when available; otherwise fall back to inferred.
    legal_area_final_ha = legal_mining_area_ha if legal_mining_area_ha > 0 else inferred_legal_from_runs_ha
    denom = legal_area_final_ha + illegal_mining_area_ha
    compliance_rate = (legal_area_final_ha / denom * 100.0) if denom > 0 else 0.0

    # --- Monthly trends (analyses + alerts + reports) ---
    month_expr_analysis = func.date_trunc("month", AnalysisRun.created_at)
    month_expr_alerts = func.date_trunc("month", Alert.created_at)
    month_expr_reports = func.date_trunc("month", Report.created_at)

    analysis_trend_rows = await db.execute(
        select(month_expr_analysis.label("month"), func.count(AnalysisRun.id))
        .group_by(month_expr_analysis)
        .order_by(month_expr_analysis.desc())
        .limit(6)
    )
    alerts_trend_rows = await db.execute(
        select(month_expr_alerts.label("month"), func.count(Alert.id))
        .group_by(month_expr_alerts)
        .order_by(month_expr_alerts.desc())
        .limit(6)
    )
    reports_trend_rows = await db.execute(
        select(month_expr_reports.label("month"), func.count(Report.id))
        .group_by(month_expr_reports)
        .order_by(month_expr_reports.desc())
        .limit(6)
    )

    by_month: Dict[str, Dict[str, Any]] = {}
    for month_dt, count in analysis_trend_rows.all():
        key = month_dt.isoformat() if month_dt else ""
        by_month[key] = {"month_dt": month_dt, "analyses": int(count or 0), "alerts": 0, "reports": 0}
    for month_dt, count in alerts_trend_rows.all():
        key = month_dt.isoformat() if month_dt else ""
        by_month.setdefault(key, {"month_dt": month_dt, "analyses": 0, "alerts": 0, "reports": 0})
        by_month[key]["alerts"] = int(count or 0)
    for month_dt, count in reports_trend_rows.all():
        key = month_dt.isoformat() if month_dt else ""
        by_month.setdefault(key, {"month_dt": month_dt, "analyses": 0, "alerts": 0, "reports": 0})
        by_month[key]["reports"] = int(count or 0)

    # sort ascending by month
    month_items = sorted(
        [v for v in by_month.values() if v.get("month_dt")],
        key=lambda x: x["month_dt"],
    )
    monthly_trends = []
    for v in month_items[-6:]:
        month_dt = v.get("month_dt")
        label = month_dt.strftime("%b") if month_dt else ""
        monthly_trends.append(
            {
                "month": label,
                "analyses": int(v.get("analyses") or 0),
                "alerts": int(v.get("alerts") or 0),
                "reports": int(v.get("reports") or 0),
            }
        )

    recent_alert_rows = await db.execute(select(Alert).order_by(Alert.created_at.desc()).limit(10))
    recent_alerts = []
    for a in recent_alert_rows.scalars().all():
        extra = a.extra_data or {}
        district = extra.get("district")
        lat = extra.get("latitude")
        lon = extra.get("longitude")
        location_text = None
        if district:
            location_text = str(district)
        elif lat is not None and lon is not None:
            location_text = f"{lat}, {lon}"
        else:
            location_text = extra.get("mine_name") or a.title

        recent_alerts.append(
            {
                "id": str(a.id),
                "location": location_text,
                "type": extra.get("type") or a.status.value,
                "severity": a.severity.value,
                "time": a.created_at.isoformat(),
            }
        )

    return AnalyticsResponse(
        total_analyses=int(total_analyses or 0),
        legal_mining_area=float(legal_area_final_ha or 0.0),
        illegal_mining_area=float(illegal_mining_area_ha or 0.0),
        compliance_rate=float(compliance_rate or 0.0),
        alerts_generated=int(alerts_generated or 0),
        reports_generated=int(reports_generated or 0),
        active_monitoring=int(active_monitoring or 0),
        officers_count=int(officers_count or 0),
        complaints_count=int(complaints_count or 0),
        monthly_trends=monthly_trends,
        recent_alerts=recent_alerts,
    )
