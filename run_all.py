import subprocess
import os
import time

def run():
    print("🚀 Oltin Baliq - Starting Unified Services...")
    
    # 1. Start Flask in the background
    # Use 0.0.0.0 and get PORT from environment (Render requirement)
    port = os.getenv("PORT", "8000")
    flask_process = subprocess.Popen([
        "python", "-m", "flask", "--app", "backend.main", "run", 
        "--host", "0.0.0.0", "--port", port
    ])
    
    # 2. Wait a bit for Flask to warm up
    time.sleep(3)
    
    # 3. Start the Bot (blocking)
    try:
        print("🤖 Starting Bot...")
        subprocess.run(["python", "bot/main.py"], check=True)
    except KeyboardInterrupt:
        flask_process.terminate()
        print("Stopping services...")

if __name__ == "__main__":
    run()
