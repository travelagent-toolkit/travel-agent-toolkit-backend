const quotationService = require("../services/quotationService");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, noContent } = require("../utils/apiResponse");

const list = asyncHandler(async (req, res) => {
  const { status, customerId } = req.query;
  const quotations = await quotationService.listQuotations(req.user.agencyId, { status, customerId });
  return ok(res, quotations);
});

const create = asyncHandler(async (req, res) => {
  const quotation = await quotationService.createQuotation(req.user.agencyId, req.body);
  return created(res, quotation);
});

const getOne = asyncHandler(async (req, res) => {
  const quotation = await quotationService.getQuotation(req.params.id, req.user.agencyId);
  return ok(res, quotation);
});

const update = asyncHandler(async (req, res) => {
  const quotation = await quotationService.updateQuotation(req.params.id, req.user.agencyId, req.body);
  return ok(res, quotation);
});

const remove = asyncHandler(async (req, res) => {
  await quotationService.deleteQuotation(req.params.id, req.user.agencyId);
  return noContent(res);
});

module.exports = { list, create, getOne, update, remove };
