from sqlalchemy.orm import Session
from models import Report, User, ReportStatus, ReportSeverity
from schemas import ReportCreateRequest, ReportResponse
from blockchain_service import blockchain_service
import uuid
from datetime import datetime
from typing import List, Tuple


class ReportService:
    @staticmethod
    def create_report(
        request: ReportCreateRequest,
        user_id: str,
        db: Session
    ) -> dict:
        """Create new report"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Submit to blockchain
        severity_map = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        tx_hash, contract_report_id = blockchain_service.submit_report(
            request.ipfs_hash,
            severity_map[request.severity],
            user.wallet_address
        )
        
        # Create report in database
        report_id = str(uuid.uuid4())
        report = Report(
            id=report_id,
            ipfs_hash=request.ipfs_hash,
            user_id=user_id,
            latitude=request.latitude,
            longitude=request.longitude,
            address=request.address,
            category=request.category,
            description=request.description,
            severity=ReportSeverity(request.severity),
            media_files=request.media_files,
            status=ReportStatus.PENDING,
            transaction_hash=tx_hash,
            contract_report_id=contract_report_id,
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "id": report.id,
            "ipfsHash": report.ipfs_hash,
            "status": report.status.value,
            "transactionHash": report.transaction_hash,
            "contractReportId": report.contract_report_id,
        }
    
    @staticmethod
    def get_user_reports(
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        db: Session = None
    ) -> Tuple[int, List[dict]]:
        """Get user's reports"""
        query = db.query(Report).filter(Report.user_id == user_id).order_by(
            Report.created_at.desc()
        )
        
        total = query.count()
        reports = query.offset(skip).limit(limit).all()
        
        return total, [
            {
                "id": r.id,
                "ipfsHash": r.ipfs_hash,
                "category": r.category,
                "description": r.description,
                "severity": r.severity.value,
                "status": r.status.value,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "address": r.address,
                "rewardAmount": r.reward_amount,
                "rewardClaimed": r.reward_claimed,
                "createdAt": r.created_at.isoformat(),
                "transactionHash": r.transaction_hash,
            }
            for r in reports
        ]
    
    @staticmethod
    def get_all_reports(
        skip: int = 0,
        limit: int = 20,
        status: str = None,
        db: Session = None
    ) -> Tuple[int, List[dict]]:
        """Get all reports (admin)"""
        query = db.query(Report)
        
        if status:
            query = query.filter(Report.status == ReportStatus(status))
        
        total = query.count()
        reports = query.order_by(Report.created_at.desc()).offset(skip).limit(limit).all()
        
        return total, [
            {
                "id": r.id,
                "ipfsHash": r.ipfs_hash,
                "category": r.category,
                "description": r.description,
                "severity": r.severity.value,
                "status": r.status.value,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "address": r.address,
                "rewardAmount": r.reward_amount,
                "rewardClaimed": r.reward_claimed,
                "reporterAddress": r.reporter.wallet_address if not r.reporter.share_profile else None,
                "createdAt": r.created_at.isoformat(),
                "transactionHash": r.transaction_hash,
                "adminNotes": r.admin_notes,
            }
            for r in reports
        ]
    
    @staticmethod
    def review_report(
        report_id: str,
        approved: bool,
        reward_amount: float,
        admin_notes: str,
        admin_id: str,
        db: Session
    ) -> dict:
        """Review report and update status"""
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise ValueError("Report not found")
        
        # Update blockchain
        tx_hash = blockchain_service.review_report(
            report.contract_report_id,
            approved
        )
        
        # Update report
        report.status = ReportStatus.APPROVED if approved else ReportStatus.REJECTED
        report.reward_amount = reward_amount if approved else 0
        report.admin_notes = admin_notes
        report.reviewed_by = admin_id
        report.reviewed_at = datetime.utcnow()
        report.transaction_hash = tx_hash
        
        db.commit()
        db.refresh(report)
        
        return {
            "id": report.id,
            "status": report.status.value,
            "rewardAmount": report.reward_amount,
            "transactionHash": tx_hash,
        }
    
    @staticmethod
    def claim_reward(report_id: str, user_id: str, db: Session) -> dict:
        """Claim reward for approved report"""
        report = db.query(Report).filter(
            Report.id == report_id,
            Report.user_id == user_id
        ).first()
        
        if not report:
            raise ValueError("Report not found")
        
        if report.status != ReportStatus.APPROVED:
            raise ValueError("Report is not approved")
        
        if report.reward_claimed:
            raise ValueError("Reward already claimed")
        
        if report.reward_amount <= 0:
            raise ValueError("No reward to claim")
        
        # Mark as claimed
        report.reward_claimed = True
        report.claimed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(report)
        
        return {
            "id": report.id,
            "rewardAmount": report.reward_amount,
            "claimedAt": report.claimed_at.isoformat(),
        }


report_service = ReportService()