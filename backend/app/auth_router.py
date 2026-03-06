from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from .database import get_db
from .models import ActivityLog, User, UserRole
from .security import verify_password, hash_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    username: str
    full_name: str
    role: str
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    email: str
    full_name: str
    role: str
    is_active: bool


class UserCreateRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "officer"


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    """
    Authenticate user and return access token.
    """
    # Query user by email
    result = await db.execute(
        select(User).where(User.email == payload.username)
    )
    user = result.scalars().first()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}
    )

    db.add(
        ActivityLog(
            actor_email=user.email,
            actor_user_id=user.id,
            type="auth",
            action="user_login",
            entity_type="user",
            entity_id=str(user.id),
            status="success",
            details={"role": user.role.value},
        )
    )
    await db.commit()
    
    return LoginResponse(
        username=user.email,
        full_name=user.full_name or user.email.split("@")[0],
        role=user.role.value,
        access_token=access_token
    )


@router.post("/register", response_model=LoginResponse)
async def register(payload: UserCreateRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    """
    Register a new user.
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(payload.password)
    new_user = User(
        email=payload.email,
        hashed_password=hashed_password,
        full_name=payload.full_name,
        role=UserRole(payload.role),
        is_active=True
    )
    
    db.add(new_user)
    await db.flush()

    db.add(
        ActivityLog(
            actor_email=new_user.email,
            actor_user_id=new_user.id,
            type="auth",
            action="user_registered",
            entity_type="user",
            entity_id=str(new_user.id),
            status="success",
            details={"role": new_user.role.value},
        )
    )

    await db.commit()
    await db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role.value}
    )
    
    return LoginResponse(
        username=new_user.email,
        full_name=new_user.full_name or new_user.email.split("@")[0],
        role=new_user.role.value,
        access_token=access_token
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = None, db: AsyncSession = Depends(get_db)):
    """
    Get current authenticated user information.
    Requires JWT token in Authorization header: Bearer <token>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    # Decode token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Get user from database
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        email=user.email,
        full_name=user.full_name or user.email.split("@")[0],
        role=user.role.value,
        is_active=user.is_active
    )
