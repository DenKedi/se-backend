require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require('./middleware/errorHandler');
const { Server } = require("socket.io");
const socketServer = require('./socket'); // Import the socket server logic

const app = express();
const PORT = process.env.PORT || 5005;

// CORS
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            /^https:\/\/([a-z0-9-]+\.)*plausch\.live$/, 
            /^https:\/\/([a-z0-9-]+\.)*bleck\.it$/,
            /^http:\/\/localhost(:\d+)?$/             
        ];

        if (!origin || allowedOrigins.some((regex) => regex.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
};

// HTTP Server
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
    path: "/socket.io",
    cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorHandler);

// Routes
app.use("/api/user", userRoutes);
// MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

socketServer(io);

// Start
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
