from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Boolean, Float, Text, JSON
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps"""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
