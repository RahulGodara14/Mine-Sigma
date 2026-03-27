from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, Float, Enum as SQLEnum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    wallet_address = Column(String, unique=True, index=True)
    role = Column(String, default="citizen")  # citizen, admin
    share_profile = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    reports = relationship("Report", back_populates="reporter")
    nonces = relationship("Nonce", back_populates="user")


class Nonce(Base):
    __tablename__ = "nonces"
    
    id = Column(String, primary_key=True, index=True)
    wallet_address = Column(String, unique=True, index=True)
    nonce = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    
    user_id = Column(String, ForeignKey("users.id"))
    user = relationship("User", back_populates="nonces")


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReportSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, index=True)
    ipfs_hash = Column(String, unique=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    
    # Location data
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String, nullable=True)
    
    # Report details
    category = Column(String)  # illegal_mining, environmental_damage, safety_violation, other
    description = Column(Text)
    severity = Column(SQLEnum(ReportSeverity))
    
    # Media
    media_files = Column(JSON)  # Array of {ipfsHash, type, fileName}
    
    # Status
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING)
    
    # Blockchain
    transaction_hash = Column(String, nullable=True, index=True)
    contract_report_id = Column(Integer, nullable=True)
    
    # Rewards
    reward_amount = Column(Float, default=0)
    reward_claimed = Column(Boolean, default=False)
    claimed_at = Column(DateTime, nullable=True)
    
    # Admin review
    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    reporter = relationship("User", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, index=True)
    action = Column(String)
    user_id = Column(String, nullable=True)
    wallet_address = Column(String, nullable=True)
    report_id = Column(String, nullable=True)
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)