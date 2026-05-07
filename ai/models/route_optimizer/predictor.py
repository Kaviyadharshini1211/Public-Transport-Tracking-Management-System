"""
Route Optimizer — Predictor
============================
Loads the trained GradientBoosting classifier + regressor and exposes
a clean predict() method used by the /optimize_live_route FastAPI endpoint.

If the .pkl files are missing (first run), it falls back to the pure-math
heuristic already in main.py so the service never crashes.
"""
import os
import joblib
import pandas as pd

FEATURES = [
    "dist_to_next_stop_km",
    "traffic_index",
    "avg_speed_kmh",
    "weather_condition",
    "time_of_day",
    "bus_type",
]

class RouteOptimizerPredictor:
    """
    Wraps two scikit-learn models:
      - clf : GradientBoostingClassifier  → detour_needed (bool)
      - reg : GradientBoostingRegressor   → time_saved_minutes (float)
    """

    def __init__(self):
        self.clf = None
        self.reg = None
        model_dir = os.path.dirname(os.path.abspath(__file__))
        clf_path  = os.path.join(model_dir, "route_optimizer_clf.pkl")
        reg_path  = os.path.join(model_dir, "route_optimizer_reg.pkl")
        self._load(clf_path, reg_path)

    def _load(self, clf_path: str, reg_path: str):
        if os.path.exists(clf_path) and os.path.exists(reg_path):
            self.clf = joblib.load(clf_path)
            self.reg = joblib.load(reg_path)
            print("[RouteOptimizer] Models loaded successfully.")
        else:
            print(
                "[RouteOptimizer] Warning: model files not found. "
                "Run  python -m models.route_optimizer.train_model  to train them. "
                "Falling back to heuristic logic."
            )

    def predict(
        self,
        dist_to_next_stop_km: float,
        traffic_index: int,
        avg_speed_kmh: float,
        weather_condition: int,
        time_of_day: int,
        bus_type: int,
    ) -> dict:
        """
        Returns:
            {
                "detour_needed"      : bool,
                "time_saved_minutes" : float,   # 0.0 if no detour
                "confidence"         : float,   # classifier probability (0–1)
            }
        """
        row = pd.DataFrame([{
            "dist_to_next_stop_km": dist_to_next_stop_km,
            "traffic_index":        traffic_index,
            "avg_speed_kmh":        avg_speed_kmh,
            "weather_condition":    weather_condition,
            "time_of_day":          time_of_day,
            "bus_type":             bus_type,
        }])

        # ── ML prediction ──────────────────────────────────────────────────
        if self.clf is not None and self.reg is not None:
            detour_needed  = bool(self.clf.predict(row)[0])
            confidence     = float(self.clf.predict_proba(row)[0][1])  # prob of class=1
            time_saved     = float(self.reg.predict(row)[0]) if detour_needed else 0.0
            return {
                "detour_needed":      detour_needed,
                "time_saved_minutes": round(max(0.0, time_saved), 2),
                "confidence":         round(confidence, 4),
            }

        # ── Heuristic fallback (no model loaded) ───────────────────────────
        base_eta = (dist_to_next_stop_km / max(avg_speed_kmh, 1)) * 60
        best_eta = (dist_to_next_stop_km / 40.0) * 60
        delay_ratio   = base_eta / max(best_eta, 0.1)
        heavy_traffic = traffic_index >= 7
        detour_needed = heavy_traffic or delay_ratio >= 1.25
        time_saved    = max(0.0, base_eta - best_eta) if detour_needed else 0.0
        return {
            "detour_needed":      detour_needed,
            "time_saved_minutes": round(time_saved, 2),
            "confidence":         0.0,   # unknown without model
        }
