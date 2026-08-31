const { Router } = require("express");
const itineraryController = require("../controllers/itineraryController");
const requireAuth = require("../middleware/requireAuth");
const handleValidation = require("../middleware/handleValidation");
const {
  createItineraryValidator,
  updateItineraryValidator,
  idParamValidator,
} = require("../validators/itineraryValidators");

const router = Router();

router.use(requireAuth);

router.get("/", itineraryController.list);
router.post("/", createItineraryValidator, handleValidation, itineraryController.create);
router.get("/:id", idParamValidator, handleValidation, itineraryController.getOne);
router.put("/:id", updateItineraryValidator, handleValidation, itineraryController.update);
router.delete("/:id", idParamValidator, handleValidation, itineraryController.remove);

module.exports = router;
