const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Register user
router.post("/register", authController.registerUser);

// Login user
router.post("/login", authController.LoginUser);

// Forgot password
router.post("/forgot-password", authController.forgotPassword);

// Reset password
router.post("/reset-password/:token", authController.resetPassword);

// Logout user
router.post("/logout", authController.logoutUser);

module.exports = router; 