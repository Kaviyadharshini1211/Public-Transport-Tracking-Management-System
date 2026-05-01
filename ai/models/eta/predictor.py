import os
import joblib
import pandas as pd

class ETAPredictor:
    def __init__(self):
        self.model = None
        model_dir = os.getenv("MODEL_DIR", os.path.dirname(os.path.abspath(__file__)))
        # Look for the pkl at models/eta/ first, then fall back to ai/ root
        local_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'eta_model.pkl')
        root_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'eta_model.pkl')
        env_path = os.path.join(model_dir, 'eta_model.pkl')

        self.model_path = local_path if os.path.exists(local_path) else (
            root_path if os.path.exists(root_path) else env_path
        )
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            print(f"[ETA] Model loaded from {self.model_path}")
        else:
            print(f"[ETA] Warning: Model not found at {self.model_path}. Using fallback math.")

    def predict(self, distance_km: float, speed_kmh: float, traffic_index: int,
                weather: int, time_of_day: int, bus_type: int) -> float:
        if self.model is None:
            return (distance_km / max(1, speed_kmh)) * 60

        input_data = pd.DataFrame([{
            'distance_remaining_km': distance_km,
            'avg_speed_kmh': speed_kmh,
            'traffic_index': traffic_index,
            'weather_condition': weather,
            'time_of_day': time_of_day,
            'bus_type': bus_type
        }])
        return round(float(self.model.predict(input_data)[0]), 2)
