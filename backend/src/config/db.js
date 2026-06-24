import mongoose from "mongoose";
import config from "./env.js";
import { logger } from '../utils/logger.js';


// Connect to MongoDB using the configured connection string.
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    const runtimeUri =
      process.env.NODE_ENV === "test"
        ? process.env.MONGO_URI_TESTS || config.mongoUri
        : config.mongoUri;

    await mongoose.connect(runtimeUri);

    logger.info("MongoDB connected successfully");

    // Avoid stacking listeners across repeated test imports.
    if (!mongoose.connection.listeners("disconnected").length) {
      mongoose.connection.on("disconnected", () => {
        if (process.env.NODE_ENV !== "test") {
          console.warn("MongoDB disconnected");
        }
      });
    }
  } catch (err) {
    logger.error("MongoDB connection failed:", err.message);
    if (process.env.NODE_ENV === "test") {
      throw err;
    }
    process.exit(1);
  }
};

export { connectDB };
