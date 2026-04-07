from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from sqlalchemy.orm import Session
import os
import sys
import os
# Add parent directory to path to allow import backend.x
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from . import database, auth
except ImportError:
    try:
        import database, auth
    except ImportError:
        import backend.database as database
        import backend.auth as auth
from typing import List, Optional, Dict

app = Flask(__name__, 
            static_folder="static", 
            template_folder="templates")
CORS(app)

# Routes
@app.route("/")
def read_root():
    """Serve the frontend."""
    return render_template("index.html")

@app.route("/health")
def health_check():
    """Health check for Render."""
    return jsonify({"status": "healthy"})

# Database Session Context
def get_db():
    db = database.SessionLocal()
    try:
        return db
    finally:
        pass # Handle closure manually in Flask context if needed or via @app.teardown_appcontext

@app.teardown_appcontext
def shutdown_session(exception=None):
    # This ensures session is closed after each request
    pass 

@app.route('/admin-panel')
def admin_panel():
    return render_template('admin.html')

@app.route("/categories", methods=["GET"])
def get_categories():
    db = database.SessionLocal()
    categories = db.query(database.Category).all()
    result = []
    for cat in categories:
        result.append({
            "id": cat.id,
            "name": cat.name,
            "image_url": cat.image_url
        })
    db.close()
    return jsonify(result)

@app.route("/items/all", methods=["GET"])
def get_all_items():
    db = database.SessionLocal()
    items = db.query(database.Item).all()
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "image_url": item.image_url,
            "category_id": item.category_id
        })
    db.close()
    return jsonify(result)

@app.route("/items/<int:category_id>", methods=["GET"])
def get_items(category_id):
    db = database.SessionLocal()
    items = db.query(database.Item).filter(database.Item.category_id == category_id).all()
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "image_url": item.image_url,
            "category_id": item.category_id
        })
    db.close()
    return jsonify(result)

