const db = require("../config/db");

const QUOTATION_COLUMNS = `
  id, agency_id AS "agencyId", customer_id AS "customerId", quotation_number AS "quotationNumber",
  destination, travel_date AS "travelDate", nights, days, adults, children, trip_type AS "tripType",
  cost_price AS "costPrice", markup_percentage AS "markupPercentage", selling_price AS "sellingPrice",
  status, created_at AS "createdAt", updated_at AS "updatedAt"
`;

const ITEM_COLUMNS = `
  id, quotation_id AS "quotationId", category, description, quantity,
  unit_price AS "unitPrice", total_price AS "totalPrice",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function createWithItems(client, agencyId, quotationNumber, data, items) {
  const {
    customerId, destination, travelDate, nights, days, adults, children,
    tripType, costPrice, markupPercentage, sellingPrice, status,
  } = data;

  const quotationResult = await client.query(
    `INSERT INTO quotations (
        agency_id, customer_id, quotation_number, destination, travel_date,
        nights, days, adults, children, trip_type, cost_price, markup_percentage,
        selling_price, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING ${QUOTATION_COLUMNS}`,
    [
      agencyId, customerId || null, quotationNumber, destination, travelDate || null,
      nights, days, adults, children, tripType, costPrice, markupPercentage,
      sellingPrice, status || "Draft",
    ]
  );
  const quotation = quotationResult.rows[0];

  const insertedItems = [];
  for (const item of items) {
    const itemResult = await client.query(
      `INSERT INTO quotation_items (quotation_id, category, description, quantity, unit_price, total_price)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING ${ITEM_COLUMNS}`,
      [quotation.id, item.category, item.description || null, item.quantity, item.unitPrice, item.totalPrice]
    );
    insertedItems.push(itemResult.rows[0]);
  }

  return { ...quotation, items: insertedItems };
}

async function listByAgency(agencyId, { status, customerId } = {}) {
  const conditions = ["agency_id = $1"];
  const values = [agencyId];
  let index = 2;

  if (status) {
    conditions.push(`status = $${index}`);
    values.push(status);
    index += 1;
  }
  if (customerId) {
    conditions.push(`customer_id = $${index}`);
    values.push(customerId);
    index += 1;
  }

  const result = await db.query(
    `SELECT ${QUOTATION_COLUMNS} FROM quotations
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC`,
    values
  );
  return result.rows;
}

async function findByIdForAgency(id, agencyId) {
  const quotationResult = await db.query(
    `SELECT ${QUOTATION_COLUMNS} FROM quotations WHERE id = $1 AND agency_id = $2`,
    [id, agencyId]
  );
  const quotation = quotationResult.rows[0];
  if (!quotation) return null;

  const itemsResult = await db.query(
    `SELECT ${ITEM_COLUMNS} FROM quotation_items WHERE quotation_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  return { ...quotation, items: itemsResult.rows };
}

async function updateForAgency(client, id, agencyId, fields) {
  const allowed = [
    "customer_id", "destination", "travel_date", "nights", "days", "adults", "children",
    "trip_type", "cost_price", "markup_percentage", "selling_price", "status",
  ];
  const columnAliases = {
    customerId: "customer_id",
    travelDate: "travel_date",
    tripType: "trip_type",
    costPrice: "cost_price",
    markupPercentage: "markup_percentage",
    sellingPrice: "selling_price",
  };

  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(fields)) {
    const column = columnAliases[key] || key;
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

  const result = await client.query(
    `UPDATE quotations SET ${setClauses.join(", ")}
     WHERE id = $${index} AND agency_id = $${index + 1}
     RETURNING ${QUOTATION_COLUMNS}`,
    values
  );
  return result.rows[0] || null;
}

async function replaceItems(client, quotationId, items) {
  await client.query(`DELETE FROM quotation_items WHERE quotation_id = $1`, [quotationId]);
  const insertedItems = [];
  for (const item of items) {
    const itemResult = await client.query(
      `INSERT INTO quotation_items (quotation_id, category, description, quantity, unit_price, total_price)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING ${ITEM_COLUMNS}`,
      [quotationId, item.category, item.description || null, item.quantity, item.unitPrice, item.totalPrice]
    );
    insertedItems.push(itemResult.rows[0]);
  }
  return insertedItems;
}

async function deleteForAgency(id, agencyId) {
  const result = await db.query(
    `DELETE FROM quotations WHERE id = $1 AND agency_id = $2 RETURNING id`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

async function countForAgencyThisYear(client, agencyId, year) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count FROM quotations
     WHERE agency_id = $1 AND quotation_number LIKE $2`,
    [agencyId, `%-${year}-%`]
  );
  return result.rows[0].count;
}

module.exports = {
  createWithItems,
  listByAgency,
  findByIdForAgency,
  updateForAgency,
  replaceItems,
  deleteForAgency,
  countForAgencyThisYear,
};
