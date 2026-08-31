const agencyService = require("../services/agencyService");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");

const getAgency = asyncHandler(async (req, res) => {
  const agency = await agencyService.getAgency(req.user.agencyId);
  return ok(res, agency);
});

const updateAgency = asyncHandler(async (req, res) => {
  const agency = await agencyService.updateAgency(req.user.agencyId, req.body);
  return ok(res, agency);
});

module.exports = { getAgency, updateAgency };
