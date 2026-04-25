/**
 * Geocode Utility
 * Converts place names to lat/lng coordinates using the OpenStreetMap Nominatim API.
 * Free to use — no API key required.
 */
const axios = require("axios");

// Use OpenStreetMap Nominatim — free & no API key required
async function geocodePlace(placeName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      placeName
    )}`;

    const res = await axios.get(url, {
      headers: { "User-Agent": "PT-Tracker-App" },
    });

    if (!res.data || res.data.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(res.data[0].lat),
      lng: parseFloat(res.data[0].lon),
    };
  } catch (err) {
    console.error("Geocoding failed for:", placeName, err);
    return null;
  }
}

module.exports = { geocodePlace };
