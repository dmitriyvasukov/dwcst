from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.v1 import products, auth, users, cart, promo, orders, upload

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GWC Store API", version="1.0.0")

# Настройка CORS - ОБНОВЛЕННАЯ ВЕРСИЯ
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],  # Все адреса вашего фронтенда
    allow_credentials=True,
    allow_methods=["*"],  # Разрешить все методы
    allow_headers=["*"],  # Разрешить все заголовки
)

app.include_router(products.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(cart.router, prefix="/api/v1")
app.include_router(promo.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "GWC Store API"}