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
        console.log("Confirmation Token:", confirmationToken);
        
    
        await newUser.save();
        return newUser; 
    } catch (err) {
        console.error("Error in registerUser:", err.message);
        throw new Error("Token konnte nicht generiert werden");
    }
}

async function findUserByEmail(email) {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found`);
            throw new Error("Benutzer nicht gefunden");
        }
        return user;
    } catch (err) {
        console.error("Error in findUserByEmail:", err.message);
        throw new Error("Benutzer nicht gefunden");
    }
}


async function findUserById(id) {
    try {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("Benutzer nicht gefunden");
        }
        return user; // Return the user
    } catch (err) {
        throw new Error("Benutzer nicht gefunden");
    }
}


function generateConfirmationToken(id) {
    try {
        console.log("Generating token for ID:", id); // Debugging
        return jwt.sign(
            { id: id },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
    } catch (err) {
        console.error("Error generating confirmation token:", err.message);
        throw new Error("Token konnte nicht generiert werden");
    }
}

function generateSessionToken(user) {
    try {
        return jwt.sign(
            { user: user },
            process.env.JWT_SECRET,
            { expiresIn: "360000" } 
        );
    } catch (err) {
        console.error("Error generating session token:", err);
        throw err;
    }
}

module.exports = { registerUser, findUserByEmail, findUserById, generateConfirmationToken, generateSessionToken };
