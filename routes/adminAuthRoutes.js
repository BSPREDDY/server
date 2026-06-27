// const express = require("express");
// const router = express.Router();
// const {
//     register,
//     login,
//     verifyToken,
// } = require("../controllers/adminAuthController");
// const authMiddleware = require("../middleware/auth");

// router.post("/register", register);
// router.post("/login", login);
// router.get("/verify", authMiddleware, verifyToken);

// module.exports = router;


const express = require("express");
const router = express.Router();
const {
    register,
    login,
    verifyToken,
    refreshTokenEndpoint,
    logout,
} = require("../controllers/adminAuthController");
const { authMiddleware, createRateLimiter } = require("../middleware/auth");

// Rate limiter for login attempts (5 attempts per 15 minutes)
const loginLimiter = createRateLimiter(5, 15 * 60 * 1000);

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/verify", authMiddleware, verifyToken);
router.post("/refresh", refreshTokenEndpoint);
router.post("/logout", authMiddleware, logout);

module.exports = router;
