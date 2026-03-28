import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// MUI
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

// Google OAuth
import { GoogleOAuthProvider } from "@react-oauth/google";

// LEAFLET (MAP) CSS — REQUIRED
import "leaflet/dist/leaflet.css";

// GLOBAL STYLES & THEME
import "./index.css";

// FIX LEAFLET MARKER ICONS
import "./fixLeafletIcons";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#f50057" },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
