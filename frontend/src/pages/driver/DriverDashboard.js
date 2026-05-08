import React, { useState, useEffect, useRef, useCallback } from "react";
import DriverNoAssignment from "./DriverNoAssignment";
import API from "../../api/api";
import CrowdWidget from "../../components/CrowdWidget";
import "../../styles/DriverDashboard.css";
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

const detourIcon = new L.DivIcon({
  html: `
    <div style="
      background: #f59e0b;
      width: 30px; height: 30px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5);
      border: 3px solid white;
      font-size: 14px;
    ">
      🚧
    </div>
  `,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

export default function DriverDashboard({ user, vehicle, loading, onRefresh }) {
  const [activeTrip, setActiveTrip]     = useState(null);
  const [todayTrips, setTodayTrips]     = useState([]);
  const [tripLoading, setTripLoading]   = useState(false);
  const [toast, setToast]               = useState(null);
  const [aiEtaData, setAiEtaData]       = useState(null);
  const [weatherData, setWeatherData]   = useState(null);
  const [routeOptData, setRouteOptData] = useState(null);   // AI route optimization result
  const [optimizing, setOptimizing]     = useState(false);

  const [originalRouteCoords, setOriginalRouteCoords] = useState([]);
  const [optimizedRouteCoords, setOptimizedRouteCoords] = useState([]);
  const [liveCoords, setLiveCoords] = useState(null);
  const mapRef = useRef(null);

  // Live Geolocation Tracking for the Dashboard Map
  useEffect(() => {
    if (!activeTrip) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setLiveCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Live location error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activeTrip]);

  // Shared live traffic/weather values updated by ETA polling
  const liveTrafficRef = useRef({ traffic_index: 5, weather_condition: 0, avg_speed_kmh: 35 });

  useEffect(() => {
    if (user && vehicle) fetchTrips();
    // eslint-disable-next-line
  }, [user, vehicle]);

  // AI ETA Polling — also updates liveTrafficRef for route optimizer
  useEffect(() => {
    let interval;
    if (activeTrip && vehicle) {
      const fetchEtaAndWeather = async () => {
        try {
          const lat = vehicle.route?.originLat || vehicle.route?.stops?.[0]?.lat || 12.9716;
          const lng = vehicle.route?.originLng || vehicle.route?.stops?.[0]?.lng || 77.5946;

          // 1. Live weather from Open-Meteo
          let weather_condition = 0;
          let isRaining = false;
          let weatherDesc = "Clear";
          try {
            const meteoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
            const meteoData = await meteoRes.json();
            const wmoCode = meteoData.current_weather?.weathercode || 0;
            if ([45, 48].includes(wmoCode)) { weather_condition = 2; weatherDesc = "Fog"; }
            else if ([51,53,55,61,63,65,66,67,80,81,82].includes(wmoCode)) { weather_condition = 1; weatherDesc = "Rain"; isRaining = true; }
            else if ([95,96,99].includes(wmoCode)) { weather_condition = 3; weatherDesc = "Storm"; isRaining = true; }
            setWeatherData({ condition: weather_condition, desc: weatherDesc, isRaining, temp: meteoData.current_weather?.temperature });
          } catch (e) { console.error("Weather fetch failed:", e); }

          // 2. Simulated traffic
          const isHeavyTraffic = Math.random() > 0.7;
          const traffic_index = isHeavyTraffic ? Math.floor(Math.random() * 4) + 7 : Math.floor(Math.random() * 4) + 2;
          const avg_speed_kmh = isHeavyTraffic ? 20 : (weather_condition > 0 ? 35 : 45);

          // Store for route optimizer
          liveTrafficRef.current = { traffic_index, weather_condition, avg_speed_kmh };

          // 3. AI ETA
          const res = await API.post(`/vehicles/${vehicle._id}/eta`, {
            distance_remaining_km: 25,
            avg_speed_kmh,
            traffic_index,
            weather_condition,
            bus_type: vehicle.type === 'long-haul' ? 1 : 0
          });
          setAiEtaData({
            etaMins: res.data.estimated_minutes,
            traffic: traffic_index,
            isHeavy: isHeavyTraffic,
            time: new Date(Date.now() + res.data.estimated_minutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        } catch (err) { console.error("ETA fetch error", err); }
      };
      fetchEtaAndWeather();
      interval = setInterval(fetchEtaAndWeather, 15000);
    } else {
      setAiEtaData(null);
      setWeatherData(null);
      setRouteOptData(null);
    }
    return () => clearInterval(interval);
  }, [activeTrip, vehicle]);

  // Route Optimization — run every 30s during active trip
  const runRouteOpt = useCallback(async () => {
    if (!vehicle?._id || !activeTrip) return;
    setOptimizing(true);
    try {
      const { traffic_index, weather_condition, avg_speed_kmh } = liveTrafficRef.current;
      const res = await API.post(`/vehicles/${vehicle._id}/optimize-route`, {
        traffic_index,
        weather_condition,
        avg_speed_kmh,
      });
      setRouteOptData(res.data);
    } catch (err) {
      console.error("Route optimization failed:", err);
    } finally {
      setOptimizing(false);
    }
  }, [vehicle, activeTrip]);

  useEffect(() => {
    if (!activeTrip || !vehicle) return;
    runRouteOpt();                              // run immediately
    const iv = setInterval(runRouteOpt, 30000); // then every 30s
    return () => clearInterval(iv);
  }, [activeTrip, vehicle, runRouteOpt]);

  // Load original route
  useEffect(() => {
    if (!activeTrip || !vehicle?.route?.stops) return;
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
        setOriginalRouteCoords(decoded.map(([lat, lng]) => [lat, lng]));
      } catch (e) {
        console.error("Route load failed:", e);
      }
    };
    loadRoute();
  }, [activeTrip, vehicle]);

  // Load optimized route
  useEffect(() => {
    if (!activeTrip || !routeOptData?.detour_needed || !vehicle) {
      setOptimizedRouteCoords([]);
      return;
    }
    
    const current_lat = vehicle.currentLocation?.lat || vehicle.route?.stops?.[0]?.lat || 12.9716;
    const current_lng = vehicle.currentLocation?.lng || vehicle.route?.stops?.[0]?.lng || 77.5946;
    const detour_lat = routeOptData.detour_lat;
    const detour_lng = routeOptData.detour_lng;
    
    const stops = vehicle.route?.stops || [];
    const end_lat = stops.length > 0 ? stops[stops.length - 1].lat : 12.9716;
    const end_lng = stops.length > 0 ? stops[stops.length - 1].lng : 77.5946;

    const coordsURL = `${current_lng},${current_lat};${detour_lng},${detour_lat};${end_lng},${end_lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsURL}?overview=full&geometries=polyline`;

    const loadOptimized = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.routes?.length) return;
        const decoded = polyline.decode(data.routes[0].geometry);
        const coords = decoded.map(([lat, lng]) => [lat, lng]);
        setOptimizedRouteCoords(coords);
        
        if (mapRef.current) {
          mapRef.current.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
        }
      } catch (e) {
        console.error("Optimized route load failed:", e);
      }
    };
    loadOptimized();
  }, [routeOptData, activeTrip, vehicle]);

  // Gently pan map to live location
  useEffect(() => {
    if (mapRef.current && liveCoords && !routeOptData?.detour_needed) {
       mapRef.current.setView([liveCoords.lat, liveCoords.lng]);
    }
  }, [liveCoords, routeOptData?.detour_needed]);

  const fetchTrips = async () => {
    try {
      const res = await API.get("/trips/my-trips");
      const allTrips = res.data || [];
      
      // Filter today's trips
      const today = new Date().setHours(0, 0, 0, 0);
      const todaysTripsList = allTrips.filter(t => new Date(t.createdAt).setHours(0, 0, 0, 0) === today);
      setTodayTrips(todaysTripsList);

      // Find if one is currently ongoing
      const ongoing = allTrips.find(t => t.status === "ongoing");
      setActiveTrip(ongoing || null);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleTrip = async () => {
    if (!vehicle || !vehicle.route) {
      showToast("No active route assigned. Cannot start trip.", "error");
      return;
    }

    setTripLoading(true);
    try {
      if (activeTrip) {
        // END TRIP
        const res = await API.post("/trips/end", {
          tripId: activeTrip._id,
          distanceCovered: 15.0 // For now, hardcode or calculate
        });
        setActiveTrip(null);
        showToast(`Trip Completed! You earned ₹${res.data.trip.earnings}`, "success");
      } else {
        // START TRIP
        // We simulate fetching driver's current coordinates via browser
        let lat = vehicle.route.originLat || 0;
        let lng = vehicle.route.originLng || 0;
        
        const res = await API.post("/trips/start", {
          vehicleId: vehicle._id,
          routeId: vehicle.route._id || vehicle.route,
          lat,
          lng
        });
        
        setActiveTrip(res.data.trip);
        showToast("Trip started! Drive safely.", "success");
      }
      
      // Refetch today's trips
      fetchTrips();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Action failed", "error");
    } finally {
      setTripLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="drv-dash-loading">
        <div className="drv-dash-spinner"></div>
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (!vehicle) return <DriverNoAssignment />;

  // Analytics Computation
  const tripCount = todayTrips.length;
  const distance = todayTrips.reduce((acc, t) => acc + (t.distanceCovered || 0), 0).toFixed(1);
  const earnings = todayTrips.reduce((acc, t) => acc + (t.earnings || 0), 0);

  return (
    <div className="drv-dash" style={{ position: "relative" }}>
      {/* Rain overlay removed — weather shown via badge in map only */}

      {/* Map modal and SOS modal */}
      {toast && (
        <div className={`drv-toast ${toast.type}`} style={{ position: 'absolute', top: 0, right: 0, padding: '10px 20px', background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', borderRadius: '8px', zIndex: 1000, animation: 'fadeInDown 0.3s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* Stats Row */}
      <div className="drv-dash__stats">
        <div className="drv-stat-card drv-stat-card--trips">
          <div className="drv-stat-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">{tripCount}</span>
            <span className="drv-stat-card__label">Trips Today</span>
          </div>
        </div>

        <div className="drv-stat-card drv-stat-card--distance">
          <div className="drv-stat-card__icon-wrap">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">{distance} <small>km</small></span>
            <span className="drv-stat-card__label">Distance Covered</span>
          </div>
        </div>

        <div className={`drv-stat-card drv-stat-card--status ${activeTrip ? "drv-stat-card--online" : "drv-stat-card--offline"}`}>
          <div className="drv-stat-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">
              <span className={`drv-status-dot ${activeTrip ? "drv-status-dot--online" : "drv-status-dot--offline"}`}></span>
              {activeTrip ? "Driving" : "Idle"}
            </span>
            <span className="drv-stat-card__label">Current Status</span>
          </div>
        </div>
      </div>

      {/* Smart Traffic & ETA Alert Widget - Only visible when trip is active */}
      {activeTrip && aiEtaData && (
        <div className="drv-smart-alert" style={{ background: 'var(--drv-surface)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--drv-border)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: aiEtaData.isHeavy ? '#ef4444' : '#10b981' }}></div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ background: aiEtaData.isHeavy ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: aiEtaData.isHeavy ? '#ef4444' : '#10b981', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--drv-text)', fontWeight: '600' }}>Live AI Traffic & ETA</h3>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--drv-text-muted)', lineHeight: '1.5' }}>
                {weatherData && weatherData.condition > 0 ? (
                  <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{weatherData.desc} detected. AI ETA has been adjusted for weather conditions. </span>
                ) : ""}
                {aiEtaData.isHeavy 
                  ? `Heavy traffic detected (Severity: ${aiEtaData.traffic}/10). AI ETA has been extended. Consider alternate routes if possible.` 
                  : `Traffic is flowing smoothly (Severity: ${aiEtaData.traffic}/10). You are currently on track to arrive on time.`}
              </p>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ background: 'var(--drv-surface-2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--drv-text)', fontWeight: 'bold' }}>
                  {aiEtaData.isHeavy ? (
                    <><span style={{ color: '#ef4444' }}>Delayed</span> ETA</>
                  ) : (
                    <><span style={{ color: '#10b981' }}>On Time</span></>
                  )}
                </div>
                <div style={{ background: 'var(--drv-surface-2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--drv-text)', fontWeight: 'bold' }}>
                  Arriving: {aiEtaData.time} ({Math.round(aiEtaData.etaMins)} mins)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Route Optimization Widget */}
      {activeTrip && routeOptData && (
        <div className="drv-smart-alert" style={{ background: 'var(--drv-surface)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--drv-border)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: routeOptData.detour_needed ? '#f59e0b' : '#3b82f6' }}></div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ background: routeOptData.detour_needed ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: routeOptData.detour_needed ? '#f59e0b' : '#3b82f6', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {routeOptData.detour_needed 
                  ? <><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></>
                  : <><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></>
                }
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--drv-text)', fontWeight: '600' }}>
                {routeOptData.detour_needed ? "AI Detour Recommended" : "Optimal Route Confirmed"}
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--drv-text-muted)', lineHeight: '1.5' }}>
                {routeOptData.reason}
              </p>
              {routeOptData.detour_needed && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ background: 'var(--drv-surface-2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                    Save {Math.max(0, Math.round(routeOptData.original_eta_minutes - routeOptData.optimized_eta_minutes))} mins
                  </div>
                  <div style={{ background: 'var(--drv-surface-2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--drv-text)', fontWeight: 'bold' }}>
                    Confidence: {routeOptData.model_confidence ? Math.round(routeOptData.model_confidence * 100) + '%' : 'N/A'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Crowd Prediction Widget — shows only this driver's route */}
      <CrowdWidget
        role="driver"
        compact={true}
        routeId={vehicle?.route?._id || vehicle?.route}
      />

      {/* Map visualization for Live Location & Detour */}
      {activeTrip && (
        <div style={{ background: 'var(--drv-surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--drv-border)', marginBottom: '24px', height: '500px', position: 'relative' }}>
          <MapContainer
            center={liveCoords ? [liveCoords.lat, liveCoords.lng] : [routeOptData?.detour_lat || 12.9716, routeOptData?.detour_lng || 77.5946]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              attribution="&copy; Google Maps"
            />
            {/* Original Route — grey dashed (greyed out old route) */}
            {originalRouteCoords.length > 0 && (
              <Polyline
                positions={originalRouteCoords}
                pathOptions={{ color: "#9ca3af", weight: 4, opacity: 0.6, dashArray: "8, 8" }}
              />
            )}
            
            {/* Optimized Detour Route — vivid orange (clearly distinct from green road tiles) */}
            {routeOptData?.detour_needed && optimizedRouteCoords.length > 0 && (
              <Polyline
                positions={optimizedRouteCoords}
                pathOptions={{ color: "#f97316", weight: 7, opacity: 1 }}
              />
            )}
            {/* If no detour needed, show original route in blue as the active route */}
            {!routeOptData?.detour_needed && originalRouteCoords.length > 0 && (
              <Polyline
                positions={originalRouteCoords}
                pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.85 }}
              />
            )}

            {/* Current Bus Location */}
            <Marker 
              position={liveCoords ? [liveCoords.lat, liveCoords.lng] : [vehicle?.currentLocation?.lat || vehicle?.route?.stops?.[0]?.lat || 12.9716, vehicle?.currentLocation?.lng || vehicle?.route?.stops?.[0]?.lng || 77.5946]} 
              icon={busIcon}
            >
              <Popup>Your Current Location</Popup>
            </Marker>

            {/* Detour Waypoint */}
            {routeOptData?.detour_lat && routeOptData?.detour_lng && (
              <Marker position={[routeOptData.detour_lat, routeOptData.detour_lng]} icon={detourIcon}>
                <Popup>🚧 Detour Waypoint</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Map Legend */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', borderRadius: 10, padding: '8px 12px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {routeOptData?.detour_needed ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#fff' }}>
                  <span style={{ width: 20, height: 3, background: '#9ca3af', display: 'inline-block', borderRadius: 2 }} />
                  Old Route
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#fff' }}>
                  <span style={{ width: 20, height: 3, background: '#f97316', display: 'inline-block', borderRadius: 2 }} />
                  Optimized Route
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#fff' }}>
                  <span style={{ fontSize: 12 }}>🚧</span>
                  Detour Point
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#fff' }}>
                <span style={{ width: 20, height: 3, background: '#3b82f6', display: 'inline-block', borderRadius: 2 }} />
                Active Route
              </div>
            )}
          </div>
        </div>
      )}


      {/* Analytics Row: Earnings & Distance (Uber style) */}
      <div style={{ background: 'var(--drv-surface)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--drv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--drv-text-muted)' }}>Today's Earnings</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--drv-primary)' }}>₹{earnings.toFixed(2)}</div>
        </div>
        <button onClick={() => showToast("Trip history feature coming soon!", "success")} style={{ padding: '8px 16px', background: 'var(--drv-surface-2)', border: '1px solid var(--drv-border)', borderRadius: '8px', color: 'var(--drv-text)', cursor: 'pointer', fontWeight: '500' }}>View History</button>
      </div>

      {/* Trip Toggle */}
      <div className="drv-dash__trip-section">
        <button
          id="voice-trip-btn"
          className={`drv-trip-btn ${activeTrip ? "drv-trip-btn--end" : "drv-trip-btn--start"}`}
          onClick={handleToggleTrip}
          disabled={tripLoading}
        >
          {tripLoading ? (
            <span className="drv-trip-btn__text">Processing...</span>
          ) : (
            <>
              <span className="drv-trip-btn__icon">
                {activeTrip ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
              </span>
              <span className="drv-trip-btn__text">
                {activeTrip ? "End Trip" : "Start Trip"}
              </span>
            </>
          )}
        </button>
        <p className="drv-trip-subtitle">
          {activeTrip
            ? "Your trip is currently active. Location is being shared securely."
            : "Tap to start your trip and begin streaming location to passengers."
          }
        </p>
      </div>
    </div>
  );
}