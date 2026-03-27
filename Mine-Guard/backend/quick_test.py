import requests
import json

# Test signup
print("Testing Signup...")
data = {
    "email": "newtest@example.com",
    "password": "Pass123456",
    "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "shareProfile": False
}

r = requests.post("http://localhost:3000/auth/signup", json=data)
print(f"Status: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}\n")

# Test login
print("Testing Login with existing user...")
data = {
    "email": "citizen@test.com",
    "password": "password123"
}

r = requests.post("http://localhost:3000/auth/login", json=data)
print(f"Status: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
