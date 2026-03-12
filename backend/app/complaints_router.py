from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .deps import get_current_user, require_admin, require_officer
from .models import ActivityLog, Complaint, ComplaintStatus, User


router = APIRouter(prefix="/api/complaints", tags=["complaints"])


class ComplaintCreateRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    contact_info: Optional[Dict[str, Any]] = None
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    submitted_by: Optional[str] = None


class ComplaintUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    is_verified: Optional[bool] = None
    verification_notes: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = None
    submitted_by: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    transaction_hash: Optional[str] = None
    status: str
    assigned_officer_id: Optional[str] = None
    created_at: datetime


def _complaint_to_response(c: Complaint) -> ComplaintResponse:
    return ComplaintResponse(
        id=c.id,
        title=c.title,
        description=c.description,
        category=c.category,
        submitted_by=getattr(c, "submitted_by", None),
        location=getattr(c, "location", None),
        transaction_hash=getattr(c, "transaction_hash", None),
        status=c.status.value if hasattr(c.status, "value") else str(c.status),
        assigned_officer_id=c.assigned_officer_id,
        created_at=c.created_at,
    )


@router.post("", response_model=ComplaintResponse)
async def create_complaint(
    payload: ComplaintCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplaintResponse:
    submitted_by = current_user.email
    if payload.submitted_by is not None:
        # Only admin (e.g., mobile proxy service token) can override submitter
        if getattr(current_user, "role", None) and getattr(current_user.role, "value", None) != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        submitted_by = payload.submitted_by

    complaint = Complaint(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        contact_info=payload.contact_info,
        transaction_hash=payload.transaction_hash,
        block_number=payload.block_number,
        submitted_by=submitted_by,
    )

    db.add(complaint)
    await db.flush()

    db.add(
        ActivityLog(
            actor_email=current_user.email,
            actor_user_id=current_user.id,
            action="complaint_submitted",
            entity_type="complaint",
            entity_id=str(complaint.id),
            status="success",
            details={"category": payload.category},
        )
    )

    await db.commit()
    await db.refresh(complaint)
    return _complaint_to_response(complaint)


@router.post("/{complaint_id}/claim", response_model=ComplaintResponse)
async def claim_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    officer: User = Depends(require_officer),
) -> ComplaintResponse:
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.assigned_officer_id is not None and complaint.assigned_officer_id != officer.id:
        raise HTTPException(status_code=403, detail="Complaint already assigned")

    complaint.assigned_officer_id = officer.id
    if complaint.status == ComplaintStatus.SUBMITTED:
        complaint.status = ComplaintStatus.IN_PROGRESS

    db.add(
        ActivityLog(
            actor_email=officer.email,
            actor_user_id=officer.id,
            action="complaint_claimed",
            entity_type="complaint",
            entity_id=str(complaint.id),
            status="success",
            details={"assigned_officer_id": officer.id},
        )
    )

    await db.commit()
    await db.refresh(complaint)
    return _complaint_to_response(complaint)


@router.get("", response_model=List[ComplaintResponse])
async def list_complaints_admin(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> List[ComplaintResponse]:
    result = await db.execute(select(Complaint).order_by(Complaint.created_at.desc()))
    complaints = result.scalars().all()
    return [_complaint_to_response(c) for c in complaints]


@router.get("/inbox", response_model=List[ComplaintResponse])
async def list_officer_inbox(
    db: AsyncSession = Depends(get_db),
    officer: User = Depends(require_officer),
) -> List[ComplaintResponse]:
    # Officers can see unassigned complaints (to claim) plus those assigned to them.
    result = await db.execute(
        select(Complaint)
        .where((Complaint.assigned_officer_id.is_(None)) | (Complaint.assigned_officer_id == officer.id))
        .order_by(Complaint.created_at.desc())
    )
    complaints = result.scalars().all()
    return [_complaint_to_response(c) for c in complaints]


@router.get("/by-submitter", response_model=List[ComplaintResponse])
async def list_by_submitter(
    submitted_by: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> List[ComplaintResponse]:
    # Used by mobile proxy service token to fetch a citizen's complaints.
    result = await db.execute(select(Complaint).where(Complaint.submitted_by == submitted_by).order_by(Complaint.created_at.desc()))
    complaints = result.scalars().all()
    return [_complaint_to_response(c) for c in complaints]


@router.get("/assigned", response_model=List[ComplaintResponse])
async def list_assigned_complaints(
    db: AsyncSession = Depends(get_db),
    officer: User = Depends(require_officer),
) -> List[ComplaintResponse]:
    result = await db.execute(
        select(Complaint)
        .where(Complaint.assigned_officer_id == officer.id)
        .order_by(Complaint.created_at.desc())
    )
    complaints = result.scalars().all()
    return [_complaint_to_response(c) for c in complaints]


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplaintResponse:
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    role = getattr(getattr(current_user, "role", None), "value", None) or getattr(current_user, "role", None)
    if role == "officer":
        if complaint.assigned_officer_id is not None and complaint.assigned_officer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Complaint not assigned to you")

    return _complaint_to_response(complaint)


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: str,
    payload: ComplaintUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplaintResponse:
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role.value == "officer":
        if complaint.assigned_officer_id and complaint.assigned_officer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Complaint not assigned to you")

    if payload.status is not None:
        complaint.status = ComplaintStatus(payload.status)

    if payload.assigned_officer_id is not None:
        # Admin can assign anyone. Officer can claim ONLY themselves when currently unassigned.
        if current_user.role.value == "admin":
            complaint.assigned_officer_id = payload.assigned_officer_id
        elif current_user.role.value == "officer":
            if payload.assigned_officer_id != current_user.id:
                raise HTTPException(status_code=403, detail="Officer can only claim themselves")
            if complaint.assigned_officer_id is not None and complaint.assigned_officer_id != current_user.id:
                raise HTTPException(status_code=403, detail="Complaint already assigned")
            complaint.assigned_officer_id = current_user.id
        else:
            raise HTTPException(status_code=403, detail="Admin access required")

    if payload.resolution_notes is not None:
        complaint.resolution_notes = payload.resolution_notes

    if payload.is_verified is not None:
        complaint.is_verified = payload.is_verified

    if payload.verification_notes is not None:
        complaint.verification_notes = payload.verification_notes

    db.add(
        ActivityLog(
            actor_email=current_user.email,
            actor_user_id=current_user.id,
            action="complaint_updated",
            entity_type="complaint",
            entity_id=str(complaint.id),
            status="success",
            details={"status": payload.status},
        )
    )

    await db.commit()
    await db.refresh(complaint)
    return _complaint_to_response(complaint)
