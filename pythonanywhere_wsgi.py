import sys
import os

# Add your project directory to the sys.path
project_home = '/home/YOUR_USERNAME/karakulrest'
if project_home not in sys.path:
    sys.path.append(project_home)

# Set environment variables if needed
os.environ['DATABASE_URL'] = 'sqlite:///' + os.path.join(project_home, 'oltin_baliq.db')
os.environ['WEBAPP_URL'] = 'https://YOUR_USERNAME.pythonanywhere.com'
os.environ['BOT_TOKEN'] = 'YOUR_BOT_TOKEN'

# Import the Flask app
from backend.main import app as application
