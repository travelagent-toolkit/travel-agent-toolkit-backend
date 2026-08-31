const customerModel = require("../models/customerModel");
const { ApiError } = require("../utils/apiResponse");

async function createCustomer(agencyId, payload) {
  return customerModel.create(agencyId, payload);
}

async function listCustomers(agencyId, filters) {
  return customerModel.listByAgency(agencyId, filters);
}

async function getCustomer(id, agencyId) {
  const customer = await customerModel.findByIdForAgency(id, agencyId);
  if (!customer) {
    throw ApiError.notFound("Customer not found");
  }
  return customer;
}

async function updateCustomer(id, agencyId, payload) {
  const existing = await customerModel.findByIdForAgency(id, agencyId);
  if (!existing) {
    throw ApiError.notFound("Customer not found");
  }
  return customerModel.updateForAgency(id, agencyId, payload);
}

async function deleteCustomer(id, agencyId) {
  const deleted = await customerModel.deleteForAgency(id, agencyId);
  if (!deleted) {
    throw ApiError.notFound("Customer not found");
  }
  return deleted;
}

module.exports = { createCustomer, listCustomers, getCustomer, updateCustomer, deleteCustomer };
