#!/usr/bin/env python3
"""Delete a dev user by email or wallet from the SQLite DB.

Usage (run from backend folder):
    python -m tools.reset_dev_user --email citizen@test.com
    python -m tools.reset_dev_user --wallet 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Or directly:
    python tools/reset_dev_user.py --email citizen@test.com

This script ensures imports work whether invoked as a module or a script.
"""
import argparse
import os
import sys

# Ensure backend package is on sys.path when running as a script
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)

from database import SessionLocal
from models import User


def main():
    parser = argparse.ArgumentParser(description="Reset dev user")
    parser.add_argument("--email", type=str, help="Email to delete")
    parser.add_argument("--wallet", type=str, help="Wallet address to delete")
    args = parser.parse_args()

    if not args.email and not args.wallet:
        print("Provide --email or --wallet")
        return

    db = SessionLocal()
    try:
        q = db.query(User)
        if args.email:
            q = q.filter(User.email == args.email)
        if args.wallet:
            q = q.filter(User.wallet_address == args.wallet)

        users = q.all()
        if not users:
            print("No matching users found.")
            return

        for u in users:
            db.delete(u)
        db.commit()
        print(f"Deleted {len(users)} user(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
