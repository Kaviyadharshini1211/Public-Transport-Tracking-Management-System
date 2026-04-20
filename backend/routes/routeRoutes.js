const express = require("express");
const {
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute
} = require("../controllers/routeController");

const router = express.Router();

// CRUD
router.get("/", listRoutes);
router.get("/:id", getRoute);
router.post("/", createRoute);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);

module.exports = router;