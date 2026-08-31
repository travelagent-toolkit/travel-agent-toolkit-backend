const itineraryService = require("../services/itineraryService");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, noContent } = require("../utils/apiResponse");

const list = asyncHandler(async (req, res) => {
  const itineraries = await itineraryService.listItineraries(req.user.agencyId);
  return ok(res, itineraries);
});

const create = asyncHandler(async (req, res) => {
  const itinerary = await itineraryService.createItinerary(req.user.agencyId, req.body);
  return created(res, itinerary);
});

const getOne = asyncHandler(async (req, res) => {
  const itinerary = await itineraryService.getItinerary(req.params.id, req.user.agencyId);
  return ok(res, itinerary);
});

const update = asyncHandler(async (req, res) => {
  const itinerary = await itineraryService.updateItinerary(req.params.id, req.user.agencyId, req.body);
  return ok(res, itinerary);
});

const remove = asyncHandler(async (req, res) => {
  await itineraryService.deleteItinerary(req.params.id, req.user.agencyId);
  return noContent(res);
});

module.exports = { list, create, getOne, update, remove };
