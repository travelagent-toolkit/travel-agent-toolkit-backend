/**
 * Server-side pricing math. The frontend may show a live preview, but the
 * backend is the source of truth: selling price is always recalculated
 * here from cost price + markup, never trusted as-is from the client.
 */
function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateSellingPrice(costPrice, markupPercentage) {
  const cost = Number(costPrice);
  const markup = Number(markupPercentage);
  return round2(cost * (1 + markup / 100));
}

function sumItemTotal(quantity, unitPrice) {
  return round2(Number(quantity) * Number(unitPrice));
}

module.exports = { round2, calculateSellingPrice, sumItemTotal };
