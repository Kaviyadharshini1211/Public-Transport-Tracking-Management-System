const RazorpayModule = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const nodemailer = require("nodemailer");

// Extremely robust Razorpay instantiation
let Razorpay;
if (typeof RazorpayModule === "function") {
  Razorpay = RazorpayModule;
} else if (RazorpayModule && typeof RazorpayModule.Razorpay === "function") {
  Razorpay = RazorpayModule.Razorpay;
} else if (RazorpayModule && typeof RazorpayModule.default === "function") {
  Razorpay = RazorpayModule.default;
} else {
  console.error("[Razorpay] Could not find constructor in module:", RazorpayModule);
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder",
});

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

// Verify Razorpay Payment Signature
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Payment is verified, now create / update the booking record
    const {
      userId,
      vehicleId,
      routeId,
      seats,
      seatNumbers,
      totalFare,
      boardingStop,
      journeyDate,
    } = bookingDetails;

    const booking = await Booking.create({
      userId,
      vehicleId,
      routeId,
      seats,
      seatNumbers,
      totalFare,
      boardingStop,
      journeyDate,
      status: "Confirmed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("userId", "name email")
      .populate("vehicleId")
      .populate("routeId");

    // Optional: Send Email Confirmation
    sendConfirmationEmail(populatedBooking);

    res.status(201).json({
      success: true,
      message: "Payment verified & Booking confirmed!",
      booking: populatedBooking,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// Utility function to send confirmation email
async function sendConfirmationEmail(booking) {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.warn("Email credentials missing, skipping confirmation email.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"PT Tracker" <${process.env.MAIL_USER}>`,
      to: booking.userId.email,
      subject: "Booking Confirmed! 🚍 Ticket Details",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
          <h2 style="color: #1a73e8; text-align: center;">Booking Confirmed!</h2>
          <p>Hi <strong>${booking.userId.name}</strong>,</p>
          <p>Your journey from <strong>${booking.routeId.origin}</strong> to <strong>${booking.routeId.destination}</strong> is successfully booked.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Vehicle:</strong> ${booking.vehicleId.model} (${booking.vehicleId.regNumber})</p>
            <p><strong>Seats:</strong> ${booking.seatNumbers.join(", ")} (${booking.seats} seats)</p>
            <p><strong>Total Fare:</strong> ₹${booking.totalFare}</p>
            <p><strong>Boarding Point:</strong> ${booking.boardingStop?.name || "As selected"}</p>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">Thank you for choosing PT Tracker. Have a safe journey! 🚍</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${booking.userId.email}`);
  } catch (err) {
    console.error("Email sending error:", err);
  }
}
