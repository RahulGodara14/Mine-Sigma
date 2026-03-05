from sqlalchemy import Column, String, Enum, ForeignKey, Text, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import enum
import uuid
from datetime import datetime

class AlertStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(AlertStatus), default=AlertStatus.OPEN, nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM, nullable=False)
    location = Column(JSONB, nullable=True)  # GeoJSON format
    coordinates = Column(JSONB, nullable=True)  # For spatial queries
    extra_data = Column(JSONB, nullable=True)  # Additional flexible data
    
    # Relationships
    assigned_officer_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    # assigned_officer = relationship("User", back_populates="assigned_alerts")
    
    # Timestamps with timezone
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Alert {self.title} ({self.status})>"
    
    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        return datetime.now(self.due_date.tzinfo) > self.due_date
