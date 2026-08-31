const { Router } = require("express");
const customerController = require("../controllers/customerController");
const requireAuth = require("../middleware/requireAuth");
const handleValidation = require("../middleware/handleValidation");
const {
  createCustomerValidator,
  updateCustomerValidator,
  idParamValidator,
  listCustomerValidator,
} = require("../validators/customerValidators");

const router = Router();

router.use(requireAuth);

router.get("/", listCustomerValidator, handleValidation, customerController.list);
router.post("/", createCustomerValidator, handleValidation, customerController.create);
router.get("/:id", idParamValidator, handleValidation, customerController.getOne);
router.put("/:id", updateCustomerValidator, handleValidation, customerController.update);
router.delete("/:id", idParamValidator, handleValidation, customerController.remove);

module.exports = router;
