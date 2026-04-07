const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

const API_BASE = "";
let currentLang = localStorage.getItem('lang') || 'uz';
let currentTheme = localStorage.getItem('theme') || 'dark';
let categories = [];
let items = [];
let cart = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let selectedCategoryId = 'all';
let map, marker;

const i18n = {
    uz: {
        welcome: "Xush kelibsiz!",
        slogan: "HAR BIR LUQMADA NAFOSAT",
        specials: "Maxsus Takliflar",
        search: "Qidirish...",
        all: "Barchasi",
        add: "Qo'shish",
        cart: "Savat",
        items_count: "ta mahsulot",
        order: "Buyurtma berish",
        name: "Ismingiz",
        phone: "Telefon raqamingiz",
        gps: "GPS orqali aniqlash",
        map_hint: "Xaritadan manzilni belgilang",
        total: "To'lov miqdori:",
        contact: "Mijoz ma'lumotlari",
        success: "Buyurtma qabul qilindi!",
        error: "Xatolik yuz berdi"
    },
    en: {
        welcome: "Welcome!",
        slogan: "ELEGANCE IN EVERY BITE",
        specials: "Special Offers",
        search: "Search...",
        all: "All",
        add: "Add",
        cart: "Cart",
        items_count: "items",
        order: "Place Order",
        name: "Your Name",
        phone: "Your Phone",
        gps: "Locate via GPS",
        map_hint: "Pin your location on map",
        total: "Total Payment:",
        contact: "Contact Info",
        success: "Order Placed!",
        error: "An error occurred"
    }
};

