const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const env = require("../config/env");
const userModel = require("../models/userModel");
const agencyModel = require("../models/agencyModel");
const subscriptionModel = require("../models/subscriptionModel");
const { ApiError } = require("../utils/apiResponse");

function signToken(user) {
  return jwt.sign({ sub: user.id, agencyId: user.agencyId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function register({ full_name, agency_name, email, phone, password }) {
  const existing = await userModel.findByEmailWithPassword(email);
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const agencyResult = await client.query(
      `INSERT INTO agencies (name) VALUES ($1)
       RETURNING id, name, phone, email, address, gstin, logo_url AS "logoUrl",
                 website, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [agency_name]
    );
    const agency = agencyResult.rows[0];

    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, agency_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name AS "fullName", email, phone, agency_id AS "agencyId",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [full_name, email.toLowerCase(), phone || null, passwordHash, agency.id]
    );
    const user = userResult.rows[0];

    await subscriptionModel.createDefault(client, agency.id);

    await client.query("COMMIT");

    const token = signToken(user);
    return { user, agency, token };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  const userWithPassword = await userModel.findByEmailWithPassword(email);
  if (!userWithPassword) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, userWithPassword.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const { passwordHash, ...safeUser } = userWithPassword;
  const token = signToken(safeUser);
  const agency = await agencyModel.findById(safeUser.agencyId);

  return { user: safeUser, agency, token };
}

async function getCurrentUser(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  const agency = await agencyModel.findById(user.agencyId);
  return { user, agency };
}

module.exports = { register, login, getCurrentUser };
