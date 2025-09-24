from sqlalchemy import Column, Integer, String, Float, Enum, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ProductStatus(str, enum.Enum):
    in_stock = "in_stock"
    preorder = "preorder"
    waiting = "waiting"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    care = Column(String)
    price = Column(Float, nullable=False)
    status = Column(Enum(ProductStatus), default=ProductStatus.in_stock)
    stock = Column(Integer, default=0)
    preorder_count = Column(Integer, default=0)
    preview = Column(String)
    images = Column(ARRAY(String), default=[])