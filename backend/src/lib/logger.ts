/**
 * Structured Logging with Pino
 * 
 * Production-ready logging with:
 * - Structured JSON logs in production
 * - Pretty formatting in development
 * - Log levels based on environment
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure transport for development (pretty print)
const developmentTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
};

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  ...(isDevelopment && { transport: developmentTransport }),
  // Add base fields to all logs
  base: {
    service: 'board-observer-api',
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.apiKey'],
    remove: true,
  },
});

// Create child loggers for different modules
export const createLogger = (module: string) => logger.child({ module });

// Pre-configured child loggers for common modules
export const webhookLogger = createLogger('webhook');
export const botLogger = createLogger('bot');
export const agentLogger = createLogger('agent');
export const transcriptLogger = createLogger('transcript');
export const apiLogger = createLogger('api');

// Export default logger
export default logger;
