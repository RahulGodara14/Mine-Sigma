from sqlalchemy import Column, String, Enum, ForeignKey, Text, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import enum
import uuid

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False)
    location = Column(JSONB, nullable=True)  # GeoJSON format
    contact_info = Column(JSONB, nullable=True)  # {email: string, phone: string}
    
    # Blockchain specific fields
    transaction_hash = Column(String(255), nullable=True)  # Storing the blockchain transaction hash
    block_number = Column(Integer, nullable=True)  # Block number where the complaint was recorded
    
    # Relationships
    submitted_by = Column(String(255), nullable=True)  # Could be user ID or anonymous identifier
    assigned_officer_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    # assigned_officer = relationship("User", back_populates="assigned_complaints")
    
    # For tracking resolution
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # For categorization
    category = Column(String(100), nullable=True)
    tags = Column(JSONB, nullable=True)  # Array of strings
    
    # For verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_notes = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Complaint {self.title} ({self.status})>"
