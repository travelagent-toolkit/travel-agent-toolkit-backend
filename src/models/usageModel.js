const db = require("../config/db");

const USAGE_COLUMNS = `
  id, agency_id AS "agencyId", month, quotation_count AS "quotationCount",
  itinerary_count AS "itineraryCount", created_at AS "createdAt", updated_at AS "updatedAt"
`;

function currentMonthKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function getForAgencyAndMonth(agencyId, month) {
  const result = await db.query(
    `SELECT ${USAGE_COLUMNS} FROM usage WHERE agency_id = $1 AND month = $2`,
    [agencyId, month]
  );
  return result.rows[0] || null;
}

async function incrementQuotationCount(client, agencyId, month) {
  const result = await client.query(
    `INSERT INTO usage (agency_id, month, quotation_count, itinerary_count)
     VALUES ($1, $2, 1, 0)
     ON CONFLICT (agency_id, month)
     DO UPDATE SET quotation_count = usage.quotation_count + 1, updated_at = now()
     RETURNING ${USAGE_COLUMNS}`,
    [agencyId, month]
  );
  return result.rows[0];
}

async function incrementItineraryCount(client, agencyId, month) {
  const result = await client.query(
    `INSERT INTO usage (agency_id, month, quotation_count, itinerary_count)
     VALUES ($1, $2, 0, 1)
     ON CONFLICT (agency_id, month)
     DO UPDATE SET itinerary_count = usage.itinerary_count + 1, updated_at = now()
     RETURNING ${USAGE_COLUMNS}`,
    [agencyId, month]
  );
  return result.rows[0];
}

module.exports = {
  currentMonthKey,
  getForAgencyAndMonth,
  incrementQuotationCount,
  incrementItineraryCount,
};
