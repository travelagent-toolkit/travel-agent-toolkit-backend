const { body, param } = require("express-validator");

const createItineraryValidator = [
  body("customerId").optional({ values: "falsy" }).isUUID().withMessage("customerId must be a valid UUID"),
  body("quotationId").optional({ values: "falsy" }).isUUID().withMessage("quotationId must be a valid UUID"),
  body("destination").trim().notEmpty().withMessage("destination is required").isLength({ max: 255 }),
  body("duration").isInt({ min: 1 }).withMessage("duration must be at least 1"),
  body("travelType").optional({ values: "falsy" }).trim().isLength({ max: 50 }),
  body("content").optional().isArray().withMessage("content must be an array of day entries"),
  body("content.*.day").optional().isInt({ min: 1 }),
  body("content.*.title").optional().trim().isLength({ max: 255 }),
  body("content.*.details").optional().trim().isLength({ max: 2000 }),
];

const updateItineraryValidator = [
  param("id").isUUID().withMessage("id must be a valid UUID"),
  body("customerId").optional({ values: "falsy" }).isUUID().withMessage("customerId must be a valid UUID"),
  body("quotationId").optional({ values: "falsy" }).isUUID().withMessage("quotationId must be a valid UUID"),
  body("destination").optional().trim().notEmpty().withMessage("destination cannot be empty").isLength({ max: 255 }),
  body("duration").optional().isInt({ min: 1 }).withMessage("duration must be at least 1"),
  body("travelType").optional({ values: "falsy" }).trim().isLength({ max: 50 }),
  body("content").optional().isArray().withMessage("content must be an array of day entries"),
];

const idParamValidator = [param("id").isUUID().withMessage("id must be a valid UUID")];

module.exports = { createItineraryValidator, updateItineraryValidator, idParamValidator };
