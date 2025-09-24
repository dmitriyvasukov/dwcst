from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.repositories.promo_repo import PromoCodeRepository
from app.schemas.promo import PromoCodeCreate, PromoCodeOut, PromoCodeUpdate

router = APIRouter(prefix="/promo-codes", tags=["promo-codes"])

@router.get("/", response_model=list[PromoCodeOut])
def get_all_promo_codes(db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    return PromoCodeRepository.get_all(db)

@router.post("/", response_model=PromoCodeOut)
def create_promo_code(promo: PromoCodeCreate, db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    if PromoCodeRepository.get_by_name(db, promo.name):
        raise HTTPException(status_code=400, detail="Promo code with this name already exists")
    return PromoCodeRepository.create(db, promo)

@router.put("/{promo_id}", response_model=PromoCodeOut)
def update_promo_code(promo_id: int, promo: PromoCodeUpdate, db: Session = Depends(get_db), admin: bool = Depends(require_admin)):
    db_promo = PromoCodeRepository.get_by_id(db, promo_id)
    if not db_promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    update_data = promo.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_promo, field, value)
    
    db.commit()
    db.refresh(db_promo)
    return db_promo