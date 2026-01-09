/**
 * Glass API Server
 * 
 * Exposes the Glass orchestrator, R execution engine, and AgentSkills
 * as RESTful endpoints for external clients (AI agents, web apps, automation tools).
 * 
 * Note: In production, install cors, helmet, and express-rate-limit packages.
 * This version uses minimal dependencies for development.
 */

import express, { Request, Response, NextFunction } from 'express';

import { orchestratorRouter } from './routes/orchestrator';
import { executeRouter } from './routes/execute';
import { skillsRouter } from './routes/skills';
import { literatureRouter } from './routes/literature';
import { chatRouter } from './routes/chat';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';

const app = express();

// =============================================================================
// Security Middleware (simplified for development)
// =============================================================================

// CORS middleware (simplified)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// =============================================================================
// Rate Limiting (simplified in-memory implementation)
// =============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.headers['x-api-key'] as string) || req.ip || 'anonymous';
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
        },
      });
    }
    
    next();
  };
}

const apiLimiter = createRateLimiter(100, 60 * 1000); // 100 requests per minute
const executeLimiter = createRateLimiter(10, 60 * 1000); // 10 R executions per minute

// =============================================================================
// Body Parsing
// =============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// Request Logging
// =============================================================================

app.use(requestLogger);

// =============================================================================
// Health Check (No Auth Required)
// =============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Glass API',
    version: '1.0.0',
    description: 'Meta-analysis orchestration and R execution API',
    documentation: 'https://docs.meta-agent.io/glass-api',
    endpoints: {
      orchestrator: '/v1/orchestrator',
      execute: '/v1/execute',
      skills: '/v1/skills',
      literature: '/v1/literature',
      chat: '/v1/chat',
    },
  });
});

// =============================================================================
// API Routes (v1)
// =============================================================================

// Apply rate limiting and authentication to all v1 routes
app.use('/v1', apiLimiter);
app.use('/v1', authMiddleware);

// Mount routers
app.use('/v1/orchestrator', orchestratorRouter);
app.use('/v1/execute', executeLimiter, executeRouter);
app.use('/v1/skills', skillsRouter);
app.use('/v1/literature', literatureRouter);
app.use('/v1/chat', chatRouter);

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

// =============================================================================
// Server Startup
// =============================================================================

const PORT = parseInt(process.env.PORT || '4000', 10);

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔬 Glass API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

export { app };