const app = {
    init: async () => {
        app.applyTheme();
        app.applyLang();
        await app.fetchData();
        app.initMap();
        lucide.createIcons();
    },

    fetchData: async () => {
        try {
            const [cRes, iRes] = await Promise.all([
                fetch(`${API_BASE}/categories`),
                fetch(`${API_BASE}/items/all`)
            ]);
            if (!cRes.ok || !iRes.ok) throw new Error("API failed");
            
            categories = await cRes.json();
            items = await iRes.json();
            app.renderCategories();
            app.renderSpecials();
            app.handleSearch('');
        } catch (e) {
            console.error("Data fetch error", e);
            document.getElementById('product-list').innerHTML = `
                <div style="grid-column: 1/-1; padding: 40px; text-align: center;">
                    <p style="color: var(--text-dim);">Bog'lanishda xatolik yuz berdi.<br>Iltimos, qaytadan urinib ko'ring.</p>
                    <button class="btn-primary" style="margin-top: 20px; width: auto; padding: 12px 24px;" onclick="location.reload()">Qayta yuklash</button>
                </div>
            `;
        } finally {
            lucide.createIcons();
        }
    },

    applyTheme: () => {
        document.documentElement.setAttribute('data-theme', currentTheme);
        const icon = document.getElementById('theme-icon');
        if (icon) icon.setAttribute('data-lucide', currentTheme === 'dark' ? 'sun' : 'moon');
        localStorage.setItem('theme', currentTheme);
        lucide.createIcons();
    },

    toggleTheme: () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        app.applyTheme();
    },

    applyLang: () => {
        const t = i18n[currentLang];
        document.getElementById('lang-indicator').innerText = currentLang.toUpperCase();
        document.getElementById('txt-welcome').innerText = t.welcome;
        document.getElementById('txt-slogan').innerText = t.slogan;
        document.getElementById('txt-specials-title').innerText = t.specials;
        document.getElementById('main-search').placeholder = t.search;
        document.getElementById('txt-cart-header').innerText = t.cart;
        document.getElementById('txt-contact-title').innerText = t.contact;
        document.getElementById('txt-total-pay').innerText = t.total;
        document.getElementById('cust-name').placeholder = t.name;
        document.getElementById('cust-phone').placeholder = t.phone;
        document.getElementById('loc-indicator').innerText = t.map_hint;
        localStorage.setItem('lang', currentLang);
        app.renderCategories();
        app.renderItems(items);
    },

    toggleLang: () => {
        currentLang = currentLang === 'uz' ? 'en' : 'uz';
        app.applyLang();
    },

    renderCategories: () => {
        const t = i18n[currentLang];
        const container = document.getElementById('category-chips');
        let html = `
            <div class="glass cat-chip ${selectedCategoryId === 'all' ? 'active' : ''}" onclick="app.selectCategory('all')">
                <div class="cat-icon"><i data-lucide="layout-grid"></i></div>
                <p style="font-size: 0.75rem;">${t.all}</p>
            </div>
        `;
        categories.forEach(cat => {
            html += `
                <div class="glass cat-chip ${selectedCategoryId === cat.id ? 'active' : ''}" onclick="app.selectCategory(${cat.id})">
                    <img src="${cat.image_url}" alt="${cat.name}" loading="lazy">
                    <p style="font-size: 0.75rem;">${cat.name}</p>
                </div>
            `;
        });
        container.innerHTML = html;
        lucide.createIcons();
    },

    renderSpecials: () => {
        const container = document.getElementById('specials-list');
        const specials = items.slice(0, 3);
        container.innerHTML = specials.map(item => `
            <div class="glass special-card" onclick="app.openDetails(${item.id})">
                <img src="${item.image_url}" alt="${item.name}">
                <div class="special-content">
                    <h3 style="font-size: 0.9rem;">${item.name}</h3>
                    <p style="color: var(--accent-gold); font-weight: 800;">${item.price.toLocaleString()} sōm</p>
                </div>
            </div>
        `).join('');
    },

    selectCategory: (id) => {
        selectedCategoryId = id;
        app.renderCategories();
        const filtered = id === 'all' ? items : items.filter(i => i.category_id === id);
        app.renderItems(filtered);
    },

    renderItems: (data) => {
        const t = i18n[currentLang];
        const container = document.getElementById('product-list');
        container.innerHTML = data.map(item => `
            <div class="glass product-card">
                <div class="product-fav ${favorites.includes(item.id) ? 'active' : ''}" onclick="app.toggleFav(${item.id})">
                    <i data-lucide="heart" style="width: 16px;"></i>
                </div>
                <div class="product-img-box" onclick="app.openDetails(${item.id})">
                    <img src="${item.image_url}" alt="${item.name}" loading="lazy">
                </div>
                <div class="product-body">
                    <div class="product-price">${item.price.toLocaleString()} sōm</div>
                    <div class="product-title">${item.name}</div>
                    <button class="btn-primary" style="margin-top: auto; padding: 10px; font-size: 0.8rem;" onclick="app.addToCart(${item.id})">
                        ${t.add}
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    handleSearch: (query) => {
        const q = query.toLowerCase();
        const filtered = items.filter(item => 
            item.name.toLowerCase().includes(q) || 
            item.description.toLowerCase().includes(q)
        );
        app.renderItems(filtered);
    },

    openDetails: (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const t = i18n[currentLang];
        const body = document.getElementById('detail-body');
        body.innerHTML = `
            <div class="glass" style="overflow: hidden; border-radius: 32px; margin-bottom: 24px;">
                <img src="${item.image_url}" style="width: 100%; height: 300px; object-fit: cover;">
            </div>
            <h2 class="gold-text" style="font-size: 2rem; margin-bottom: 12px;">${item.name}</h2>
            <p style="color: var(--text-dim); margin-bottom: 24px;">${item.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                <span style="font-size: 1.8rem; font-weight: 900; color: var(--accent-gold);">${item.price.toLocaleString()} sōm</span>
                <button class="btn-primary" style="width: auto; padding: 16px 40px;" onclick="app.addToCart(${item.id}); app.closeDetails();">
                    ${t.add}
                </button>
            </div>
        `;
        document.getElementById('item-details').style.display = 'flex';
    },

    closeDetails: () => {
        document.getElementById('item-details').style.display = 'none';
    },

    toggleFav: (id) => {
        const idx = favorites.indexOf(id);
        if (idx > -1) favorites.splice(idx, 1);
        else favorites.push(id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        app.renderItems(items);
    },

    addToCart: (id) => {
        const item = items.find(i => i.id === id);
        const inCart = cart.find(i => i.id === id);
        if (inCart) inCart.quantity++;
        else cart.push({...item, quantity: 1});
        app.updateCartUI();
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    },

    updateCartUI: () => {
        const t = i18n[currentLang];
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        document.getElementById('cart-count').innerText = `${count} ${t.items_count}`;
        document.getElementById('cart-total').innerText = `${total.toLocaleString()} sōm`;
        document.getElementById('final-price').innerText = `${total.toLocaleString()} sōm`;
        document.getElementById('cart-float').style.display = count > 0 ? 'flex' : 'none';
    },

    toggleCheckout: (show) => {
        document.getElementById('checkout-overlay').style.display = show ? 'flex' : 'none';
        if (show) app.renderCartList();
    },

    renderCartList: () => {
        const container = document.getElementById('checkout-items');
        if (cart.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: var(--text-dim);">Savat bo'sh</p>`;
            return;
        }
        container.innerHTML = cart.map(item => `
            <div class="glass" style="padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="font-size: 0.9rem;">${item.name}</h4>
                    <p style="color: var(--accent-gold); font-size: 0.85rem;">${item.price.toLocaleString()} x ${item.quantity}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn" style="padding: 6px;" onclick="app.changeQty(${item.id}, -1)">
                        <i data-lucide="minus" style="width: 14px;"></i>
                    </button>
                    <button class="action-btn" style="padding: 6px;" onclick="app.changeQty(${item.id}, 1)">
                        <i data-lucide="plus" style="width: 14px;"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    changeQty: (id, delta) => {
        const inCart = cart.find(i => i.id === id);
        if (inCart) {
            inCart.quantity += delta;
            if (inCart.quantity <= 0) cart = cart.filter(i => i.id !== id);
        }
        app.updateCartUI();
        app.renderCartList();
    },

    initMap: () => {
        map = L.map('leaflet-map').setView([41.3111, 69.2401], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('click', (e) => {
            if (marker) marker.setLatLng(e.latlng);
            else marker = L.marker(e.latlng).addTo(map);
        });
    },

    getGPS: () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const latlng = [pos.coords.latitude, pos.coords.longitude];
            map.setView(latlng, 16);
            if (marker) marker.setLatLng(latlng);
            else marker = L.marker(latlng).addTo(map);
        });
    },

    isPlacingOrder: false,
    placeOrder: async () => {
        if (app.isPlacingOrder) return;
        
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const btn = document.getElementById('btn-place-order');
        
        if (!name || !phone) return alert("Ism va raqamni kiriting");
        
        const orderData = {
            init_data: tg?.initData || "debug_mode",
            name, phone,
            lat: marker?.getLatLng().lat,
            lng: marker?.getLatLng().lng,
            items: cart.map(i => ({id: i.id, quantity: i.quantity}))
        };

        try {
            app.isPlacingOrder = true;
            btn.disabled = true;
            btn.innerText = "Yuborilmoqda...";
            btn.style.opacity = "0.7";

            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert(i18n[currentLang].success);
                cart = [];
                app.updateCartUI();
                app.toggleCheckout(false);
            }
        } catch (e) {
            alert(i18n[currentLang].error);
        } finally {
            app.isPlacingOrder = false;
            btn.disabled = false;
            btn.innerText = "Buyurtma berish";
            btn.style.opacity = "1";
        }
    },

    switchTab: (tabId) => {
        const tabs = document.querySelectorAll('.tab-link');
        tabs.forEach(t => t.classList.remove('active'));
        
        const tabMap = {
            home: ['menu'],
            favs: currentLang === 'uz' ? ['saralangan', 'fav'] : ['fav'],
            history: currentLang === 'uz' ? ['buyurtmalar', 'order'] : ['order'],
            profile: currentLang === 'uz' ? ['profil', 'profile'] : ['profile']
        };

        const activeTab = Array.from(tabs).find(t => {
            const text = t.innerText.toLowerCase();
            return tabMap[tabId].some(m => text.includes(m));
        });

        if (activeTab) activeTab.classList.add('active');
        
        // Toggle areas
        const specialsArea = document.getElementById('specials-area');
        if (specialsArea) specialsArea.style.display = (tabId === 'home') ? 'block' : 'none';

        if (tabId === 'favs') {
            const filtered = items.filter(i => favorites.includes(i.id));
            app.renderItems(filtered);
        } else if (tabId === 'home') {
            app.selectCategory('all');
        } else if (tabId === 'history') {
            app.renderHistory();
        } else if (tabId === 'profile') {
            app.renderProfile();
        }
    },

    renderHistory: async () => {
        const container = document.getElementById('product-list');
        const userId = tg?.initDataUnsafe?.user?.id || 123456789;
        try {
            const res = await fetch(`${API_BASE}/orders/user/${userId}`);
            const orders = await res.json();
            if (orders.length === 0) {
                container.innerHTML = `<div class="glass" style="grid-column: 1/-1; padding: 40px; text-align: center;">Hozircha buyurtmalar yo'q</div>`;
                return;
            }
            container.innerHTML = orders.map(o => `
                <div class="glass" style="grid-column: 1/-1; padding: 20px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 800;">ID: #${o.id}</span>
                        <span class="gold-text">${o.status.toUpperCase()}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 8px;">
                        ${new Date(o.created_at).toLocaleString()}
                    </div>
                    <div style="font-size: 0.9rem; border-top: 1px solid var(--glass-border); padding-top: 8px;">
                        ${o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>
                    <div style="text-align: right; font-weight: 900; margin-top: 8px; font-size: 1.1rem; color: var(--accent-gold);">
                        ${o.total_price.toLocaleString()} sōm
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = `<p>Xatolik yuz berdi</p>`;
        }
    },

    renderProfile: async () => {
        const container = document.getElementById('product-list');
        const user = tg?.initDataUnsafe?.user || {first_name: "Mehmon", last_name: "", username: "guest", id: 123456789};
        const t = i18n[currentLang];
        
        // Try to get updated data from backend if possible
        let dbUser = { full_name: `${user.first_name} ${user.last_name || ""}`.trim(), phone: "" };
        try {
            const res = await fetch(`${API_BASE}/orders/user/${user.id}`);
            const orders = await res.json();
            // Just a trick to get latest info if they have orders
            if (orders.length > 0) {
                // If we had a real user fetch, we'd use that. For now using local state/form.
            }
        } catch(e){}

        container.innerHTML = `
            <div class="glass" style="grid-column: 1/-1; padding: 32px; text-align: center;">
                <div style="width: 80px; height: 80px; background: var(--accent-gold); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 2rem; color: #000; font-weight: 900;">
                    ${user.first_name[0]}
                </div>
                <h2 style="font-size: 1.4rem; margin-bottom: 4px;">${user.first_name} ${user.last_name || ''}</h2>
                <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 24px;">@${user.username || "noma'lum"}</p>
                
                <div style="text-align: left; margin-bottom: 32px;">
                    <label style="font-size: 0.75rem; color: var(--text-dim); font-weight: 800; margin-left: 8px;">${currentLang === 'uz' ? 'ISM FAMILYA' : 'FULL NAME'}</label>
                    <input type="text" id="prof-name" class="glass" style="width: 100%; padding: 16px; margin-top: 8px; margin-bottom: 16px;" value="${localStorage.getItem('user_name') || dbUser.full_name}">
                    
                    <label style="font-size: 0.75rem; color: var(--text-dim); font-weight: 800; margin-left: 8px;">${currentLang === 'uz' ? 'TELEFON RAQAM' : 'PHONE NUMBER'}</label>
                    <input type="text" id="prof-phone" class="glass" style="width: 100%; padding: 16px; margin-top: 8px; margin-bottom: 16px;" value="${localStorage.getItem('user_phone') || ''}">
                    
                    <button class="btn-primary" onclick="app.saveProfile()" style="margin-top: 8px;">
                        ${currentLang === 'uz' ? 'SAQLASH' : 'SAVE CHANGES'}
                    </button>
                </div>

                <div style="border-top: 1px solid var(--glass-border); padding-top: 24px; text-align: left;">
                    <div class="glass" style="padding: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px; cursor: pointer;" onclick="app.toggleLang()">
                        <i data-lucide="globe" style="width: 20px;"></i>
                        <div style="flex: 1;">${currentLang === 'uz' ? "Tilni o'zgartirish" : "Change Language"}</div>
                        <span style="font-weight: 800; color: var(--accent-gold);">${currentLang.toUpperCase()}</span>
                    </div>
                    <div class="glass" style="padding: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px; cursor: pointer;" onclick="app.toggleTheme()">
                        <i data-lucide="sun" style="width: 20px;"></i>
                        <div style="flex: 1;">${currentLang === 'uz' ? "Mavzu" : "Theme"}</div>
                        <span style="font-weight: 800; color: var(--accent-gold);">${currentTheme.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    saveProfile: async () => {
        const name = document.getElementById('prof-name').value;
        const phone = document.getElementById('prof-phone').value;
        const user_id = tg?.initDataUnsafe?.user?.id || 123456789;

        try {
            const res = await fetch(`${API_BASE}/user/update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: user_id, full_name: name, phone: phone})
            });
            const data = await res.json();
            if (data.status === 'success') {
                localStorage.setItem('user_name', name);
                localStorage.setItem('user_phone', phone);
                alert(currentLang === 'uz' ? "Ma'lumotlar saqlandi!" : "Profile updated!");
            }
        } catch (e) {
            alert(i18n[currentLang].error);
        }
    }
};

window.onload = app.init;
