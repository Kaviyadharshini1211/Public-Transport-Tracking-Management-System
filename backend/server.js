// Use Google DNS to resolve MongoDB SRV records (network DNS fix)
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
dotenv.config();                        // 1️⃣ Load env FIRST 🔥

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

// CORS Whitelist (Authorized origins)
const whitelist = [];
if (process.env.FRONTEND_URL) {
  whitelist.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`[CORS Error] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With", 
    "Accept", 
    "Origin"
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/routes", require("./routes/routeRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/trips", require("./routes/tripRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/sos", require("./routes/sosRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/local-buses", require("./routes/localBusRoutes"));

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Attach socket IO to app globally for controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[Socket.IO] New connection: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => console.log(`Server & Socket.IO running on port ${PORT}`));

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Better error handling for production
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});
