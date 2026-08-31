const { validationResult } = require("express-validator");
const { ApiError } = require("../utils/apiResponse");

/**
 * Runs after a list of express-validator checks and turns any failures
 * into a single consistent 400 VALIDATION_ERROR response.
 */
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest("Invalid request data", details));
}

module.exports = handleValidation;
