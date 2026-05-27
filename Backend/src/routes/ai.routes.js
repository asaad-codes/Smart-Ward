const express = require("express");
const aiController = require("../controllers/ai.controller");

const VerifyToken = require("../middleware/auth.middleware");
const { AllowRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
    "/ask",
    VerifyToken,
    AllowRoles("admin", "doctor", "nurse", "patient"),
    aiController.askSmartWardAI
);

module.exports = router; 