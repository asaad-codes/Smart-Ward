const cors = require("cors"); 
const express = require("express"); 
const authRoutes = require("./routes/auth.routes");  
const VerifyToken = require("./middleware/auth.middleware");
const patientRoutes = require("./routes/patient.routes");
const cookieParser = require('cookie-parser'); 

const app = express(); 

// Updated to allow both localhost and 127.0.0.1 origins explicitly
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
})); 

app.use(express.json()); 
app.use(cookieParser()); 

app.use("/api/auth", authRoutes);

app.use("/api/patient", patientRoutes);   


module.exports = app; 