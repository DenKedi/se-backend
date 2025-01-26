const nodemailer = require('nodemailer');
require("dotenv").config();

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


async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: '"Plausch-noreply" <noreply@plausch.live>', 
      to,                                        
      subject,                                       
      html,                                         
    });
    return info; 
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
}


async function resendConfirmationMail(email, confirmationToken) {
  const emailSubject = 'Plausch - Bestätige deine E-Mail-Adresse';
  const emailContent = `
    <h1>Willkommen bei Plausch!</h1>
    <p>Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.</p>
    <a href="https://plausch.live/confirm/${confirmationToken}">Hier klicken, um zu bestätigen</a>
  `;

  await sendEmail(email, emailSubject, emailContent);
}

module.exports = { sendEmail, resendConfirmationMail };
