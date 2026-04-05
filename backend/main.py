from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

class OrderItemCreate(BaseModel):
    id: int
    quantity: int

class OrderCreate(BaseModel):
    init_data: str
    items: List[OrderItemCreate]

@app.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    return db.query(database.Category).all()

@app.get("/items/{category_id}", response_model=List[ItemSchema])
def get_items(category_id: int, db: Session = Depends(get_db)):
    return db.query(database.Item).filter(database.Item.category_id == category_id).all()

@app.post("/orders")
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Validate Telegram Data
    if not auth.validate_init_data(order_data.init_data):
        raise HTTPException(status_code=401, detail="Invalid Telegram data")
    
    # Extract user info
    user_data = auth.parse_init_data_user(order_data.init_data)
    if not user_data or 'id' not in user_data:
        raise HTTPException(status_code=400, detail="User data missing in initData")
    
    tg_user_id = user_data['id']
    full_name = user_data.get('first_name', '')
    if user_data.get('last_name'):
        full_name += f" {user_data['last_name']}"
    
    # Sync User
    db_user = db.query(database.User).filter(database.User.id == tg_user_id).first()
    if not db_user:
        db_user = database.User(
            id=tg_user_id,
            full_name=full_name,
            username=user_data.get('username')
        )
        db.add(db_user)
    else:
        db_user.full_name = full_name
        db_user.username = user_data.get('username')
    
    db.commit()
    db.refresh(db_user)
    
    # Create Order
    new_order = database.Order(user_id=db_user.id, total_price=0)
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    total = 0
    for order_item_data in order_data.items:
        db_item = db.query(database.Item).filter(database.Item.id == order_item_data.id).first()
        if db_item:
            order_item = database.OrderItem(
                order_id=new_order.id,
                item_id=db_item.id,
                quantity=order_item_data.quantity,
                price=db_item.price
            )
            total += db_item.price * order_item_data.quantity
            db.add(order_item)
    
    new_order.total_price = total
    db.commit()
    
    return {"order_id": new_order.id, "total": total}
