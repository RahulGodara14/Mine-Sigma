from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import uuid


class AnalysisRun(Base, TimestampMixin):
    __tablename__ = "analysis_runs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))

    project_name = Column(String(255), nullable=True)
    latitude = Column(String(100), nullable=True)
    longitude = Column(String(100), nullable=True)

    status = Column(String(50), nullable=True)
    result = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)

    def __repr__(self):
        return f"<AnalysisRun {self.project_name} ({self.status})>"
