import React, { useEffect, useState } from "react";
import "../styles/MapWeatherOverlay.css";

const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82]; // Drizzle and Rain

export default function MapWeatherOverlay({ lat, lng }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!lat || !lng) return;

    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        const data = await res.json();
        if (isMounted && data.current_weather) {
          setWeather(data.current_weather);
        }
      } catch (e) {
        console.error("Failed to fetch weather:", e);
      }
    };

    fetchWeather();
    return () => { isMounted = false; };
  }, [lat, lng]);

  if (!weather) return null;

  const isRaining = RAIN_CODES.includes(weather.weathercode);
  const isNight = weather.is_day === 0;

  return (
    <>
      {/* Visual map overlays */}
      <div className={`map-weather-overlay ${isNight ? "night-mode" : ""} ${isRaining ? "rain-effect" : ""}`}>
        {isRaining && (
          <div className="rain-container">
            {/* Generating multiple rain drops using CSS */}
            {[...Array(50)].map((_, i) => (
              <div key={i} className="rain-drop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random() * 0.5}s`, animationDelay: `${Math.random() * 2}s` }}></div>
            ))}
          </div>
        )}
      </div>

      {/* Weather info badge */}
      <div className="weather-info-badge">
        <span className="weather-icon">{isRaining ? "🌧️" : isNight ? "🌙" : "☀️"}</span>
        <span className="weather-temp">{Math.round(weather.temperature)}°C</span>
      </div>
    </>
  );
}
