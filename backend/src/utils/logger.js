import winston from 'winston';
import morgan from 'morgan';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // ensure stack traces are properly handled
    colorize(),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Stream for morgan to use the winston logger
export const stream = {
  write: (message) => {
    // Morgan adds a newline by default, so we trim it
    logger.info(message.trim());
  },
};

// Morgan middleware to use in Express
export const morganMiddleware = morgan((tokens, req, res) => {
  const status = Number(tokens.status(req, res));

  let statusColor;
  if (status >= 500) statusColor = '\x1b[31m'; // red
  else if (status >= 400) statusColor = '\x1b[33m'; // yellow
  else statusColor = '\x1b[32m'; // green

  const reset = '\x1b[0m';

  const responseTime = parseFloat(
    tokens['response-time'](req, res)
  );

  let timeColor;
  if (responseTime < 100) timeColor = '\x1b[32m';
  else if (responseTime < 500) timeColor = '\x1b[33m';
  else timeColor = '\x1b[31m';

  return [
    tokens.method(req, res),
    tokens.url(req, res),
    `${statusColor}${status}${reset}`,
    `${timeColor}${responseTime}ms${reset}`,
  ].join(' ');
}, { stream });
