import nodemailer from "nodemailer";
import config from "./env.js";

//Build and return a transport instance or null if SMTP config is missing.

const createTransporter = () => {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

export { createTransporter };
