import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

const API_BASE = window.location.hostname === "localhost" ? "https://public-bees-mate.loca.lt" : "";

function App() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }, []);

  const fetchItems = (catId) => {
    setSelectedCategory(catId);
    axios.get(`${API_BASE}/items/${catId}`)
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  };

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() }]);
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 className="gold-text" style={{ fontSize: '2.5rem' }}>Oltin Baliq</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Elegance in Every Bite</p>
      </header>

      {/* Categories */}
      <section style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '10px' }}>
        {categories.map(cat => (
          <motion.div
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`glass-card ${selectedCategory === cat.id ? 'active' : ''}`}
            style={{ 
              minWidth: '120px', 
              padding: '15px', 
              textAlign: 'center', 
              cursor: 'pointer',
              borderColor: selectedCategory === cat.id ? 'var(--accent-gold)' : 'var(--glass-border)'
            }}
            onClick={() => fetchItems(cat.id)}
          >
            <img src={cat.image_url} alt={cat.name} style={{ width: '50px', height: '50px', borderRadius: '50%', marginBottom: '10px' }} />
            <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{cat.name}</p>
          </motion.div>
        ))}
      </section>

      {/* Items */}
      <section style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={item.id}
              className="glass-card glow-hover"
              style={{ overflow: 'hidden' }}
            >
              <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
              <div style={{ padding: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>{item.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', height: '40px', overflow: 'hidden' }}>{item.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="gold-text">{item.price.toLocaleString()} sōm</span>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Cart Float Button */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="glass-card"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            padding: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(212, 175, 55, 0.9)',
            color: '#000',
            zIndex: 1000
          }}
        >
          <span style={{ fontWeight: 'bold' }}>{cart.length} ta mahsulot</span>
          <span style={{ fontWeight: '800' }}>{cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()} sōm</span>
          <button 
            style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => {
              const initData = window.Telegram?.WebApp?.initData || "";
              axios.post(`${API_BASE}/orders`, {
                init_data: initData,
                items: cart.map(i => ({ id: i.id, quantity: 1 }))
              }).then(res => {
                alert(`Buyurtma qabul qilindi! ID: ${res.data.order_id}`);
                setCart([]);
                window.Telegram?.WebApp?.close();
              }).catch(err => alert("Xatolik yuz berdi"));
            }}
          >
            Buyurtma berish
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default App;
