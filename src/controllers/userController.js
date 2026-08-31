const userService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user.id);
  return ok(res, user);
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateMe(req.user.id, req.body);
  return ok(res, user);
});

module.exports = { getMe, updateMe };
