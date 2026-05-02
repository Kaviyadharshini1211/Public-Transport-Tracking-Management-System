import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import os

def generate_synthetic_data(num_samples=10000):
    print(f"Generating {num_samples} synthetic training samples...")
    np.random.seed(42)
    
    # Distance in km between driver base and route origin
    distance_km = np.random.uniform(0.1, 50.0, num_samples)
    
    # Driver experience in years
    experience_years = np.random.randint(1, 21, num_samples)
    
    # Traffic severity at route origin (1-10)
    traffic_index = np.random.randint(1, 11, num_samples)
    
    # Vehicle type: 0 = local, 1 = intercity (long-haul)
    vehicle_type = np.random.randint(0, 2, num_samples)
    
    # Base cost is proportional to commute distance
    base_cost = distance_km * 2.0
    
    # Penalize low experience, especially for intercity (type=1)
    experience_penalty = np.where(
        (vehicle_type == 1) & (experience_years < 5),
        (5 - experience_years) * 10, # Heavy penalty for rookie drivers on long-haul
        np.maximum(0, (3 - experience_years) * 5) # Slight penalty for rookies on local
    )
    
    # Penalize commuting through heavy traffic
    traffic_penalty = (traffic_index / 10.0) * (distance_km * 0.5)
    
    # Bonus for highly experienced drivers on long-haul
    experience_bonus = np.where(
        (vehicle_type == 1) & (experience_years > 10),
        -5.0,
        0
    )
    
    # Total assignment cost (lower is better, meaning more suitable match)
    assignment_cost = base_cost + experience_penalty + traffic_penalty + experience_bonus
    # Ensure cost doesn't drop below a minimum threshold
    assignment_cost = np.maximum(assignment_cost, distance_km * 0.5)
    
    # Add some random noise to simulate real-world variance
    noise = np.random.normal(0, 2.0, num_samples)
    assignment_cost += noise
    
    df = pd.DataFrame({
        'distance_km': distance_km,
        'experience_years': experience_years,
        'traffic_index': traffic_index,
        'vehicle_type': vehicle_type,
        'assignment_cost': assignment_cost
    })
    return df

def train_model():
    df = generate_synthetic_data(15000)
    
    X = df[['distance_km', 'experience_years', 'traffic_index', 'vehicle_type']]
    y = df['assignment_cost']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"Model Evaluation -> MSE: {mse:.2f}, MAE: {mae:.2f}")
    
    model_path = os.path.join(os.path.dirname(__file__), "assignment_model.pkl")
    joblib.dump(model, model_path)
    print(f"Model saved successfully at: {model_path}")

if __name__ == "__main__":
    train_model()
