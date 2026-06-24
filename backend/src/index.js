// HTTP server bootstrap for the API and Socket.io.
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import config from "./config/env.js";
import setupSockets from "./sockets/index.js";
import { initCronJobs } from "./utils/cronJobs.js";
import { logger } from './utils/logger.js';


// Connect to the database, attach sockets, and start listening.
const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  setupSockets(server);

  // Start scheduled background jobs (daily reminders etc.)
  initCronJobs();

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    logger.info(`FYPMS API running on port ${config.port}`);
  });
};

// Start the application.
start();
