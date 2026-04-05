let categories = [];
let items = [];
let selectedCategory = null;
let cart = [];

const API_BASE = "";

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    
    // Initialize Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
    }
});

async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        categories = await response.json();
        renderCategories();
        if (categories.length > 0) {
            fetchItems(categories[0].id);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchItems(catId) {
    selectedCategory = catId;
    renderCategories();
    try {
        const response = await fetch(`${API_BASE}/items/${catId}`);
        items = await response.json();
        renderItems();
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

function renderCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = categories.map(cat => `
        <div class="glass-card category-item ${selectedCategory === cat.id ? 'active' : ''}" 
             onclick="fetchItems(${cat.id})">
            <img src="${cat.image_url}" alt="${cat.name}">
            <p style="font-size: 0.9rem; font-weight: bold;">${cat.name}</p>
        </div>
    `).join('');
}

function renderItems() {
    const grid = document.getElementById('items-grid');
    grid.innerHTML = items.map(item => `
        <div class="glass-card item-card glow-hover">
            <img src="${item.image_url}" alt="${item.name}">
            <div class="item-info">
                <h3 style="font-size: 1rem; margin-bottom: 5px;">${item.name}</h3>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; height: 40px; overflow: hidden;">
                    ${item.description}
                </p>
                <div style="display: flex; justify-content: space-between; alignItems: center;">
                    <span class="gold-text">${item.price.toLocaleString()} sōm</span>
                    <button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" 
                            onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(item) {
    cart.push(item);
    updateCartUI();
}

function updateCartUI() {
    const cartFloat = document.getElementById('cart-float');
    if (cart.length > 0) {
        cartFloat.style.display = 'flex';
        const totalCount = cart.length;
        const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
        
        document.getElementById('cart-count').innerText = `${totalCount} ta mahsulot`;
        document.getElementById('cart-total').innerText = `${totalPrice.toLocaleString()} sōm`;
    } else {
        cartFloat.style.display = 'none';
    }
}

async function submitOrder() {
    const initData = window.Telegram?.WebApp?.initData || "";
    
    // Group items by ID
    const groupedItems = Object.values(cart.reduce((acc, item) => {
        if (!acc[item.id]) {
            acc[item.id] = { id: item.id, quantity: 0 };
        }
        acc[item.id].quantity += 1;
        return acc;
    }, {}));

    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                init_data: initData,
                items: groupedItems
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            alert(`Buyurtma qabul qilindi! ID: ${result.order_id}`);
            cart = [];
            updateCartUI();
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.close();
            }
        } else {
            alert("Xatolik: " + (result.detail || "Noma'lum xato"));
        }
    } catch (error) {
        console.error('Order error:', error);
        alert("Tarmoq xatosi yuz berdi");
    }
}
