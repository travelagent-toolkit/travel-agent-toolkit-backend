const { Router } = require("express");
const quotationController = require("../controllers/quotationController");
const requireAuth = require("../middleware/requireAuth");
const handleValidation = require("../middleware/handleValidation");
const {
  createQuotationValidator,
  updateQuotationValidator,
  idParamValidator,
  listQuotationValidator,
} = require("../validators/quotationValidators");

const router = Router();

router.use(requireAuth);

router.get("/", listQuotationValidator, handleValidation, quotationController.list);
router.post("/", createQuotationValidator, handleValidation, quotationController.create);
router.get("/:id", idParamValidator, handleValidation, quotationController.getOne);
router.put("/:id", updateQuotationValidator, handleValidation, quotationController.update);
router.delete("/:id", idParamValidator, handleValidation, quotationController.remove);

module.exports = router;
