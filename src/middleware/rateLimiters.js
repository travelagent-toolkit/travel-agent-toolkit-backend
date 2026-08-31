const rateLimit = require("express-rate-limit");

/**
 * Applied only to authentication endpoints (register/login) to slow
 * down credential-stuffing and brute-force attempts.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please try again later.",
    },
  },
});

module.exports = { authRateLimiter };
