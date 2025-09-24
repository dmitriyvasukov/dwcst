from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserOut, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=list[UserOut])
def get_all_users(db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    return UserRepository.get_all(db)

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    if UserRepository.get_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return UserRepository.create(db, user)

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    updated = UserRepository.update(db, user_id, user)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated