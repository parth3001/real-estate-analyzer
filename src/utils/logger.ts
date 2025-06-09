import winston from 'winston';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'real-estate-analyzer' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    // File transport for errors
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      dirname: process.env.LOG_DIR || './logs',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      dirname: process.env.LOG_DIR || './logs',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, also log to the console with more details
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Logging initialized in development mode');
}

// Handle uncaught exceptions and unhandled rejections
winston.exceptions.handle(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
  new winston.transports.File({ 
    filename: 'logs/exceptions.log',
    dirname: process.env.LOG_DIR || './logs',
  })
);

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

export default logger; 