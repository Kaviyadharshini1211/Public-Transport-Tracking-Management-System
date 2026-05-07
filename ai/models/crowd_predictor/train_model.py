"""
Crowd Predictor — Training Script
===================================
Trains two GradientBoosting models to predict crowd levels on local buses:

  Model A (Classifier):  crowd_level
        0 = empty     (0–20% capacity)
        1 = low       (21–50% capacity)
        2 = moderate  (51–75% capacity)
        3 = high      (76–100% capacity)
        4 = overcrowded (>100% capacity)

  Model B (Regressor):   estimated_passengers (absolute count on bus)

Features used:
  - hour_of_day        : 0–23
  - day_of_week        : 0=Mon … 6=Sun
  - is_weekend         : 0 or 1
  - stop_index         : position of the stop along the route (0-based)
  - total_stops        : total stops on the route
  - route_type         : 0=urban_core, 1=suburban, 2=feeder
  - bus_capacity       : max passenger capacity of the bus
  - weather_condition  : 0=clear, 1=rain, 2=fog, 3=storm
  - is_holiday         : 0 or 1
  - traffic_index      : 1 (clear) to 10 (standstill)

Targets:
  - crowd_level          : 0–4 (classified above)
  - estimated_passengers : absolute passenger count

Run this script from the ai/ directory:
    python -m models.crowd_predictor.train_model
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, classification_report,
    mean_absolute_error, r2_score
)
import joblib
import os

# ─────────────────────────────────────────────────────────────────────────────
# Reproducibility
# ─────────────────────────────────────────────────────────────────────────────
np.random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# 1.  GENERATE SYNTHETIC TRAINING DATA
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("Crowd Predictor — Generating synthetic training data…")
print("=" * 60)

N = 25_000  # 25k samples for a well-generalised model

# ── Feature generation ───────────────────────────────────────────────────────
hour_of_day       = np.random.randint(0, 24, N)
day_of_week       = np.random.randint(0, 7, N)
is_weekend        = (day_of_week >= 5).astype(int)
stop_index        = np.random.randint(0, 30, N)          # position along route
total_stops       = np.random.randint(10, 40, N)         # total stops on route
# Clamp stop_index to be < total_stops
stop_index        = np.minimum(stop_index, total_stops - 1)
route_type        = np.random.randint(0, 3, N)           # 0=urban_core, 1=suburban, 2=feeder
bus_capacity      = np.random.choice([40, 50, 60, 80], N)  # typical local bus capacities
weather_condition = np.random.randint(0, 4, N)           # 0=clear, 1=rain, 2=fog, 3=storm
is_holiday        = np.random.binomial(1, 0.08, N)       # ~8% of days are holidays
traffic_index     = np.random.randint(1, 11, N)          # 1–10

# ── Physics / demand-based passenger count ────────────────────────────────────
# Base demand scaled by route type
base_demand_map = np.array([0.80, 0.55, 0.35])   # urban_core, suburban, feeder
base_demand = base_demand_map[route_type]          # fraction of capacity

# Rush-hour multiplier
morning_rush = ((hour_of_day >= 7) & (hour_of_day <= 9))
evening_rush = ((hour_of_day >= 17) & (hour_of_day <= 19))
rush_mult    = np.where(morning_rush | evening_rush, 1.55, 1.0)

# Night/early morning discount
night_disc   = np.where((hour_of_day >= 22) | (hour_of_day <= 5), 0.35, 1.0)

# Weekend effect
weekend_mult = np.where(is_weekend == 1, 0.65, 1.0)

# Holiday effect (more or less depending on route type)
holiday_mult = np.where(
    is_holiday == 1,
    np.where(route_type == 0, 1.20, 0.75),   # urban spikes on holidays; suburban/feeder drops
    1.0
)

# Stop progress: crowd builds up toward the middle and drops near terminus
stop_progress  = stop_index / np.maximum(total_stops - 1, 1)   # 0..1
bell_curve     = 1.0 + 0.5 * np.sin(np.pi * stop_progress)    # peaks in the middle

# Weather dampens demand (rain + storm increase slightly; fog reduces)
weather_mult_map = np.array([1.0, 1.12, 0.85, 1.18])
weather_mult = weather_mult_map[weather_condition]

# Traffic: high traffic keeps people waiting → buses arrive fuller
traffic_mult = 1.0 + (traffic_index - 1) * 0.03

# Combine all effects
passenger_fraction = (
    base_demand
    * rush_mult
    * night_disc
    * weekend_mult
    * holiday_mult
    * bell_curve
    * weather_mult
    * traffic_mult
)
passenger_fraction = np.clip(passenger_fraction, 0.0, 1.5)   # allow overcrowding up to 150%

estimated_passengers = passenger_fraction * bus_capacity
estimated_passengers += np.random.normal(0, 4, N)            # small noise
estimated_passengers  = np.clip(np.round(estimated_passengers), 0, bus_capacity * 1.5)

# ── Crowd level labels ────────────────────────────────────────────────────────
capacity_ratio = estimated_passengers / bus_capacity

def assign_crowd_level(ratio: np.ndarray) -> np.ndarray:
    """Converts a capacity ratio array into a crowd level 0–4."""
    levels = np.zeros(len(ratio), dtype=int)
    levels[ratio > 0.20] = 1
    levels[ratio > 0.50] = 2
    levels[ratio > 0.75] = 3
    levels[ratio > 1.00] = 4
    return levels

crowd_level = assign_crowd_level(capacity_ratio)

# ── Build DataFrame ─────────────────────────────────────────────────────────
df = pd.DataFrame({
    "hour_of_day":          hour_of_day,
    "day_of_week":          day_of_week,
    "is_weekend":           is_weekend,
    "stop_index":           stop_index,
    "total_stops":          total_stops,
    "route_type":           route_type,
    "bus_capacity":         bus_capacity,
    "weather_condition":    weather_condition,
    "is_holiday":           is_holiday,
    "traffic_index":        traffic_index,
    "estimated_passengers": estimated_passengers,
    "capacity_ratio":       capacity_ratio,
    "crowd_level":          crowd_level,
})

print(f"\nDataset shape           : {df.shape}")
for lvl, label in enumerate(["empty", "low", "moderate", "high", "overcrowded"]):
    count = (crowd_level == lvl).sum()
    print(f"  Level {lvl} ({label:<12}): {count:,}  ({100 * count / N:.1f}%)")
print()

FEATURES = [
    "hour_of_day", "day_of_week", "is_weekend", "stop_index",
    "total_stops", "route_type", "bus_capacity", "weather_condition",
    "is_holiday", "traffic_index",
]
X = df[FEATURES]

# ─────────────────────────────────────────────────────────────────────────────
# 2.  TRAIN MODEL A — Crowd Level Classifier
# ─────────────────────────────────────────────────────────────────────────────
print("Training Model A: Crowd Level Classifier (GradientBoostingClassifier)…")
y_clf = df["crowd_level"]
Xtr, Xte, ytr, yte = train_test_split(X, y_clf, test_size=0.2, random_state=42, stratify=y_clf)

clf = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42,
)
clf.fit(Xtr, ytr)
clf_preds = clf.predict(Xte)
print(f"  Accuracy : {accuracy_score(yte, clf_preds):.4f}")
print(classification_report(
    yte, clf_preds,
    target_names=["empty", "low", "moderate", "high", "overcrowded"],
))

# ─────────────────────────────────────────────────────────────────────────────
# 3.  TRAIN MODEL B — Passenger Count Regressor
# ─────────────────────────────────────────────────────────────────────────────
print("Training Model B: Passenger Count Regressor (GradientBoostingRegressor)…")
y_reg = df["estimated_passengers"]
Xtr2, Xte2, ytr2, yte2 = train_test_split(X, y_reg, test_size=0.2, random_state=42)

reg = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42,
)
reg.fit(Xtr2, ytr2)
reg_preds = reg.predict(Xte2)
mae = mean_absolute_error(yte2, reg_preds)
r2  = r2_score(yte2, reg_preds)
print(f"  MAE      : {mae:.3f} passengers")
print(f"  R²       : {r2:.4f}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# 4.  FEATURE IMPORTANCE
# ─────────────────────────────────────────────────────────────────────────────
print("Feature Importances (Classifier):")
for feat, imp in sorted(zip(FEATURES, clf.feature_importances_), key=lambda x: -x[1]):
    bar = "#" * int(imp * 40)
    print(f"  {feat:<22} {bar}  {imp:.4f}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# 5.  SAVE MODELS
# ─────────────────────────────────────────────────────────────────────────────
save_dir = os.path.dirname(os.path.abspath(__file__))
clf_path = os.path.join(save_dir, "crowd_predictor_clf.pkl")
reg_path = os.path.join(save_dir, "crowd_predictor_reg.pkl")

joblib.dump(clf, clf_path)
joblib.dump(reg, reg_path)

print(f"[OK] Classifier saved -> {clf_path}")
print(f"[OK] Regressor  saved -> {reg_path}")
print("\nTraining complete!")