@app.route("/orders", methods=["POST"])
def create_order():
    data = request.json
    db = database.SessionLocal()
    
    init_data = data.get("init_data")
    items_data = data.get("items", [])

    # Validate Telegram Data
    if not auth.validate_init_data(init_data):
        db.close()
        return jsonify({"detail": "Invalid Telegram data"}), 401
    
    # Extract user info
    user_data = auth.parse_init_data_user(init_data)
    if not user_data or 'id' not in user_data:
        db.close()
        return jsonify({"detail": "User data missing in initData"}), 400
    
    tg_user_id = user_data['id']
    full_name = user_data.get('first_name', '')
    if user_data.get('last_name'):
        full_name += f" {user_data['last_name']}"
    
    # Sync User
    db_user = db.query(database.User).filter(database.User.id == tg_user_id).first()
    if not db_user:
        db_user = database.User(
            id=tg_user_id,
            full_name=data.get('name') or full_name,
            username=user_data.get('username'),
            phone=data.get('phone')
        )
        db.add(db_user)
    else:
        if data.get('name'): db_user.full_name = data.get('name')
        if data.get('phone'): db_user.phone = data.get('phone')
        db_user.username = user_data.get('username')
    
    db.commit()
    db.refresh(db_user)
    
    # Create Order
    new_order = database.Order(
        user_id=db_user.id, 
        total_price=0,
        lat=data.get('lat'),
        lng=data.get('lng')
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    total = 0
    for item_entry in items_data:
        db_item = db.query(database.Item).filter(database.Item.id == item_entry["id"]).first()
        if db_item:
            order_item = database.OrderItem(
                order_id=new_order.id,
                item_id=db_item.id,
                quantity=item_entry["quantity"],
                price=db_item.price
            )
            total += db_item.price * item_entry["quantity"]
            db.add(order_item)
    
    new_order.total_price = total
    db.commit()
    db.close()
    
    return jsonify({"order_id": new_order.id, "total": total, "status": "success"})

@app.route('/orders/user/<int:user_id>', methods=['GET'])
def get_user_orders(user_id):
    db = database.SessionLocal()
    orders = db.query(database.Order).filter(database.Order.user_id == user_id).order_by(database.Order.created_at.desc()).all()
    result = []
    for o in orders:
        items_list = [{"name": oi.item.name, "quantity": oi.quantity} for oi in o.items]
        result.append({
            "id": o.id,
            "total_price": o.total_price,
            "status": o.status,
            "created_at": o.created_at.isoformat(),
            "items": items_list
        })
    db.close()
    return jsonify(result)

@app.route('/admin/orders', methods=['GET'])
def get_all_orders():
    db = database.SessionLocal()
    orders = db.query(database.Order).order_by(database.Order.created_at.desc()).all()
    result = []
    for o in orders:
        result.append({
            "id": o.id,
            "user_id": o.user_id,
            "user_name": o.user.full_name if o.user else "Unknown",
            "phone": o.user.phone if o.user else "",
            "total_price": o.total_price,
            "status": o.status,
            "lat": o.lat,
            "lng": o.lng,
            "created_at": o.created_at.isoformat(),
            "items": [{"name": oi.item.name, "quantity": oi.quantity} for oi in o.items]
        })
    db.close()
    return jsonify(result)

@app.route('/admin/orders/<int:order_id>/status', methods=['POST'])
def update_order_status(order_id):
    data = request.json
    db = database.SessionLocal()
    order = db.query(database.Order).filter(database.Order.id == order_id).first()
    if order:
        order.status = data.get('status', 'pending')
        db.commit()
        db.close()
        return jsonify({"status": "success"})
    db.close()
    return jsonify({"status": "error"}), 404

@app.route('/user/update', methods=['POST'])
def update_user():
    data = request.json
    user_id = data.get('id')
    db = database.SessionLocal()
    user = db.query(database.User).filter(database.User.id == user_id).first()
    if user:
        user.full_name = data.get('full_name', user.full_name)
        user.phone = data.get('phone', user.phone)
        db.commit()
        db.close()
        return jsonify({"status": "success"})
    db.close()
    return jsonify({"status": "error"}), 404

# --- CATEGORY CRUD ---

@app.route('/admin/categories', methods=['POST'])
def add_category():
    data = request.json
    db = database.SessionLocal()
    new_cat = database.Category(name=data['name'], image_url=data['image_url'])
    db.add(new_cat)
    db.commit()
    db.close()
    return jsonify({"status": "success"})

@app.route('/admin/categories/<int:cat_id>', methods=['PUT', 'DELETE'])
def manage_category(cat_id):
    db = database.SessionLocal()
    cat = db.query(database.Category).filter(database.Category.id == cat_id).first()
    if not cat:
        db.close()
        return jsonify({"status": "error"}), 404
    
    if request.method == 'DELETE':
        db.delete(cat)
    elif request.method == 'PUT':
        data = request.json
        cat.name = data.get('name', cat.name)
        cat.image_url = data.get('image_url', cat.image_url)
    
    db.commit()
    db.close()
    return jsonify({"status": "success"})

# --- ITEM CRUD ---

@app.route('/admin/items', methods=['POST'])
def add_item():
    data = request.json
    db = database.SessionLocal()
    new_item = database.Item(
        name=data['name'],
        description=data['description'],
        price=data['price'],
        image_url=data['image_url'],
        category_id=data['category_id']
    )
    db.add(new_item)
    db.commit()
    db.close()
    return jsonify({"status": "success"})

@app.route('/admin/items/<int:item_id>', methods=['PUT', 'DELETE'])
def manage_item(item_id):
    db = database.SessionLocal()
    item = db.query(database.Item).filter(database.Item.id == item_id).first()
    if not item:
        db.close()
        return jsonify({"status": "error"}), 404
    
    if request.method == 'DELETE':
        db.delete(item)
    elif request.method == 'PUT':
        data = request.json
        item.name = data.get('name', item.name)
        item.description = data.get('description', item.description)
        item.price = data.get('price', item.price)
        item.image_url = data.get('image_url', item.image_url)
        item.category_id = data.get('category_id', item.category_id)
    
    db.commit()
    db.close()
    return jsonify({"status": "success"})

if __name__ == "__main__":
    database.init_db()
    app.run(host="0.0.0.0", port=8000, debug=True)
