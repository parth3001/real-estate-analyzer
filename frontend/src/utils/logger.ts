/**
 * Frontend Logger Utility
 *
 * Conditionally logs to console based on environment:
 * - Development: All console.log statements work normally
 * - Production: console.log is silenced (console.error/warn still work)
 *
 * Usage: Replace console.log with logger.log throughout codebase
 * Or: Use the setupProductionLogger() to globally silence console.log
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Custom logger that respects environment
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    // Always show warnings (even in production)
    console.warn(...args);
  },

  error: (...args: any[]) => {
    // Always show errors (even in production)
    console.error(...args);
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

/**
 * Globally silence console.log in production
 * Call this once in main.tsx to disable ALL console.log statements
 *
 * Note: console.error and console.warn will still work
 */
export const setupProductionLogger = () => {
  if (isProduction) {
    // Save original console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Silence log, info, debug in production
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};

    // Keep error and warn (important for debugging production issues)
    // console.error and console.warn remain unchanged

    // Optional: Log once that we're in production mode (using originalLog to bypass silence)
    originalLog('[Production Mode] Console.log statements are silenced. Errors and warnings will still appear.');
  }
};

export default logger;
