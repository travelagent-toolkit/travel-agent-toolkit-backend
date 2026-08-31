const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/apiResponse");

const register = asyncHandler(async (req, res) => {
  const { user, agency, token } = await authService.register(req.body);
  return created(res, { user, agency, token });
});

const login = asyncHandler(async (req, res) => {
  const { user, agency, token } = await authService.login(req.body);
  return ok(res, { user, agency, token });
});

const me = asyncHandler(async (req, res) => {
  const { user, agency } = await authService.getCurrentUser(req.user.id);
  return ok(res, { user, agency });
});

module.exports = { register, login, me };
