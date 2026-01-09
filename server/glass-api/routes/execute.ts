/**
 * Execute Routes
 * 
 * Endpoints for R code execution with sandboxing and streaming support.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ApiError, ValidationError, RExecutionError } from '../middleware/error';

export const executeRouter = Router();

// In production, this would connect to the R worker pool via Redis
// For now, we'll provide a stub implementation

interface ExecutionJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  code: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  error?: string;
  files?: string[];
}

// Simple in-memory job store (use Redis in production)
const jobs = new Map<string, ExecutionJob>();

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// POST /execute
// Submit R code for execution
// =============================================================================
executeRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, timeout = 60, packages = [] } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      throw new ValidationError([
        { field: 'code', message: 'code must be a non-empty string' }
      ]);
    }

    if (code.length > 100000) {
      throw new ValidationError([
        { field: 'code', message: 'code exceeds maximum length of 100,000 characters' }
      ]);
    }

    // Create job
    const jobId = generateJobId();
    const job: ExecutionJob = {
      id: jobId,
      status: 'queued',
      code,
      createdAt: new Date(),
    };

    jobs.set(jobId, job);

    // In production, this would add the job to a Redis queue
    // For now, we'll simulate async execution
    setTimeout(() => {
      const storedJob = jobs.get(jobId);
      if (storedJob) {
        storedJob.status = 'running';
        storedJob.startedAt = new Date();
        
        // Simulate execution (in production, R worker would process this)
        setTimeout(() => {
          storedJob.status = 'completed';
          storedJob.completedAt = new Date();
          storedJob.output = '# R execution simulated\n# In production, this would run actual R code';
          storedJob.files = [];
        }, 1000);
      }
    }, 100);

    res.status(202).json({
      success: true,
      data: {
        job_id: jobId,
        status: 'queued',
        estimated_wait_seconds: 5,
        poll_url: `/v1/execute/${jobId}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET /execute/:jobId
// Get execution job status and results
// =============================================================================
executeRouter.get('/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    const job = jobs.get(jobId);
    if (!job) {
      throw ApiError.notFound('Execution job');
    }

    const response: Record<string, unknown> = {
      job_id: job.id,
      status: job.status,
      created_at: job.createdAt.toISOString(),
    };

    if (job.startedAt) {
      response.started_at = job.startedAt.toISOString();
    }

    if (job.status === 'completed') {
      response.completed_at = job.completedAt?.toISOString();
      response.output = job.output;
      response.files = job.files;
    }

    if (job.status === 'failed') {
      response.error = job.error;
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// DELETE /execute/:jobId
// Cancel an execution job
// =============================================================================
executeRouter.delete('/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    const job = jobs.get(jobId);
    if (!job) {
      throw ApiError.notFound('Execution job');
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw ApiError.badRequest('Cannot cancel a completed or failed job');
    }

    job.status = 'failed';
    job.error = 'Job cancelled by user';
    job.completedAt = new Date();

    res.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'cancelled',
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// POST /execute/sync
// Execute R code synchronously (blocking, for simple operations)
// =============================================================================
executeRouter.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, timeout = 30 } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      throw new ValidationError([
        { field: 'code', message: 'code must be a non-empty string' }
      ]);
    }

    if (code.length > 10000) {
      throw new ValidationError([
        { field: 'code', message: 'sync execution limited to 10,000 characters' }
      ]);
    }

    // In production, this would execute R code synchronously
    // For now, return a simulated response
    res.json({
      success: true,
      data: {
        output: '# Synchronous R execution simulated\n# In production, this would run actual R code',
        execution_time_ms: 150,
        files: [],
      },
    });
  } catch (error) {
    next(error);
  }
});
