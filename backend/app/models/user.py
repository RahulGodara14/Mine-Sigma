from sqlalchemy import Column, String, Boolean, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, TimestampMixin
import enum
import uuid

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OFFICER = "officer"

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.OFFICER)
    is_active = Column(Boolean(), default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    # Add relationships here as needed, for example:
    # assigned_alerts = relationship("Alert", back_populates="assigned_officer", foreign_keys="Alert.assigned_officer_id")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN

    @property
    def is_officer(self):
        return self.role == UserRole.OFFICER
