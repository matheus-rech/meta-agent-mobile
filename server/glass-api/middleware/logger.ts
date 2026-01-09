/**
 * Request Logger Middleware
 * 
 * Logs all incoming requests with timing information.
 */

import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ip: string;
  userAgent?: string;
  apiKey?: string;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Mask API key for logging (show first and last 4 chars)
 */
function maskApiKey(key?: string): string | undefined {
  if (!key || key.length < 12) return undefined;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/**
 * Request logger middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const apiKey = (req.headers['x-api-key'] as string) || 
                   req.headers.authorization?.replace('Bearer ', '');

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'],
      apiKey: maskApiKey(apiKey),
    };

    // Color-coded status
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : // Red for 5xx
                        res.statusCode >= 400 ? '\x1b[33m' : // Yellow for 4xx
                        res.statusCode >= 300 ? '\x1b[36m' : // Cyan for 3xx
                        '\x1b[32m'; // Green for 2xx
    const reset = '\x1b[0m';

    // Log format: [timestamp] METHOD /path STATUS duration
    const logLevel = res.statusCode >= 500 ? 'ERROR' : 
                     res.statusCode >= 400 ? 'WARN' : 'INFO';

    console.log(
      `[${logEntry.timestamp}] ${logLevel} ${req.method} ${req.path} ` +
      `${statusColor}${res.statusCode}${reset} ${formatDuration(duration)}` +
      (logEntry.apiKey ? ` [${logEntry.apiKey}]` : '')
    );

    // Log full entry as JSON in production for structured logging
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}

/**
 * Skip logging for specific paths (e.g., health checks)
 */
export function requestLoggerWithSkip(skipPaths: string[] = ['/health']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (skipPaths.includes(req.path)) {
      return next();
    }
    return requestLogger(req, res, next);
  };
}
