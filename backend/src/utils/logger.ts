import winston from 'winston';
import { resolve } from 'path';
import { env } from '../config/env';

// Determine log level
const logLevel = env.logLevel || 'info';

// Log directory
const logDirectory = resolve(__dirname, '../../logs'); // Assuming logs folder is at backend/logs

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Include stack trace
  winston.format.json()
);

// Custom format for console output (human-readable, with colors in dev)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    // Only add metadata if it's not empty, and not an empty object
    if (Object.keys(metadata).length) {
      msg += ` - ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  levels: winston.config.npm.levels, // Use standard npm levels (error, warn, info, http, verbose, debug, silly)
  format: fileFormat, // Default to JSON format for files
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat, // Human-readable format for console
    }),
    // File transport for all logs
    new winston.transports.File({ filename: resolve(logDirectory, 'combined.log') }),
    // File transport for errors only
    new winston.transports.File({ filename: resolve(logDirectory, 'error.log'), level: 'error' }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: resolve(logDirectory, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: resolve(logDirectory, 'rejections.log') }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// A wrapper for error logging to ensure consistency and easy usage
export const logError = (context: string, message: string, error?: unknown, metadata?: Record<string, unknown>) => {
  const logObject: Record<string, unknown> = {
    message: `${context}: ${message}`,
  };

  if (error instanceof Error) {
    logObject.error = error.message;
    logObject.stack = error.stack;
  } else if (error) {
    logObject.error = error;
  }

  if (metadata) {
    Object.assign(logObject, metadata);
  }

  logger.error(logObject);
};