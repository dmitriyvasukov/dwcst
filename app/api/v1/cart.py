from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.repositories.cart_repo import CartRepository
from app.repositories.promo_repo import PromoCodeRepository
from app.schemas.promo import ApplyPromoCode

router = APIRouter(prefix="/cart", tags=["cart"])

@router.get("/")
def get_cart(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    cart = CartRepository.get_or_create_cart(db, current_user.id)
    return cart

@router.post("/items")
def add_to_cart(product_id: int, quantity: int = 1, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    CartRepository.add_to_cart(db, current_user.id, product_id, quantity)
    return {"message": "Product added to cart"}

@router.put("/items/{item_id}")
def update_cart_item(item_id: int, quantity: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    CartRepository.update_cart_item(db, current_user.id, item_id, quantity)
    return {"message": "Cart item updated"}

@router.post("/apply-promo")
def apply_promo_code(promo_data: ApplyPromoCode, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    cart = CartRepository.get_or_create_cart(db, current_user.id)
    promo, error = PromoCodeRepository.apply_promo_code(db, promo_data.promo_code, cart)
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    cart.promo_code_id = promo.id
    db.commit()
    return {"message": "Promo code applied successfully"}

@router.delete("/")
def clear_cart(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    CartRepository.clear_cart(db, current_user.id)
    return {"message": "Cart cleared"}