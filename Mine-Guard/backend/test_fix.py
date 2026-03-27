#!/usr/bin/env python3
"""Test the fixed signup and login endpoints"""

import requests
import json

BASE_URL = "http://localhost:3000"

def test_signup():
    """Test signup endpoint"""
    print("\n=== Testing Signup Endpoint ===")
    
    payload = {
        "email": "testuser@example.com",
        "password": "TestPass123",
        "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "shareProfile": False
    }
    
    print(f"Sending: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json=payload,
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("✅ Signup successful!")
            return response.json()
        else:
            print(f"❌ Signup failed with status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def test_login():
    """Test login with existing account"""
    print("\n=== Testing Login Endpoint ===")
    
    payload = {
        "email": "citizen@test.com",
        "password": "password123"
    }
    
    print(f"Sending: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            return response.json()
        else:
            print(f"❌ Login failed with status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/health",
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Health check successful!")
            return True
        else:
            print(f"❌ Health check failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    print("Testing Mine-Guard Backend API")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("\n⚠️  Backend not responding. Make sure it's running on port 3000")
        exit(1)
    
    # Test signup
    signup_result = test_signup()
    
    # Test login
    login_result = test_login()
    
    print("\n" + "=" * 50)
    print("Testing completed!")
