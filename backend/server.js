// Use Google DNS to resolve MongoDB SRV records (network DNS fix)
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
dotenv.config();                        // 1️⃣ Load env FIRST 🔥

const connectDB = require("./config/db");
const cors = require("cors");
const morgan = require("morgan");

const passport = require("passport");
require("./config/passport");  
require("./jobs/etaEmailJob");
         // 2️⃣ Load passport AFTER env


connectDB();

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());


// Routes
app.use("/api/auth", require("./routes/authRoutes"));
// Add below routes later
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/routes", require("./routes/routeRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/trips", require("./routes/tripRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/sos", require("./routes/sosRoutes"));


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
