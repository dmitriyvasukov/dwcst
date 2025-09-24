from sqlalchemy.orm import Session, joinedload
from app.models.cart import Cart, CartItem
from app.models.user import User

class CartRepository:
    @staticmethod
    def get_or_create_cart(db: Session, user_id: int):
        cart = db.query(Cart).options(
            joinedload(Cart.items).joinedload(CartItem.product)
        ).filter(Cart.user_id == user_id).first()
        
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    @staticmethod
    def add_to_cart(db: Session, user_id: int, product_id: int, quantity: int = 1):
        cart = CartRepository.get_or_create_cart(db, user_id)
        
        cart_item = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product_id
        ).first()
        
        if cart_item:
            cart_item.quantity += quantity
        else:
            cart_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
            db.add(cart_item)
        
        db.commit()
        db.refresh(cart_item)
        return cart_item

    @staticmethod
    def update_cart_item(db: Session, user_id: int, item_id: int, quantity: int):
        cart = CartRepository.get_or_create_cart(db, user_id)
        cart_item = db.query(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id
        ).first()
        
        if cart_item:
            if quantity <= 0:
                db.delete(cart_item)
            else:
                cart_item.quantity = quantity
            db.commit()
        
        return cart_item

    @staticmethod
    def clear_cart(db: Session, user_id: int):
        cart = CartRepository.get_or_create_cart(db, user_id)
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        cart.promo_code_id = None
        db.commit()
        return cart