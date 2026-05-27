const jwt = require("jsonwebtoken");

function VerifyToken(req, res, next) {
    try {
        let token = null;

        // 1. Check token from cookies
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        // 2. Check token from Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;

            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Token not found.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "fallback_secret"
        );

        // Your JWT should contain id and role from login/register controller
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };

        if (!req.user.id || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload. User id or role missing.",
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
}

function AllowRoles(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated.",
            });
        }

        const userRole = req.user.role.toLowerCase();

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are not allowed to perform this action.",
            });
        }

        next();
    };
}

// Old import support:
// const VerifyToken = require("../middlewares/auth.middleware");

// New import support:
// const { VerifyToken, AllowRoles } = require("../middlewares/auth.middleware");

module.exports = VerifyToken;
module.exports.VerifyToken = VerifyToken;
module.exports.AllowRoles = AllowRoles;  