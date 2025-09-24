from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.repositories.order_repo import OrderRepository
from app.schemas.order import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=OrderOut)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    order = OrderRepository.create_from_cart(db, current_user.id, order_data.dict())
    if not order:
        raise HTTPException(status_code=400, detail="Cart is empty")
    return order

@router.get("/", response_model=list[OrderOut])
def get_user_orders(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return OrderRepository.get_user_orders(db, current_user.id)

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    order = OrderRepository.get_order_by_id(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/admin/all", response_model=list[OrderOut])
def get_all_orders(db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    return db.query(Order).order_by(Order.created_at.desc()).all()