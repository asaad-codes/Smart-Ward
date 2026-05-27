const crypto = require("crypto");
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function getRoleByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail.endsWith("@admin.com")) {
        return "admin";
    }

    if (normalizedEmail.endsWith("@doctor.com")) {
        return "doctor";
    }

    if (normalizedEmail.endsWith("@nurse.com")) {
        return "nurse";
    }

    return "patient";
}

function createToken(user) {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
    );
}

function sendTokenCookie(res, token) {
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
} 

async function registerUser(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const normalizedName = String(name).trim();
        const assignedRole = getRoleByEmail(normalizedEmail);

        const isUserAlreadyExist = await userModel.findOne({
            $or: [{ email: normalizedEmail }, { name: normalizedName }],
        });

        if (isUserAlreadyExist) {
            return res.status(400).json({
                success: false,
                message: "User with this email or username already exists",
            });
        }

        const newuser = await userModel.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
            role: assignedRole,
        });

        const token = createToken(newuser);

        sendTokenCookie(res, token);

        return res.status(201).json({
            success: true,
            message: `User registered successfully as ${newuser.role}`,
            token,
            user: {
                id: newuser._id,
                name: newuser.name,
                email: newuser.email,
                role: newuser.role,
            },
        });
    } catch (error) {
        console.error("Backend Register Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred during registration.",
        });
    }
}

async function LoginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        const user = await userModel.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = createToken(user);

        sendTokenCookie(res, token);

        return res.status(200).json({
            success: true,
            message: `User logged in successfully as ${user.role}`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Backend Login Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred during login.",
        });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        const user = await userModel.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email.",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

        console.log("Password Reset Link:", resetLink);

        return res.status(200).json({
            success: true,
            message: "Password reset link generated successfully.",
            resetLink,
        });
    } catch (error) {
        console.error("Backend Forgot Password Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred during forgot password.",
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Reset token is required.",
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "New password is required.",
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token.",
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can login now.",
        });
    } catch (error) {
        console.error("Backend Reset Password Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error occurred during password reset.",
        });
    }
}

async function logoutUser(req, res) {
    try {
        const isProduction = process.env.NODE_ENV === "production";

        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Logout failed.",
        });
    }
} 

module.exports = {
    registerUser,
    LoginUser,
    forgotPassword,
    resetPassword,
    logoutUser,
}; 