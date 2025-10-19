const nodemailer = require('nodemailer');
require('dotenv').config();

// SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: '"Plausch" <noreply@plausch.live>',
      to,
      subject,
      html,
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    console.error('Full error:', error);
    throw new Error('Error sending email: ' + error.message);
  }
}

async function resendConfirmationMail(email, confirmationToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://plausch.live';
  const emailSubject = 'Plausch - Bestätige deine E-Mail-Adresse';
  const emailContent = `
    <h1>Willkommen bei Plausch!</h1>
    <p>Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.</p>
    <a href="${frontendUrl}/confirm-email?token=${confirmationToken}">Hier klicken, um zu bestätigen</a>
  `;

  await sendEmail(email, emailSubject, emailContent);
}

module.exports = { sendEmail, resendConfirmationMail };
