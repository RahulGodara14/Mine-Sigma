from .base import Base, TimestampMixin
from .user import User, UserRole
from .alert import Alert, AlertStatus, AlertSeverity
from .complaint import Complaint, ComplaintStatus
from .zone import Zone
from .report import Report, ReportStatus, ReportType
from .activity_log import ActivityLog
from .analysis_run import AnalysisRun

# Import all models to ensure they are registered with SQLAlchemy
# This is necessary for Alembic to detect the models
__all__ = [
    'Base',
    'TimestampMixin',
    'User',
    'UserRole',
    'Alert',
    'AlertStatus',
    'AlertSeverity',
    'Complaint',
    'ComplaintStatus',
    'Zone',
    'Report',
    'ReportStatus',
    'ReportType',
    'ActivityLog',
    'AnalysisRun',
]
