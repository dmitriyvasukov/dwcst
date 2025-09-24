from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    discount = Column(Float, nullable=False)
    usage_limit = Column(Integer, default=1)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    applies_to_all = Column(Boolean, default=True)

class PromoApplicableProduct(Base):
    __tablename__ = "promo_applicable_products"
    
    promo_id = Column(Integer, ForeignKey("promo_codes.id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)