const { body } = require("express-validator");

const registerValidator = [
  body("full_name").trim().notEmpty().withMessage("full_name is required")
    .isLength({ max: 255 }).withMessage("full_name is too long"),
  body("agency_name").trim().notEmpty().withMessage("agency_name is required")
    .isLength({ max: 255 }).withMessage("agency_name is too long"),
  body("email").trim().notEmpty().withMessage("email is required")
    .isEmail().withMessage("email must be a valid email address").normalizeEmail(),
  body("phone").optional({ values: "falsy" }).trim()
    .isLength({ min: 7, max: 20 }).withMessage("phone must be between 7 and 20 characters"),
  body("password").notEmpty().withMessage("password is required")
    .isLength({ min: 8 }).withMessage("password must be at least 8 characters long"),
];

const loginValidator = [
  body("email").trim().notEmpty().withMessage("email is required")
    .isEmail().withMessage("email must be a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("password is required"),
];

module.exports = { registerValidator, loginValidator };
