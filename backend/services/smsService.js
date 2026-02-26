const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to,
    });

    console.log("SMS sent:", response.sid);
  } catch (error) {
    console.error("SMS error:", error.message);
  }
};

module.exports = sendSMS;
