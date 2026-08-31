const agencyModel = require("../models/agencyModel");
const { ApiError } = require("../utils/apiResponse");

async function getAgency(agencyId) {
  const agency = await agencyModel.findById(agencyId);
  if (!agency) {
    throw ApiError.notFound("Agency not found");
  }
  return agency;
}

async function updateAgency(agencyId, payload) {
  const updated = await agencyModel.update(agencyId, payload);
  if (!updated) {
    throw ApiError.notFound("Agency not found");
  }
  return updated;
}

module.exports = { getAgency, updateAgency };
