from fastapi import FastAPI, Depends, HTTPException, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import User, Report, ReportSeverity, ReportStatus
from schemas import (
    SignupRequest, LoginRequest, TokenResponse,
    ReportCreateRequest, ReportListResponse,
    NonceResponse, ProfileResponse, HealthResponse
)
from security import verify_token
from auth_service import auth_service
from report_service import report_service
from blockchain_service import blockchain_service
from ipfs_service import ipfs_service
from config import settings
from datetime import datetime
from typing import Optional
from sqlalchemy import text
import httpx
import time

# Create tables
Base.metadata.create_all(bind=engine)

# Create app
app = FastAPI(
    title="MineGuard Backend API",
    description="Blockchain-based citizen reporting system",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Dependencies ====================

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        # Extract token from "Bearer <token>"
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError("Invalid authorization header format")
        
        token = parts[1]
        payload = verify_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


# ==================== Core Backend Proxy (Complaints) ====================

_core_token_cache: dict = {"token": None, "expires_at": 0.0}


async def _get_core_admin_token() -> str:
    now = time.time()
    token = _core_token_cache.get("token")
    expires_at = float(_core_token_cache.get("expires_at") or 0.0)
    if token and expires_at > now + 30:
        return token

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            f"{settings.core_backend_api_base}/auth/login",
            json={"username": settings.core_backend_admin_email, "password": settings.core_backend_admin_password},
        )
        resp.raise_for_status()
        data = resp.json()
        token = data.get("access_token")
        if not token:
            raise HTTPException(status_code=500, detail="Core backend login failed")
        _core_token_cache["token"] = token
        _core_token_cache["expires_at"] = now + 7 * 60 * 60
        return token


async def _mirror_report_to_core_complaint(current_user: User, report: Report, loc: dict) -> Optional[str]:
    """Create a complaint in the core Mine-Sigma backend representing this citizen report.

    This makes citizen reports visible in the officer portal complaints inbox.
    Best-effort: returns complaint_id if created, else None.
    """
    try:
        token = await _get_core_admin_token()
        title = f"{(report.category or 'report').replace('_', ' ').title()} Report"
        body = {
            "title": title,
            "description": report.description,
            "category": report.category,
            "location": loc or {"latitude": report.latitude, "longitude": report.longitude, "address": report.address},
            "transaction_hash": report.transaction_hash,
            "block_number": None,
            "submitted_by": current_user.email,
            "contact_info": {
                "source": "mineguard_report",
                "mineguard_report_id": report.id,
                "ipfs_hash": report.ipfs_hash,
                "wallet": current_user.wallet_address,
            },
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{settings.core_backend_api_base}/complaints",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
            )
            if resp.status_code >= 400:
                print("[mirror_report_to_core] failed:", resp.status_code, resp.text)
                return None
            data = resp.json()
            return data.get("id")
    except Exception as e:
        print(f"[mirror_report_to_core] error: {e}")
        return None


def _map_core_complaint_status_to_report_status(core_status: Optional[str]) -> Optional[str]:
    if not core_status:
        return None
    v = str(core_status).lower()
    if v == "submitted":
        return "pending"
    if v in ("under_review", "in_progress"):
        return "under_review"
    if v == "resolved":
        return "approved"
    if v == "rejected":
        return "rejected"
    return None


async def _get_core_complaints_for_submitter(submitted_by: str) -> list:
    """Fetch citizen complaints from the core backend (admin proxy). Best-effort."""
    try:
        token = await _get_core_admin_token()
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(
                f"{settings.core_backend_api_base}/complaints/by-submitter",
                headers={"Authorization": f"Bearer {token}"},
                params={"submitted_by": submitted_by},
            )
            if resp.status_code >= 400:
                print("[core_complaints_for_submitter] failed:", resp.status_code, resp.text)
                return []
            data = resp.json()
            return data if isinstance(data, list) else []
    except Exception as e:
        print(f"[core_complaints_for_submitter] error: {e}")
        return []


def _merge_core_complaint_status_into_reports(reports: list, core_complaints: list) -> list:
    by_tx = {}
    for c in core_complaints:
        if not isinstance(c, dict):
            continue
        tx = c.get("transaction_hash")
        if tx:
            by_tx[str(tx)] = c

    merged = []
    for r in reports:
        if not isinstance(r, dict):
            merged.append(r)
            continue

        tx = r.get("transactionHash") or r.get("transaction_hash")
        c = by_tx.get(str(tx)) if tx else None
        if c:
            core_status = c.get("status")
            mapped = _map_core_complaint_status_to_report_status(core_status)
            if mapped:
                r["status"] = mapped
            r["coreComplaintId"] = c.get("id")
            r["coreComplaintStatus"] = core_status
            r["coreAssignedOfficerId"] = c.get("assigned_officer_id")
        merged.append(r)

    return merged


