const { body } = require("express-validator");

const updateAgencyValidator = [
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty").isLength({ max: 255 }),
  body("phone").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
  body("email").optional({ values: "falsy" }).trim().isEmail().withMessage("email must be valid").normalizeEmail(),
  body("address").optional({ values: "falsy" }).trim().isLength({ max: 1000 }),
  body("gstin").optional({ values: "falsy" }).trim().isLength({ max: 20 }),
  body("logoUrl").optional({ values: "falsy" }).trim().isURL().withMessage("logoUrl must be a valid URL"),
  body("website").optional({ values: "falsy" }).trim().isLength({ max: 255 }),
];

const updateUserValidator = [
  body("full_name").optional().trim().notEmpty().withMessage("full_name cannot be empty").isLength({ max: 255 }),
  body("phone").optional({ values: "falsy" }).trim().isLength({ min: 7, max: 20 }),
];

module.exports = { updateAgencyValidator, updateUserValidator };
