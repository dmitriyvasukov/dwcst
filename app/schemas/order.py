from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderCreate(BaseModel):
    promo_code: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_email: EmailStr
    delivery_address: str

class OrderOut(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    status: OrderStatus
    total_amount: float
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    delivery_address: Optional[str] = None
    items: List[OrderItemBase]
    
    class Config:
        from_attributes = True