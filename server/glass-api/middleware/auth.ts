/**
 * Authentication Middleware
 * 
 * Validates API keys and JWT tokens for Glass API requests.
 */

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  userId?: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

/**
 * Validate API key format
 */
function isValidApiKeyFormat(key: string): boolean {
  // Format: glss_sk_live_xxxx or glss_sk_test_xxxx
  return /^glss_sk_(live|test)_[a-zA-Z0-9]{24,}$/.test(key);
}

/**
 * Get API key from request headers
 */
function extractApiKey(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Authentication middleware
 * 
 * Validates the API key and attaches user info to the request.
 * In production, this would verify against a database of API keys.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = extractApiKey(req);

    // Allow unauthenticated access in development
    if (process.env.NODE_ENV === 'development' && !apiKey) {
      req.tier = 'pro'; // Default to pro tier in dev
      return next();
    }

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'API key is required. Include it in the Authorization header as "Bearer <api_key>" or in the X-API-Key header.',
        },
      });
      return;
    }

    if (!isValidApiKeyFormat(apiKey)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key format. Keys should start with "glss_sk_live_" or "glss_sk_test_".',
        },
      });
      return;
    }

    // In production, verify the API key against the database
    // For now, we'll accept any valid format and assign a default tier
    // TODO: Implement database lookup
    // const keyRecord = await db.query.apiKeys.findFirst({
    //   where: eq(apiKeys.key, hashApiKey(apiKey)),
    // });

    // Attach key info to request
    req.apiKey = apiKey;
    req.tier = apiKey.includes('_test_') ? 'free' : 'pro';

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * 
 * Allows unauthenticated access but attaches user info if API key is provided.
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = extractApiKey(req);

    if (apiKey && isValidApiKeyFormat(apiKey)) {
      req.apiKey = apiKey;
      req.tier = apiKey.includes('_test_') ? 'free' : 'pro';
    } else {
      req.tier = 'free';
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require specific tier middleware
 */
export function requireTier(minTier: 'free' | 'pro' | 'enterprise') {
  const tierLevels = { free: 0, pro: 1, enterprise: 2 };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userTierLevel = tierLevels[req.tier || 'free'];
    const requiredLevel = tierLevels[minTier];

    if (userTierLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_TIER',
          message: `This endpoint requires ${minTier} tier or higher. Your current tier: ${req.tier || 'free'}`,
        },
      });
      return;
    }

    next();
  };
}
