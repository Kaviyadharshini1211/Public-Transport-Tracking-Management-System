/**
 * localBusSimulator.js
 *
 * Moves each local bus along the REAL road geometry (fetched from OSRM).
 * This ensures bus markers follow the same road line shown on the map.
 *
 * Flow:
 *   1. On startup, fetch OSRM road waypoints for every route and cache them.
 *   2. Every 5 s, advance each bus along those waypoints using a budget of
 *      (speed × 5s) km, bouncing when it reaches either terminus.
 *   3. Write the interpolated lat/lng to MongoDB — the frontend polls this.
 */

const Vehicle = require("../models/Vehicle");
const Route   = require("../models/Route");
const https   = require("https");

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Fetch OSRM road geometry (returns [[lat,lng], ...]) ──────────────────────
function fetchOSRM(stops) {
  return new Promise((resolve) => {
    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const url    = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const req = https.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (data.code === "Ok" && data.routes?.[0]) {
            // OSRM returns [lng, lat]; we store [lat, lng]
            const pts = data.routes[0].geometry.coordinates.map(
              ([lng, lat]) => [lat, lng]
            );
            resolve(pts);
            return;
          }
        } catch (_) {}
        // Fallback: straight lines between stops
        resolve(stops.map((s) => [s.lat, s.lng]));
      });
    });

    req.setTimeout(12000, () => {
      req.destroy();
      resolve(stops.map((s) => [s.lat, s.lng]));
    });
    req.on("error", () => resolve(stops.map((s) => [s.lat, s.lng])));
  });
}

// ── Per-route waypoint cache  routeId → [[lat,lng], ...] ─────────────────────
const routeWaypoints = {};

async function ensureWaypoints(route) {
  const key = route._id.toString();
  if (routeWaypoints[key]) return routeWaypoints[key];

  const label = route.name || route.routeName || key.slice(-5);
  console.log(`🗺️  Fetching road geometry: ${label}`);
  const pts = await fetchOSRM(route.stops);
  routeWaypoints[key] = pts;
  console.log(`   ✅ ${pts.length} road waypoints for "${label}"`);
  return pts;
}

// ── Per-bus movement state ────────────────────────────────────────────────────
// busId → { wIdx: number, prog: 0-1, dir: 1|-1 }
const busState = {};

/**
 * Advance a bus along road waypoints.
 *   wIdx  = index of the FROM waypoint in the current segment
 *   prog  = 0-1 how far through that segment the bus currently is
 *   dir   = +1 (forward) or -1 (backward)
 *
 * Returns the new { lat, lng } position exactly on the road.
 */
function advanceOnRoad(state, waypoints, speedKmh, tickSec) {
  // km budget for this tick, with ±15% jitter for realism
  let budget = ((speedKmh * (0.85 + Math.random() * 0.3)) / 3600) * tickSec;

  while (budget > 1e-7) {
    const i    = state.wIdx;
    const next = i + state.dir;

    // Bounce at either end
    if (next < 0 || next >= waypoints.length) {
      state.dir *= -1;
      state.prog = 0;
      continue;
    }

    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[next];
    const segLen = haversine(lat1, lng1, lat2, lng2);

    // Distance remaining inside the current segment
    const leftInSeg = segLen > 0 ? segLen * (1 - state.prog) : 0;

    if (budget >= leftInSeg) {
      // Step to the next waypoint
      budget      -= leftInSeg;
      state.prog   = 0;
      state.wIdx   = next;

      // Bounce immediately if we hit an end
      if (state.wIdx <= 0)                       state.dir =  1;
      else if (state.wIdx >= waypoints.length - 1) state.dir = -1;
    } else {
      // Stay within this segment
      state.prog += segLen > 0 ? budget / segLen : 0;
      budget      = 0;
    }
  }

  // Compute interpolated position
  const i    = state.wIdx;
  const next = Math.max(0, Math.min(waypoints.length - 1, i + state.dir));
  if (i === next) return { lat: waypoints[i][0], lng: waypoints[i][1] };

  const [lat1, lng1] = waypoints[i];
  const [lat2, lng2] = waypoints[next];
  const t = Math.min(Math.max(state.prog, 0), 1);
  return {
    lat: lat1 + (lat2 - lat1) * t,
    lng: lng1 + (lng2 - lng1) * t,
  };
}

// ── Nearest stop index (for ETA) ──────────────────────────────────────────────
function nearestStopIdx(lat, lng, stops) {
  let best = 0, bestDist = Infinity;
  stops.forEach((s, i) => {
    const d = haversine(lat, lng, s.lat, s.lng);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

// ── Single tick ───────────────────────────────────────────────────────────────
async function tick() {
  try {
    const buses = await Vehicle.find({ type: "local" })
      .populate("route", "stops avgSpeedKmph name routeName");

    // Group buses by route so we can spread them evenly
    const byRoute = {};
    for (const bus of buses) {
      if (!bus.route?.stops?.length) continue;
      const key = bus.route._id.toString();
      (byRoute[key] = byRoute[key] || { route: bus.route, buses: [] }).buses.push(bus);
    }

    for (const { route, buses: routeBuses } of Object.values(byRoute)) {
      const waypoints = await ensureWaypoints(route);
      if (waypoints.length < 2) continue;

      const speed = route.avgSpeedKmph || 25;

      // Sort buses by _id for consistent index assignment
      routeBuses.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

      for (let idx = 0; idx < routeBuses.length; idx++) {
        const bus = routeBuses[idx];
        const id  = bus._id.toString();

        // Initialise new bus — spread evenly across the road
        if (!busState[id]) {
          const frac     = idx / routeBuses.length;
          const startW   = Math.floor(frac * (waypoints.length - 1));
          busState[id] = {
            wIdx: startW,
            prog: 0,
            dir:  idx % 2 === 0 ? 1 : -1,  // alternate forward/backward
          };
        }

        const pos     = advanceOnRoad(busState[id], waypoints, speed, 5);
        const nearest = nearestStopIdx(pos.lat, pos.lng, route.stops);

        await Vehicle.findByIdAndUpdate(bus._id, {
          currentLocation:  { lat: pos.lat, lng: pos.lng },
          lastSeenAt:       new Date(),
          isTracking:       true,
          nearestStopIndex: nearest,
        });
      }
    }
  } catch (err) {
    console.error("🚌 Simulator error:", err.message);
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────
async function startLocalBusSimulator() {
  console.log("🚌 Local bus GPS simulator starting…");

  // Pre-fetch OSRM road geometry for all existing routes before first tick
  try {
    const routes = await Route.find({ stops: { $exists: true } });
    for (const route of routes) {
      if (route.stops?.length >= 2) await ensureWaypoints(route);
    }
  } catch (e) {
    console.warn("⚠️  Could not pre-fetch route geometries:", e.message);
  }

  console.log("🚌 GPS simulator running — buses follow real roads every 5 s");
  tick();
  setInterval(tick, 5000);
}

module.exports = { startLocalBusSimulator };
