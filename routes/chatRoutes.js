require("dotenv").config(); // Load environment variables from .env

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import the auth middleware
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = router;

