from pydantic import BaseModel
from typing import List, Optional

class PromoCodeBase(BaseModel):
    name: str
    discount: float
    usage_limit: Optional[int] = 1
    is_active: Optional[bool] = True
    applies_to_all: Optional[bool] = True

class PromoCodeCreate(PromoCodeBase):
    applicable_product_ids: Optional[List[int]] = []

class PromoCodeUpdate(BaseModel):
    discount: Optional[float] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None

class PromoCodeOut(PromoCodeBase):
    id: int
    usage_count: int
    
    class Config:
        from_attributes = True


class ApplyPromoCode(BaseModel):
    promo_code: str