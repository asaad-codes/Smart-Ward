const crypto = require("crypto");
// Commenting this out temporarily to diagnose the crash
// const User = require("../models/user.model"); 

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Received Email for reset:", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // TEMPORARY MOCK BYPASS: Pretend the user was found successfully
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    return res.status(200).json({ 
      message: `Link: ${resetUrl}` 
    });

  } catch (error) {
    console.error("Forgot Password Controller Error:", error);
    return res.status(500).json({ 
      message: "Server error occurred while processing request.",
      error: error.message 
    });
  }
}; 