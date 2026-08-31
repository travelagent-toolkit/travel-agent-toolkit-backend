function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function created(res, data) {
  return ok(res, data, 201);
}

function noContent(res) {
  return res.status(204).send();
}

/**
 * ApiError carries an HTTP status and a machine-readable code so the
 * centralized error handler can produce a consistent response shape
 * without leaking internal details.
 */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Invalid request", details) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(409, "CONFLICT", message);
  }

  static unprocessable(message = "Unable to process request", details) {
    return new ApiError(422, "UNPROCESSABLE_ENTITY", message, details);
  }

  static internal(message = "Something went wrong") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

module.exports = { ok, created, noContent, ApiError };
