const express = require("express");
const router = express.Router();

const { createOrder, verifyPayment } = require("../controllers/paymentController");

// Create Order (generating order_id)
router.post("/create-order", createOrder);

// Verify Signature and Save Booking
router.post("/verify", verifyPayment);

module.exports = router;
