const nodemailer = require('nodemailer');
require("dotenv").config();

// SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use STARTTLS, not SSL/TLS
  auth: {
    user: process.env.BREVO_USER, // Your Brevo identifier
    pass: process.env.BREVO_PASS,         // Your Brevo password
  },
});

// Function to send email
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: '"Plausch-noreply" <noreply@plausch.live>', // Sender address
      to,                                            // Recipient email
      subject,                                       // Email subject
      html,                                          // HTML content
    });
    console.log('Email sent to: ', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = { sendEmail };