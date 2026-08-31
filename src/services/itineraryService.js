const { pool } = require("../config/db");
const itineraryModel = require("../models/itineraryModel");
const customerModel = require("../models/customerModel");
const quotationModel = require("../models/quotationModel");
const usageModel = require("../models/usageModel");
const { ApiError } = require("../utils/apiResponse");

async function assertCustomerBelongsToAgency(customerId, agencyId) {
  if (!customerId) return;
  const customer = await customerModel.findByIdForAgency(customerId, agencyId);
  if (!customer) {
    throw ApiError.badRequest("customerId does not belong to your agency");
  }
}

async function assertQuotationBelongsToAgency(quotationId, agencyId) {
  if (!quotationId) return;
  const quotation = await quotationModel.findByIdForAgency(quotationId, agencyId);
  if (!quotation) {
    throw ApiError.badRequest("quotationId does not belong to your agency");
  }
}

async function createItinerary(agencyId, payload) {
  await assertCustomerBelongsToAgency(payload.customerId, agencyId);
  await assertQuotationBelongsToAgency(payload.quotationId, agencyId);

  // Normalize optional fields so an omitted value falls back to a real
  // default instead of an explicit NULL, which would override the
  // column's own DEFAULT clause and violate its NOT NULL constraint.
  const normalizedPayload = {
    ...payload,
    travelType: payload.travelType || "Leisure",
    content: payload.content || [],
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const itinerary = await itineraryModel.create(client, agencyId, normalizedPayload);

    const month = usageModel.currentMonthKey();
    await usageModel.incrementItineraryCount(client, agencyId, month);

    await client.query("COMMIT");
    return itinerary;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listItineraries(agencyId) {
  return itineraryModel.listByAgency(agencyId);
}

async function getItinerary(id, agencyId) {
  const itinerary = await itineraryModel.findByIdForAgency(id, agencyId);
  if (!itinerary) {
    throw ApiError.notFound("Itinerary not found");
  }
  return itinerary;
}

async function updateItinerary(id, agencyId, payload) {
  const existing = await itineraryModel.findByIdForAgency(id, agencyId);
  if (!existing) {
    throw ApiError.notFound("Itinerary not found");
  }
  if (payload.customerId !== undefined) {
    await assertCustomerBelongsToAgency(payload.customerId, agencyId);
  }
  if (payload.quotationId !== undefined) {
    await assertQuotationBelongsToAgency(payload.quotationId, agencyId);
  }
  return itineraryModel.updateForAgency(id, agencyId, payload);
}

async function deleteItinerary(id, agencyId) {
  const deleted = await itineraryModel.deleteForAgency(id, agencyId);
  if (!deleted) {
    throw ApiError.notFound("Itinerary not found");
  }
  return deleted;
}

module.exports = { createItinerary, listItineraries, getItinerary, updateItinerary, deleteItinerary };
