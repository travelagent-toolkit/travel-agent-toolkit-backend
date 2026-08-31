const db = require("../config/db");

const SAFE_COLUMNS = `
  id, agency_id AS "agencyId", customer_id AS "customerId", quotation_id AS "quotationId",
  destination, duration, travel_type AS "travelType", content,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function create(client, agencyId, { customerId, quotationId, destination, duration, travelType, content }) {
  const result = await client.query(
    `INSERT INTO itineraries (agency_id, customer_id, quotation_id, destination, duration, travel_type, content)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING ${SAFE_COLUMNS}`,
    [agencyId, customerId || null, quotationId || null, destination, duration, travelType, JSON.stringify(content || [])]
  );
  return result.rows[0];
}

async function listByAgency(agencyId) {
  const result = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM itineraries WHERE agency_id = $1 ORDER BY created_at DESC`,
    [agencyId]
  );
  return result.rows;
}

async function findByIdForAgency(id, agencyId) {
  const result = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM itineraries WHERE id = $1 AND agency_id = $2`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

async function updateForAgency(id, agencyId, fields) {
  const allowed = ["customer_id", "quotation_id", "destination", "duration", "travel_type", "content"];
  const columnAliases = { customerId: "customer_id", quotationId: "quotation_id", travelType: "travel_type" };
  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(fields)) {
    const column = columnAliases[key] || key;
    if (!allowed.includes(column)) continue;
    setClauses.push(`${column} = $${index}`);
    values.push(column === "content" ? JSON.stringify(value) : value);
    index += 1;
  }

  if (setClauses.length === 0) {
    return findByIdForAgency(id, agencyId);
  }

  setClauses.push("updated_at = now()");
  values.push(id, agencyId);

  const result = await db.query(
    `UPDATE itineraries SET ${setClauses.join(", ")}
     WHERE id = $${index} AND agency_id = $${index + 1}
     RETURNING ${SAFE_COLUMNS}`,
    values
  );
  return result.rows[0] || null;
}

async function deleteForAgency(id, agencyId) {
  const result = await db.query(
    `DELETE FROM itineraries WHERE id = $1 AND agency_id = $2 RETURNING id`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

module.exports = { create, listByAgency, findByIdForAgency, updateForAgency, deleteForAgency };
