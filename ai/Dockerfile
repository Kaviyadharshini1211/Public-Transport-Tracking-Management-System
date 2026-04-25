FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV MODEL_DIR=/app/model

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create the model directory (which can be mounted as a volume)
RUN mkdir -p /app/model

# Make startup script executable
RUN chmod +x startup.sh

# Expose FastAPI port
EXPOSE 8000

# Run the startup script which downloads the model and starts the server
CMD ["./startup.sh"]
