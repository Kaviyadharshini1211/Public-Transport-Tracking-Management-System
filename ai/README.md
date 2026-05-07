---
title: PTTMS AI
emoji: 🚌
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Public Transport Tracking Management System - AI Service

This is the AI microservice for the PTTMS project, deployed as a Docker container on Hugging Face Spaces.

## Features
- **ETA Prediction** — RandomForest model predicts arrival time from distance, speed, traffic & weather
- **Vehicle-Driver Assignment Optimization** — Hungarian algorithm + ML cost matrix for optimal driver-vehicle matching
- **AI Live Route Optimization** — GradientBoosting classifier (91.75% accuracy) detects traffic delays and recommends real-time alternate routes without changing stops

## ML Models

| Model | Algorithm | Accuracy / MAE | pkl files |
|-------|-----------|----------------|-----------|
| ETA Predictor | Random Forest Regressor | MAE ~3 min, R² 0.99 | `eta_model.pkl` |
| Assignment Optimizer | GradientBoosting Regressor | — | `assignment_model.pkl` |
| Route Optimizer (Classifier) | GradientBoosting Classifier | Accuracy 91.75% | `route_optimizer_clf.pkl` |
| Route Optimizer (Regressor) | GradientBoosting Regressor | MAE 2.47 min, R² 0.95 | `route_optimizer_reg.pkl` |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/predict_eta` | Predict ETA in minutes |
| POST | `/optimize_assignments` | AI driver-vehicle assignment |
| POST | `/optimize_live_route` | Live route detour recommendation |

## Training Models

```bash
# From the ai/ directory:
python -m models.eta.train_model
python -m models.assignment.train_model
python -m models.route_optimizer.train_model
```


## Deployment
This service runs a FastAPI application on port 7860.
