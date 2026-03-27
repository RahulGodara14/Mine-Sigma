#!/usr/bin/env python
"""Test password verification"""
from database import SessionLocal
from models import User
from bcrypt import hashpw, gensalt, checkpw

db = SessionLocal()

# Get the user
user = db.query(User).filter(User.email == "citizen@test.com").first()

if user:
    print(f"User found: {user.email}")
    print(f"Hashed password: {user.hashed_password}")
    print(f"Hashed password type: {type(user.hashed_password)}")
    print(f"Hashed password length: {len(user.hashed_password)}")
    
    # Test password
    test_password = "password123"
    print(f"\nTesting password: {test_password}")
    
    try:
        hashed = user.hashed_password
        if isinstance(hashed, str):
            hashed = hashed.encode('utf-8')
        
        result = checkpw(test_password.encode('utf-8'), hashed)
        print(f"Password match: {result}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("User not found")

db.close()
