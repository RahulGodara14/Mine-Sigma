from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import uuid


class Zone(Base, TimestampMixin):
    __tablename__ = "zones"

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    district = Column(String(255), nullable=True)
    state = Column(String(255), nullable=True)

    area_km2 = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)
    status = Column(String(100), nullable=True)

    last_scan_at = Column(DateTime(timezone=True), nullable=True)
    geometry = Column(JSONB, nullable=True)

    def __repr__(self):
        return f"<Zone {self.name}>"
