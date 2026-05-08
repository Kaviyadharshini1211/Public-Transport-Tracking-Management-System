import React, { useEffect, useState } from "react";
import "../styles/MapWeatherOverlay.css";

export default function MapWeatherOverlay({ lat, lng }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!lat || !lng) return;

    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
        );
        const data = await res.json();
        if (isMounted && data.current_weather) {
          setWeather(data.current_weather);
        }
      } catch (e) {
        console.error("Failed to fetch weather:", e);
      }
    };

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  if (!weather) return null;

  const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const isRaining = RAIN_CODES.includes(weather.weathercode);
  const isNight = weather.is_day === 0;

  const icon = isRaining ? "🌧️" : isNight ? "🌙" : "☀️";

  // Only render the small weather badge — no overlay, no rain drops, no night tint
  return (
    <div className="weather-info-badge">
      <span className="weather-icon">{icon}</span>
      <span className="weather-temp">{Math.round(weather.temperature)}°C</span>
      <span className="weather-desc">
        {isRaining ? "Rain" : isNight ? "Night" : "Clear"}
      </span>
    </div>
  );
}
