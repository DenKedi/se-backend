const nodemailer = require('nodemailer');
require("dotenv").config();

// SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use STARTTLS, not SSL/TLS
  auth: {
    user: process.env.BREVO_USER, 
    pass: process.env.BREVO_PASS,        
  },
});

// Function to send email
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: '"Plausch-noreply" <noreply@plausch.live>', 
      to,                                        
      subject,                                       
      html,                                         
    });
    console.log('Email sent to: ', to);
    return info; //Returnen wir einfach mal und gucken wohin es uns führt
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
}

// Function to resend confirmation email
async function resendConfirmationMail(email, confirmationToken) {
  const emailSubject = 'Plausch - Bestätige deine E-Mail-Adresse';
  const emailContent = `
    <h1>Willkommen bei Plausch!</h1>
    <p>Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.</p>
    <a href="http://localhost:3000/confirm/${confirmationToken}">Hier klicken, um zu bestätigen</a>
  `;

  await sendEmail(email, emailSubject, emailContent);
}


module.exports = { sendEmail, resendConfirmationMail };