const express = require("express");
const dotenv  = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const cors      = require("cors");
const morgan    = require("morgan");

const passport = require("passport");
require("./config/passport");
require("./jobs/etaEmailJob");
require("./jobs/etaSmsJob");

connectDB().then(() => {
  // Start GPS simulator for local buses AFTER DB is ready
  const { startLocalBusSimulator } = require("./jobs/localBusSimulator");
  startLocalBusSimulator();
});

const app = express();

app.use(cors({
  origin:         "*",
  methods:        ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/vehicles",    require("./routes/vehicleRoutes"));
app.use("/api/routes",      require("./routes/routeRoutes"));
app.use("/api/dashboard",   require("./routes/dashboardRoutes"));
app.use("/api/bookings",    require("./routes/bookingRoutes"));

// ★ NEW — local city buses
app.use("/api/local-buses", require("./routes/localBusRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));