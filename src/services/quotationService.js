const { pool } = require("../config/db");
const quotationModel = require("../models/quotationModel");
const customerModel = require("../models/customerModel");
const agencyModel = require("../models/agencyModel");
const usageModel = require("../models/usageModel");
const { generateQuotationNumber } = require("./quotationNumberService");
const { calculateSellingPrice, sumItemTotal } = require("../utils/pricing");
const { ApiError } = require("../utils/apiResponse");

function prepareItems(rawItems = []) {
  return rawItems.map((item) => ({
    category: item.category,
    description: item.description || null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    totalPrice: sumItemTotal(item.quantity, item.unitPrice),
  }));
}

async function assertCustomerBelongsToAgency(customerId, agencyId) {
  if (!customerId) return;
  const customer = await customerModel.findByIdForAgency(customerId, agencyId);
  if (!customer) {
    throw ApiError.badRequest("customerId does not belong to your agency");
  }
}

async function createQuotation(agencyId, payload) {
  await assertCustomerBelongsToAgency(payload.customerId, agencyId);

  const costPrice = Number(payload.costPrice);
  const markupPercentage = Number(payload.markupPercentage);
  // Selling price is always recalculated server-side — the client's
  // number (if any) is never trusted.
  const sellingPrice = calculateSellingPrice(costPrice, markupPercentage);
  const items = prepareItems(payload.items);

  // Normalize optional fields so an omitted value falls back to a real
  // default instead of an explicit NULL, which would override the
  // column's own DEFAULT clause and violate its NOT NULL constraint.
  const normalizedPayload = {
    ...payload,
    children: payload.children !== undefined ? Number(payload.children) : 0,
    tripType: payload.tripType || "Leisure",
    status: payload.status || "Draft",
  };

  const agency = await agencyModel.findById(agencyId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let quotation;
    // Retry once on a quotation_number collision under concurrent requests.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const quotationNumber = await generateQuotationNumber(client, agencyId, agency?.name);
      try {
        quotation = await quotationModel.createWithItems(
          client,
          agencyId,
          quotationNumber,
          { ...normalizedPayload, costPrice, markupPercentage, sellingPrice },
          items
        );
        break;
      } catch (err) {
        if (err.code === "23505" && attempt === 0) {
          continue; // retry with a freshly generated number
        }
        throw err;
      }
    }

    const month = usageModel.currentMonthKey();
    await usageModel.incrementQuotationCount(client, agencyId, month);

    await client.query("COMMIT");
    return quotation;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listQuotations(agencyId, filters) {
  return quotationModel.listByAgency(agencyId, filters);
}

async function getQuotation(id, agencyId) {
  const quotation = await quotationModel.findByIdForAgency(id, agencyId);
  if (!quotation) {
    throw ApiError.notFound("Quotation not found");
  }
  return quotation;
}

async function updateQuotation(id, agencyId, payload) {
  const existing = await quotationModel.findByIdForAgency(id, agencyId);
  if (!existing) {
    throw ApiError.notFound("Quotation not found");
  }

  if (payload.customerId !== undefined) {
    await assertCustomerBelongsToAgency(payload.customerId, agencyId);
  }

  const nextCostPrice = payload.costPrice !== undefined ? Number(payload.costPrice) : Number(existing.costPrice);
  const nextMarkup = payload.markupPercentage !== undefined ? Number(payload.markupPercentage) : Number(existing.markupPercentage);
  const sellingPrice = calculateSellingPrice(nextCostPrice, nextMarkup);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updated = await quotationModel.updateForAgency(client, id, agencyId, {
      ...payload,
      costPrice: nextCostPrice,
      markupPercentage: nextMarkup,
      sellingPrice,
    });

    let items = existing.items;
    if (payload.items !== undefined) {
      items = await quotationModel.replaceItems(client, id, prepareItems(payload.items));
    }

    await client.query("COMMIT");
    return { ...updated, items };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteQuotation(id, agencyId) {
  const deleted = await quotationModel.deleteForAgency(id, agencyId);
  if (!deleted) {
    throw ApiError.notFound("Quotation not found");
  }
  return deleted;
}

module.exports = { createQuotation, listQuotations, getQuotation, updateQuotation, deleteQuotation };
