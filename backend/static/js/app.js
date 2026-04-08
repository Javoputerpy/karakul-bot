/* =========================================
   ZENITH MASTERPIECE VISUAL ENGINE
   The Orchestrator of Elegance
   ========================================= */

const API_BASE = window.location.origin;
const tg = window.Telegram?.WebApp;

let cart = [];
let items = [];
let categories = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let currentLang = localStorage.getItem('lang') || 'uz';
let currentTheme = localStorage.getItem('theme') || 'dark';
let selectedCategoryId = 'all';
let map, marker;
let userLocation = {lat: null, lng: null};

const i18n = {
    uz: {
        welcome: "Xush kelibsiz!",
        slogan: "HAR BIR LUQMADA NAFOSAT",
        search: "Qidirish...",
        specials: "Maxsus Takliflar",
        add: "QO'SHISH",
        checkout: "BUYURTMA BERISH",
        success: "Buyurtma qabul qilindi!",
        error: "Xatolik yuz berdi",
        items_count: "ta mahsulot"
    },
    en: {
        welcome: "Welcome!",
        slogan: "ELEGANCE IN EVERY BITE",
        search: "Search...",
        specials: "Special Offers",
        add: "ADD TO CART",
        checkout: "PLACE ORDER",
        success: "Order received!",
        error: "An error occurred",
        items_count: "items"
    }
};

