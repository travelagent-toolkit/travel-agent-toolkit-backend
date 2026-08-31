const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
const apiRoutes = require("./routes/index");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // required on Render so rate-limiting/IP logic sees the real client IP

app.use(helmet());

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Travel Agent Toolkit API is running" });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
