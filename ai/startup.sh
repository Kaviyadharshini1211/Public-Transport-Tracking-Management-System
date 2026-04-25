#!/bin/bash
set -e

echo "Starting AI Microservice initialization..."

# Download the model from MongoDB if it doesn't exist locally
python download_model.py

echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
