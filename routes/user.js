/**
 * @fileoverview This file contains the routes for user-related operations, including user registration, 
 * fetching user details, and email confirmation. It uses Express.js for routing and various middleware 
 * for authentication and validation.
 */

require("dotenv").config(); // Load environment variables from .env

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import the auth middleware
const User = require("../models/User"); // Import the User model
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/email");
const jwt = require("jsonwebtoken");

/**
 * @typedef {Object} User
 * @property {number} index - The unique index of the user.
 * @property {string} username - The unique username of the user.
 * @property {string} email - The unique email of the user.
 * @property {string} password - The hashed password of the user.
 * @property {string} [bio] - The bio of the user.
 * @property {string} [status="online"] - The status of the user.
 * @property {string} [profilePicture] - The profile picture URL of the user.
 * @property {Array<ObjectId>} friendList - The list of friends of the user.
 * @property {Date} createdAt - The date when the user was created.
 * @property {Date} updatedAt - The date when the user was last updated.
 */

//GET /api/users/me
router.get("/me", auth, async (req, res) => {
    try {
      // Find the user by ID
      const user = await User.findById(req.user.id).select("-password"); // Exclude the password
      res.json(user);
    } catch (err) {
      console.error(err.message);
      console.log("hello");
      res.status(500).send("Server error");
    }
  });

// GET /api/users/:id
router.get("/:id", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "User not found" });
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });
  

//POST /api/users/register
    // POST /api/users/register
router.post("/register", async (req, res) => {
    const { name, email, password, location } = req.body;
  
    try {
        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "Benutzer mit dieser E-mail existiert bereits" });
        }
  
        // Check if company email @straightforward.email
        if (!email.includes("@straightforward.email")) {
            return res.status(401).json({ msg: "Bitte benutze eine E-mail der Firma Straightforward" });
        }
  
        // Create a new user instance
        user = new User({
            name,
            email,
            password,
            location,
            isConfirmed: false // Set isActive to false until email confirmation
        });
  
        // Save the new user
        await user.save();
  
        // Generate a confirmation token with a short expiration time (e.g., 1 hour)
        const confirmationToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
  
        await user.save();
  
        // Send the confirmation email
        const confirmUrl = `https://straightmonitor.com/confirm-email?token=${confirmationToken}`;
        const emailSubject = "Bestätige deine E-Mail Adresse für den Straightforward Monitor";
        const emailContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="font-weight: bold; color: #000;">Willkommen beim Straightforward Monitor!</h2>
      <p>Diese E-Mail dient zur Bestätigung deiner Registrierung. Bitte bestätige deine E-Mail Adresse, um dein Profil zu aktivieren.</p>
      <p>
        <a href="${confirmUrl}" style="color: #000; text-decoration: none; font-weight: bold;">
          <strong>Hier klicken, um die E-Mail Adresse zu bestätigen</strong>
        </a>
      </p>
      <hr />
      <p style="font-size: 12px; color: #666;">
        Falls du nicht versuchst, dich zu registrieren, ignoriere diese Nachricht.
      </p>
    </div>
  `;
  
        await sendMail(user.email, emailSubject, emailContent);
  
        res.status(200).json({ msg: "Registration successful. Please check your email to confirm your account." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
  });
  
  //POST /api/users/resend-confirmation
router.post("/resend-confirmation", async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ msg: "Benutzer nicht gefunden." });
      }
  
      if (user.isConfirmed) {
        return res.status(400).json({ msg: "E-Mail bereits bestätigt." });
      }
  
      // Generate a new confirmation token
      const confirmationToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
  
  
      await user.save();
  
      const confirmUrl = `https://straightmonitor.com/confirm-email?token=${confirmationToken}`;
      const emailSubject = "Bestätige deine E-Mail Adresse für den Straightforward Monitor";
      const emailContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="font-weight: bold; color: #000;">Bestätige deine E-Mail Adresse!</h2>
          <p>Bitte bestätige deine E-Mail Adresse, um dein Profil zu aktivieren.</p>
          <a href="${confirmUrl}" style="color: #000; text-decoration: none; font-weight: bold;">
            <strong>Hier klicken, um die E-Mail Adresse zu bestätigen</strong>
          </a>
        </div>
      `;
  
      await sendMail(user.email, emailSubject, emailContent);
      res.status(200).json({ msg: "Bestätigungs-E-Mail wurde erneut gesendet." });
  
    } catch (err) {
      console.error("Error in resending confirmation:", err);
      res.status(500).json({ msg: "Serverfehler beim erneuten Senden der Bestätigung." });
    }
  });
  
  // POST /api/users/confirm-email
router.post("/confirm-email", async (req, res) => {
    const { token } = req.body;
  
    try {
      // Verify the confirmation token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      // Find the user by ID and confirm email
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "Benutzer nicht gefunden" });
      }
  
      // Check if the user is already confirmed
      if (user.isConfirmed) {
        return res.status(400).json({ msg: "E-Mail bereits bestätigt" });
      }
  
      // Update the user's confirmation status
      user.isConfirmed = true;
      await user.save();
  
      res.status(200).json({ msg: "E-Mail erfolgreich bestätigt. Du kannst dich nun anmelden." });
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(400).json({ msg: "Ungültiger oder abgelaufener Bestätigungslink" });
    }
  });
  
  // POST /api/users/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Ungültige Anmeldedaten" });
      }
  
      // Check if user email is confirmed
      if (!user.isConfirmed) {
        return res.status(403).json({ msg: "Bitte bestätige zuerst deine E-Mail Adresse." });
      }
  
      // Compare the provided password with the hashed password stored in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Ungültige Anmeldedaten" });
      }
  
      // Generate a JWT token for the user
      const payload = {
        user: {
          id: user.id,
        },
      };
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET, // Use the JWT secret from .env
        { expiresIn: 360000 }, // Set token expiry time as needed
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });
  
module.exports = router;