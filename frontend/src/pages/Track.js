import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
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

// ---------------- BUS ICON ----------------
const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61231.png",
  iconSize: [45, 45],
  iconAnchor: [22, 22],
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

  const [etaFinal, setEtaFinal] = useState(null);
  const [etaBoarding, setEtaBoarding] = useState(null);

  const mapRef = useRef(null);

  // Read bookingId (?bookingId=XXX)
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("bookingId");

  // ---------- FETCH BOOKING ----------
  useEffect(() => {
    if (!bookingId) return;
    API.get(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data))
      .catch(console.error);
  }, [bookingId]);

  // ---------- FETCH VEHICLE ----------
  const fetchVehicle = async () => {
    try {
      const res = await API.get(`/vehicles/${vehicleId}`);
      setVehicle(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load vehicle data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vehicleId) return;
    fetchVehicle();
    const iv = setInterval(fetchVehicle, 3000);
    return () => clearInterval(iv);
  }, [vehicleId]);

  // ---------- LOAD ROUTE FROM OSRM ----------
  useEffect(() => {
    if (!vehicle?.route?.stops) return;

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
    const minutes = (km / speed) * 60;
    setEtaFinal(formatETA(minutes));
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
    const minutes = (d / speed) * 60;

    setEtaBoarding(formatETA(minutes));
  }, [booking?.boardingStop, vehicle?.currentLocation, vehicle?.route?.avgSpeedKmph]);

  // ---------- FOLLOW BUS AUTO ----------
  useEffect(() => {
    if (!vehicle?.currentLocation || !mapRef.current) return;

    mapRef.current.setView(
      [vehicle.currentLocation.lat, vehicle.currentLocation.lng],
      15,
      { animate: true }
    );
  }, [vehicle]);

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
        <MapContainer
          center={[vehicle.currentLocation.lat, vehicle.currentLocation.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%", minHeight: "400px" }}
          ref={mapRef}
        >
          {/* BASE OSM MAP */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Covered route (dark grey) */}
          <Polyline
            positions={coveredCoords}
            pathOptions={{ color: "#555", weight: 8, opacity: 0.9 }}
          />

          {/* Remaining route (blue) */}
          <Polyline
            positions={remainingCoords}
            pathOptions={{ color: "blue", weight: 6 }}
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
