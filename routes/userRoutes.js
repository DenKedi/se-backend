require("dotenv").config(); // Load environment variables from .env

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import the auth middleware
const User = require("../models/User"); // Import the User model
const bcrypt = require("bcryptjs");
//const { sendMail } = require("../utils/emailService");
const jwt = require("jsonwebtoken");

//Methoden
const { registerUser, findUserByEmail, findUserById, generateConfirmationToken, } = require("../utils/userService");



//GET /api/user
router.get("/", async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });


//GET /api/user/me
router.get("/me", auth, async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("-password"); // Exclude the password
      res.json(user);
    } catch (err) {
     next(err);
    }
  });


router.get("/:id", async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "User not found" });
      res.json(user);
    } catch (err) {
      next(err);
    }
  });
  

// POST /api/user/register
router.post("/register", async (req, res, next) => {

  try {
   const newUser = await registerUser(req.body);
    res.status(201).json({ msg: "Registrierung erfolgreich. Bitte überprüfe deine E-Mails." });
  } catch (err) {
   next(err);
  }

});

  //POST /api/user/resend-confirmation
router.post("/resend-confirmation", async (req, res, next) => {
    const { email } = req.body;
  
    try {
      const user = await findUserByEmail(email);
      
      if (user.isConfirmed) {
        return res.status(400).json({ msg: "E-Mail bereits bestätigt." });
      }

      /*
       const confirmationToken = generateConfirmationToken(user.id);
       await resendConfirmationMail(user.email, emailSubject, emailContent);
      */
      
      res.status(200).json({ msg: "Bestätigungs-E-Mail wurde erneut gesendet." });
  
    } catch (err) {
      err.message = "Fehler beim Versenden der Bestätigung";
      next(err);
    }
  });
  
  // POST /api/user/confirm-email
router.put("/confirm-email", async (req, res, next) => {
    const { token } = req.params.token;
  
    try {
      // Verify the confirmation token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
   
      const user = findUserById(userId);
      
  
      // Check if the user is already confirmed
      if (user.isConfirmed) {
        return res.status(400).json({ msg: "Email bereits bestätigt" });
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
  
  // POST /api/user/login
router.post("/login", async (req, res, next) => {
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
