// const jwt = require("jsonwebtoken");

// const authMiddleware = (req, res, next) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];

//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: "No token provided",
//             });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.admin = decoded;
//         next();
//     } catch (error) {
//         console.log(error);
//         res.status(401).json({
//             success: false,
//             message: "Invalid token",
//         });
//     }
// };

// module.exports = authMiddleware;


const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        req.adminId = decoded.id;
        next();
    } catch (error) {
        console.log("Auth middleware error:", error);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired",
                code: "TOKEN_EXPIRED",
            });
        }
        res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of roles that are allowed
 */
const authorizeRole = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            if (!req.admin) {
                return res.status(401).json({
                    success: false,
                    message: "Not authenticated",
                });
            }

            if (!allowedRoles.includes(req.admin.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Authorization check failed",
            });
        }
    };
};

/**
 * Rate limiting middleware for login attempts
 */
const createRateLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        if (!attempts.has(ip)) {
            attempts.set(ip, []);
        }

        const userAttempts = attempts.get(ip);
        const recentAttempts = userAttempts.filter((time) => now - time < windowMs);

        if (recentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                success: false,
                message: "Too many login attempts. Please try again later.",
            });
        }

        recentAttempts.push(now);
        attempts.set(ip, recentAttempts);

        next();
    };
};

module.exports = {
    authMiddleware,
    authorizeRole,
    createRateLimiter
};
