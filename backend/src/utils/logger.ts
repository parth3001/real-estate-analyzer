import winston from 'winston';

// Custom format for better console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: () => new Date().toLocaleString() // Local time format
  }),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, ...meta } = info;
    let log = `[${timestamp}] ${level}: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// File format with UTC timestamps for consistency
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Determine log level based on environment
// 🔍 ISSUE #53 DEBUG: Temporarily set to 'error' to silence noise
const logLevel = process.env.NODE_ENV === 'production'
  ? (process.env.LOG_LEVEL || 'error')  // Production: Only errors by default
  : (process.env.LOG_LEVEL || 'error');   // Development: TEMPORARILY 'error' to reduce logs

export const logger = winston.createLogger({
  level: logLevel,
  transports: []
});

// Production: Only error logs to file
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
} else {
  // Development: Full logging to files
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: fileFormat
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/all.log',
    format: fileFormat
  }));
  // Development: Console logging with colors
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} 