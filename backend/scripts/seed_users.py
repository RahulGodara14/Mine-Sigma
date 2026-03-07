"""
Script to seed demo users into the database.
Run this after setting up the database.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, async_session, Base
from app.models import User, UserRole
from app.security import hash_password
from sqlalchemy import select, text


async def seed_users():
    """Create demo users in the database."""
    try:
        # Create all tables first
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("✓ Database tables created/verified")
        
        # Wait a moment for the tables to be available
        await asyncio.sleep(1)
        
        # Now add users
        async with async_session() as session:
            # Check if users already exist
            try:
                result = await session.execute(select(User))
                existing_users = result.scalars().all()
            except Exception as e:
                print(f"Warning: Could not check existing users: {e}")
                existing_users = []
            
            if existing_users:
                print(f"Database already contains {len(existing_users)} users.")
                # Update full_name for existing users if empty
                updated_count = 0
                for user in existing_users:
                    if not user.full_name:
                        user.full_name = user.email.split("@")[0].title()
                        updated_count += 1
                
                if updated_count > 0:
                    await session.commit()
                    print(f"✓ Updated {updated_count} users with full names")
                
                await session.close()
                return
            
            # Create demo users with pre-hashed passwords
            demo_users = [
                User(
                    email="admin@mine-sigma.com",
                    hashed_password=hash_password("admin123"),
                    full_name="Admin User",
                    role=UserRole.ADMIN,
                    is_active=True
                ),
                User(
                    email="officer@mine-sigma.com",
                    hashed_password=hash_password("officer123"),
                    full_name="Officer User",
                    role=UserRole.OFFICER,
                    is_active=True
                ),
                User(
                    email="officer2@mine-sigma.com",
                    hashed_password=hash_password("officer123"),
                    full_name="Second Officer",
                    role=UserRole.OFFICER,
                    is_active=True
                ),
            ]
            
            session.add_all(demo_users)
            await session.commit()
            
            print(f"✓ Successfully seeded {len(demo_users)} demo users:")
            for user in demo_users:
                print(f"  - {user.email} ({user.role.value})")
            
            await session.close()
    
    except Exception as e:
        print(f"✗ Error seeding users: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_users())
