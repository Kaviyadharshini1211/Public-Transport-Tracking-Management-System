import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";

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

  const [vehicle, setVehicle] = useState(null);
  const [booking, setBooking] = useState(null);

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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicle();
    const iv = setInterval(fetchVehicle, 3000);
    return () => clearInterval(iv);
  }, []);

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

  if (!vehicle) return <h2 style={{ padding: 20 }}>Loading…</h2>;

  return (
    <div style={{ height: "100vh" }}>
      <h2 style={{ padding: 20 }}>
        Live Tracking 🚍
        {etaFinal && (
          <span style={{ marginLeft: 20, color: "green" }}>
            | ETA (Destination): {etaFinal}
          </span>
        )}
        {etaBoarding && (
          <span style={{ marginLeft: 20, color: "blue" }}>
            | ETA (Your Stop): {etaBoarding}
          </span>
        )}
      </h2>

      <MapContainer
        center={[vehicle.currentLocation.lat, vehicle.currentLocation.lng]}
        zoom={14}
        style={{ height: "85vh" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        {/* BASE OSM MAP */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* LIVE TRAFFIC (TomTom) */}
        <TileLayer
          url={`https://api.tomtom.com/traffic/map/4/tile/flow/{z}/{x}/{y}.png?key=YOUR_TOMTOM_KEY`}
          opacity={0.7}
        />

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
        {vehicle.route.stops.map((stop, i) => (
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
  );
}
