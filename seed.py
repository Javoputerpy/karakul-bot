from backend.database import SessionLocal, Category, Item, init_db

def seed():
    init_db()
    db = SessionLocal()
    
    # 1. Categories
    cats_data = [
        ("Dengiz Mahsulotlari", "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800"),
        ("Asosiy Taomlar", "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800"),
        ("Ichimliklar", "https://images.unsplash.com/photo-1544145945-f904253db0ad?q=80&w=800"),
        ("Shirinliklar", "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800"),
        ("Salatlar", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800")
    ]
    
    cat_objs = {}
    for name, img in cats_data:
        cat = db.query(Category).filter(Category.name == name).first()
        if not cat:
            cat = Category(name=name, image_url=img)
            db.add(cat)
            db.flush()
        cat_objs[name] = cat.id
    
    # 2. Items
    items_data = [
        # Dengiz Mahsulotlari
        ("Oltin Baliq Maxsus", "Tandirda pishirilgan yangi oltin baliq, limon va maxsus ziravorlar bilan.", 125000, "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800", "Dengiz Mahsulotlari"),
        ("Qirol Krevetkalari", "Grilda pishirilgan yirik krevetkalar, sarimsoqli sous bilan.", 180000, "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?q=80&w=800", "Dengiz Mahsulotlari"),
        
        # Asosiy Taomlar
        ("Premium Steak", "Yumshoq mol go'shti, Rozmarin va sariyog'da qovurilgan.", 250000, "https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=800", "Asosiy Taomlar"),
        ("Tovuq Tabaka", "Maxsus sousda marinadlangan qisir-qisir tovuq.", 85000, "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800", "Asosiy Taomlar"),
        
        # Ichimliklar
        ("Moxito", "Yalpiz, laym va sovuq gazlangan suv.", 35000, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800", "Ichimliklar"),
        ("Uy Limonadi", "Tabiiy limon sharbati va asalli muz.", 25000, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800", "Ichimliklar"),
        
        # Shirinliklar
        ("Chocolate Fondant", "Issiq shokoladli vulqon, qaymoqli muzqaymoq bilan.", 55000, "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?q=80&w=800", "Shirinliklar"),
        ("Tiramisu", "Italiya klassik shirinligi, espresso va maskarpone bilan.", 45000, "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800", "Shirinliklar")
    ]
    
    for name, desc, price, img, cat_name in items_data:
        cat_id = cat_objs.get(cat_name)
        if cat_id:
            item = db.query(Item).filter(Item.name == name).first()
            if not item:
                item = Item(name=name, description=desc, price=price, image_url=img, category_id=cat_id)
                db.add(item)
            else:
                item.description = desc
                item.price = price
                item.image_url = img
                item.category_id = cat_id
    
    db.commit()
    db.close()
    print("Database seeded with premium images successfully!")

if __name__ == "__main__":
    seed()
