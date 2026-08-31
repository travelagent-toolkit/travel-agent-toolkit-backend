const { Router } = require("express");
const requireAuth = require("../middleware/requireAuth");
const usageService = require("../services/usageService");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const usage = await usageService.getCurrentUsage(req.user.agencyId);
    return ok(res, usage);
  })
);

module.exports = router;
