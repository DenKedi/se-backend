const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./emailService');




async function registerUser({ displayed_name, email, password }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Benutzer mit dieser E-Mail existiert bereits");
  }

  const lastUser = await User.findOne().sort({ user_id: -1 });
  const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

  const newUser = new User({ user_id: nextUserId, displayed_name, email, password });
  try {
    const confirmationToken = generateConfirmationToken(newUser.id);
    const confirmUrl = `http://localhost:4200/confirm-email?token=${confirmationToken}`;
    const emailSubject = "Bestätige deine E-Mail Adresse für Plausch";
    const emailContent = `Bitte folge diesem Link, um deine E-Mail Adresse zu bestätigen: <a href="${confirmUrl}">Klick</a>`;
    await sendEmail(newUser.email, emailSubject, emailContent);  
  } catch (err) {
    throw new Error("Token konnte nicht generiert werden");
  }
  
  await newUser.save();
  return newUser;
}

async function findUserByEmail(email) {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("Benutzer nicht gefunden");
        }
    } catch (err) {
        throw new Error("Benutzer nicht gefunden");
    }
}
async function findUserById(id) {
    try {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("Benutzer nicht gefunden");
        }
    } catch (err) {
        throw new Error("Benutzer nicht gefunden");
    }
}

function generateConfirmationToken(id){
    console.log(id);
    try {
        return jwt.sign(
            { userId: id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
    } catch (err) {
        console.error(err.message);
        throw new Error("Token konnte nicht generiert werden");
    }
}
module.exports = { registerUser, findUserByEmail, findUserById, generateConfirmationToken };
