from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from predictor import ETAPredictor
from datetime import datetime

app = FastAPI(
    title="PT Tracker AI Services",
    description="Provides machine learning predictions for the public transport tracking system.",
    version="1.0.0"
)

# Initialize the ML predictor
eta_predictor = ETAPredictor()

class ETARequest(BaseModel):
    distance_remaining_km: float = Field(..., gt=0, description="Remaining distance in kilometers")
    avg_speed_kmh: float = Field(..., gt=0, description="Average speed in km/h")
    traffic_index: int = Field(1, ge=1, le=10, description="Traffic severity (1=clear, 10=standstill)")
    weather_condition: int = Field(0, ge=0, le=3, description="Weather (0=clear, 1=rain, 2=fog, 3=storm)")
    time_of_day: Optional[int] = Field(None, ge=0, le=23, description="Hour of the day (0-23). Defaults to current hour.")
    bus_type: int = Field(0, ge=0, le=1, description="Type of bus (0=standard, 1=express)")

class ETAResponse(BaseModel):
    estimated_minutes: float
    estimated_hours: float
    status: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": eta_predictor.model is not None
    }

@app.post("/predict_eta", response_model=ETAResponse)
def predict_eta(req: ETARequest):
    try:
        # Determine current hour if not provided
        hour = req.time_of_day
        if hour is None:
            hour = datetime.now().hour

        # Predict
        eta_minutes = eta_predictor.predict(
            distance_km=req.distance_remaining_km,
            speed_kmh=req.avg_speed_kmh,
            traffic_index=req.traffic_index,
            weather=req.weather_condition,
            time_of_day=hour,
            bus_type=req.bus_type
        )

        return {
            "estimated_minutes": eta_minutes,
            "estimated_hours": round(eta_minutes / 60, 2),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
