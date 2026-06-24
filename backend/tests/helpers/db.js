import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

const assertTestConnection = () => {
  const uri = mongoose.connection?.client?.s?.url || process.env.MONGO_URI_TESTS || "";
  const isTestEnv = process.env.NODE_ENV === "test";
  const looksLikeTestDb =
    String(uri).includes("127.0.0.1") ||
    String(uri).includes("localhost") ||
    String(uri).includes("mongodb-memory-server");

  if (!isTestEnv || !looksLikeTestDb) {
    throw new Error(
      "Refusing DB cleanup outside isolated test DB. Check NODE_ENV and MONGO_URI_TESTS.",
    );
  }
};

export const connectTestDB = async () => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI_TESTS = mongoServer.getUri("pms_test_db");
  }

  const { connectDB } = await import("../../src/config/db.js");
  await connectDB();
};

export const clearTestDB = async () => {
  assertTestConnection();
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};
