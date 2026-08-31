require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET"];

function assertRequiredEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length && process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in real values."
    );
    process.exit(1);
  }
}

assertRequiredEnv();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
};

module.exports = env;
