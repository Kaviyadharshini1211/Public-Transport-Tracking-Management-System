"""
Route Optimizer — Training Script
==================================
Trains a GradientBoostingRegressor to predict:
  - Whether a detour is needed (detour_score >= 0.5)
  - The estimated time saved by taking the detour (minutes)

Features used:
  - dist_to_next_stop_km   : Haversine distance to the next bus stop
  - traffic_index          : 1 (clear) to 10 (standstill)
  - avg_speed_kmh          : Current average speed
  - weather_condition      : 0=clear, 1=rain, 2=fog, 3=storm
  - time_of_day            : Hour of the day (0-23)
  - bus_type               : 0=standard, 1=express

Targets:
  - detour_score           : 0.0–1.0 (>= 0.5 means detour recommended)
  - time_saved_minutes     : Estimated minutes saved by alternate route

Run this script from the ai/ directory:
    python -m models.route_optimizer.train_model
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report
import joblib
import os

np.random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# 1. GENERATE SYNTHETIC TRAINING DATA
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("Route Optimizer — Generating synthetic training data…")
print("=" * 60)

N = 20_000  # 20k samples for a well-generalised model

# ── Feature generation ───────────────────────────────────────────────────────
dist_to_next_stop_km = np.random.uniform(0.2, 15.0, N)      # city bus: 0.2–15 km between stops
traffic_index        = np.random.randint(1, 11, N)           # 1–10
avg_speed_kmh        = np.random.uniform(10.0, 80.0, N)      # slow city traffic to open road
weather_condition    = np.random.randint(0, 4, N)            # 0–3
time_of_day          = np.random.randint(0, 24, N)           # 0–23
bus_type             = np.random.randint(0, 2, N)            # 0 or 1

# ── Physics-based ETA (minutes) ───────────────────────────────────────────────
base_eta = (dist_to_next_stop_km / np.maximum(avg_speed_kmh, 1)) * 60

# Penalties
traffic_penalty  = 1.0 + (traffic_index - 1) * 0.22
weather_map      = np.array([1.0, 1.1, 1.25, 1.5])
weather_penalty  = weather_map[weather_condition]
rush             = ((time_of_day >= 8) & (time_of_day <= 10)) | \
                   ((time_of_day >= 17) & (time_of_day <= 19))
time_penalty     = np.where(rush, 1.2, np.where(time_of_day <= 4, 0.9, 1.0))
bus_bonus        = np.where(bus_type == 1, 0.9, 1.0)

actual_eta = base_eta * traffic_penalty * weather_penalty * time_penalty * bus_bonus
actual_eta += np.random.normal(0, 3, N)   # small noise
actual_eta = np.maximum(actual_eta, 1.0)

# Theoretical best-case ETA (clear roads, 40 km/h)
best_eta = (dist_to_next_stop_km / 40.0) * 60

# ── Label generation ──────────────────────────────────────────────────────────
# Detour is worthwhile when actual ETA is >= 25% worse than best-case
# OR traffic is heavy (index >= 7)
delay_ratio   = actual_eta / np.maximum(best_eta, 0.1)
heavy_traffic = traffic_index >= 7

detour_score_raw = np.clip(
    0.4 * (delay_ratio - 1.0) + 0.6 * ((traffic_index - 1) / 9.0),
    0.0, 1.0
)
# Smooth detour_score into 0–1
detour_score = np.where(heavy_traffic | (delay_ratio >= 1.25), detour_score_raw, detour_score_raw * 0.4)
detour_score += np.random.normal(0, 0.02, N)
detour_score = np.clip(detour_score, 0.0, 1.0)

# Binary label: should we detour?
detour_needed = (detour_score >= 0.5).astype(int)

# Estimated time saved (only meaningful when detour_needed=1)
# Alternate road reduces traffic by ~3 index points and increases speed ~20%
reduced_traffic  = np.maximum(1, traffic_index - 3)
improved_speed   = np.minimum(avg_speed_kmh * 1.2, 60.0)
optimized_eta    = (dist_to_next_stop_km / np.maximum(improved_speed, 1)) * 60 * \
                   (1.0 + (reduced_traffic - 1) * 0.22) * weather_penalty * time_penalty * bus_bonus
time_saved       = np.maximum(0.0, actual_eta - optimized_eta)
time_saved      += np.random.normal(0, 1, N)
time_saved       = np.maximum(0.0, time_saved)

# ── Build DataFrame ────────────────────────────────────────────────────────────
df = pd.DataFrame({
    "dist_to_next_stop_km": dist_to_next_stop_km,
    "traffic_index":        traffic_index,
    "avg_speed_kmh":        avg_speed_kmh,
    "weather_condition":    weather_condition,
    "time_of_day":          time_of_day,
    "bus_type":             bus_type,
    "detour_score":         detour_score,
    "detour_needed":        detour_needed,
    "time_saved_minutes":   time_saved,
    "actual_eta_minutes":   actual_eta,
})

print(f"\nDataset shape      : {df.shape}")
print(f"Detour needed (1)  : {detour_needed.sum():,} / {N:,}  ({100*detour_needed.mean():.1f}%)")
print(f"Avg time saved     : {time_saved[detour_needed == 1].mean():.2f} min  (when detour needed)")
print()

FEATURES = ["dist_to_next_stop_km", "traffic_index", "avg_speed_kmh",
            "weather_condition", "time_of_day", "bus_type"]
X = df[FEATURES]

# ─────────────────────────────────────────────────────────────────────────────
# 2. TRAIN MODEL A — Detour Classifier (should we detour?)
# ─────────────────────────────────────────────────────────────────────────────
print("Training Model A: Detour Classifier (GradientBoostingClassifier)…")
y_clf = df["detour_needed"]
Xtr, Xte, ytr, yte = train_test_split(X, y_clf, test_size=0.2, random_state=42)

clf = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42
)
clf.fit(Xtr, ytr)
clf_preds = clf.predict(Xte)
print(f"  Accuracy : {accuracy_score(yte, clf_preds):.4f}")
print(classification_report(yte, clf_preds, target_names=["No Detour", "Detour"]))

# ─────────────────────────────────────────────────────────────────────────────
# 3. TRAIN MODEL B — Time-Saved Regressor (how many minutes saved?)
# ─────────────────────────────────────────────────────────────────────────────
print("Training Model B: Time-Saved Regressor (GradientBoostingRegressor)…")
y_reg = df["time_saved_minutes"]
Xtr2, Xte2, ytr2, yte2 = train_test_split(X, y_reg, test_size=0.2, random_state=42)

reg = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42
)
reg.fit(Xtr2, ytr2)
reg_preds = reg.predict(Xte2)
mae = mean_absolute_error(yte2, reg_preds)
r2  = r2_score(yte2, reg_preds)
print(f"  MAE      : {mae:.3f} minutes")
print(f"  R²       : {r2:.4f}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# 4. FEATURE IMPORTANCE
# ─────────────────────────────────────────────────────────────────────────────
print("Feature Importances (Classifier):")
for feat, imp in sorted(zip(FEATURES, clf.feature_importances_), key=lambda x: -x[1]):
    bar = "#" * int(imp * 40)
    print(f"  {feat:<28} {bar}  {imp:.4f}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# 5. SAVE MODELS
# ─────────────────────────────────────────────────────────────────────────────
save_dir = os.path.dirname(os.path.abspath(__file__))
clf_path = os.path.join(save_dir, "route_optimizer_clf.pkl")
reg_path = os.path.join(save_dir, "route_optimizer_reg.pkl")

joblib.dump(clf, clf_path)
joblib.dump(reg, reg_path)

print(f"[OK] Classifier saved -> {clf_path}")
print(f"[OK] Regressor  saved -> {reg_path}")
print("\nTraining complete!")

