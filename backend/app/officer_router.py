from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import (
    OfficerAssignedAlert,
    OfficerSiteVisit,
    OfficerAaiFlag,
    CitizenComplaint,
    OfficerOverviewResponse,
)
from .database import get_db
from .deps import require_officer
from .models import Alert, Complaint, User

router = APIRouter(prefix="/api/officer", tags=["officer"])


@router.get("/overview", response_model=OfficerOverviewResponse)
async def get_officer_overview(
    db: AsyncSession = Depends(get_db),
    officer: User = Depends(require_officer),
) -> OfficerOverviewResponse:
    alert_result = await db.execute(
        select(Alert)
        .where(Alert.assigned_officer_id == officer.id)
        .order_by(Alert.created_at.desc())
        .limit(25)
    )
    alerts = alert_result.scalars().all()

    assigned_alerts = []
    for a in alerts:
        extra = a.extra_data or {}
        mine_name = extra.get("mine_name") or a.title
        district = extra.get("district") or ""
        due_in_hours = 0
        if a.due_date:
            now = datetime.now(a.due_date.tzinfo) if a.due_date.tzinfo else datetime.now(timezone.utc)
            due_date = a.due_date
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
            delta = due_date - now
            due_in_hours = max(0, int(delta.total_seconds() // 3600))

        assigned_alerts.append(
            OfficerAssignedAlert(
                id=str(a.id),
                mine_name=mine_name,
                district=district,
                severity=(a.severity.value if hasattr(a.severity, "value") else str(a.severity)),
                status=(a.status.value if hasattr(a.status, "value") else str(a.status)),
                due_in_hours=due_in_hours,
            )
        )

    complaint_result = await db.execute(
        select(Complaint)
        .where((Complaint.assigned_officer_id.is_(None)) | (Complaint.assigned_officer_id == officer.id))
        .order_by(Complaint.created_at.desc())
        .limit(25)
    )
    complaints = complaint_result.scalars().all()

    citizen_complaints = []
    for c in complaints:
        loc = ""
        if isinstance(c.location, dict):
            loc = c.location.get("name") or c.location.get("address") or ""
        citizen_complaints.append(
            CitizenComplaint(
                id=str(c.id),
                category=c.category or "",
                location=loc,
                submitted_at=c.created_at.isoformat(),
                status=(c.status.value if hasattr(c.status, "value") else str(c.status)),
            )
        )

    return OfficerOverviewResponse(
        assigned_alerts=assigned_alerts,
        pending_site_visits=[],
        recent_aai_flags=[],
        citizen_complaints=citizen_complaints,
    )
