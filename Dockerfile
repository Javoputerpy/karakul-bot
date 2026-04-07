# Python Backend & Bot
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port (Render will override this with $PORT)
EXPOSE 8000

# Default command (using run_all.py to start both Flask and Bot)
CMD ["python", "run_all.py"]
