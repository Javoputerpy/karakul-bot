import subprocess
import time
import sys
import os

def run():
    print("Starting Oltin Baliq Restaurant System...")
    
    # 1. Start Backend
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "flask", "--app", "backend.main", "run", "--port", "8000"],
        cwd=os.getcwd()
    )
    
    # 2. Start Bot
    bot_proc = subprocess.Popen(
        [sys.executable, "bot/main.py"],
        cwd=os.getcwd()
    )
    
    print("\nSystem is running!")
    print("Backend: http://localhost:8000")
    print("Bot: Check your Telegram bot")
    print("Frontend: Run 'npm run dev' in the frontend directory")
    print("\nPress Ctrl+C to stop all processes.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping processes...")
        backend_proc.terminate()
        bot_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    run()
