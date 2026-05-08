const RazorpayModule = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const sendEmail = require("../services/emailService");
const sendSMS = require("../services/smsService");

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
      .populate("userId", "name email phone")
      .populate("vehicleId")
      .populate("routeId");

    // ── Send Notifications (Email + SMS) ─────────────────────────
    const routeName = populatedBooking.routeId?.name || "N/A";
    const regNum   = populatedBooking.vehicleId?.regNumber || "N/A";
    const seats_str = seatNumbers?.length > 0 ? seatNumbers.join(", ") : `${seats} seat(s)`;
    const stop     = boardingStop?.name || "As selected";
    const fare     = totalFare ? `₹${totalFare}` : "N/A";

    // 1. Send SMS
    const rawPhone = populatedBooking.userId?.phone;
    if (rawPhone) {
      let e164Phone = rawPhone.trim();
      if (/^[6-9]\d{9}$/.test(e164Phone)) e164Phone = `+91${e164Phone}`;
      if (/^0[6-9]\d{9}$/.test(e164Phone)) e164Phone = `+91${e164Phone.slice(1)}`;
      
      const smsBody = `✅ Booking Confirmed!
Route: ${routeName}
Vehicle: ${regNum}
Seats: ${seats_str}
Boarding: ${stop}
Fare: ${fare}
Have a safe journey! 🚌`;
      
      await sendSMS(e164Phone, smsBody);
    }

    // 2. Send Email
    if (populatedBooking.userId?.email) {
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! 🚍</h2>
          </div>
          <div style="padding: 30px; background-color: white;">
            <p style="font-size: 16px; color: #1e293b;">Hi <strong>${populatedBooking.userId.name}</strong>,</p>
            <p style="color: #475569; line-height: 1.6;">Your journey is successfully booked. Get ready for a comfortable ride!</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; width: 40%;">Booking ID</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${populatedBooking._id}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Route</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${routeName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Vehicle</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${regNum}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Seats</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${seats_str}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Boarding Stop</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${stop}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Fare Paid</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${fare}</td></tr>
              </table>
            </div>
            
            <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 30px;">Thank you for choosing PT Tracker. Have a safe journey!</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} PT Tracker System. All rights reserved.
          </div>
        </div>
      `;

      await sendEmail(populatedBooking.userId.email, `✅ Booking Confirmed — ${routeName}`, emailHtml);
    }

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
