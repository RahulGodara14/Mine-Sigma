from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .deps import get_current_user, require_admin, require_officer
from .models import Alert, AlertSeverity, AlertStatus, ActivityLog, User


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertCreateRequest(BaseModel):
    mine_name: str
    district: Optional[str] = None
    description: Optional[str] = None
    severity: str = "medium"
    status: str = "open"
    due_date: Optional[datetime] = None
    location: Optional[Dict[str, Any]] = None
    coordinates: Optional[Dict[str, Any]] = None


class AlertAssignRequest(BaseModel):
    officer_id: str


class AlertUpdateStatusRequest(BaseModel):
    status: str


class AlertResponse(BaseModel):
    id: str
    mine_name: str
    district: Optional[str] = None
    description: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    coordinates: Optional[Dict[str, Any]] = None
    severity: str
    status: str
    created_at: datetime
    due_date: Optional[datetime] = None
    assigned_officer_id: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lease_id: Optional[str] = None
    legal_ha: Optional[float] = None
    illegal_ha: Optional[float] = None
    analysis_run_id: Optional[str] = None


def _alert_to_response(a: Alert) -> AlertResponse:
    extra = a.extra_data or {}

    lat = extra.get("latitude")
    lon = extra.get("longitude")
    if lat is None and isinstance(a.coordinates, dict):
        lat = a.coordinates.get("lat") or a.coordinates.get("latitude")
    if lon is None and isinstance(a.coordinates, dict):
        lon = a.coordinates.get("lon") or a.coordinates.get("longitude")

    return AlertResponse(
        id=a.id,
        mine_name=extra.get("mine_name") or a.title,
        district=extra.get("district"),
        description=a.description,
        location=a.location,
        coordinates=a.coordinates,
        severity=a.severity.value if hasattr(a.severity, "value") else str(a.severity),
        status=a.status.value if hasattr(a.status, "value") else str(a.status),
        created_at=a.created_at,
        due_date=a.due_date,
        assigned_officer_id=a.assigned_officer_id,
        latitude=lat,
        longitude=lon,
        lease_id=extra.get("lease_id"),
        legal_ha=extra.get("legal_ha"),
        illegal_ha=extra.get("illegal_ha"),
        analysis_run_id=extra.get("analysis_run_id"),
    )


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> List[AlertResponse]:
    result = await db.execute(select(Alert).order_by(Alert.created_at.desc()))
    alerts = result.scalars().all()
    return [_alert_to_response(a) for a in alerts]


@router.post("", response_model=AlertResponse)
async def create_alert(
    payload: AlertCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> AlertResponse:
    extra = {
        "mine_name": payload.mine_name,
        "district": payload.district,
    }

    alert = Alert(
        title=payload.mine_name,
        description=payload.description,
        severity=AlertSeverity(payload.severity),
        status=AlertStatus(payload.status),
        due_date=payload.due_date,
        location=payload.location,
        coordinates=payload.coordinates,
        extra_data=extra,
    )

    db.add(alert)
    await db.flush()

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="alert_created",
            entity_type="alert",
            entity_id=str(alert.id),
            status="success",
            details={"mine_name": payload.mine_name},
        )
    )

    await db.commit()
    await db.refresh(alert)
    return _alert_to_response(alert)


@router.post("/{alert_id}/assign", response_model=AlertResponse)
async def assign_alert(
    alert_id: str,
    payload: AlertAssignRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> AlertResponse:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.assigned_officer_id = payload.officer_id

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="alert_assigned",
            entity_type="alert",
            entity_id=str(alert.id),
            status="success",
            details={"officer_id": payload.officer_id},
        )
    )

    await db.commit()
    await db.refresh(alert)
    return _alert_to_response(alert)


@router.get("/assigned", response_model=List[AlertResponse])
async def my_assigned_alerts(
    db: AsyncSession = Depends(get_db),
    officer: User = Depends(require_officer),
) -> List[AlertResponse]:
    result = await db.execute(
        select(Alert)
        .where(Alert.assigned_officer_id == officer.id)
        .order_by(Alert.due_date.asc().nulls_last(), Alert.created_at.desc())
    )
    alerts = result.scalars().all()
    return [_alert_to_response(a) for a in alerts]


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertResponse:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    role = getattr(getattr(current_user, "role", None), "value", None) or getattr(current_user, "role", None)
    if role == "officer":
        if alert.assigned_officer_id and alert.assigned_officer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Alert not assigned to you")

    return _alert_to_response(alert)


@router.post("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(
    alert_id: str,
    payload: AlertUpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertResponse:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    role = getattr(getattr(current_user, "role", None), "value", None) or getattr(current_user, "role", None)
    if role == "officer":
        if alert.assigned_officer_id and alert.assigned_officer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Alert not assigned to you")
    elif role == "admin":
        # Admin can update any alert
        pass
    else:
        raise HTTPException(status_code=403, detail="Admin or Officer access required")

    alert.status = AlertStatus(payload.status)

    if alert.status in (AlertStatus.RESOLVED, AlertStatus.REJECTED):
        alert.resolved_at = datetime.now(timezone.utc)

    db.add(
        ActivityLog(
            actor_email=current_user.email,
            actor_user_id=current_user.id,
            action="alert_status_updated",
            entity_type="alert",
            entity_id=str(alert.id),
            status="success",
            details={"new_status": payload.status},
        )
    )

    await db.commit()
    await db.refresh(alert)
    return _alert_to_response(alert)
