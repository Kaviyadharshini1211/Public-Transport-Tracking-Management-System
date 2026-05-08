/**
 * Email Service
 * Sends transactional emails (booking confirmations, ETA alerts) via Gmail SMTP.
 * Requires MAIL_USER and MAIL_PASS (Gmail App Password) environment variables.
 */
const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Verify connection on startup
  transporter.verify((err) => {
    if (err) {
      console.error("❌ Email transporter error:", err.message);
      console.error("   → Check that MAIL_PASS is a Gmail App Password (not your Gmail login password).");
      console.error("   → Enable 2FA then generate at: https://myaccount.google.com/apppasswords");
    } else {
      console.log("✅ Email transporter ready — using", process.env.MAIL_USER);
    }
  });
} else {
  console.warn("⚠️ MAIL_USER or MAIL_PASS not set. Emails will be disabled.");
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.warn("📧 Email skipped (transporter not configured):", subject);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: `"PT Tracker" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("📧 Email sent to:", to, "— Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Email send error:", err.message);
    if (err.code === "EAUTH") {
      console.error("   → Authentication failed. Regenerate your Gmail App Password.");
    }
  }
}

module.exports = sendEmail;