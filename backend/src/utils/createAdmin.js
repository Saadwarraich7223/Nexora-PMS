import config from "../config/env.js";
import User from "../models/user.model.js";
import { logger } from './logger.js';

const seedAdmin = async () => {
  const admin = await User.findOne({ email: config.adminEmail });

  if (!admin) {
    logger.info("Seeding admin user...");
    await User.create({
      name: config.adminName,
      email: config.adminEmail,
      password: config.adminPassword,
      role: "admin",
    });
  }
};

export default seedAdmin;
