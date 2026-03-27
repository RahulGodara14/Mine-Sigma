#!/usr/bin/env python
"""
Seed default test data for Mine-Guard
"""
import sys
from database import SessionLocal, engine, Base
from models import User
import uuid
from bcrypt import hashpw, gensalt

def hash_password(password: str) -> str:
    """Hash password using bcrypt directly"""
    return hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')

def seed_database():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if default user exists
        existing = db.query(User).filter(User.email == "citizen@test.com").first()
        if existing:
            print("✓ Default citizen already exists")
            return
        
        # Create default citizen user
        default_user = User(
            id=str(uuid.uuid4()),
            email="citizen@test.com",
            hashed_password=hash_password("password123"),
            wallet_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            role="citizen",
            share_profile=False,
            is_active=True
        )
        
        db.add(default_user)
        db.commit()
        
        print("✓ Default citizen user created:")
        print("  Email: citizen@test.com")
        print("  Password: password123")
        print("  Wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
