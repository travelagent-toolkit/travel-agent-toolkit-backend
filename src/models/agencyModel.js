const db = require("../config/db");

const SAFE_COLUMNS = `
  id, name, phone, email, address, gstin, logo_url AS "logoUrl",
  website, created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function create({ name, phone, email, address }) {
  const result = await db.query(
    `INSERT INTO agencies (name, phone, email, address)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SAFE_COLUMNS}`,
    [name, phone || null, email || null, address || null]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM agencies WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function update(id, fields) {
  const allowed = ["name", "phone", "email", "address", "gstin", "logo_url", "website"];
  const columnMap = { logo_url: "logo_url" };
  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(fields)) {
    const column = key === "logoUrl" ? "logo_url" : key;
    if (!allowed.includes(column)) continue;
    setClauses.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  setClauses.push(`updated_at = now()`);
  values.push(id);

  const result = await db.query(
    `UPDATE agencies SET ${setClauses.join(", ")}
     WHERE id = $${index}
     RETURNING ${SAFE_COLUMNS}`,
    values
  );
  return result.rows[0] || null;
}

module.exports = { create, findById, update };
