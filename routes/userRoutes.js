require("dotenv").config(); // Load environment variables from .env

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import the auth middleware
const User = require("../models/User"); // Import the User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Methoden
const { registerUser, findUserByEmail, findUserById, findUserByIndex, handleFriendRequest, acceptFriendRequest, denyFriendRequest, removeFriend, generateConfirmationToken, generateSessionToken} = require("../utils/userService");
const { sendEmail, resendConfirmationMail } = require("../utils/emailService");

//GET /api/user
router.get("/", auth, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

//GET /api/user/find
router.get("/find", auth, async (req, res, next) => {
    const filters = { ...req.query };
    try {
        const users = await User.find(filters);
        res.json(users);
    } catch (err) {
        next(err);
    }
});

//GET /api/user/me
router.get("/me", auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.get("/byID/:id", async (req, res, next) => {
    try {
        //Try findById or alternatively findByIndex
        const user = await findUserById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User nicht gefunden" });
        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.get("/byIndex/:index", async (req, res, next) => {
    try {
        const user = await findUserByIndex(req.params.index);
        if (!user) return res.status(404).json({ msg: "User nicht gefunden" });
        res.json(user);
    } catch (err) {
        next(err);
    }
});

// POST /api/user/register
router.post("/register", async (req, res, next) => {
    try {
        await registerUser(req.body);
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

        const confirmationToken = generateConfirmationToken(user.id);
        await resendConfirmationMail(user.email, confirmationToken);
      
        res.status(200).json({ msg: "Bestätigungs-E-Mail wurde erneut gesendet." });
    } catch (err) {
        err.message = "Fehler beim Versenden der Bestätigung";
        next(err);
    }
});
  
// PUT /api/user/confirm-email
router.put("/confirm-email", async (req, res, next) => {
    const { token } = req.query;

    try {
        // Verify the confirmation token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const id = decoded.id;

        const user = await findUserById(id);
        if (!user) {
            return res.status(400).json({ msg: "User nicht gefunden" });
        }

        // Check if the user is already confirmed
        if (user.isConfirmed) {
            return res.status(400).json({ msg: "Email bereits bestätigt" });
        }

        // Update the user's confirmation status
        user.isConfirmed = true;
        await user.save();
        const sessionToken = generateSessionToken(user);

        // Include the token in the response
        res.status(200).json({
            msg: "E-Mail erfolgreich bestätigt. Du kannst dich nun anmelden.",
            sessionToken // Return the original token
        });
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
  
        const token = generateSessionToken(user);
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});
  
// PUT /api/user/friend-request
router.put("/friend-request", auth, async (req, res, next) => {
    const { userIndex } = req.body;
    const receiver = await findUserByIndex(userIndex);
    const sender = await findUserById(req.user._id);

    console.log("Receiver:", receiver);
    console.log("Sender:", sender);

    if (!receiver) {
        return res.status(404).json({ msg: "Empfänger nicht gefunden" });
    }

    const response = await handleFriendRequest(sender, receiver);
    return res.status(response.status).json({ msg: response.msg });
});

// Put /api/user/accept-friend-request
router.put("/accept-friend-request", auth, async (req, res, next) => {
    const { userId } = req.body;
    const receiver = await findUserById(req.user._id);
    const sender = await findUserById(userId);

    if (!receiver) {
        return res.status(404).json({ msg: "User nicht gefunden" });
    }

    const response = await acceptFriendRequest(sender, receiver);
    return res.status(response.status).json({ msg: response.msg });
});

router.put("/deny-friend-request", auth, async (req, res, next) => {
    const { userId } = req.body;
    const receiver = await findUserById(req.user._id);
    const sender = await findUserById(userId);

    if (!receiver) {
        return res.status(404).json({ msg: "User nicht gefunden" });
    }

    const response = await denyFriendRequest(sender, receiver);
    return res.status(response.status).json({ msg: response.msg });
});

router.put("/remove-friend", auth, async (req, res, next) => {
    const { userId } = req.body;
    const user = await findUserById(req.user._id);
    const friend = await findUserById(userId);

    if (!user) {
        return res.status(404).json({ msg: "User nicht gefunden" });
    }

    const response = await removeFriend(user, friend);
    return res.status(response.status).json({ msg: response.msg });
});

module.exports = router;
