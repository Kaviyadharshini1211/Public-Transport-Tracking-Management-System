import React, { useState, useEffect } from "react";
import DriverNoAssignment from "./DriverNoAssignment";
import API from "../../api/api";
import "../../styles/DriverDashboard.css";

export default function DriverDashboard({ user, vehicle, loading, onRefresh }) {
  const [activeTrip, setActiveTrip] = useState(null);
  const [todayTrips, setTodayTrips] = useState([]);
  const [tripLoading, setTripLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [aiEtaData, setAiEtaData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    if (user && vehicle) fetchTrips();
    // eslint-disable-next-line
  }, [user, vehicle]);

  // AI ETA Polling
  useEffect(() => {
    let interval;
    if (activeTrip && vehicle) {
      const fetchEtaAndWeather = async () => {
        try {
          // Get vehicle location (approximate using origin for demo)
          const lat = vehicle.route?.originLat || vehicle.route?.stops?.[0]?.lat || 12.9716; // Default to Bangalore
          const lng = vehicle.route?.originLng || vehicle.route?.stops?.[0]?.lng || 77.5946;

          // 1. Fetch live weather from Open-Meteo (Free, no API key)
          let weather_condition = 0; // 0=Clear, 1=Rain, 2=Fog, 3=Storm
          let isRaining = false;
          let weatherDesc = "Clear";
          
          try {
            const meteoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
            const meteoData = await meteoRes.json();
            const wmoCode = meteoData.current_weather?.weathercode || 0;
            
            // Map WMO codes to our model (0-3)
            if ([45, 48].includes(wmoCode)) { weather_condition = 2; weatherDesc = "Fog"; }
            else if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(wmoCode)) { weather_condition = 1; weatherDesc = "Rain"; isRaining = true; }
            else if ([95, 96, 99].includes(wmoCode)) { weather_condition = 3; weatherDesc = "Storm"; isRaining = true; }
            
            setWeatherData({ condition: weather_condition, desc: weatherDesc, isRaining, temp: meteoData.current_weather?.temperature });
          } catch (e) {
            console.error("Weather fetch failed:", e);
          }

          // 2. Simulate dynamic traffic condition for demo
          const isHeavyTraffic = Math.random() > 0.7;
          const traffic_index = isHeavyTraffic ? Math.floor(Math.random() * 4) + 7 : Math.floor(Math.random() * 4) + 2;
          
          // 3. Fetch AI ETA predicting using LIVE weather
          const res = await API.post(`/vehicles/${vehicle._id}/eta`, {
            distance_remaining_km: 25,
            avg_speed_kmh: isHeavyTraffic ? 20 : (weather_condition > 0 ? 35 : 45), // Slow down in bad weather
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
        } catch (err) {
          console.error("ETA fetch error", err);
        }
      };
      
      fetchEtaAndWeather();
      interval = setInterval(fetchEtaAndWeather, 15000); // 15 seconds for demo reactivity
    } else {
      setAiEtaData(null);
      setWeatherData(null);
    }
    return () => clearInterval(interval);
  }, [activeTrip, vehicle]);

  // Voice Assistant Hook
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.trim().toLowerCase();
      
      if (command.includes('start trip')) {
        showToast("Voice command detected: Starting Trip", "success");
        // Safe check using current state isn't guaranteed here due to closure unless we use refs, 
        // but for demo purposes, we will trigger handleToggleTrip natively if NOT active.
        document.getElementById('voice-trip-btn')?.click();
      } else if (command.includes('end trip') || command.includes('stop trip')) {
        showToast("Voice command detected: Ending Trip", "success");
        document.getElementById('voice-trip-btn')?.click();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.log('Voice recognition failed to start:', e);
    }

    return () => {
      try { recognition.stop(); } catch(e){}
    };
  }, []);

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
      {/* Rain Effect overlay if it's raining */}
      {weatherData?.isRaining && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          background: 'url("https://cdn.pixabay.com/photo/2015/06/08/14/53/rain-801755_960_720.jpg")',
          backgroundSize: 'cover',
          opacity: 0.15,
          mixBlendMode: 'screen'
        }} />
      )}

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