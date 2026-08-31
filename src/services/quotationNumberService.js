const quotationModel = require("../models/quotationModel");

/**
 * Builds a short, readable prefix from the agency name, e.g.
 * "RJ Holidays" -> "RJH". Falls back to "TAT" if the name yields
 * nothing usable. Never derived from client input directly.
 */
function prefixFromAgencyName(name) {
  const letters = (name || "")
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z]/g, "").charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase();

  if (letters.length >= 2) return letters.slice(0, 4);
  return "TAT";
}

/**
 * Generates a unique quotation number in the form PREFIX-YEAR-000001,
 * numbered sequentially per agency per year. Must be called within the
 * same transaction/client that will insert the quotation to avoid a
 * race between the count and the insert under concurrent requests.
 */
async function generateQuotationNumber(client, agencyId, agencyName) {
  const year = new Date().getUTCFullYear();
  const prefix = prefixFromAgencyName(agencyName);
  const existingCount = await quotationModel.countForAgencyThisYear(client, agencyId, year);
  const sequence = String(existingCount + 1).padStart(6, "0");
  return `${prefix}-${year}-${sequence}`;
}

module.exports = { generateQuotationNumber };
