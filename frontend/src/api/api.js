import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  timeout: 30000, // 30s timeout for Render cold starts
});

// Attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. The server might be waking up.');
      error.message = 'The server is taking too long to respond. Please try again in 30 seconds.';
    }
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! Clearing token and redirecting to login...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Force reload to clear React state and redirect correctly via Auth flow
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