async def _get_core_officer_id_by_email(officer_email: str) -> Optional[str]:
    try:
        if not officer_email:
            return None
        token = await _get_core_admin_token()
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(
                f"{settings.core_backend_api_base}/admin/officers",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code >= 400:
                print("[core_officer_lookup] failed:", resp.status_code, resp.text)
                return None
            officers = resp.json()
            if not isinstance(officers, list):
                return None
            for o in officers:
                if isinstance(o, dict) and str(o.get("email") or "").lower() == str(officer_email).lower():
                    oid = o.get("id")
                    return str(oid) if oid else None
        return None
    except Exception as e:
        print(f"[core_officer_lookup] error: {e}")
        return None


async def _get_core_alerts_assigned_to_officer(officer_id: str) -> list:
    """Fetch all alerts from core backend (admin) and filter by assigned officer id."""
    try:
        if not officer_id:
            return []
        token = await _get_core_admin_token()
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(
                f"{settings.core_backend_api_base}/alerts",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code >= 400:
                print("[core_alerts_list] failed:", resp.status_code, resp.text)
                return []
            alerts = resp.json()
            if not isinstance(alerts, list):
                return []
            return [a for a in alerts if isinstance(a, dict) and str(a.get("assigned_officer_id") or "") == str(officer_id)]
    except Exception as e:
        print(f"[core_alerts_list] error: {e}")
        return []


@app.get("/tasks/assigned")
async def proxy_list_assigned_tasks(
    officer_email: str,
    current_user: User = Depends(get_current_user),
):
    """List core backend tasks (alerts) assigned to an officer.

    Mine-Guard only supports citizen/admin roles; this endpoint is intended for a Mine-Guard admin UI
    (or future officer app) and uses core backend admin token.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    officer_id = await _get_core_officer_id_by_email(officer_email)
    if not officer_id:
        raise HTTPException(status_code=404, detail="Officer not found")

    return await _get_core_alerts_assigned_to_officer(officer_id)


@app.post("/tasks/{alert_id}/status")
async def proxy_update_task_status(
    alert_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """Update core backend task status for an alert (admin proxy).

    Requires officer_email in payload to verify assignment before updating.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    status_val = payload.get("status")
    officer_email = payload.get("officer_email") or payload.get("officerEmail")
    if not status_val:
        raise HTTPException(status_code=400, detail="status required")
    if not officer_email:
        raise HTTPException(status_code=400, detail="officer_email required")

    officer_id = await _get_core_officer_id_by_email(str(officer_email))
    if not officer_id:
        raise HTTPException(status_code=404, detail="Officer not found")

    token = await _get_core_admin_token()
    async with httpx.AsyncClient(timeout=20.0) as client:
        # Verify assignment
        detail = await client.get(
            f"{settings.core_backend_api_base}/alerts/{alert_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if detail.status_code >= 400:
            raise HTTPException(status_code=detail.status_code, detail=detail.text)
        alert = detail.json() if isinstance(detail.json(), dict) else {}
        assigned = str(alert.get("assigned_officer_id") or "")
        if assigned and assigned != str(officer_id):
            raise HTTPException(status_code=403, detail="Alert not assigned to this officer")
        if not assigned:
            raise HTTPException(status_code=403, detail="Alert is not assigned")

        resp = await client.post(
            f"{settings.core_backend_api_base}/alerts/{alert_id}/status",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": status_val},
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


@app.post("/complaints")
async def proxy_create_complaint(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """Citizen creates a complaint in shared core DB via admin proxy."""
    token = await _get_core_admin_token()
    body = {
        "title": payload.get("title"),
        "description": payload.get("description"),
        "category": payload.get("category"),
        "location": payload.get("location"),
        "contact_info": payload.get("contact_info"),
        "transaction_hash": payload.get("transaction_hash"),
        "block_number": payload.get("block_number"),
        "submitted_by": current_user.email,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            f"{settings.core_backend_api_base}/complaints",
            headers={"Authorization": f"Bearer {token}"},
            json=body,
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


@app.get("/complaints/my")
async def proxy_list_my_complaints(
    current_user: User = Depends(get_current_user),
):
    """Citizen lists their complaints from shared core DB via admin proxy."""
    token = await _get_core_admin_token()
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            f"{settings.core_backend_api_base}/complaints/by-submitter",
            headers={"Authorization": f"Bearer {token}"},
            params={"submitted_by": current_user.email},
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


# ==================== Health Check ====================

@app.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Check API health status"""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        print(f"Database error: {str(e)}")
        db_status = "disconnected"
    
    try:
        blockchain_status = "connected" if blockchain_service.is_connected() else "disconnected"
    except Exception as e:
        print(f"Blockchain error: {str(e)}")
        blockchain_status = "disconnected"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "blockchain": blockchain_status,
        "timestamp": datetime.utcnow(),
    }

@app.get("/health/client")
async def health_client_info(request: Request, db: Session = Depends(get_db)):
    """Return client connectivity details (IP, headers) for mobile debugging."""
    client_host = request.client.host if request.client else None
    # Minimal header echo (avoid dumping all for privacy)
    ua = request.headers.get("user-agent")
    origin = request.headers.get("origin")
    return {
        "client_ip": client_host,
        "user_agent": ua,
        "origin": origin,
        "backend_time": datetime.utcnow().isoformat(),
        "reachable": True,
    }


# ==================== Authentication Routes ====================

@app.post("/auth/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        result = auth_service.signup(request, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")


@app.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user with email and password"""
    try:
        print(f"[LOGIN] Attempt email={request.email}")
        result = auth_service.login(request, db)
        print(f"[LOGIN] Success user_id={result['user']['id']}")
        return result
    except ValueError as e:
        print(f"[LOGIN] ValueError: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed")


@app.get("/auth/nonce/{wallet_address}", response_model=NonceResponse)
async def get_nonce(wallet_address: str, db: Session = Depends(get_db)):
    """Get nonce for wallet verification"""
    try:
        nonce = auth_service.get_nonce(wallet_address, db)
        return {"nonce": nonce}
    except Exception as e:
        print(f"Nonce error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate nonce")


@app.post("/auth/verify-wallet", response_model=TokenResponse)
async def verify_wallet(request: dict, db: Session = Depends(get_db)):
    """Verify wallet signature and create/login user"""
    try:
        result = auth_service.verify_wallet(
            request.get("wallet_address"),
            request.get("signature"),
            request.get("nonce"),
            db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Wallet verify error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wallet verification failed")


# ==================== Profile Routes ====================

@app.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user profile and statistics"""
    try:
        total_reports = db.query(Report).filter(Report.user_id == current_user.id).count()
        approved_reports = db.query(Report).filter(
            Report.user_id == current_user.id,
            Report.status == "approved"
        ).count()
        
        total_rewards_query = db.query(Report).filter(
            Report.user_id == current_user.id,
            Report.reward_claimed == True
        ).with_entities(
            db.func.sum(Report.reward_amount)
        ).scalar()
        
        total_rewards = float(total_rewards_query) if total_rewards_query else 0.0
        
        return {
            "id": current_user.id,
            "email": current_user.email if current_user.share_profile else None,
            "wallet_address": current_user.wallet_address,
            "role": current_user.role,
            "share_profile": current_user.share_profile,
            "total_reports": total_reports,
            "approved_reports": approved_reports,
            "total_rewards": total_rewards,
            "created_at": current_user.created_at,
        }
    except Exception as e:
        print(f"Profile error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get profile")


# ==================== Report Routes ====================

@app.post("/reports", status_code=status.HTTP_201_CREATED)
async def create_report(
    request: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create and submit new report"""
    try:
        result = report_service.create_report(request, current_user.id, db)
        return result
    except Exception as e:
        print(f"Report creation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create report")


@app.post("/reports/submit-onchain")
async def submit_report_onchain(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Server-side on-chain submission using backend signer and persistence.
    Payload keys:
      ipfs_hash (str) REQUIRED - metadata IPFS hash
      severity (str) REQUIRED - low|medium|high|critical
      category (str) OPTIONAL
      description (str) OPTIONAL
      location (dict) OPTIONAL { latitude, longitude, address }
      mediaFiles (list) OPTIONAL [{ ipfsHash, type, fileName }]
    Returns: { tx_hash, contract_report_id, id }
    """
    try:
        if not blockchain_service.is_connected():
            raise HTTPException(status_code=503, detail="Blockchain RPC unavailable")
        ipfs_hash = payload.get("ipfs_hash")
        if not ipfs_hash:
            raise HTTPException(status_code=400, detail="ipfs_hash required")
        severity_str = payload.get("severity", "medium")
        severity_map = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        severity_idx = severity_map.get(severity_str, 1)
        tx_hash, contract_report_id = blockchain_service.submit_report(ipfs_hash, severity_idx, current_user.wallet_address)

        # Persist report (generate UUID)
        import uuid
        loc = payload.get("location") or {}
        media_files = payload.get("mediaFiles") or []
        # Normalize media file keys to match model expectation
        normalized_media = []
        for m in media_files:
            if isinstance(m, dict):
                normalized_media.append({
                    "ipfsHash": m.get("ipfsHash") or m.get("ipfs_hash"),
                    "type": m.get("type"),
                    "fileName": m.get("fileName") or m.get("file_name")
                })
        report = Report(
            id=str(uuid.uuid4()),
            ipfs_hash=ipfs_hash,
            user_id=current_user.id,
            latitude=loc.get("latitude"),
            longitude=loc.get("longitude"),
            address=loc.get("address"),
            category=payload.get("category"),
            description=payload.get("description"),
            severity=ReportSeverity(severity_str if severity_str in severity_map else "medium"),
            media_files=normalized_media,
            status=ReportStatus.PENDING,
            transaction_hash=tx_hash,
            contract_report_id=contract_report_id,
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Mirror to core backend complaints so officers can act on it
        core_complaint_id = await _mirror_report_to_core_complaint(current_user, report, loc)
        return {
            "tx_hash": tx_hash,
            "contract_report_id": contract_report_id,
            "id": report.id,
            "status": report.status.value,
            "core_complaint_id": core_complaint_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"On-chain submit error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit report on-chain")


@app.get("/reports/my-reports", response_model=ReportListResponse)
async def get_my_reports(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's submitted reports"""
    try:
        total, reports = report_service.get_user_reports(current_user.id, skip, limit, db)
        core_complaints = await _get_core_complaints_for_submitter(current_user.email)
        reports = _merge_core_complaint_status_into_reports(reports, core_complaints)
        return {"total": total, "reports": reports}
    except Exception as e:
        print(f"Report list error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch reports")


@app.get("/reports/{report_id}")
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get report details"""
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        
        # Check permissions
        if report.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
        
        resp = {
            "id": report.id,
            "ipfs_hash": report.ipfs_hash,
            "category": report.category,
            "description": report.description,
            "severity": report.severity,
            "status": report.status,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "address": report.address,
            "reward_amount": report.reward_amount,
            "reward_claimed": report.reward_claimed,
            "created_at": report.created_at,
            "transaction_hash": report.transaction_hash,
        }

        # Best-effort sync with core complaint status
        core_complaints = await _get_core_complaints_for_submitter(current_user.email)
        merged = _merge_core_complaint_status_into_reports([{
            "id": resp.get("id"),
            "transactionHash": resp.get("transaction_hash"),
            "status": resp.get("status").value if hasattr(resp.get("status"), "value") else resp.get("status"),
        }], core_complaints)
        if merged and isinstance(merged[0], dict):
            # Keep original status field shape (string)
            resp["status"] = merged[0].get("status")
            resp["coreComplaintId"] = merged[0].get("coreComplaintId")
            resp["coreComplaintStatus"] = merged[0].get("coreComplaintStatus")
            resp["coreAssignedOfficerId"] = merged[0].get("coreAssignedOfficerId")

        return resp
    except HTTPException:
        raise
    except Exception as e:
        print(f"Report fetch error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch report")


@app.post("/reports/{report_id}/claim-reward")
async def claim_reward(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Claim reward for approved report"""
    try:
        result = report_service.claim_reward(report_id, current_user.id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Reward claim error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to claim reward")


# ==================== Admin Routes ====================

@app.get("/admin/reports", response_model=ReportListResponse)
async def get_all_reports(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reports (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    try:
        total, reports = report_service.get_all_reports(skip, limit, status_filter, db)
        return {"total": total, "reports": reports}
    except Exception as e:
        print(f"Admin reports error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch reports")


@app.post("/admin/reports/{report_id}/review")
async def review_report(
    report_id: str,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Review and approve/reject report (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    try:
        result = report_service.review_report(
            report_id,
            request.get("approved"),
            request.get("reward_amount", 0),
            request.get("admin_notes", ""),
            current_user.id,
            db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Review report error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to review report")


# ==================== Error Handlers ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

# ==================== IPFS Upload Routes ====================
from fastapi import UploadFile, File

@app.post("/ipfs/upload")
async def upload_ipfs_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    try:
        content = await file.read()
        file_tuple = (file.filename, content, file.content_type or "application/octet-stream")
        ipfs_hash = ipfs_service.pin_file(file_tuple)
        return {"ipfs_hash": ipfs_hash}
    except Exception as e:
        print("IPFS upload error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to upload file to IPFS")

@app.post("/ipfs/upload-json")
async def upload_ipfs_json(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    try:
        ipfs_hash = ipfs_service.pin_json(payload)
        return {"ipfs_hash": ipfs_hash}
    except Exception as e:
        print("IPFS upload JSON error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to upload metadata to IPFS")


if __name__ == "__main__":
    import uvicorn
    print(f"Starting server on {settings.host}:{settings.port}")
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level="info"
    )