const app = {
    /* --- INITIALIZATION ENGINE --- */
    init: async () => {
        if (tg) {
            tg.expand();
            tg.ready();
            tg.headerColor = currentTheme === 'dark' ? '#020617' : '#f8fafc';
        }

        // Sync Profile from Sovereign Backend
        const user = tg?.initDataUnsafe?.user;
        if (user) {
            try {
                const res = await fetch(`${API_BASE}/user/${user.id}`);
                if (res.ok) {
                    const dbUser = await res.json();
                    if (dbUser.full_name) localStorage.setItem('user_name', dbUser.full_name);
                    if (dbUser.phone) localStorage.setItem('user_phone', dbUser.phone);
                }
            } catch(e) {}
        }

        app.applyTheme();
        app.applyLang();
        await app.fetchData();
        app.renderUI();
        
        // Final Polish: Lucide & Entrance
        lucide.createIcons();
        document.body.style.opacity = '1';
    },

    /* --- DATA ORCHESTRATION --- */
    fetchData: async () => {
        try {
            const [cRes, iRes] = await Promise.all([
                fetch(`${API_BASE}/categories`),
                fetch(`${API_BASE}/items/all`)
            ]);
            if (!cRes.ok || !iRes.ok) throw new Error("API synchrony failure");
            
            categories = await cRes.json();
            items = await iRes.json();
        } catch (e) {
            console.error("Zenith Engine: Data fetch error", e);
            app.showErrorState();
        }
    },

    /* --- RENDERING PIPELINE --- */
    renderUI: () => {
        app.renderCategories();
        app.renderSpecials();
        app.renderItems(items);
    },

    renderCategories: () => {
        const container = document.getElementById('category-chips');
        if (!container) return;
        
        const allChip = {id: 'all', name: currentLang === 'uz' ? 'Barchasi' : 'All'};
        const list = [allChip, ...categories];
        
        container.innerHTML = list.map((cat, index) => `
            <div class="cat-chip ${selectedCategoryId == cat.id ? 'active' : ''}" 
                 onclick="app.selectCategory('${cat.id}')"
                 style="animation-delay: ${index * 0.1}s">
                <div class="cat-icon z-shadow-glow">
                    ${cat.image_url ? `<img src="${cat.image_url}">` : '<i data-lucide="layout-grid"></i>'}
                </div>
                <p>${cat.name}</p>
            </div>
        `).join('');
        lucide.createIcons();
    },

    renderSpecials: () => {
        const container = document.getElementById('specials-list');
        if (!container) return;
        const specials = items.slice(0, 4);
        container.innerHTML = specials.map((item, index) => `
            <div class="glass special-card anim-scale-in" 
                 onclick="app.openDetails(${item.id})"
                 style="animation-delay: ${index * 0.15}s">
                <img src="${item.image_url}" alt="${item.name}">
                <div class="special-content">
                    <h3 class="gold-text">${item.name}</h3>
                    <p style="color: var(--zenith-accent-gold); font-weight: 900;">${item.price.toLocaleString()} sōm</p>
                </div>
            </div>
        `).join('');
    },

    renderItems: (data) => {
        const t = i18n[currentLang];
        const container = document.getElementById('product-list');
        if (!container) return;

        container.innerHTML = data.map((item, index) => {
            const inCart = cart.find(i => i.id === item.id);
            const actionBtn = inCart ? `
                <div class="qty-control anim-scale-in">
                    <button class="qty-btn" onclick="app.changeQty(${item.id}, -1)"><i data-lucide="minus"></i></button>
                    <span class="qty-num">${inCart.quantity}</span>
                    <button class="qty-btn plus" onclick="app.changeQty(${item.id}, 1)"><i data-lucide="plus"></i></button>
                </div>
            ` : `
                <button class="btn-primary anim-fade-in" style="animation-delay: 0.1s" onclick="app.addToCart(${item.id})">
                    ${t.add}
                </button>
            `;

            return `
                <div class="glass product-card anim-fade-in" style="animation-delay: ${(index % 4) * 0.1}s">
                    <div class="product-fav ${favorites.includes(item.id) ? 'active' : ''}" onclick="app.toggleFav(${item.id}, event)">
                        <i data-lucide="heart" style="width: 18px;"></i>
                    </div>
                    <div class="product-img-box" onclick="app.openDetails(${item.id})">
                        <img src="${item.image_url}" alt="${item.name}" loading="lazy">
                    </div>
                    <div class="product-body">
                        <div class="product-price">${item.price.toLocaleString()} sōm</div>
                        <div class="product-title">${item.name}</div>
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    },

    /* --- INTERACTION ENGINE --- */
    selectCategory: (id) => {
        selectedCategoryId = id;
        app.renderCategories();
        const filtered = id === 'all' ? items : items.filter(i => i.category_id == id);
        app.renderItems(filtered);
    },

    changeQty: (id, delta) => {
        const inCart = cart.find(i => i.id === id);
        if (inCart) {
            inCart.quantity += delta;
            if (inCart.quantity <= 0) cart = cart.filter(i => i.id !== id);
        } else if (delta > 0) {
            const item = items.find(i => i.id === id);
            cart.push({...item, quantity: 1});
        }
        
        app.updateCartUI();
        const filtered = selectedCategoryId === 'all' ? items : items.filter(i => i.category_id == selectedCategoryId);
        app.renderItems(filtered);
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(delta > 0 ? 'medium' : 'light');
        }
    },

    addToCart: (id) => app.changeQty(id, 1),

    updateCartUI: () => {
        const t = i18n[currentLang];
        const count = cart.reduce((sum, i) => sum + i.quantity, 0);
        const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        const float = document.getElementById('cart-float');
        if (count > 0) {
            float.style.display = 'flex';
            document.getElementById('cart-count').innerText = `${count} ${t.items_count}`;
            document.getElementById('cart-total').innerText = `${total.toLocaleString()} sōm`;
        } else {
            float.style.display = 'none';
        }
        
        const fp = document.getElementById('final-price');
        if (fp) fp.innerText = `${total.toLocaleString()} sōm`;
    },

    /* --- MODAL & OVERLAY SYSTEMS --- */
    toggleCheckout: (show) => {
        const overlay = document.getElementById('checkout-overlay');
        overlay.style.display = show ? 'flex' : 'none';
        if (show) {
            app.renderCartList();
            setTimeout(() => app.initMap(), 100);
            
            // Populate profile
            document.getElementById('cust-name').value = localStorage.getItem('user_name') || "";
            document.getElementById('cust-phone').value = localStorage.getItem('user_phone') || "+998 ";
        }
    },

    renderCartList: () => {
        const container = document.getElementById('checkout-items');
        container.innerHTML = cart.map(item => `
            <div class="glass anim-fade-in" style="padding: 18px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="font-size: 1rem; font-weight: 800;">${item.name}</h4>
                    <p class="z-text-gold">${item.price.toLocaleString()} x ${item.quantity}</p>
                </div>
                <div class="qty-control" style="background: var(--zenith-glass-bg); padding: 4px;">
                    <button class="qty-btn" onclick="app.changeQtyInCart(${item.id}, -1)"><i data-lucide="minus"></i></button>
                    <span class="qty-num" style="font-size: 1rem;">${item.quantity}</span>
                    <button class="qty-btn plus" onclick="app.changeQtyInCart(${item.id}, 1)"><i data-lucide="plus"></i></button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    changeQtyInCart: (id, delta) => {
        app.changeQty(id, delta);
        app.renderCartList();
        
        // Re-render open detail if it is open
        const detailsOverlay = document.getElementById('item-details');
        if(detailsOverlay.style.display === 'flex') {
            const currentItemTitle = document.getElementById('detail-body').querySelector('h2')?.innerText;
            const item = items.find(i => i.name === currentItemTitle);
            if(item) app.openDetails(item.id);
        }
    },

    openDetails: (id) => {
        const item = items.find(i => i.id === id);
        if(!item) return;

        const overlay = document.getElementById('item-details');
        const body = document.getElementById('detail-body');
        
        const inCart = cart.find(i => i.id === id);
        const btnHtml = inCart 
            ? `<div class="qty-control" style="background: var(--zenith-bg-deep); padding: 6px;">
                 <button class="qty-btn" onclick="app.changeQty(${item.id}, -1)"><i data-lucide="minus"></i></button>
                 <span class="qty-num">${inCart.quantity}</span>
                 <button class="qty-btn plus" onclick="app.changeQty(${item.id}, 1)"><i data-lucide="plus"></i></button>
               </div>`
            : `<button class="btn-primary" style="padding: 16px; font-size: 1.1rem;" onclick="app.addToCart(${item.id}); app.closeDetails();">Savatga qo'shish</button>`;

        body.innerHTML = `
            <img src="${item.image_url}" style="width:100%; border-radius:var(--zenith-radius-xl); margin-bottom:20px; object-fit: cover;">
            <h2 style="font-size:1.8rem; margin-bottom:8px;">${item.name}</h2>
            <p class="gold-text" style="font-size:1.4rem; margin-bottom:16px;">${item.price.toLocaleString()} sōm</p>
            <p style="color:var(--zenith-accent-dim); margin-bottom:30px; font-size: 0.95rem; line-height: 1.5;">${item.description}</p>
            ${btnHtml}
        `;
        overlay.style.display = 'flex';
        lucide.createIcons();
    },

    closeDetails: () => {
        document.getElementById('item-details').style.display = 'none';
    },

    toggleFav: (id, e) => {
        if(e) e.stopPropagation();
        if(favorites.includes(id)) {
            favorites = favorites.filter(f => f !== id);
        } else {
            favorites.push(id);
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // Re-render current view to reflect heart color change
        const filtered = selectedCategoryId === 'all' ? items : items.filter(i => i.category_id == selectedCategoryId);
        app.renderItems(filtered);
        
        if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    },

    handleSearch: (query) => {
        query = query.toLowerCase();
        if(!query) {
            app.renderItems(selectedCategoryId === 'all' ? items : items.filter(i => i.category_id == selectedCategoryId));
            return;
        }
        const filtered = items.filter(i => i.name.toLowerCase().includes(query) || i.description.toLowerCase().includes(query));
        app.renderItems(filtered);
    },

    /* --- GEOSPATIAL ENGINE --- */
    initMap: () => {
        const mapContainer = document.getElementById('leaflet-map');
        if (mapContainer) mapContainer.classList.remove('shimmer'); // Prevent shimmer from interfering
        
        if (!map) {
            map = L.map('leaflet-map', {zoomControl: false}).setView([39.7747, 64.4286], 13);
            L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=uz&x={x}&y={y}&z={z}').addTo(map);
            
            map.on('click', (e) => {
                userLocation = {lat: e.latlng.lat, lng: e.latlng.lng};
                if (marker) marker.setLatLng(e.latlng);
                else marker = L.marker(e.latlng).addTo(map);
            });
            
            // Auto GPS request on first map load
            app.getGPS(true);
        }
        
        setTimeout(() => { if(map) map.invalidateSize(); }, 400); // Critical for map inside flex overlay
    },

    getGPS: (silent = false) => {
        if (!silent) tg?.MainButton.showProgress();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                userLocation = {lat: pos.coords.latitude, lng: pos.coords.longitude};
                map.setView([userLocation.lat, userLocation.lng], 16);
                if (marker) marker.setLatLng([userLocation.lat, userLocation.lng]);
                else marker = L.marker([userLocation.lat, userLocation.lng]).addTo(map);
                if (!silent) tg?.MainButton.hideProgress();
            }, (error) => {
                if (!silent) {
                    alert("GPS orqali joylashuvni aniqlab bo'lmadi. GPS yoniqligini tekshiring.");
                    tg?.MainButton.hideProgress();
                }
            });
        }
    },

    /* --- ORDER SUBMISSION --- */
    isPlacingOrder: false,
    placeOrder: async () => {
        if (app.isPlacingOrder || cart.length === 0) return;
        
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const comment = document.getElementById('order-comment').value;

        if (!name || phone.length < 9) return alert("Ma'lumotlarni to'liq kiriting");
        if (!userLocation.lat) return alert("Manzilni belgilang");

        app.isPlacingOrder = true;
        const btn = document.getElementById('btn-place-order');
        btn.innerText = "YUBORILMOQDA...";
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    init_data: tg?.initData || "debug_mode",
                    name, phone, comment,
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    items: cart.map(i => ({id: i.id, quantity: i.quantity}))
                })
            });
            if (res.ok) {
                alert(i18n[currentLang].success);
                cart = [];
                app.updateCartUI();
                app.toggleCheckout(false);
            }
        } catch (e) {
            alert("Xatolik yuz berdi");
        } finally {
            app.isPlacingOrder = false;
            btn.innerText = i18n[currentLang].checkout;
            btn.disabled = false;
        }
    },

    /* --- UTILITIES --- */
    toggleLang: () => {
        currentLang = currentLang === 'uz' ? 'en' : 'uz';
        localStorage.setItem('lang', currentLang);
        app.applyLang();
        app.renderUI();
    },

    toggleTheme: () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        app.applyTheme();
    },

    applyTheme: () => {
        document.documentElement.setAttribute('data-theme', currentTheme);
        const icon = document.getElementById('theme-icon');
        if (icon) icon.setAttribute('data-lucide', currentTheme === 'dark' ? 'sun' : 'moon');
        lucide.createIcons();
    },

    applyLang: () => {
        const t = i18n[currentLang];
        document.getElementById('lang-indicator').innerText = currentLang.toUpperCase();
        document.getElementById('txt-welcome').innerText = t.welcome;
        document.getElementById('txt-slogan').innerText = t.slogan;
        document.getElementById('main-search').placeholder = t.search;
        document.getElementById('txt-specials-title').innerText = t.specials;
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
        
        const specialsArea = document.getElementById('specials-area');
        const catSlider = document.getElementById('category-chips');
        const searchBox = document.querySelector('.search-box');
        
        if (specialsArea) specialsArea.style.display = (tabId === 'home') ? 'block' : 'none';
        if (catSlider) catSlider.style.display = (tabId === 'home') ? 'flex' : 'none';
        if (searchBox) searchBox.style.display = (tabId === 'home') ? 'block' : 'none';

        if (tabId === 'home') {
            app.selectCategory('all');
        } else if (tabId === 'favs') {
            app.renderItems(items.filter(i => favorites.includes(i.id)));
        } else if (tabId === 'history') {
            app.renderHistory();
        } else if (tabId === 'profile') {
            app.renderProfile();
        }
    },

    /* --- PROFILE & HISTORY --- */
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
                <div class="glass anim-fade-in" style="grid-column: 1/-1; padding: 20px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 800;">ID: #${o.id}</span>
                        <span class="gold-text">${o.status.toUpperCase()}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 8px;">
                        ${new Date(o.created_at).toLocaleString()}
                    </div>
                    <div style="font-size: 0.9rem; border-top: 1px solid var(--zenith-glass-border); padding-top: 8px;">
                        ${o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>
                    <div style="text-align: right; font-weight: 900; margin-top: 8px; font-size: 1.1rem; color: var(--zenith-accent-gold);">
                        ${o.total_price.toLocaleString()} sōm
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = `<p>Xatolik yuz berdi</p>`;
        }
    },

    renderProfile: () => {
        const user = tg?.initDataUnsafe?.user || {first_name: "Mehmon", last_name: "", username: "guest", id: 123456789};
        const container = document.getElementById('product-list');
        container.innerHTML = `
            <div class="glass anim-scale-in" style="grid-column: 1/-1; padding: 20px; text-align: center; margin-top: 20px; margin-bottom: 120px;">
                <div class="z-shadow-glow" style="width: 100px; height: 100px; background: var(--zenith-accent-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2.5rem; color: #000; font-weight: 900;">
                    ${user.first_name[0]}
                </div>
                <h2 class="gold-text" style="font-size: 1.8rem; margin-bottom: 4px;">${user.first_name} ${user.last_name || ""}</h2>
                <p style="color: var(--zenith-accent-dim); margin-bottom: 24px;">@${user.username || "guest"}</p>
                
                <div style="text-align: left;">
                    <div class="form-group">
                        <label style="font-size: 0.75rem; font-weight: 800; color: var(--zenith-accent-dim); margin-left: 10px; display: block; margin-bottom: 6px;">ISM</label>
                        <input type="text" id="prof-name" class="form-input" value="${localStorage.getItem('user_name') || ''}">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 0.75rem; font-weight: 800; color: var(--zenith-accent-dim); margin-left: 10px; display: block; margin-bottom: 6px;">TEL</label>
                        <input type="tel" id="prof-phone" class="form-input" value="${localStorage.getItem('user_phone') || '+998 '}">
                    </div>
                    <button class="btn-primary" style="margin-top: 10px;" onclick="app.saveProfile()">SAQLASH</button>
                </div>
            </div>
        `;
    },

    saveProfile: async () => {
        const name = document.getElementById('prof-name').value;
        const phone = document.getElementById('prof-phone').value;
        const userId = tg?.initDataUnsafe?.user?.id || 123456789;

        // Unconditionally save to local storage for instant frontend use
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_phone', phone);

        try {
            const res = await fetch(`${API_BASE}/user/update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: userId, full_name: name, phone})
            });
            alert(currentLang === 'uz' ? "Saqlandi!" : "Saved!");
        } catch(e) { } // Even if offline, local storage has the data
    }
};

window.onload = app.init;
