from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .deps import get_current_user, require_admin
from .models import ActivityLog, User
from .models.report import Report, ReportStatus, ReportType


router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    report_type: str = "field_visit"
    status: str = "draft"
    related_alert_id: Optional[str] = None
    file_urls: Optional[Dict[str, Any]] = None


class ReportResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    report_type: str
    status: str
    created_at: datetime
    created_by_user_id: Optional[str] = None


def _report_to_response(r: Report) -> ReportResponse:
    return ReportResponse(
        id=r.id,
        title=r.title or "Untitled Report",
        description=r.description,
        report_type=r.report_type.value if hasattr(r.report_type, "value") else str(r.report_type),
        status=r.status.value if hasattr(r.status, "value") else str(r.status),
        created_at=r.created_at,
        created_by_user_id=r.created_by_user_id,
    )


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[ReportResponse]:
    result = await db.execute(select(Report).order_by(Report.created_at.desc()))
    reports = result.scalars().all()
    return [_report_to_response(r) for r in reports]


@router.post("", response_model=ReportResponse)
async def create_report(
    payload: ReportCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    report = Report(
        title=payload.title,
        description=payload.description,
        report_type=ReportType(payload.report_type),
        status=ReportStatus(payload.status),
        created_by_user_id=current_user.id,
        related_alert_id=payload.related_alert_id,
        file_urls=payload.file_urls,
    )

    db.add(report)
    await db.flush()

    db.add(
        ActivityLog(
            actor_email=current_user.email,
            actor_user_id=current_user.id,
            action="report_created",
            entity_type="report",
            entity_id=str(report.id),
            status="success",
            details={"title": payload.title},
        )
    )

    await db.commit()
    await db.refresh(report)
    return _report_to_response(report)


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    await db.delete(report)

    db.add(
        ActivityLog(
            actor_email=admin.email,
            actor_user_id=admin.id,
            action="report_deleted",
            entity_type="report",
            entity_id=str(report_id),
            status="success",
            details={"title": report.title},
        )
    )

    await db.commit()
    return {"ok": True}
