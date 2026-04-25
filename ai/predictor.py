import os
import joblib
import pandas as pd
import numpy as np

class ETAPredictor:
    def __init__(self):
        self.model = None
        model_dir = os.getenv("MODEL_DIR", os.path.dirname(__file__))
        self.model_path = os.path.join(model_dir, 'eta_model.pkl')
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            print("ETA Model loaded successfully.")
        else:
            print(f"Warning: Model not found at {self.model_path}. Please run train_model.py first.")

    def predict(self, distance_km: float, speed_kmh: float, traffic_index: int, weather: int, time_of_day: int, bus_type: int) -> float:
        """
        Predicts ETA in minutes.
        """
        if self.model is None:
            # Fallback simple math if model fails to load
            return (distance_km / max(1, speed_kmh)) * 60

        # Construct input DataFrame matching training data
        input_data = pd.DataFrame([{
            'distance_remaining_km': distance_km,
            'avg_speed_kmh': speed_kmh,
            'traffic_index': traffic_index,
            'weather_condition': weather,
            'time_of_day': time_of_day,
            'bus_type': bus_type
        }])

        prediction = self.model.predict(input_data)[0]
        return round(float(prediction), 2)
