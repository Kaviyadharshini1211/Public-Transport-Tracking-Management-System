import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as bookingService from "../api/booking";
import * as vehicleService from "../api/vehicle";
import LoadingSpinner from "../components/LoadingSpinner";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import polyline from "polyline";
import "leaflet/dist/leaflet.css";
import "../styles/Track.css";
import MapWeatherOverlay from "../components/MapWeatherOverlay";

// ---------------- FIX DEFAULT MARKERS ----------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
});

// ---------------- PREMIUM BUS ICON ----------------
const busIcon = new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #ec4899, #7c3aed);
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.5);
      border: 3px solid white;
      font-size: 20px;
    ">
      🚌
    </div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// ---------------- HAVERSINE ----------------
const distance = (lat1, lon1, lat2, lon2) => {
  var R = 6371;
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------- FORMAT ETA ----------------
const formatETA = (min) => {
  if (min <= 0) return "Arriving";
  const hrs = Math.floor(min / 60);
  const mins = Math.round(min % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
};

export default function Track() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [routeCoords, setRouteCoords] = useState([]);
  const [coveredCoords, setCoveredCoords] = useState([]);
  const [remainingCoords, setRemainingCoords] = useState([]);

  const [etaBoarding, setEtaBoarding] = useState(null);
  const [etaFinal, setEtaFinal] = useState(null); // Fixed missing state
  const [isAuthorized, setIsAuthorized] = useState(null); // NEW: null=checking, true/false

  const mapRef = useRef(null);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // ---------- VERIFY BOOKING ----------
  useEffect(() => {
    if (!user) {
      setError("Please login to track the bus.");
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    if (user.role === "admin" || user.role === "driver") {
      setIsAuthorized(true);
      return;
    }

    // For passengers, check if they have a confirmed booking for THIS vehicle
    const checkBooking = async () => {
      try {
        const data = await bookingService.checkActiveBooking(user.id || user._id, vehicleId);
        if (data.hasActiveBooking) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setError("Please book a ticket to track the bus.");
        }
      } catch (err) {
        console.error("Booking verification failed:", err);
        setError("Failed to verify booking status.");
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkBooking();
  }, [user, vehicleId]);

  // ---------- FETCH VEHICLE ----------
  const fetchVehicle = async () => {
    try {
      if (!isAuthorized && user?.role === "passenger") return;

      const data = await vehicleService.getVehicleById(vehicleId);
      setVehicle(data);
      // setError(null); // Remove this to avoid clearing the "No booking" error
    } catch (err) {
      console.error(err);
      if (isAuthorized) setError("Failed to load vehicle data. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!vehicleId || isAuthorized === false) return;
    
    fetchVehicle();
    const iv = setInterval(fetchVehicle, 3000);
    return () => clearInterval(iv);
  }, [vehicleId, isAuthorized]);

  // ---------- LOAD ROUTE FROM OSRM ----------
  const routeLoadedFor = useRef(null);
  
  useEffect(() => {
    if (!vehicle?.route?.stops || !vehicle.route._id) return;
    if (routeLoadedFor.current === vehicle.route._id) return;

    const stops = vehicle.route.stops;
    if (stops.length < 2) return;

    const coordsURL = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsURL}?overview=full&geometries=polyline`;

    const loadRoute = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.routes?.length) return;

        const decoded = polyline.decode(data.routes[0].geometry);
        const coords = decoded.map(([lat, lng]) => [lat, lng]);
        setRouteCoords(coords);

        // Auto zoom to route
        if (mapRef.current) {
          mapRef.current.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
          routeLoadedFor.current = vehicle.route._id;
        }
      } catch (e) {
        console.error("Route load failed:", e);
      }
    };

    loadRoute();
  }, [vehicle]);

  // ---------- SPLIT COVERED / REMAINING ----------
  useEffect(() => {
    if (!vehicle?.currentLocation || !routeCoords.length) return;

    const { lat, lng } = vehicle.currentLocation;

    let minDist = Infinity;
    let index = 0;

    routeCoords.forEach((c, i) => {
      const d = distance(lat, lng, c[0], c[1]);
      if (d < minDist) {
        minDist = d;
        index = i;
      }
    });

    setCoveredCoords(routeCoords.slice(0, index));
    setRemainingCoords(routeCoords.slice(index));
  }, [vehicle, routeCoords]);

  // ---------- ETA TO FINAL DESTINATION ----------
  useEffect(() => {
    if (!remainingCoords.length || !vehicle?.route) return;

    let km = 0;
    for (let i = 0; i < remainingCoords.length - 1; i++) {
      km += distance(
        remainingCoords[i][0],
        remainingCoords[i][1],
        remainingCoords[i + 1][0],
        remainingCoords[i + 1][1]
      );
    }

    const speed = vehicle.route.avgSpeedKmph || 50;
    
    vehicleService.getVehicleETA(vehicle._id, { distance_remaining_km: km, avg_speed_kmh: speed })
      .then(res => setEtaFinal(formatETA(res.estimated_minutes)))
      .catch(err => {
        console.warn("AI ETA fallback");
        setEtaFinal(formatETA((km / speed) * 60));
      });
  }, [remainingCoords]);

  // ---------- ETA TO BOARDING STOP ----------
  useEffect(() => {
    if (!booking?.boardingStop) return;
    if (!vehicle?.currentLocation) return;
    if (!vehicle?.route?.avgSpeedKmph) return;

    const stop = booking.boardingStop;

    const d = distance(
      vehicle.currentLocation.lat,
      vehicle.currentLocation.lng,
      stop.lat,
      stop.lng
    );

    const speed = vehicle.route.avgSpeedKmph || 50;

    vehicleService.getVehicleETA(vehicle._id, { distance_remaining_km: d, avg_speed_kmh: speed })
      .then(res => setEtaBoarding(formatETA(res.estimated_minutes)))
      .catch(err => setEtaBoarding(formatETA((d / speed) * 60)));
  }, [booking?.boardingStop, vehicle?.currentLocation, vehicle?.route?.avgSpeedKmph]);

  // ---------- FOLLOW BUS AUTO ----------
  useEffect(() => {
    if (!vehicle?.currentLocation || !mapRef.current) return;
    
    // We only want to pan initially if we haven't loaded a full route bounds yet
    if (!routeCoords.length && mapRef.current) {
      mapRef.current.setView(
        [vehicle.currentLocation.lat, vehicle.currentLocation.lng],
        14,
        { animate: true }
      );
    }
    // Intentionally omitted the aggressive setView on every location update
    // as it interrupts the user's manual zooming and panning.
  }, [vehicle?.currentLocation]);

  // ---------- LOADING STATE ----------
  if (loading) {
    return (
      <div className="track-page">
        <div className="track-loading">
          <LoadingSpinner size="lg" />
          <p className="track-loading-text">Loading vehicle data...</p>
        </div>
      </div>
    );
  }

  // ---------- ERROR STATE ----------
  if (error) {
    return (
      <div className="track-page">
        <div className="track-error">
          <span className="track-error-icon">⚠️</span>
          <h2 className="track-error-title">Something went wrong</h2>
          <p className="track-error-message">{error}</p>
          <button className="track-error-btn" onClick={() => navigate("/vehicles")}>
            ← Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  // ---------- NO VEHICLE ----------
  if (!vehicle) {
    return (
      <div className="track-page">
        <div className="track-error">
          <span className="track-error-icon">🚌</span>
          <h2 className="track-error-title">Vehicle Not Found</h2>
          <p className="track-error-message">
            The vehicle you're looking for doesn't exist or has been removed.
          </p>
          <button className="track-error-btn" onClick={() => navigate("/vehicles")}>
            ← Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  // ---------- NO LOCATION DATA ----------
  if (!vehicle.currentLocation || !vehicle.currentLocation.lat) {
    return (
      <div className="track-page">
        <div className="track-no-location">
          <div className="track-no-location-icon">📡</div>
          <h2 className="track-no-location-title">No Live Tracking Available</h2>
          <p className="track-no-location-message">
            This vehicle ({vehicle.regNumber || "Unknown"}) hasn't started sharing its location yet.
            The driver may not have started the trip. Please check back later.
          </p>

          {/* Show vehicle info even without location */}
          <div className="track-vehicle-info-card">
            <div className="track-info-row">
              <strong>Registration:</strong> {vehicle.regNumber || "—"}
            </div>
            <div className="track-info-row">
              <strong>Model:</strong> {vehicle.model || "—"}
            </div>
            <div className="track-info-row">
              <strong>Driver:</strong> {vehicle.driverName || "Unassigned"}
            </div>
            <div className="track-info-row">
              <strong>Route:</strong> {vehicle.route?.name || "Unassigned"}
            </div>
            <div className="track-info-row">
              <strong>Status:</strong>{" "}
              <span className={`track-status ${vehicle.status === "active" ? "active" : ""}`}>
                {vehicle.status ? vehicle.status.toUpperCase() : "UNKNOWN"}
              </span>
            </div>
          </div>

          <button className="track-error-btn" onClick={() => navigate("/vehicles")}>
            ← Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  // ---------- RENDER MAP ----------
  return (
    <div className="track-page">
      {/* Header Bar */}
      <div className="track-header">
        <div className="track-header-left">
          <button className="track-back-btn" onClick={() => navigate("/vehicles")}>
            ←
          </button>
          <h2 className="track-title">
            Live Tracking 🚍
            <span className="track-vehicle-label">{vehicle.regNumber}</span>
          </h2>
        </div>

        <div className="track-eta-badges">
          {etaFinal && (
            <span className="eta-badge eta-destination">
              🏁 Destination: {etaFinal}
            </span>
          )}
          {etaBoarding && (
            <span className="eta-badge eta-boarding">
              📍 Your Stop: {etaBoarding}
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="track-map-container">
        <MapWeatherOverlay lat={vehicle.currentLocation.lat} lng={vehicle.currentLocation.lng} />
        <MapContainer
          center={[vehicle.currentLocation.lat, vehicle.currentLocation.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%", minHeight: "400px" }}
          ref={mapRef}
        >
          {/* GOOGLE MAPS TRAFFIC LAYER */}
          <TileLayer
            url="https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            attribution="&copy; Google Maps"
          />

          {/* Covered route (dark purple) */}
          <Polyline
            positions={coveredCoords}
            pathOptions={{ color: "#7c3aed", weight: 8, opacity: 0.9 }}
          />

          {/* Remaining route (neon pink) */}
          <Polyline
            positions={remainingCoords}
            pathOptions={{ color: "#ec4899", weight: 6, opacity: 0.8 }}
          />

          {/* Stops */}
          {vehicle.route?.stops?.map((stop, i) => (
            <Marker key={i} position={[stop.lat, stop.lng]}>
              <Popup>{stop.name}</Popup>
            </Marker>
          ))}

          {/* Bus Marker */}
          <Marker
            position={[
              vehicle.currentLocation.lat,
              vehicle.currentLocation.lng,
            ]}
            icon={busIcon}
          >
            <Popup>
              <strong>{vehicle.regNumber}</strong>
              <br />
              Driver: {vehicle.driverName}
              <br />
              Last Updated:{" "}
              {new Date(vehicle.lastSeenAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
