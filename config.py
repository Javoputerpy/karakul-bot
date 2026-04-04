import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./oltin_baliq.db")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:5173")

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN is not set in .env file")
