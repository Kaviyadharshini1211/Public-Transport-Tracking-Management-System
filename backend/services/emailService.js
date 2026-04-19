const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent to:", to);
  } catch (err) {
    console.error("Email error:", err.message);
  }
}

module.exports = sendEmail;