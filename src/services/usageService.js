const usageModel = require("../models/usageModel");

/**
 * Returns the current calendar month's usage counters for an agency.
 * Plan limit enforcement (Free/Pro/Agency) is intentionally not
 * implemented yet — this only reports current counts.
 */
async function getCurrentUsage(agencyId) {
  const month = usageModel.currentMonthKey();
  const usage = await usageModel.getForAgencyAndMonth(agencyId, month);
  return (
    usage || {
      agencyId,
      month,
      quotationCount: 0,
      itineraryCount: 0,
    }
  );
}

module.exports = { getCurrentUsage };
