from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.repositories.product_repo import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return ProductRepository.get_all(db)

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = ProductRepository.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductOut)
def create_product(product: ProductCreate, db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    return ProductRepository.create(db, product)

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    updated = ProductRepository.update(db, product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/{product_id}", response_model=ProductOut)
def delete_product(product_id: int, db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    deleted = ProductRepository.delete(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return deleted