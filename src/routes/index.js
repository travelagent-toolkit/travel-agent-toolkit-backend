const { Router } = require("express");
const authRoutes = require("./authRoutes");
const customerRoutes = require("./customerRoutes");
const quotationRoutes = require("./quotationRoutes");
const itineraryRoutes = require("./itineraryRoutes");
const agencyRoutes = require("./agencyRoutes");
const userRoutes = require("./userRoutes");
const usageRoutes = require("./usageRoutes");

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Travel Agent Toolkit API is running" });
});

router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/quotations", quotationRoutes);
router.use("/itineraries", itineraryRoutes);
router.use("/agency", agencyRoutes);
router.use("/users", userRoutes);
router.use("/usage", usageRoutes);

module.exports = router;
