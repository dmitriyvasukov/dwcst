from pydantic import BaseModel
from typing import List, Optional
from app.models.product import ProductStatus

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    care: Optional[str] = None
    price: float
    status: Optional[ProductStatus] = ProductStatus.in_stock
    stock: Optional[int] = 0
    preorder_count: Optional[int] = 0
    preview: Optional[str] = None
    images: Optional[List[str]] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    
    class Config:
        from_attributes = True