const { Router } = require("express");
const authController = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");
const { authRateLimiter } = require("../middleware/rateLimiters");
const handleValidation = require("../middleware/handleValidation");
const { registerValidator, loginValidator } = require("../validators/authValidators");

const router = Router();

router.post("/register", authRateLimiter, registerValidator, handleValidation, authController.register);
router.post("/login", authRateLimiter, loginValidator, handleValidation, authController.login);
router.get("/me", requireAuth, authController.me);

module.exports = router;
