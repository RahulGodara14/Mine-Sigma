from pydantic import BaseModel, EmailStr, Field
from pydantic import AliasChoices, ConfigDict

from datetime import datetime
from typing import Optional, List
from enum import Enum

# ==================== Auth Schemas ====================

class SignupRequest(BaseModel):
    """Signup request schema"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    walletAddress: str = Field(..., alias="wallet_address")
    shareProfile: bool = Field(default=False, alias="share_profile")
    
    class Config:
        populate_by_name = True  # Allow both camelCase and snake_case
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepass123",
                "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "shareProfile": False
            }
        }


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepass123"
            }
        }


class WalletVerifyRequest(BaseModel):
    """Wallet verification request"""
    wallet_address: str
    signature: str
    nonce: str


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: str
    walletAddress: str
    role: str
    shareProfile: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "role": "citizen",
                "shareProfile": False,
                "created_at": "2024-01-15T10:30:00"
            }
        }


class TokenResponse(BaseModel):
    """Token response schema"""
    token: str
    user: UserResponse


# ==================== Report Schemas ====================

class SeverityEnum(str, Enum):
    """Report severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CategoryEnum(str, Enum):
    """Report categories"""
    ILLEGAL_MINING = "illegal_mining"
    ENVIRONMENTAL_DAMAGE = "environmental_damage"
    SAFETY_VIOLATION = "safety_violation"
    OTHER = "other"


class StatusEnum(str, Enum):
    """Report statuses"""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class MediaFileSchema(BaseModel):
    """Media file schema"""
    ipfs_hash: str
    type: str  # image, video
    file_name: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "ipfs_hash": "QmExample123",
                "type": "image",
                "file_name": "evidence.jpg"
            }
        }


class ReportCreateRequest(BaseModel):
    """Create report request"""
    ipfs_hash: str
    category: CategoryEnum
    description: str = Field(..., min_length=20, max_length=1000)
    severity: SeverityEnum
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    media_files: List[MediaFileSchema] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "ipfs_hash": "QmExample123",
                "category": "illegal_mining",
                "description": "Large-scale illegal mining operation with heavy machinery visible",
                "severity": "high",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "address": "Mumbai, India",
                "media_files": [
                    {
                        "ipfs_hash": "QmMedia123",
                        "type": "image",
                        "file_name": "evidence.jpg"
                    }
                ]
            }
        }


class ReportResponse(BaseModel):
    """Report response schema"""
    id: str
    ipfs_hash: str = Field(
        ...,
        validation_alias=AliasChoices("ipfs_hash", "ipfsHash"),
        serialization_alias="ipfsHash",
    )
    category: str
    description: str
    severity: str
    status: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    reward_amount: float = Field(
        ...,
        validation_alias=AliasChoices("reward_amount", "rewardAmount"),
        serialization_alias="rewardAmount",
    )
    reward_claimed: bool = Field(
        ...,
        validation_alias=AliasChoices("reward_claimed", "rewardClaimed"),
        serialization_alias="rewardClaimed",
    )
    created_at: datetime = Field(
        ...,
        validation_alias=AliasChoices("created_at", "createdAt"),
        serialization_alias="createdAt",
    )
    transaction_hash: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("transaction_hash", "transactionHash"),
        serialization_alias="transactionHash",
    )
    admin_notes: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("admin_notes", "adminNotes"),
        serialization_alias="adminNotes",
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        extra="ignore",
        json_schema_extra={
            "example": {
                "id": "report-id",
                "ipfs_hash": "QmExample123",
                "category": "illegal_mining",
                "description": "Large-scale illegal mining...",
                "severity": "high",
                "status": "pending",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "address": "Mumbai, India",
                "reward_amount": 0.5,
                "reward_claimed": False,
                "created_at": "2024-01-15T10:30:00",
                "transaction_hash": "0x...",
                "admin_notes": None,
            }
        },
    )


class ReportListResponse(BaseModel):
    """Report list response"""
    total: int
    reports: List[ReportResponse]


# ==================== Admin Schemas ====================

class ReportReviewRequest(BaseModel):
    """Admin report review request"""
    approved: bool
    reward_amount: Optional[float] = None
    admin_notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "approved": True,
                "reward_amount": 0.5,
                "admin_notes": "High quality evidence"
            }
        }


class ReportReviewResponse(BaseModel):
    """Admin review response"""
    id: str
    status: str
    reward_amount: float
    transaction_hash: str
    admin_notes: Optional[str] = None
    
    class Config:
        from_attributes = True


# ==================== Profile Schemas ====================

class ProfileResponse(BaseModel):
    """User profile response"""
    id: str
    email: Optional[str] = None
    wallet_address: str
    role: str
    share_profile: bool
    total_reports: int
    approved_reports: int
    total_rewards: float
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "user-id",
                "email": "user@example.com",
                "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "role": "citizen",
                "share_profile": False,
                "total_reports": 5,
                "approved_reports": 3,
                "total_rewards": 1.5,
                "created_at": "2024-01-15T10:00:00"
            }
        }


# ==================== Utility Schemas ====================

class NonceResponse(BaseModel):
    """Nonce response"""
    nonce: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    database: str
    blockchain: str
    timestamp: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "database": "connected",
                "blockchain": "connected",
                "timestamp": "2024-01-15T10:30:00"
            }
        }


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
    status_code: int
    timestamp: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Email already registered",
                "status_code": 400,
                "timestamp": "2024-01-15T10:30:00"
            }
        }