const env = require("../config/env");
const { ApiError } = require("../utils/apiResponse");

/**
 * Maps known PostgreSQL error codes to safe ApiErrors so a raw database
 * error (and its internal detail) is never sent to the client.
 */
function fromPgError(err) {
  if (err.code === "23505") {
    return ApiError.conflict("A record with that value already exists");
  }
  if (err.code === "23503") {
    return ApiError.badRequest("Referenced resource does not exist");
  }
  if (err.code === "22P02") {
    return ApiError.badRequest("Invalid identifier format");
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let apiError = err instanceof ApiError ? err : null;

  if (!apiError && err && err.code) {
    apiError = fromPgError(err);
  }

  if (!apiError) {
    apiError = ApiError.internal();
  }

  if (env.nodeEnv !== "production" && !(err instanceof ApiError)) {
    // eslint-disable-next-line no-console
    console.error(err);
  } else if (apiError.status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const body = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
    },
  };

  if (apiError.details) {
    body.error.details = apiError.details;
  }

  return res.status(apiError.status).json(body);
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
}

module.exports = { errorHandler, notFoundHandler };
