from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from . import database, auth
from pydantic import BaseModel
from typing import List, Optional, Dict

app = FastAPI(title="Oltin Baliq API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

@app.api_route("/", methods=["GET", "HEAD"])
async def read_root():
    """Serve the React frontend."""
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Oltin Baliq API is running. Frontend not built yet."}

@app.get("/health")
async def health_check():
    """Health check for Render."""
    return {"status": "healthy"}

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup():
    database.init_db()

# Basic Schemas
class CategorySchema(BaseModel):
    id: int
    name: str
    image_url: Optional[str]
    class Config:
        orm_mode = True

class ItemSchema(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    category_id: int
    class Config:
        orm_mode = True

@app.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    return db.query(database.Category).all()

@app.get("/items/{category_id}", response_model=List[ItemSchema])
def get_items(category_id: int, db: Session = Depends(get_db)):
    return db.query(database.Item).filter(database.Item.category_id == category_id).all()

class OrderCreate(BaseModel):
    init_data: str
    items: List[Dict] # {item_id, quantity}

@app.post("/orders")
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Validate Telegram Data
    if not auth.validate_init_data(order_data.init_data):
        # For development, we might skip this if the init_data is empty
        if order_data.init_data:
            raise HTTPException(status_code=401, detail="Invalid initData")
    
    # In a real app, extract user_id from init_data
    # For now, create a dummy order
    new_order = database.Order(user_id=1, total_price=0) # user_id 1 should exist or be created
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    total = 0
    for item in order_data.items:
        db_item = db.query(database.Item).filter(database.Item.id == item["id"]).first()
        if db_item:
            order_item = database.OrderItem(
                order_id=new_order.id,
                item_id=db_item.id,
                quantity=item.get("quantity", 1),
                price=db_item.price
            )
            total += db_item.price * item.get("quantity", 1)
            db.add(order_item)
    
    new_order.total_price = total
    db.commit()
    
    return {"order_id": new_order.id, "total": total}
