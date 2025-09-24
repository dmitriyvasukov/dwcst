from sqlalchemy.orm import Session, joinedload
from app.models.order import Order, OrderItem
from app.models.cart import Cart, CartItem

class OrderRepository:
    @staticmethod
    def create_from_cart(db: Session, user_id: int, order_data: dict):
        cart = db.query(Cart).options(
            joinedload(Cart.items).joinedload(CartItem.product)
        ).filter(Cart.user_id == user_id).first()
        
        if not cart or not cart.items:
            return None
        
        total_amount = sum(item.product.price * item.quantity for item in cart.items)
        
        order = Order(
            user_id=user_id,
            total_amount=total_amount,
            promo_code_id=cart.promo_code_id,
            customer_name=order_data.get('customer_name'),
            customer_phone=order_data.get('customer_phone'),
            customer_email=order_data.get('customer_email'),
            delivery_address=order_data.get('delivery_address')
        )
        
        db.add(order)
        db.commit()
        
        for cart_item in cart.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price=cart_item.product.price
            )
            db.add(order_item)
        
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        cart.promo_code_id = None
        db.commit()
        
        return order

    @staticmethod
    def get_user_orders(db: Session, user_id: int):
        return db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product)
        ).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()

    @staticmethod
    def get_order_by_id(db: Session, order_id: int, user_id: int = None):
        query = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product)
        ).filter(Order.id == order_id)
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
            
        return query.first()