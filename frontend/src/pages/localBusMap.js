import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as localBusService from "../api/localBus";
import "../styles/localBusMap.css";

// ── Fix default icons ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
});

// ── Route colour palette (one colour per route) ───────────────────────────────
const ROUTE_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4"];

// ── Dynamic numbered bus pin (coloured circle + triangle tail) ────────────────
function makeBusIcon(num, color, isStale) {
  const bg = isStale ? "#9ca3af" : color;
  return new L.DivIcon({
    html: `<div class="lbm-pin" style="--c:${bg}"><span class="lbm-pin-num">${num}</span></div>`,
    className:   "",
    iconSize:    [36, 46],
    iconAnchor:  [18, 46],
    popupAnchor: [0, -50],
  });
}

// ── Stop dot icons ────────────────────────────────────────────────────────────
const stopIcon = new L.DivIcon({
  html: `<div class="lbm-stop-dot"></div>`,
  className: "", iconSize: [14, 14], iconAnchor: [7, 7],
});
const activeStopIcon = new L.DivIcon({
  html: `<div class="lbm-stop-dot lbm-stop-dot--selected"></div>`,
  className: "", iconSize: [20, 20], iconAnchor: [10, 10],
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtETA = (m) =>
  m <= 0 ? "Arriving now" : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;

const ago = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  return s < 10 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
};

const rName = (r) =>
  r?.name || r?.routeName || `Route ${r?._id?.slice(-5) || ""}`;

// ── Fetch road-snapped geometry from OSRM (free public API) ───────────────────
async function fetchRoadGeometry(stops) {
  try {
    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res   = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    const data  = await res.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      // GeoJSON = [lng, lat]; Leaflet needs [lat, lng]
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (e) {
    console.warn("OSRM unavailable, falling back to straight lines:", e.message);
  }
  return stops.map((s) => [s.lat, s.lng]); // straight-line fallback
}

// ── MapController — useMap hook (replaces deprecated whenCreated) ─────────────
function MapController({ selectedRoute, flyTarget, mapRef }) {
  const map = useMap();

  useEffect(() => { mapRef.current = map; }, [map, mapRef]);

  useEffect(() => {
    if (!selectedRoute?.stops?.length) return;
    const bounds = L.latLngBounds(selectedRoute.stops.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }, [selectedRoute, map]);

  useEffect(() => {
    if (!flyTarget) return;
    map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom ?? 16, { animate: true, duration: 0.8 });
  }, [flyTarget, map]);

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LocalBusMap() {
  const [routes,        setRoutes]        = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [buses,         setBuses]         = useState([]);
  const [roadGeo,       setRoadGeo]       = useState(null);
  const [geoLoading,    setGeoLoading]    = useState(false);
  const [selectedStop,  setSelectedStop]  = useState(null);
  const [etaData,       setEtaData]       = useState(null);
  const [etaLoading,    setEtaLoading]    = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [flyTarget,     setFlyTarget]     = useState(null);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [busesLoading,  setBusesLoading]  = useState(false);

  const mapRef   = useRef(null);
  const pollRef  = useRef(null);
  const geoCache = useRef({});

  // ── Load routes once ────────────────────────────────────────────────────────
  useEffect(() => {
    localBusService.getLocalRoutes()
      .then((data) => { setRoutes(data); if (data[0]) setSelectedRoute(data[0]); })
      .catch(console.error)
      .finally(() => setRoutesLoading(false));
  }, []);

  // ── Fetch road geometry when route changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedRoute?.stops?.length) return;
    const key = selectedRoute._id;

    // Show straight-line immediately, replace with roads once OSRM responds
    setRoadGeo(selectedRoute.stops.map((s) => [s.lat, s.lng]));

    if (geoCache.current[key]) { setRoadGeo(geoCache.current[key]); return; }

    setGeoLoading(true);
    fetchRoadGeometry(selectedRoute.stops).then((geo) => {
      geoCache.current[key] = geo;
      setRoadGeo(geo);
    }).finally(() => setGeoLoading(false));
  }, [selectedRoute]);

  // ── Poll live buses every 5 s ────────────────────────────────────────────────
  const fetchBuses = useCallback(() => {
    if (!selectedRoute) return;
    setBusesLoading(true);
    localBusService.getLiveBuses(selectedRoute._id)
      .then((data) => { setBuses(data); setLastUpdated(new Date()); })
      .catch(console.error)
      .finally(() => setBusesLoading(false));
  }, [selectedRoute]);

  useEffect(() => {
    fetchBuses();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchBuses, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchBuses]);

  // Reset ETA when route changes
  useEffect(() => { setSelectedStop(null); setEtaData(null); }, [selectedRoute]);

  // ── Stop click → ETA ─────────────────────────────────────────────────────────
  const handleStopClick = async (stop, idx) => {
    setSelectedStop({ stop, index: idx });
    setEtaData(null);
    setEtaLoading(true);
    setFlyTarget({ lat: stop.lat, lng: stop.lng, zoom: 16 });
    try {
      const data = await localBusService.getStopETA(selectedRoute._id, idx);
      setEtaData(data);
    } catch { setEtaData({ arrivals: [] }); }
    finally   { setEtaLoading(false); }
  };


  // ── Derived values ────────────────────────────────────────────────────────────
  const routeColorIdx = routes.findIndex((r) => r._id === selectedRoute?._id);
  const routeColor    = ROUTE_COLORS[Math.max(0, routeColorIdx) % ROUTE_COLORS.length];
  // Sort by _id so bus numbering is stable across refreshes
  const sortedBuses   = [...buses].sort((a, b) => a._id.localeCompare(b._id));
  const liveBuses     = sortedBuses.filter((b) => !b.isStale);
  const mapCenter     = selectedRoute?.stops?.[0]
    ? [selectedRoute.stops[0].lat, selectedRoute.stops[0].lng]
    : [20.5937, 78.9629];

  return (
    <div className="lbm-wrapper">

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside className="lbm-sidebar">
        <div className="lbm-sidebar-header">
          <h1 className="lbm-title">🚌 Live City Buses</h1>
          <p className="lbm-subtitle">Tap a stop to see arrival times</p>
        </div>

        {/* Route picker */}
        <div className="lbm-section">
          <span className="lbm-label">Select Route</span>
          {routesLoading ? (
            <div className="lbm-skeleton-select" />
          ) : routes.length === 0 ? (
            <div className="lbm-empty-state">
              <span className="lbm-empty-icon">🔍</span>
              <p>No routes found.</p>
              <small>Run the local bus seed script first.</small>
            </div>
          ) : (
            <select
              className="lbm-select"
              value={selectedRoute?._id || ""}
              onChange={(e) => setSelectedRoute(routes.find((x) => x._id === e.target.value) || null)}
            >
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {rName(r)}{r.activeBusCount > 0 ? ` · ${r.activeBusCount} live 🟢` : ""}
                </option>
              ))}
            </select>
          )}

          {/* Route colour + meta */}
          {selectedRoute && (
            <div className="lbm-route-meta">
              <span className="lbm-route-color-dot" style={{ background: routeColor }} />
              {selectedRoute.origin      && <span className="lbm-meta-pill">🔵 {selectedRoute.origin}</span>}
              {selectedRoute.destination && <span className="lbm-meta-pill">🔴 {selectedRoute.destination}</span>}
              {selectedRoute.distanceKm  && <span className="lbm-meta-pill">📏 {selectedRoute.distanceKm} km</span>}
              {geoLoading && <span className="lbm-meta-pill geo-loading">🗺️ Snapping to roads…</span>}
            </div>
          )}
        </div>

        {/* Bus list */}
        {selectedRoute && (
          <div className="lbm-section">
            <div className="lbm-section-header">
              <span className="lbm-label">
                Buses
                <span className={`lbm-count ${liveBuses.length > 0 ? "live" : "none"}`}>
                  {liveBuses.length}/{sortedBuses.length} live
                </span>
              </span>
              {busesLoading && <span className="lbm-spinner-tiny" />}
            </div>

            <div className="lbm-bus-list">
              {sortedBuses.length === 0 ? (
                <div className="lbm-empty-state small">
                  <span className="lbm-empty-icon">📡</span>
                  <p>Waiting for bus signals…</p>
                </div>
              ) : (
                sortedBuses.map((bus, idx) => (
                  <button
                    key={bus._id}
                    className={`lbm-bus-item ${bus.isStale ? "stale" : "live"}`}
                    onClick={() => bus.currentLocation && setFlyTarget({ ...bus.currentLocation, zoom: 16 })}
                    title="Click to locate on map"
                  >
                    <span className="lbm-bus-badge" style={{ background: bus.isStale ? "#9ca3af" : routeColor }}>
                      {idx + 1}
                    </span>
                    <div className="lbm-bus-info">
                      <span className="lbm-bus-reg">Bus {idx + 1}</span>
                      <span className="lbm-bus-plate">{bus.regNumber}</span>
                      <span className="lbm-bus-driver">
                        {bus.driverName || "No driver assigned"}
                        {bus.nearestStopIndex != null && bus.route?.stops?.[bus.nearestStopIndex]
                          ? ` · near ${bus.route.stops[bus.nearestStopIndex].name}` : ""}
                      </span>
                    </div>
                    <div className="lbm-bus-right">
                      <span className={`lbm-bus-status ${bus.isStale ? "stale" : "live"}`}>
                        {bus.isStale ? "⚠ Offline" : "● Live"}
                      </span>
                      <span className="lbm-bus-time">
                        {bus.lastSeenAt ? ago(bus.lastSeenAt) : "—"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
            {lastUpdated && <p className="lbm-last-updated">Updated {ago(lastUpdated)}</p>}
          </div>
        )}

        {/* ETA panel */}
        {selectedStop && (
          <div className="lbm-section lbm-eta-panel">
            <div className="lbm-eta-header">
              <span className="lbm-label">📍 {selectedStop.stop.name}</span>
              <button className="lbm-close-btn" onClick={() => { setSelectedStop(null); setEtaData(null); }}>✕</button>
            </div>
            {etaLoading ? (
              <div className="lbm-eta-loading"><div className="lbm-spinner" /><span>Calculating arrivals…</span></div>
            ) : etaData ? (
              etaData.arrivals.length === 0 ? (
                <div className="lbm-empty-state small">
                  <span className="lbm-empty-icon">🕐</span>
                  <p>No buses heading here right now.</p>
                </div>
              ) : (
                <div className="lbm-arrivals">
                  {etaData.arrivals.map((a, i) => {
                    const busIdx = sortedBuses.findIndex((b) => b._id === a.vehicleId?.toString());
                    const busNum = busIdx >= 0 ? busIdx + 1 : "?";
                    return (
                      <div key={a.vehicleId || i} className={`lbm-arrival-row ${a.status === "arriving" ? "arriving" : ""}`}>
                        <div className="lbm-arrival-left">
                          <span className="lbm-arrival-badge" style={{ background: routeColor }}>{busNum}</span>
                          <div className="lbm-arrival-info">
                            <span className="lbm-arrival-reg">Bus {busNum}</span>
                            <span className="lbm-arrival-driver">{a.regNumber}</span>
                          </div>
                        </div>
                        <div className="lbm-arrival-right">
                          <span className={`lbm-eta-badge ${a.status === "arriving" ? "arriving" : ""}`}>
                            {a.status === "arriving" ? "🟢 Now" : fmtETA(a.etaMinutes)}
                          </span>
                          <span className="lbm-arrival-dist">{a.distanceKm} km away</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : null}
          </div>
        )}

        {/* Stop list */}
        {selectedRoute?.stops?.length > 0 && (
          <div className="lbm-section">
            <span className="lbm-label">
              Stops <span className="lbm-stop-count">{selectedRoute.stops.length}</span>
            </span>
            <div className="lbm-stop-list">
              {selectedRoute.stops.map((stop, idx) => (
                <button
                  key={idx}
                  className={`lbm-stop-btn ${selectedStop?.index === idx ? "active" : ""}`}
                  onClick={() => handleStopClick(stop, idx)}
                >
                  <span className={`lbm-stop-num ${idx === 0 ? "first" : idx === selectedRoute.stops.length - 1 ? "last" : ""}`}>
                    {idx + 1}
                  </span>
                  <span className="lbm-stop-name">{stop.name}</span>
                  {selectedStop?.index === idx && etaData?.arrivals?.length > 0 && (
                    <span className="lbm-stop-chip">{fmtETA(etaData.arrivals[0].etaMinutes)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Map ──────────────────────────────────────────────────────────────── */}
      <div className="lbm-map-wrap">
        <MapContainer center={mapCenter} zoom={13} className="lbm-map">
          <MapController selectedRoute={selectedRoute} flyTarget={flyTarget} mapRef={mapRef} />

          <TileLayer
            url="https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            attribution="&copy; Google Maps"
          />

          {/* Road-following polyline */}
          {roadGeo && (
            <Polyline
              positions={roadGeo}
              pathOptions={{ color: routeColor, weight: 5, opacity: 0.85, lineJoin: "round", lineCap: "round" }}
            />
          )}

          {/* Stop markers */}
          {selectedRoute?.stops?.map((stop, idx) => (
            <Marker
              key={idx}
              position={[stop.lat, stop.lng]}
              icon={selectedStop?.index === idx ? activeStopIcon : stopIcon}
              eventHandlers={{ click: () => handleStopClick(stop, idx) }}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ fontSize: 14 }}>Stop {idx + 1}: {stop.name}</strong>
                  {idx === 0 && <div style={{ fontSize: 11, color: "#10b981", marginTop: 2 }}>🟢 Origin</div>}
                  {idx === selectedRoute.stops.length - 1 && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>🔴 Terminus</div>}
                  <button
                    style={{ marginTop: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, borderRadius: 6, border: `1px solid ${routeColor}`, color: routeColor, background: "white", width: "100%" }}
                    onClick={() => handleStopClick(stop, idx)}
                  >
                    📋 See arrivals
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Selected stop ring */}
          {selectedStop && (
            <Circle
              center={[selectedStop.stop.lat, selectedStop.stop.lng]}
              radius={120}
              pathOptions={{ color: "#f59e0b", fillColor: "#fef3c7", fillOpacity: 0.4, weight: 2 }}
            />
          )}

          {/* Live bus markers — numbered pin icons */}
          {sortedBuses.map((bus, idx) => {
            if (!bus.currentLocation) return null;
            return (
              <Marker
                key={bus._id}
                position={[bus.currentLocation.lat, bus.currentLocation.lng]}
                icon={makeBusIcon(idx + 1, routeColor, bus.isStale)}
              >
                <Popup>
                  <div style={{ minWidth: 190 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: bus.isStale ? "#9ca3af" : routeColor, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: 15 }}>Bus {idx + 1}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: bus.isStale ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                      {bus.isStale ? "⚠️ Signal lost" : "🟢 Live tracking"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>🚌 {bus.model || "City Bus"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>🔢 {bus.regNumber}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>👤 {bus.driverName || "Unassigned"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>🕐 {bus.lastSeenAt ? ago(bus.lastSeenAt) : "Unknown"}</div>
                    {bus.nearestStopIndex != null && bus.route?.stops?.[bus.nearestStopIndex] && (
                      <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>
                        📍 Near: {bus.route.stops[bus.nearestStopIndex].name}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* LIVE badge */}
        <div className="lbm-live-badge">
          <span className={`lbm-live-dot ${liveBuses.length > 0 ? "active" : "inactive"}`} />
          {liveBuses.length > 0
            ? `LIVE · ${liveBuses.length} bus${liveBuses.length !== 1 ? "es" : ""} active`
            : "WAITING FOR SIGNAL"}
        </div>

        {/* Stats overlay */}
        {sortedBuses.length > 0 && (
          <div className="lbm-stats-overlay">
            <div className="lbm-stat">
              <span className="lbm-stat-val" style={{ color: routeColor }}>{liveBuses.length}</span>
              <span className="lbm-stat-lbl">Live</span>
            </div>
            <div className="lbm-stat-div" />
            <div className="lbm-stat">
              <span className="lbm-stat-val">{sortedBuses.length}</span>
              <span className="lbm-stat-lbl">Total</span>
            </div>
            <div className="lbm-stat-div" />
            <div className="lbm-stat">
              <span className="lbm-stat-val">{selectedRoute?.stops?.length || 0}</span>
              <span className="lbm-stat-lbl">Stops</span>
            </div>
          </div>
        )}

        {/* Road-snap loading indicator */}
        {geoLoading && (
          <div className="lbm-geo-loading-badge">
            <span className="lbm-spinner-tiny" /> Snapping route to roads…
          </div>
        )}
      </div>
    </div>
  );
}