const { body, param, query } = require("express-validator");

const STATUSES = ["Draft", "Sent", "Accepted", "Expired"];
const ITEM_CATEGORIES = ["Hotel", "Transport", "Sightseeing", "Activities", "Transfers", "Other"];

const itemValidator = (path) => [
  body(`${path}.*.category`).notEmpty().withMessage("item category is required")
    .isIn(ITEM_CATEGORIES).withMessage(`item category must be one of ${ITEM_CATEGORIES.join(", ")}`),
  body(`${path}.*.description`).optional({ values: "falsy" }).trim().isLength({ max: 500 }),
  body(`${path}.*.quantity`).isFloat({ min: 0 }).withMessage("item quantity must be a non-negative number"),
  body(`${path}.*.unitPrice`).isFloat({ min: 0 }).withMessage("item unitPrice must be a non-negative number"),
];

const createQuotationValidator = [
  body("customerId").optional({ values: "falsy" }).isUUID().withMessage("customerId must be a valid UUID"),
  body("destination").trim().notEmpty().withMessage("destination is required").isLength({ max: 255 }),
  body("travelDate").optional({ values: "falsy" }).isISO8601().withMessage("travelDate must be a valid date"),
  body("nights").isInt({ min: 0 }).withMessage("nights must be a non-negative integer"),
  body("days").isInt({ min: 1 }).withMessage("days must be at least 1"),
  body("adults").isInt({ min: 1 }).withMessage("adults must be at least 1"),
  body("children").optional().isInt({ min: 0 }).withMessage("children must be a non-negative integer"),
  body("tripType").optional({ values: "falsy" }).trim().isLength({ max: 50 }),
  body("costPrice").isFloat({ min: 0 }).withMessage("costPrice must be a non-negative number"),
  body("markupPercentage").isFloat({ min: 0, max: 1000 }).withMessage("markupPercentage must be between 0 and 1000"),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of ${STATUSES.join(", ")}`),
  body("items").optional().isArray().withMessage("items must be an array"),
  ...itemValidator("items"),
];

const updateQuotationValidator = [
  param("id").isUUID().withMessage("id must be a valid UUID"),
  body("customerId").optional({ values: "falsy" }).isUUID().withMessage("customerId must be a valid UUID"),
  body("destination").optional().trim().notEmpty().withMessage("destination cannot be empty").isLength({ max: 255 }),
  body("travelDate").optional({ values: "falsy" }).isISO8601().withMessage("travelDate must be a valid date"),
  body("nights").optional().isInt({ min: 0 }).withMessage("nights must be a non-negative integer"),
  body("days").optional().isInt({ min: 1 }).withMessage("days must be at least 1"),
  body("adults").optional().isInt({ min: 1 }).withMessage("adults must be at least 1"),
  body("children").optional().isInt({ min: 0 }).withMessage("children must be a non-negative integer"),
  body("tripType").optional({ values: "falsy" }).trim().isLength({ max: 50 }),
  body("costPrice").optional().isFloat({ min: 0 }).withMessage("costPrice must be a non-negative number"),
  body("markupPercentage").optional().isFloat({ min: 0, max: 1000 }).withMessage("markupPercentage must be between 0 and 1000"),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of ${STATUSES.join(", ")}`),
  body("items").optional().isArray().withMessage("items must be an array"),
  ...itemValidator("items"),
];

const idParamValidator = [param("id").isUUID().withMessage("id must be a valid UUID")];

const listQuotationValidator = [
  query("status").optional().isIn(STATUSES),
  query("customerId").optional().isUUID(),
];

module.exports = {
  createQuotationValidator,
  updateQuotationValidator,
  idParamValidator,
  listQuotationValidator,
};
