/**
 * Error Handler Middleware
 * 
 * Catches and formats all errors for consistent API responses.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message: string = 'Rate limit exceeded'): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  static serviceUnavailable(message: string = 'Service temporarily unavailable'): ApiError {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }
}

/**
 * Validation error for request body/params
 */
export class ValidationError extends ApiError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed', { errors });
  }
}

/**
 * R Execution error
 */
export class RExecutionError extends ApiError {
  constructor(message: string, output?: string) {
    super(500, 'R_EXECUTION_ERROR', message, { output });
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
    });
    return;
  }

  // Handle unexpected errors
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      ...(isDev && { stack: err.stack }),
    },
  });
}
