const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patient.routes");
const wardRoutes = require("./routes/ward.routes");
const vitalRoutes = require("./routes/vital.routes");
const medicationRoutes = require("./routes/medication.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();

/*
Deployment CORS setup:

Local frontend:
http://localhost:3000

Vercel frontend:
FRONTEND_URL=https://your-project.vercel.app

Optional multiple URLs:
FRONTEND_URLS=https://your-project.vercel.app,https://your-preview.vercel.app
*/

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS
        ? process.env.FRONTEND_URLS.split(",").map((url) => url.trim())
        : []),
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow Postman, mobile apps, server-to-server requests
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`CORS blocked this origin: ${origin}`),
                false
            );
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SmartWard Backend API is running",
        environment: process.env.NODE_ENV || "development",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/ward", wardRoutes);
app.use("/api/vital", vitalRoutes);
app.use("/api/medication", medicationRoutes);
app.use("/api/ai", aiRoutes);

// Wrong route handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global Backend Error:", error.message);

    res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
    });
});

module.exports = app; 