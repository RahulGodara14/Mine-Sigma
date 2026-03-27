import requests
import json

BASE_URL = "http://localhost:3000"

def test_signup():
    """Test signup endpoint"""
    print("\n🧪 Testing Signup Endpoint")
    print("=" * 50)
    
    payload = {
        "email": "test@example.com",
        "password": "testpass123",
        "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "shareProfile": False
    }
    
    print(f"\nPayload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2))
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_login():
    """Test login endpoint"""
    print("\n🧪 Testing Login Endpoint")
    print("=" * 50)
    
    payload = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    print(f"\nPayload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2))
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_health():
    """Test health endpoint"""
    print("\n🧪 Testing Health Endpoint")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2))
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    print("🚀 MineGuard Backend API Tests")
    
    # Test health first
    health_ok = test_health()
    
    if not health_ok:
        print("\n❌ Backend is not running!")
        exit(1)
    
    # Test signup
    signup_ok = test_signup()
    
    if signup_ok:
        # Test login
        login_ok = test_login()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")