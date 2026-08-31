const { Router } = require("express");
const agencyController = require("../controllers/agencyController");
const requireAuth = require("../middleware/requireAuth");
const handleValidation = require("../middleware/handleValidation");
const { updateAgencyValidator } = require("../validators/profileValidators");

const router = Router();

router.use(requireAuth);

router.get("/", agencyController.getAgency);
router.put("/", updateAgencyValidator, handleValidation, agencyController.updateAgency);

module.exports = router;
