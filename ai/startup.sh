#!/bin/bash
set -e

echo "Starting AI Microservice initialization..."

# Download the model from MongoDB if it doesn't exist locally
python download_models.py

echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 7860
