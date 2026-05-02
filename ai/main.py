from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from models.eta import ETAPredictor
from models.assignment import AssignmentPredictor
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

# Initialize the ML predictors
eta_predictor = ETAPredictor()
assignment_predictor = AssignmentPredictor()

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
