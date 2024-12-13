require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Cors
const whitelist = ["http://localhost:4200"];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorHandler);

// Routes
app.get("/", (req, res) => {
  res.send("Node.js backend is running!");
});
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);

// Example API route
app.post("/api/data", (req, res) => {
  const data = req.body;
  res.status(200).json({ message: "Data received!", data });
});

// MONGODB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(async (err) => {
    console.error("MongoDB connection error:", err);

    process.exit(1); // Exit process with failure
  });

// Start the server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
