from sqlalchemy.orm import Session, joinedload
from app.models.promo import PromoCode, PromoApplicableProduct
from app.schemas.promo import PromoCodeCreate

class PromoCodeRepository:
    @staticmethod
    def get_all(db: Session):
        return db.query(PromoCode).all()

    @staticmethod
    def get_by_name(db: Session, name: str):
        return db.query(PromoCode).filter(PromoCode.name == name).first()

    @staticmethod
    def get_by_id(db: Session, promo_id: int):
        return db.query(PromoCode).filter(PromoCode.id == promo_id).first()

    @staticmethod
    def create(db: Session, promo: PromoCodeCreate):
        db_promo = PromoCode(
            name=promo.name,
            discount=promo.discount,
            usage_limit=promo.usage_limit,
            is_active=promo.is_active,
            applies_to_all=promo.applies_to_all
        )
        
        db.add(db_promo)
        db.commit()
        db.refresh(db_promo)
        
        if not promo.applies_to_all and promo.applicable_product_ids:
            for product_id in promo.applicable_product_ids:
                db_applicable = PromoApplicableProduct(
                    promo_id=db_promo.id,
                    product_id=product_id
                )
                db.add(db_applicable)
        
        db.commit()
        return db_promo

    @staticmethod
    def apply_promo_code(db: Session, promo_name: str, cart):
        promo = db.query(PromoCode).options(
            joinedload(PromoCode.applicable_products)
        ).filter(PromoCode.name == promo_name).first()
        
        if not promo or not promo.is_active:
            return None, "Invalid or inactive promo code"
        
        if promo.usage_limit and promo.usage_count >= promo.usage_limit:
            return None, "Promo code usage limit exceeded"
        
        if not promo.applies_to_all:
            cart_product_ids = [item.product_id for item in cart.items]
            applicable_product_ids = [product.id for product in promo.applicable_products]
            
            if not any(pid in applicable_product_ids for pid in cart_product_ids):
                return None, "Promo code not applicable to any product in cart"
        
        promo.usage_count += 1
        db.commit()
        
        return promo, None