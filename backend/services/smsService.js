/**
 * SMS Service
 * Sends SMS notifications via Twilio.
 * Requires TWILIO_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE environment variables.
 * If credentials are missing the service logs a warning and skips silently.
 */
const twilio = require("twilio");

const { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;

// Only create client if all credentials exist
let client = null;
if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
  try {
    client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
    console.log("✅ SMS (Twilio) ready — sending from", TWILIO_PHONE);
  } catch (err) {
    console.warn("⚠️  Twilio init failed:", err.message);
  }
} else {
  console.warn("⚠️  SMS disabled — set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE in .env to enable");
}

/**
 * @param {string} to   - E.164 phone number e.g. +919876543210
 * @param {string} message - Text body
 */
const sendSMS = async (to, message) => {
  if (!client) {
    console.log(`[SMS skipped — no Twilio credentials] To: ${to} | ${message.slice(0, 60)}`);
    return;
  }

  if (!to || !to.startsWith("+")) {
    console.warn(`[SMS] Invalid phone number: "${to}" — must be E.164 format (+countryCode...)`);
    return;
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: to,
    });
    console.log(`✅ SMS sent to ${to} — SID: ${response.sid}`);
  } catch (error) {
    // Log clearly but never crash the job
    console.error(`❌ SMS send failed to ${to}:`, error.message);
  }
};

module.exports = sendSMS;
