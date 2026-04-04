from backend.database import SessionLocal, Category, Item, init_db

def seed():
    init_db()
    db = SessionLocal()
    
    # Categories
    seafood = Category(name="Dengiz Mahsulotlari", image_url="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=400")
    drinks = Category(name="Ichimliklar", image_url="https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&q=80&w=400")
    desserts = Category(name="Shirinliklar", image_url="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=400")
    
    db.add_all([seafood, drinks, desserts])
    db.commit()
    
    # Items
    items = [
        Item(name="Oltin Baliq Maxsus", description="Tandirda pishirilgan oltinrang baliq, maxsus ziravorlar bilan.", price=125000.0, image_url="https://images.unsplash.com/photo-1594005254530-5febdd994f38?auto=format&fit=crop&q=80&w=400", category_id=seafood.id),
        Item(name="Gril Somon", description="Yumshoq somon balig'i, limon va ismaloq bilan.", price=95000.0, image_url="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400", category_id=seafood.id),
        Item(name="Golden Fizz", description="Tsitrusli va yaltiroq oltin rangli kokteyl.", price=35000.0, image_url="https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=400", category_id=drinks.id),
        Item(name="Okean Marvaridi", description="Oq shokoladli va ko'k rezavorli desert.", price=45000.0, image_url="https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400", category_id=desserts.id),
    ]
    
    db.add_all(items)
    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed()
