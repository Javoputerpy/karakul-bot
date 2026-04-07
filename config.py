import os
from dotenv import load_dotenv

load_dotenv()

# --- DISCORD/TELEGRAM TOKENS ---
BOT_TOKEN = os.getenv("BOT_TOKEN")

# --- DATABASE CONFIG ---
# For Render persistent disk, use the /data volume
if os.path.exists("/opt/render/project/src/data"):
    DATABASE_URL = "sqlite:////opt/render/project/src/data/oltin_baliq.db"
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'oltin_baliq.db')}")

# --- WEBAPP URL ---
# This is the URL where your site is hosted (e.g. yourname.pythonanywhere.com)
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:8000")

if not BOT_TOKEN:
    # We only raise error if we are running the BOT
    pass 
