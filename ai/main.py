from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from models.eta import ETAPredictor
from models.assignment import AssignmentPredictor
from models.route_optimizer import RouteOptimizerPredictor
from models.crowd_predictor import CrowdPredictor
from datetime import datetime
import math
import numpy as np
import random
from scipy.optimize import linear_sum_assignment

app = FastAPI(
    title="PT Tracker AI Services",
    description="Provides machine learning predictions for the public transport tracking system.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the ML predictors
eta_predictor = ETAPredictor()
assignment_predictor = AssignmentPredictor()
route_optimizer_predictor = RouteOptimizerPredictor()
crowd_predictor = CrowdPredictor()

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

# Models for Optimization
class Location(BaseModel):
    lat: float
    lng: float

class DriverOpt(BaseModel):
    id: str
    location: Location
    experience_years: int = Field(5, description="Driver experience in years")

class VehicleOpt(BaseModel):
    id: str
    route_origin: Location
    type: int = Field(0, description="0 for local, 1 for intercity")

class OptimizationRequest(BaseModel):
    drivers: List[DriverOpt]
    vehicles: List[VehicleOpt]

class AssignmentMatch(BaseModel):
    vehicle_id: str
    driver_id: str
    distance_km: float

class OptimizationResponse(BaseModel):
    assignments: List[AssignmentMatch]
    unassigned_vehicles: List[str]
    unassigned_drivers: List[str]
    status: str

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in kilometers
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

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


def build_cost_matrix_vectorized(vehicles, drivers, predictor) -> np.ndarray:
    """
    Builds the cost matrix using fully-vectorized NumPy to avoid any Python loops.
    This computes all Haversine distances at once then feeds them to the ML model as a single batch.
    """
    # Extract coordinate arrays
    v_lats = np.array([v.route_origin.lat for v in vehicles])
    v_lngs = np.array([v.route_origin.lng for v in vehicles])
    d_lats = np.array([d.location.lat for d in drivers])
    d_lngs = np.array([d.location.lng for d in drivers])

    # Vectorized Haversine using broadcasting (NV x ND matrices)
    R = 6371.0
    # v_lats[:, None] is (NV, 1) and d_lats[None, :] is (1, ND), broadcast to (NV, ND)
    dlat = np.radians(d_lats[None, :] - v_lats[:, None])
    dlng = np.radians(d_lngs[None, :] - v_lngs[:, None])
    v_lat_rad = np.radians(v_lats[:, None])
    d_lat_rad = np.radians(d_lats[None, :])
    a = np.sin(dlat / 2)**2 + np.cos(v_lat_rad) * np.cos(d_lat_rad) * np.sin(dlng / 2)**2
    dist_matrix = 2 * R * np.arctan2(np.sqrt(a), np.sqrt(1 - a))  # shape: (NV, ND)

    # Flatten to build batch features for ML model
    nv, nd = dist_matrix.shape
    flat_dist = dist_matrix.flatten()
    
    # Broadcast driver experience years across vehicles
    exp_arr = np.array([d.experience_years for d in drivers])
    flat_exp = np.tile(exp_arr, nv)
    
    # Broadcast vehicle type across drivers 
    vtype_arr = np.array([v.type for v in vehicles])
    flat_vtype = np.repeat(vtype_arr, nd)
    
    # Random traffic index per pair
    flat_traffic = np.random.randint(2, 9, size=nv * nd)

    features_df_data = {
        'distance_km': flat_dist,
        'experience_years': flat_exp,
        'traffic_index': flat_traffic,
        'vehicle_type': flat_vtype
    }

    flat_costs = predictor.predict_costs_batch_arr(features_df_data, nv * nd)
    return flat_costs.reshape(nv, nd)

@app.post("/optimize_assignments", response_model=OptimizationResponse)
def optimize_assignments(req: OptimizationRequest):
    try:
        drivers = req.drivers
        vehicles = req.vehicles

        if not drivers or not vehicles:
            return OptimizationResponse(
                assignments=[],
                unassigned_vehicles=[v.id for v in vehicles],
                unassigned_drivers=[d.id for d in drivers],
                status="No assignment possible (missing drivers or vehicles)"
            )

        nv = len(vehicles)
        nd = len(drivers)
        print(f"Building vectorized cost matrix for {nv} vehicles x {nd} drivers...")

        # Step 1: Build the full cost matrix using vectorized operations
        cost_matrix = build_cost_matrix_vectorized(vehicles, drivers, assignment_predictor)

        # Step 2: If matrix is large, pre-filter each vehicle to its top-K best driver candidates
        # This prunes the Hungarian search space from O(N^3) to O(N * K^3)
        K = min(nd, 50)  # Cap at top 50 candidates per vehicle
        if nd > K:
            print(f"Pruning to top-{K} candidates per vehicle for faster Hungarian...")
            # Set cost to infinity for non-top-K candidates so Hungarian ignores them
            top_k_mask = np.ones_like(cost_matrix) * np.inf
            top_k_indices = np.argsort(cost_matrix, axis=1)[:, :K]
            for i in range(nv):
                top_k_mask[i, top_k_indices[i]] = cost_matrix[i, top_k_indices[i]]
            cost_matrix = top_k_mask

        # Step 3: Run Hungarian Algorithm on the pruned cost matrix
        print("Running Hungarian Algorithm...")
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        # Filter out inf-cost assignments (no valid candidate found)
        assignments = []
        assigned_v_indices = set()
        assigned_d_indices = set()

        for i, j in zip(row_ind, col_ind):
            cost_val = cost_matrix[i, j]
            if not np.isinf(cost_val):
                assignments.append(AssignmentMatch(
                    vehicle_id=vehicles[i].id,
                    driver_id=drivers[j].id,
                    distance_km=round(float(cost_val), 2)
                ))
                assigned_v_indices.add(i)
                assigned_d_indices.add(j)

        unassigned_vehicles = [v.id for i, v in enumerate(vehicles) if i not in assigned_v_indices]
        unassigned_drivers = [d.id for j, d in enumerate(drivers) if j not in assigned_d_indices]

        print(f"Assignment complete: {len(assignments)} matched, {len(unassigned_vehicles)} unassigned vehicles.")
        return OptimizationResponse(
            assignments=assignments,
            unassigned_vehicles=unassigned_vehicles,
            unassigned_drivers=unassigned_drivers,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# LIVE ROUTE OPTIMIZATION — Models & Endpoint
# ─────────────────────────────────────────────────────────────────────────────

class RouteOptimizationRequest(BaseModel):
    current_lat: float       = Field(..., description="Current vehicle latitude")
    current_lng: float       = Field(..., description="Current vehicle longitude")
    next_stop_lat: float     = Field(..., description="Next stop latitude")
    next_stop_lng: float     = Field(..., description="Next stop longitude")
    avg_speed_kmh: float     = Field(30.0, gt=0, description="Current average speed km/h")
    traffic_index: int       = Field(5, ge=1, le=10, description="Traffic severity (1=clear, 10=standstill)")
    weather_condition: int   = Field(0, ge=0, le=3, description="0=clear 1=rain 2=fog 3=storm")
    bus_type: int            = Field(0, ge=0, le=1, description="0=standard 1=express")

class RouteOptimizationResponse(BaseModel):
    detour_needed: bool
    detour_lat: Optional[float] = None
    detour_lng: Optional[float] = None
    original_eta_minutes: float
    optimized_eta_minutes: float
    reason: str
    traffic_severity: str
    model_confidence: Optional[float] = None


@app.post("/optimize_live_route", response_model=RouteOptimizationResponse)
def optimize_live_route(req: RouteOptimizationRequest):
    """
    Uses the trained RouteOptimizerPredictor (GradientBoosting) to decide
    whether a detour is needed, then computes a perpendicular waypoint and
    estimates time savings using the ETA model.
    """
    try:
        dist_km = haversine_distance(
            req.current_lat, req.current_lng,
            req.next_stop_lat, req.next_stop_lng
        )

        if dist_km < 0.01:
            return RouteOptimizationResponse(
                detour_needed=False,
                original_eta_minutes=0.0,
                optimized_eta_minutes=0.0,
                reason="Vehicle is already at the next stop.",
                traffic_severity="none",
                model_confidence=None
            )

        hour = datetime.now().hour

        # ── ML Model decision ────────────────────────────────────────────────
        ml_result = route_optimizer_predictor.predict(
            dist_to_next_stop_km=dist_km,
            traffic_index=req.traffic_index,
            avg_speed_kmh=req.avg_speed_kmh,
            weather_condition=req.weather_condition,
            time_of_day=hour,
            bus_type=req.bus_type
        )
        detour_needed = ml_result["detour_needed"]
        confidence    = ml_result["confidence"]

        # ── ETA estimates via existing ETA model ─────────────────────────────
        actual_eta = eta_predictor.predict(
            distance_km=dist_km,
            speed_kmh=req.avg_speed_kmh,
            traffic_index=req.traffic_index,
            weather=req.weather_condition,
            time_of_day=hour,
            bus_type=req.bus_type
        )
        reduced_traffic  = max(1, req.traffic_index - 3)
        optimized_speed  = min(req.avg_speed_kmh * 1.2, 50.0)
        optimized_eta    = eta_predictor.predict(
            distance_km=dist_km * 1.05,
            speed_kmh=optimized_speed,
            traffic_index=reduced_traffic,
            weather=req.weather_condition,
            time_of_day=hour,
            bus_type=req.bus_type
        )

        # ── Traffic severity label ───────────────────────────────────────────
        if req.traffic_index >= 9:
            traffic_severity = "standstill"
        elif req.traffic_index >= 7:
            traffic_severity = "heavy"
        elif req.traffic_index >= 5:
            traffic_severity = "moderate"
        else:
            traffic_severity = "light"

        if not detour_needed:
            return RouteOptimizationResponse(
                detour_needed=False,
                original_eta_minutes=round(actual_eta, 1),
                optimized_eta_minutes=round(actual_eta, 1),
                reason=f"Traffic is {traffic_severity}. ML model says current route is optimal.",
                traffic_severity=traffic_severity,
                model_confidence=confidence
            )

        # ── Compute perpendicular detour waypoint ────────────────────────────
        mid_lat = (req.current_lat + req.next_stop_lat) / 2
        mid_lng = (req.current_lng + req.next_stop_lng) / 2
        dlat    = req.next_stop_lat - req.current_lat
        dlng    = req.next_stop_lng - req.current_lng
        length  = math.sqrt(dlat ** 2 + dlng ** 2) or 1e-9
        perp_lat = -dlng / length
        perp_lng =  dlat / length
        OFFSET_DEG = 0.0014   # ~150 metres
        detour_lat = round(mid_lat + perp_lat * OFFSET_DEG, 7)
        detour_lng = round(mid_lng + perp_lng * OFFSET_DEG, 7)

        savings = round(actual_eta - optimized_eta, 1)
        reason  = (
            f"ML model detected {traffic_severity} traffic (index {req.traffic_index}/10, "
            f"confidence {confidence:.0%}). "
            f"Alternate route recommended — est. {savings} min saved. "
            f"All stops remain unchanged."
        )

        return RouteOptimizationResponse(
            detour_needed=True,
            detour_lat=detour_lat,
            detour_lng=detour_lng,
            original_eta_minutes=round(actual_eta, 1),
            optimized_eta_minutes=round(optimized_eta, 1),
            reason=reason,
            traffic_severity=traffic_severity,
            model_confidence=confidence
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route optimization failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# CROWD PREDICTION — Models & Endpoint
# ─────────────────────────────────────────────────────────────────────────────

class CrowdPredictionRequest(BaseModel):
    """
    Input schema for the /predict_crowd endpoint.

    All fields map directly to features used by the trained CrowdPredictor
    GradientBoosting models.
    """
    hour_of_day:       int   = Field(..., ge=0, le=23,  description="Hour of the day (0–23)")
    day_of_week:       int   = Field(..., ge=0, le=6,   description="Day of week (0=Mon … 6=Sun)")
    stop_index:        int   = Field(..., ge=0,          description="Zero-based stop position along the route")
    total_stops:       int   = Field(..., ge=1,          description="Total stops on the route")
    route_type:        int   = Field(0,  ge=0, le=2,   description="0=urban_core, 1=suburban, 2=feeder")
    bus_capacity:      int   = Field(50, ge=1,          description="Max passenger capacity of the bus")
    weather_condition: int   = Field(0,  ge=0, le=3,   description="0=clear, 1=rain, 2=fog, 3=storm")
    traffic_index:     int   = Field(5,  ge=1, le=10,  description="Traffic severity (1=clear, 10=standstill)")
    is_holiday:        int   = Field(0,  ge=0, le=1,   description="1 if today is a public holiday")


class CrowdPredictionResponse(BaseModel):
    """
    Output schema for the /predict_crowd endpoint.

    Returns a crowd level label, estimated passenger count, capacity ratio,
    and the classifier's confidence in its prediction.
    """
    crowd_level:          int
    crowd_label:          str
    estimated_passengers: int
    capacity_ratio:       float
    confidence:           float
    status:               str


@app.post("/predict_crowd", response_model=CrowdPredictionResponse)
def predict_crowd(req: CrowdPredictionRequest):
    """
    Predicts the crowd density level for a local bus at a given stop and time.

    Uses the trained CrowdPredictor (GradientBoostingClassifier + Regressor)
    to output:
      - crowd_level          : 0 (empty) → 4 (overcrowded)
      - crowd_label          : human-readable label for crowd_level
      - estimated_passengers : approximate number of passengers on board
      - capacity_ratio       : passengers / bus_capacity (e.g. 1.2 = 120% full)
      - confidence           : classifier's probability for the predicted class

    Falls back to a heuristic calculation if the model files are not present.
    """
    try:
        result = crowd_predictor.predict(
            hour_of_day       = req.hour_of_day,
            day_of_week       = req.day_of_week,
            stop_index        = req.stop_index,
            total_stops       = req.total_stops,
            route_type        = req.route_type,
            bus_capacity      = req.bus_capacity,
            weather_condition = req.weather_condition,
            traffic_index     = req.traffic_index,
            is_holiday        = req.is_holiday,
        )
        return CrowdPredictionResponse(**result, status="success")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crowd prediction failed: {str(e)}")
