import joblib
import os
import pandas as pd
import numpy as np

class AssignmentPredictor:
    def __init__(self):
        self.model = None
        model_dir = os.getenv("MODEL_DIR", os.path.dirname(os.path.abspath(__file__)))
        
        local_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assignment_model.pkl')
        root_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assignment_model.pkl')
        env_path = os.path.join(model_dir, 'assignment_model.pkl')

        self.model_path = local_path if os.path.exists(local_path) else (
            root_path if os.path.exists(root_path) else env_path
        )
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                print(f"[Assignment] Model loaded from {self.model_path}")
            except Exception as e:
                print(f"[Assignment] Error loading model: {e}")
        else:
            print(f"[Assignment] Warning: Model not found at {self.model_path}. Fallback logic will be used.")

    def predict_cost(self, distance_km: float, experience_years: int, traffic_index: int, vehicle_type: int) -> float:
        if self.model is None:
            return distance_km * 2.0
            
        features = pd.DataFrame([{
            'distance_km': distance_km,
            'experience_years': experience_years,
            'traffic_index': traffic_index,
            'vehicle_type': vehicle_type
        }])
        
        try:
            pred = self.model.predict(features)
            return float(pred[0])
        except Exception as e:
            print(f"Prediction error: {e}")
            return distance_km * 2.0

    def predict_costs_batch(self, features_list: list) -> list:
        if self.model is None:
            return [f['distance_km'] * 2.0 for f in features_list]
            
        features_df = pd.DataFrame(features_list)
        
        try:
            preds = self.model.predict(features_df)
            return preds.tolist()
        except Exception as e:
            print(f"Batch prediction error: {e}")
            return [f['distance_km'] * 2.0 for f in features_list]

    def predict_costs_batch_arr(self, features_dict: dict, n: int) -> np.ndarray:
        if self.model is None:
            return np.array(features_dict['distance_km']) * 2.0

        features_df = pd.DataFrame(features_dict)
        
        try:
            preds = self.model.predict(features_df)
            return np.array(preds)
        except Exception as e:
            print(f"Batch array prediction error: {e}")
            return np.array(features_dict['distance_km']) * 2.0
