#!/usr/bin/env python3
"""
Generate secure secrets for MineGuard backend
"""
import secrets
import sys

def generate_secret_key(length=32):
    """Generate a secure secret key for JWT"""
    return secrets.token_urlsafe(length)

def generate_hex_secret(length=32):
    """Generate a hex-encoded secret key"""
    return secrets.token_hex(length)

def main():
    print("\n🔐 MineGuard Secret Key Generator")
    print("=" * 50)
    
    print("\n1️⃣  JWT SECRET_KEY (URL-safe):")
    secret_key = generate_secret_key(32)
    print(f"   {secret_key}")
    print(f"   Length: {len(secret_key)} characters")
    
    print("\n2️⃣  Alternative HEX Format:")
    hex_secret = generate_hex_secret(32)
    print(f"   {hex_secret}")
    print(f"   Length: {len(hex_secret)} characters")
    
    print("\n3️⃣  Copy to .env file:")
    print(f"\n   SECRET_KEY={secret_key}")
    
    print("\n" + "=" * 50)
    print("✅ Use option 1 or 2 in your .env file")
    print("⚠️  Keep these keys secret - never commit to Git!")
    print("=" * 50 + "\n")

if __name__ == '__main__':
    main()
