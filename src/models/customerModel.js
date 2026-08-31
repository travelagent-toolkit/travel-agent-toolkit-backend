const db = require("../config/db");

const SAFE_COLUMNS = `
  id, agency_id AS "agencyId", name, phone, email, destination,
  last_contact AS "lastContact", status,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function create(agencyId, { name, phone, email, destination, status }) {
  const result = await db.query(
    `INSERT INTO customers (agency_id, name, phone, email, destination, status)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Lead'))
     RETURNING ${SAFE_COLUMNS}`,
    [agencyId, name, phone || null, email || null, destination || null, status || null]
  );
  return result.rows[0];
}

async function listByAgency(agencyId, { search, status } = {}) {
  const conditions = ["agency_id = $1"];
  const values = [agencyId];
  let index = 2;

  if (search) {
    conditions.push(`(name ILIKE $${index} OR destination ILIKE $${index})`);
    values.push(`%${search}%`);
    index += 1;
  }
  if (status) {
    conditions.push(`status = $${index}`);
    values.push(status);
    index += 1;
  }

  const result = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM customers
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC`,
    values
  );
  return result.rows;
}

async function findByIdForAgency(id, agencyId) {
  const result = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM customers WHERE id = $1 AND agency_id = $2`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

async function updateForAgency(id, agencyId, fields) {
  const allowed = ["name", "phone", "email", "destination", "last_contact", "status"];
  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(fields)) {
    const column = key === "lastContact" ? "last_contact" : key;
    if (!allowed.includes(column)) continue;
    setClauses.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  }

  if (setClauses.length === 0) {
    return findByIdForAgency(id, agencyId);
  }

  setClauses.push("updated_at = now()");
  values.push(id, agencyId);

  const result = await db.query(
    `UPDATE customers SET ${setClauses.join(", ")}
     WHERE id = $${index} AND agency_id = $${index + 1}
     RETURNING ${SAFE_COLUMNS}`,
    values
  );
  return result.rows[0] || null;
}

async function deleteForAgency(id, agencyId) {
  const result = await db.query(
    `DELETE FROM customers WHERE id = $1 AND agency_id = $2 RETURNING id`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

module.exports = {
  create,
  listByAgency,
  findByIdForAgency,
  updateForAgency,
  deleteForAgency,
};
