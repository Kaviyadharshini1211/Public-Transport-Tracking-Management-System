import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# Set random seed for reproducibility
np.random.seed(42)

# ==========================================
# 1. GENERATE SYNTHETIC DATA
# ==========================================
print("Generating synthetic transit data...")
n_samples = 10000

# Features
# Distance remaining to destination (km)
distance_remaining_km = np.random.uniform(1.0, 500.0, n_samples)

# Average speed of the vehicle (km/h) - ranges from 20 km/h (city) to 90 km/h (highway)
avg_speed_kmh = np.random.uniform(20.0, 90.0, n_samples)

# Traffic index: 1 (clear) to 10 (standstill)
traffic_index = np.random.randint(1, 11, n_samples)

# Weather condition: 0 (clear), 1 (rain), 2 (fog), 3 (storm)
weather_condition = np.random.randint(0, 4, n_samples)

# Time of day (hour: 0-23)
time_of_day = np.random.randint(0, 24, n_samples)

# Bus type: 0 (standard), 1 (express/volvo)
bus_type = np.random.randint(0, 2, n_samples)

# Calculate Base ETA (in minutes) based on physics: Time = Distance / Speed
base_eta_minutes = (distance_remaining_km / avg_speed_kmh) * 60

# Apply real-world penalties
# Traffic penalty: 1 (no delay) up to 3x delay for standstill
traffic_multiplier = 1.0 + (traffic_index - 1) * 0.2

# Weather penalty: clear=1.0, rain=1.1, fog=1.25, storm=1.5
weather_multipliers = np.array([1.0, 1.1, 1.25, 1.5])
weather_penalty = weather_multipliers[weather_condition]

# Time of day penalty: Rush hours (8-10, 17-19) add 20% delay
time_penalty = np.ones(n_samples)
rush_hours = ((time_of_day >= 8) & (time_of_day <= 10)) | ((time_of_day >= 17) & (time_of_day <= 19))
time_penalty[rush_hours] = 1.2

# Night driving (0-4 AM) might be slightly faster
night_hours = (time_of_day >= 0) & (time_of_day <= 4)
time_penalty[night_hours] = 0.9

# Express bus advantage: 10% faster
bus_multiplier = np.where(bus_type == 1, 0.9, 1.0)

# Calculate final realistic ETA with some random noise (human unpredictability, signals)
true_eta = base_eta_minutes * traffic_multiplier * weather_penalty * time_penalty * bus_multiplier
noise = np.random.normal(0, 5, n_samples) # +/- 5 minutes random variance
final_eta_minutes = np.maximum(1.0, true_eta + noise) # Ensure ETA is at least 1 min

# Create DataFrame
df = pd.DataFrame({
    'distance_remaining_km': distance_remaining_km,
    'avg_speed_kmh': avg_speed_kmh,
    'traffic_index': traffic_index,
    'weather_condition': weather_condition,
    'time_of_day': time_of_day,
    'bus_type': bus_type,
    'eta_minutes': final_eta_minutes
})

# ==========================================
# 2. TRAIN THE MODEL
# ==========================================
print("Training Random Forest Regressor...")
X = df.drop('eta_minutes', axis=1)
y = df['eta_minutes']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# We use RandomForest because it captures non-linear relationships (like traffic vs speed) perfectly
model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# ==========================================
# 3. EVALUATE
# ==========================================
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print(f"Model Performance:")
print(f"Mean Absolute Error (MAE): {mae:.2f} minutes")
print(f"R-squared (R2) Score: {r2:.4f}")

# ==========================================
# 4. EXPORT MODEL
# ==========================================
os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
model_path = os.path.join(os.path.dirname(__file__), 'eta_model.pkl')
joblib.dump(model, model_path)
print(f"Model successfully saved to {model_path}")
