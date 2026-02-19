const express = require("express");
const {
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute
} = require("../controllers/routeController");

const router = express.Router();

// Routes
router.get("/", listRoutes);
router.get("/:id", getRoute);
router.post("/", createRoute);        // Admin only normally
router.put("/:id", updateRoute);      // Admin only
router.delete("/:id", deleteRoute);   // Admin only

module.exports = router;
