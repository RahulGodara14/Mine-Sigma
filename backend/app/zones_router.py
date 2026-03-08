from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .deps import require_admin
from .models import ActivityLog, User
from .models.zone import Zone


router = APIRouter(prefix="/api/zones", tags=["zones"])


class ZoneCreateRequest(BaseModel):
    name: str
    district: Optional[str] = None
    state: Optional[str] = None
    area_km2: Optional[float] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    last_scan_at: Optional[datetime] = None
    geometry: Optional[Dict[str, Any]] = None


class ZoneResponse(BaseModel):
    id: str
    name: str
    district: Optional[str] = None
    state: Optional[str] = None
    area_km2: Optional[float] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    last_scan_at: Optional[datetime] = None


class ZoneUpdateRequest(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    area_km2: Optional[float] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    last_scan_at: Optional[datetime] = None
    geometry: Optional[Dict[str, Any]] = None


def _zone_to_response(z: Zone) -> ZoneResponse:
    return ZoneResponse(
        id=z.id,
        name=z.name,
        district=z.district,
        state=z.state,
        area_km2=z.area_km2,
        risk_level=z.risk_level,
        status=z.status,
        last_scan_at=z.last_scan_at,
    )


@router.get("", response_model=List[ZoneResponse])
async def list_zones(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> List[ZoneResponse]:
    result = await db.execute(select(Zone).order_by(Zone.created_at.desc()))
    zones = result.scalars().all()
    return [_zone_to_response(z) for z in zones]


@router.post("", response_model=ZoneResponse)
async def create_zone(
    payload: ZoneCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> ZoneResponse:
    zone = Zone(
        name=payload.name,
        district=payload.district,
        state=payload.state,
        area_km2=payload.area_km2,
        risk_level=payload.risk_level,
        status=payload.status,
        last_scan_at=payload.last_scan_at,
        geometry=payload.geometry,
    )

    db.add(zone)
    await db.flush()

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="zone_created",
            entity_type="zone",
            entity_id=str(zone.id),
            status="success",
            details={"name": payload.name},
        )
    )

    await db.commit()
    await db.refresh(zone)
    return _zone_to_response(zone)


@router.delete("/{zone_id}")
async def delete_zone(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalars().first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    await db.delete(zone)

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="zone_deleted",
            entity_type="zone",
            entity_id=str(zone_id),
            status="success",
            details={"name": zone.name},
        )
    )

    await db.commit()
    return {"ok": True}


@router.patch("/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    zone_id: str,
    payload: ZoneUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> ZoneResponse:
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalars().first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    for field in (
        "name",
        "district",
        "state",
        "area_km2",
        "risk_level",
        "status",
        "last_scan_at",
        "geometry",
    ):
        val = getattr(payload, field)
        if val is not None:
            setattr(zone, field, val)

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="zone_updated",
            entity_type="zone",
            entity_id=str(zone.id),
            status="success",
            details={k: v for k, v in payload.model_dump().items() if v is not None},
        )
    )

    await db.commit()
    await db.refresh(zone)
    return _zone_to_response(zone)
