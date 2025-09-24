import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate
from app.models.user import UserRole

def create_admin_user():
    db = SessionLocal()
    try:
        admin = UserRepository.get_by_email(db, "admin@example.com")
        if admin:
            print("Admin user already exists!")
            return
        
        admin_data = UserCreate(
            email="admin@dodus.ru",
            password="admin",
            first_name="Admin",
            role=UserRole.ADMIN
        )
        
        admin = UserRepository.create(db, admin_data)
        print(f"Admin user created successfully! ID: {admin.id}")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()