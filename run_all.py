import subprocess
import os
import time

def run():
    print("🚀 Oltin Baliq - Starting Unified Services...")
    
    # 1. Start Flask with Gunicorn in the background
    port = os.getenv("PORT", "8000")
    print(f"🌐 Starting Web Server on port {port}...")
    flask_process = subprocess.Popen([
        "gunicorn", "-b", f"0.0.0.0:{port}", "backend.main:app",
        "--workers", "1", "--threads", "2", "--timeout", "0"
    ])
    
    # 2. Wait a bit for Gunicorn to warm up
    time.sleep(5)
    
    # 3. Start the Bot (blocking)
    try:
        print("🤖 Starting Bot...")
        # Use sys.executable to ensure we use the same python environment
        subprocess.run(["python", "bot/main.py"], check=True)
    except Exception as e:
        print(f"❌ Bot error: {e}")
    finally:
        print("🛑 Stopping Web Server...")
        flask_process.terminate()
        flask_process.wait()

if __name__ == "__main__":
    run()
