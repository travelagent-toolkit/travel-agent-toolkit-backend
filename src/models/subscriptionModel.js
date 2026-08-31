const db = require("../config/db");

const SUB_COLUMNS = `
  id, agency_id AS "agencyId", plan, status,
  started_at AS "startedAt", expires_at AS "expiresAt",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function createDefault(client, agencyId) {
  const result = await client.query(
    `INSERT INTO subscriptions (agency_id, plan, status)
     VALUES ($1, 'FREE', 'ACTIVE')
     RETURNING ${SUB_COLUMNS}`,
    [agencyId]
  );
  return result.rows[0];
}

async function findByAgencyId(agencyId) {
  const result = await db.query(
    `SELECT ${SUB_COLUMNS} FROM subscriptions WHERE agency_id = $1`,
    [agencyId]
  );
  return result.rows[0] || null;
}

module.exports = { createDefault, findByAgencyId };
