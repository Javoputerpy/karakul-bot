# 🚀 Oltin Baliq - Render Unified Deployment Guide

Ushbu yo'riqnoma orqali siz **Veb-sayt** va **Telegram Botni** bitta Render xizmatida (Web Service) ishga tushirishingiz mumkin. Bu usul bepul va ma'lumotlar bazasini oson sinxronizatsiya qilish imkonini beradi.

## 1. Tayyorgarlik

1.  Loyihani GitHub-ga yuklang.
2.  Render Dashboard-ga kiring: [dashboard.render.com](https://dashboard.render.com).

## 2. Render-da sozlash

1.  **New** -> **Blueprint** tugmasini bosing.
2.  GitHub repositoriyangizni ulang.
3.  Render avtomatik ravishda `render.yaml` faylini topadi.
4.  **Environment Variables** bo'limida quyidagilarni kiriting:
    *   `BOT_TOKEN`: Telegram bot tokeringiz.
    *   `WEBAPP_URL`: Render bergan sayt manzili (masalan: `https://oltin-baliq-all.onrender.com`).

## 3. Qanday ishlaydi?

-   **`run_all.py`**: Bu skript bir vaqtning o'zida ham Flask saytini, ham Telegram botni ishga tushiradi.
-   **Persistent Disk**: Render-dagi "Disk" xizmati orqali SQLite bazangiz (`oltin_baliq.db`) o'chib ketmaydi va doimiy saqlanadi.
-   **Yagona manzil**: Sayt ham, bot ham bitta serverda bo'lgani uchun ular juda tez va xatosiz ishlaydi.

---

**Eslatma**: Agar sizga PythonAnywhere varianti kerak bo'lsa, `pythonanywhere_wsgi.py` faylidan foydalanishingiz mumkin, lekin Render varianti hozirda eng tavsiya etilgan va oson yo'ldir.
