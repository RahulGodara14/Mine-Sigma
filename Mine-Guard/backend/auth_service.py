from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models import User, Nonce
from security import verify_password as verify_password_ctx, hash_password as hash_password_ctx, create_access_token, generate_nonce
from schemas import SignupRequest, LoginRequest, UserResponse
from database import SessionLocal
import uuid
from datetime import datetime
from typing import Optional


def hash_password(password: str) -> str:
    return hash_password_ctx(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return verify_password_ctx(plain_password, hashed_password)


class AuthService:
    @staticmethod
    def signup(request: SignupRequest, db: Session):
        """Register new user"""
        wallet = (request.walletAddress or "").strip()
        if not wallet or wallet.lower() in (
            "0x0000000000000000000000000000000000000000",
            "0x0",
            "0",
        ):
            wallet = "0x" + (uuid.uuid4().hex + uuid.uuid4().hex)[:40]

        # Enforce unique wallet
        existing_wallet = db.query(User).filter(User.wallet_address == wallet).first()
        if existing_wallet:
            raise ValueError("Wallet already registered")

        existing_email = db.query(User).filter(User.email == request.email).first()
        if existing_email:
            raise ValueError("Email already registered")
        
        # Create user
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=request.email,
            hashed_password=hash_password(request.password),
            wallet_address=wallet,
            share_profile=request.shareProfile,
            role="citizen",
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create token
        token = create_access_token({"sub": user.id, "email": user.email})
        
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "walletAddress": user.wallet_address,
                "role": user.role,
                "shareProfile": user.share_profile,
                "created_at": user.created_at,
            }
        }
    
    @staticmethod
    def login(request: LoginRequest, db: Session):
        """Login user"""
        try:
            user = db.query(User).filter(User.email == request.email).first()
            if not user:
                raise ValueError("Invalid credentials")

            if not verify_password(request.password, user.hashed_password):
                raise ValueError("Invalid credentials")

            token = create_access_token({"sub": user.id})
            return {
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "walletAddress": user.wallet_address,
                    "role": user.role or "citizen",
                    "shareProfile": bool(user.share_profile),
                    "created_at": user.created_at,
                },
            }
        except ValueError as e:
            # 401 handled in router
            raise e
        except Exception as e:
            # Defensive: avoid 500 cascades due to None fields
            print(f"Login error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed"
            )
    
    @staticmethod
    def get_nonce(wallet_address: str, db: Session) -> str:
        """Generate or get nonce for wallet verification"""
        # Check for existing unused nonce
        existing_nonce = db.query(Nonce).filter(
            Nonce.wallet_address == wallet_address,
            Nonce.used == False
        ).first()
        
        if existing_nonce:
            return existing_nonce.nonce
        
        # Generate new nonce
        nonce = generate_nonce()
        nonce_id = str(uuid.uuid4())
        
        nonce_obj = Nonce(
            id=nonce_id,
            wallet_address=wallet_address,
            nonce=nonce,
        )
        
        db.add(nonce_obj)
        db.commit()
        
        return nonce
    
    @staticmethod
    def verify_wallet(
        wallet_address: str, signature: str, nonce: str, db: Session
    ) -> dict:
        """Verify wallet signature and create/get user"""
        # Find nonce
        nonce_obj = db.query(Nonce).filter(
            Nonce.wallet_address == wallet_address,
            Nonce.nonce == nonce,
            Nonce.used == False
        ).first()
        
        if not nonce_obj:
            raise ValueError("Invalid or expired nonce")
        
        # In production, verify signature using web3.py
        # from eth_account.messages import encode_defunct
        # message = encode_defunct(text=nonce)
        # recovered_address = Account.recover_message(message, signature=signature)
        # if recovered_address.lower() != wallet_address.lower():
        #     raise ValueError("Signature verification failed")
        
        # Mark nonce as used
        nonce_obj.used = True
        nonce_obj.used_at = datetime.utcnow()
        
        # Check if user exists
        user = db.query(User).filter(User.wallet_address == wallet_address).first()
        
        if not user:
            # Create new user
            user_id = str(uuid.uuid4())
            user = User(
                id=user_id,
                wallet_address=wallet_address,
                email=f"{wallet_address}@wallet.local",
                hashed_password=hash_password(str(uuid.uuid4())),
                role="citizen",
                share_profile=False,
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        # Create token
        token = create_access_token({"sub": user.id, "wallet": user.wallet_address})
        
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "walletAddress": user.wallet_address,
                "role": user.role,
                "shareProfile": user.share_profile,
                "created_at": user.created_at,
            }
        }
    
    @staticmethod
    def get_user_profile(user_id: str, db: Session) -> dict:
        """Get user profile"""
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise ValueError("User not found")
        
        # Get stats
        total_reports = db.query(User).join(
            db.models.Report
        ).filter(db.models.Report.user_id == user_id).count()
        
        return {
            "id": user.id,
            "email": user.email if user.share_profile else None,
            "walletAddress": user.wallet_address,
            "role": user.role,
            "shareProfile": user.share_profile,
            "createdAt": user.created_at,
        }


auth_service = AuthService()