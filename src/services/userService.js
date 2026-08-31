const userModel = require("../models/userModel");
const { ApiError } = require("../utils/apiResponse");

async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
}

async function updateMe(userId, { full_name, phone }) {
  const updated = await userModel.updateById(userId, { fullName: full_name, phone });
  if (!updated) {
    throw ApiError.notFound("User not found");
  }
  return updated;
}

module.exports = { getMe, updateMe };
