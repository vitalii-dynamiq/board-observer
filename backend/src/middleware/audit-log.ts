/**
 * Audit Logging Middleware
 * 
 * Logs all API requests and responses for security auditing.
 * Particularly important for AI agent actions and sensitive operations.
 */

import { Request, Response, NextFunction } from 'express';
import { apiLogger as logger } from '../lib/logger';

export interface AuditLogEntry {
  timestamp: Date;
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  statusCode: number;
  duration: number;
  requestBody?: any;
  responseBody?: any;
  error?: string;
  category: 'api' | 'webhook' | 'ai-agent' | 'auth' | 'admin';
}

// In production, write to a proper logging service (e.g., CloudWatch, Datadog)
const auditLogs: AuditLogEntry[] = [];

// Keep only last 1000 logs in memory
const MAX_LOGS = 1000;

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function categorizeRequest(path: string, method: string): AuditLogEntry['category'] {
  if (path.includes('/webhooks/')) return 'webhook';
  if (path.includes('/agent/') || path.includes('/bot/')) return 'ai-agent';
  if (path.includes('/auth/')) return 'auth';
  if (path.includes('/admin/')) return 'admin';
  return 'api';
}

function sanitizeBody(body: any): any {
  if (!body) return undefined;
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Truncate large bodies
  const stringified = JSON.stringify(sanitized);
  if (stringified.length > 1000) {
    return { _truncated: true, length: stringified.length };
  }
  
  return sanitized;
}

/**
 * Create audit logging middleware
 */
export function auditLog(options: {
  logRequestBody?: boolean;
  logResponseBody?: boolean;
} = {}) {
  const { logRequestBody = false, logResponseBody = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Attach request ID for tracing
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Capture original end function
    const originalEnd = res.end;
    let responseBody: any;

    // Override end to capture response body
    res.end = function (this: Response, chunk?: any, encoding?: any, callback?: any) {
      if (logResponseBody && chunk) {
        try {
          responseBody = JSON.parse(chunk.toString());
        } catch {
          // Not JSON, skip
        }
      }
      return originalEnd.call(this, chunk, encoding, callback);
    } as typeof res.end;

    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const entry: AuditLogEntry = {
        timestamp: new Date(),
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        statusCode: res.statusCode,
        duration,
        category: categorizeRequest(req.path, req.method),
      };

      if (logRequestBody && req.body && Object.keys(req.body).length > 0) {
        entry.requestBody = sanitizeBody(req.body);
      }

      if (logResponseBody && responseBody) {
        entry.responseBody = sanitizeBody(responseBody);
      }

      if (res.statusCode >= 400) {
        entry.error = res.statusMessage;
      }

      // Store log
      auditLogs.push(entry);
      if (auditLogs.length > MAX_LOGS) {
        auditLogs.shift();
      }

      // Log request
      const logData = {
        category: entry.category,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        requestId,
      };

      if (res.statusCode >= 500) {
        logger.error(logData, 'Request error');
      } else if (res.statusCode >= 400) {
        logger.warn(logData, 'Request failed');
      } else if (entry.category === 'ai-agent') {
        // Log AI agent actions more verbosely
        logger.info({
          ...logData,
          ...(entry.requestBody && { input: entry.requestBody }),
        }, 'AI agent action');
      } else {
        logger.debug(logData, 'Request completed');
      }
    });

    next();
  };
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export function getRecentLogs(options: {
  limit?: number;
  category?: AuditLogEntry['category'];
  statusCode?: number;
} = {}): AuditLogEntry[] {
  let logs = [...auditLogs].reverse();

  if (options.category) {
    logs = logs.filter(l => l.category === options.category);
  }

  if (options.statusCode) {
    logs = logs.filter(l => l.statusCode === options.statusCode);
  }

  return logs.slice(0, options.limit || 100);
}

/**
 * Get AI agent audit logs
 */
export function getAIAgentLogs(limit: number = 50): AuditLogEntry[] {
  return auditLogs
    .filter(l => l.category === 'ai-agent')
    .reverse()
    .slice(0, limit);
}

/**
 * Get error logs
 */
export function getErrorLogs(limit: number = 50): AuditLogEntry[] {
  return auditLogs
    .filter(l => l.statusCode >= 400)
    .reverse()
    .slice(0, limit);
}

export default auditLog;
