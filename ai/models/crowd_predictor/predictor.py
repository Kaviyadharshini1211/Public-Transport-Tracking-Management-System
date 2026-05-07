"""
Crowd Predictor — Predictor
============================
Loads the trained GradientBoosting classifier + regressor and exposes
a clean predict() method used by the /predict_crowd FastAPI endpoint.

If the .pkl files are missing (first run), it falls back to a pure-math
heuristic so the service never crashes.

Crowd levels:
    0 = empty       (0–20% of capacity)
    1 = low         (21–50% of capacity)
    2 = moderate    (51–75% of capacity)
    3 = high        (76–100% of capacity)
    4 = overcrowded (> 100% of capacity)
"""
import os
import joblib
import pandas as pd

# Feature order must match train_model.py FEATURES list exactly
FEATURES = [
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "stop_index",
    "total_stops",
    "route_type",
    "bus_capacity",
    "weather_condition",
    "is_holiday",
    "traffic_index",
]

CROWD_LABELS = ["empty", "low", "moderate", "high", "overcrowded"]


class CrowdPredictor:
    """
    Wraps two scikit-learn models:
      - clf : GradientBoostingClassifier  → crowd_level (int 0–4)
      - reg : GradientBoostingRegressor   → estimated_passengers (float)

    Both models share the same 10-feature input schema defined in FEATURES.
    """

    def __init__(self):
        """
        Initialise the predictor by resolving the model file paths and
        loading them from disk. If either .pkl file is absent, both are
        set to None and the heuristic fallback is used instead.
        """
        self.clf = None
        self.reg = None
        model_dir = os.path.dirname(os.path.abspath(__file__))
        clf_path  = os.path.join(model_dir, "crowd_predictor_clf.pkl")
        reg_path  = os.path.join(model_dir, "crowd_predictor_reg.pkl")
        self._load(clf_path, reg_path)

    def _load(self, clf_path: str, reg_path: str) -> None:
        """
        Attempts to load both model files from disk.

        Args:
            clf_path (str): Absolute path to the classifier .pkl file.
            reg_path (str): Absolute path to the regressor .pkl file.
        """
        if os.path.exists(clf_path) and os.path.exists(reg_path):
            self.clf = joblib.load(clf_path)
            self.reg = joblib.load(reg_path)
            print("[CrowdPredictor] Models loaded successfully.")
        else:
            print(
                "[CrowdPredictor] Warning: model files not found. "
                "Run  python -m models.crowd_predictor.train_model  to train them. "
                "Falling back to heuristic logic."
            )

    def predict(
        self,
        hour_of_day: int,
        day_of_week: int,
        stop_index: int,
        total_stops: int,
        route_type: int,
        bus_capacity: int,
        weather_condition: int,
        traffic_index: int,
        is_holiday: int = 0,
    ) -> dict:
        """
        Predicts the crowd level and estimated passenger count for a local bus.

        Args:
            hour_of_day (int):       Hour of the day (0–23).
            day_of_week (int):       Day of the week (0=Mon … 6=Sun).
            stop_index (int):        Zero-based index of the current stop along the route.
            total_stops (int):       Total number of stops on the route.
            route_type (int):        Route category — 0=urban_core, 1=suburban, 2=feeder.
            bus_capacity (int):      Maximum passenger capacity of the bus.
            weather_condition (int): Weather code — 0=clear, 1=rain, 2=fog, 3=storm.
            traffic_index (int):     Traffic severity — 1 (clear) to 10 (standstill).
            is_holiday (int):        1 if today is a public holiday, else 0 (default 0).

        Returns:
            dict: {
                "crowd_level"          : int   (0–4),
                "crowd_label"          : str   ("empty" | "low" | "moderate" | "high" | "overcrowded"),
                "estimated_passengers" : int   (absolute count),
                "capacity_ratio"       : float (0.0–1.5+ relative to bus_capacity),
                "confidence"           : float (classifier probability for predicted class, 0–1),
            }
        """
        is_weekend = 1 if day_of_week >= 5 else 0

        row = pd.DataFrame([{
            "hour_of_day":       hour_of_day,
            "day_of_week":       day_of_week,
            "is_weekend":        is_weekend,
            "stop_index":        stop_index,
            "total_stops":       total_stops,
            "route_type":        route_type,
            "bus_capacity":      bus_capacity,
            "weather_condition": weather_condition,
            "is_holiday":        is_holiday,
            "traffic_index":     traffic_index,
        }])

        # ── ML prediction ──────────────────────────────────────────────────
        if self.clf is not None and self.reg is not None:
            crowd_level        = int(self.clf.predict(row)[0])
            proba              = self.clf.predict_proba(row)[0]
            confidence         = float(proba[crowd_level])
            estimated_passengers = max(0, int(round(float(self.reg.predict(row)[0]))))
            capacity_ratio     = round(estimated_passengers / max(bus_capacity, 1), 3)
            return {
                "crowd_level":          crowd_level,
                "crowd_label":          CROWD_LABELS[crowd_level],
                "estimated_passengers": estimated_passengers,
                "capacity_ratio":       capacity_ratio,
                "confidence":           round(confidence, 4),
            }

        # ── Heuristic fallback (no model loaded) ───────────────────────────
        base_demand_map = [0.80, 0.55, 0.35]
        base_demand     = base_demand_map[min(route_type, 2)]

        morning_rush = 7 <= hour_of_day <= 9
        evening_rush = 17 <= hour_of_day <= 19
        rush_mult    = 1.55 if (morning_rush or evening_rush) else 1.0
        night_disc   = 0.35 if (hour_of_day >= 22 or hour_of_day <= 5) else 1.0
        weekend_mult = 0.65 if is_weekend else 1.0

        stop_progress = stop_index / max(total_stops - 1, 1)
        import math
        bell_curve    = 1.0 + 0.5 * math.sin(math.pi * stop_progress)

        weather_mult_map = [1.0, 1.12, 0.85, 1.18]
        weather_mult     = weather_mult_map[min(weather_condition, 3)]
        traffic_mult     = 1.0 + (traffic_index - 1) * 0.03

        fraction = base_demand * rush_mult * night_disc * weekend_mult * bell_curve * weather_mult * traffic_mult
        fraction = min(max(fraction, 0.0), 1.5)

        estimated_passengers = max(0, int(round(fraction * bus_capacity)))
        capacity_ratio       = round(fraction, 3)

        if fraction <= 0.20:
            crowd_level = 0
        elif fraction <= 0.50:
            crowd_level = 1
        elif fraction <= 0.75:
            crowd_level = 2
        elif fraction <= 1.00:
            crowd_level = 3
        else:
            crowd_level = 4

        return {
            "crowd_level":          crowd_level,
            "crowd_label":          CROWD_LABELS[crowd_level],
            "estimated_passengers": estimated_passengers,
            "capacity_ratio":       capacity_ratio,
            "confidence":           0.0,   # unknown without model
        }
