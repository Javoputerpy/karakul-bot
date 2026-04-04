import asyncio
import logging
import sys
import os

# Add root directory to sys.path to find config.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from config import BOT_TOKEN, WEBAPP_URL

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    # Premium welcome message
    welcome_text = (
        "🌟 **Oltin Baliq Restoraniga xush kelibsiz!** 🌟\n\n"
        "Bizning mukammal dengiz taomlari menyusi bilan tanishing va bot orqali osongina buyurtma bering.\n\n"
        "👇 Buyurtma berish uchun quyidagi tugmani bosing:"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛒 Menyu va Buyurtma", web_app=WebAppInfo(url=WEBAPP_URL))]
    ])
    
    await message.answer(welcome_text, reply_markup=keyboard, parse_mode="Markdown")

async def main():
    print("Bot is starting...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
