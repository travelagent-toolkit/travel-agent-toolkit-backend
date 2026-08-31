const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { ApiError } = require("../utils/apiResponse");

/**
 * Verifies the Bearer token and attaches the authenticated identity to
 * req.user. Only the user id and agency id from the verified token are
 * trusted for authorization — never a value supplied by the client in
 * the URL or body.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(ApiError.unauthorized("Missing or invalid authorization header"));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, agencyId: payload.agencyId };
    return next();
  } catch (err) {
    return next(ApiError.unauthorized("Invalid or expired token"));
  }
}

module.exports = requireAuth;
