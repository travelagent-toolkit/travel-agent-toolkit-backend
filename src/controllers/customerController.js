const customerService = require("../services/customerService");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, noContent } = require("../utils/apiResponse");

const list = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const customers = await customerService.listCustomers(req.user.agencyId, { search, status });
  return ok(res, customers);
});

const create = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.user.agencyId, req.body);
  return created(res, customer);
});

const getOne = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomer(req.params.id, req.user.agencyId);
  return ok(res, customer);
});

const update = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.user.agencyId, req.body);
  return ok(res, customer);
});

const remove = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id, req.user.agencyId);
  return noContent(res);
});

module.exports = { list, create, getOne, update, remove };
