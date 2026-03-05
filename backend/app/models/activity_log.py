from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import uuid


class ActivityLog(Base, TimestampMixin):
    __tablename__ = "activity_log"

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))

    actor_email = Column(String(255), nullable=True)
    actor_user_id = Column(UUID(as_uuid=False), nullable=True)

    type = Column(String(50), nullable=False, default="event")

    action = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(255), nullable=True)

    status = Column(String(50), nullable=True)
    details = Column(JSONB, nullable=True)
    message = Column(Text, nullable=True)

    def __repr__(self):
        return f"<ActivityLog {self.action}>"
