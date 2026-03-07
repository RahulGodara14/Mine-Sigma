"""
Script to reset the database (drop all tables and recreate).
WARNING: This will delete all data!
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import *  # Import all models


async def reset_db():
    """Drop all tables and recreate them."""
    try:
        print("⚠️  WARNING: This will delete all data from the database!")
        confirm = input("Type 'yes' to confirm: ")
        
        if confirm.lower() != "yes":
            print("Cancelled.")
            return
        
        # Drop all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            print("✓ All tables dropped")
        
        # Recreate all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("✓ All tables recreated")
        
        print("\n✓ Database reset complete!")
    
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(reset_db())
