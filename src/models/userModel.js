const db = require("../config/db");

const SAFE_COLUMNS = `
  id, full_name AS "fullName", email, phone, agency_id AS "agencyId",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function create({ fullName, email, phone, passwordHash, agencyId }) {
  const result = await db.query(
    `INSERT INTO users (full_name, email, phone, password_hash, agency_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_COLUMNS}`,
    [fullName, email.toLowerCase(), phone || null, passwordHash, agencyId]
  );
  return result.rows[0];
}

async function findByEmailWithPassword(email) {
  const result = await db.query(
    `SELECT id, full_name AS "fullName", email, phone, password_hash AS "passwordHash",
            agency_id AS "agencyId", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function updateById(id, { fullName, phone }) {
  const setClauses = [];
  const values = [];
  let index = 1;

  if (fullName !== undefined) {
    setClauses.push(`full_name = $${index}`);
    values.push(fullName);
    index += 1;
  }
  if (phone !== undefined) {
    setClauses.push(`phone = $${index}`);
    values.push(phone);
    index += 1;
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  setClauses.push("updated_at = now()");
  values.push(id);

  const result = await db.query(
    `UPDATE users SET ${setClauses.join(", ")}
     WHERE id = $${index}
     RETURNING ${SAFE_COLUMNS}`,
    values
  );
  return result.rows[0] || null;
}

module.exports = { create, findByEmailWithPassword, findById, updateById };
