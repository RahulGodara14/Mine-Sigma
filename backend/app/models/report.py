from sqlalchemy import Column, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import enum
import uuid


class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    FINALIZED = "finalized"


class ReportType(str, enum.Enum):
    AUTOMATED = "automated"
    FIELD_VISIT = "field_visit"
    SUMMARY = "summary"
    AUDIT = "audit"


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(Enum(ReportStatus), default=ReportStatus.DRAFT, nullable=False)
    report_type = Column(Enum(ReportType), default=ReportType.FIELD_VISIT, nullable=False)

    created_by_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    related_alert_id = Column(UUID(as_uuid=False), ForeignKey("alerts.id"), nullable=True)

    file_urls = Column(JSONB, nullable=True)

    finalized_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Report {self.title} ({self.status})>"
