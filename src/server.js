const app = require("./app");
const env = require("./config/env");
const { checkConnection } = require("./config/db");

async function start() {
  try {
    await checkConnection();
    // eslint-disable-next-line no-console
    console.log("Database connection established.");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to the database:", err.message);
    process.exit(1);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Travel Agent Toolkit API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
