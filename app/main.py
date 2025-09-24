from fastapi import FastAPI
from app.core.database import engine, Base
from app.api.v1 import products, auth, users, cart, promo, orders

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GWC Store API", version="1.0.0")

app.include_router(products.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(cart.router, prefix="/api/v1")
app.include_router(promo.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "GWC Store API"}