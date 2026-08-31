const { Router } = require("express");
const userController = require("../controllers/userController");
const requireAuth = require("../middleware/requireAuth");
const handleValidation = require("../middleware/handleValidation");
const { updateUserValidator } = require("../validators/profileValidators");

const router = Router();

router.use(requireAuth);

router.get("/me", userController.getMe);
router.put("/me", updateUserValidator, handleValidation, userController.updateMe);

module.exports = router;
