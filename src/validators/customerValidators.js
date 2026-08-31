const { body, param, query } = require("express-validator");

const STATUSES = ["Lead", "Active", "Inactive"];

const createCustomerValidator = [
  body("name").trim().notEmpty().withMessage("name is required")
    .isLength({ max: 255 }).withMessage("name is too long"),
  body("phone").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
  body("email").optional({ values: "falsy" }).trim().isEmail().withMessage("email must be valid").normalizeEmail(),
  body("destination").optional({ values: "falsy" }).trim().isLength({ max: 255 }),
  body("status").optional({ values: "falsy" }).isIn(STATUSES).withMessage(`status must be one of ${STATUSES.join(", ")}`),
];

const updateCustomerValidator = [
  param("id").isUUID().withMessage("id must be a valid UUID"),
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ max: 255 }),
  body("phone").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
  body("email").optional({ values: "falsy" }).trim().isEmail().withMessage("email must be valid").normalizeEmail(),
  body("destination").optional({ values: "falsy" }).trim().isLength({ max: 255 }),
  body("lastContact").optional({ values: "falsy" }).isISO8601().withMessage("lastContact must be a valid date"),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of ${STATUSES.join(", ")}`),
];

const idParamValidator = [param("id").isUUID().withMessage("id must be a valid UUID")];

const listCustomerValidator = [
  query("search").optional().trim().isLength({ max: 255 }),
  query("status").optional().isIn(STATUSES),
];

module.exports = {
  createCustomerValidator,
  updateCustomerValidator,
  idParamValidator,
  listCustomerValidator,
};
