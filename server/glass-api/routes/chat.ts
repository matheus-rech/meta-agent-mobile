/**
 * Chat Routes
 * 
 * Endpoints for conversational interface with Glass AI.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/error';

export const chatRouter = Router();

// =============================================================================
// POST /chat
// Send a message to Glass and get a response
// =============================================================================
chatRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, context = {}, session_id } = req.body;

    if (!message || typeof message !== 'string') {
      throw new ValidationError([
        { field: 'message', message: 'message must be a non-empty string' }
      ]);
    }

    // In production, this would invoke the Glass AI agent
    // For now, return a simulated response
    res.json({
      success: true,
      data: {
        response: `Glass received your message: "${message}". In production, this would invoke the full Glass AI agent with orchestrator integration.`,
        session_id: session_id || `session_${Date.now()}`,
        skills_used: [],
        suggestions: [
          'Try /analyze to detect your data type',
          'Try /suggest to get analysis recommendations',
          'Try /generate-code to create R scripts',
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// POST /chat/stream
// Stream a response from Glass (Server-Sent Events)
// =============================================================================
chatRouter.post('/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      throw new ValidationError([
        { field: 'message', message: 'message must be a non-empty string' }
      ]);
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Simulate streaming response
    const words = `Glass is processing your request. In production, this would stream the actual AI response in real-time.`.split(' ');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < words.length) {
        res.write(`data: ${JSON.stringify({ token: words[index] + ' ' })}\n\n`);
        index++;
      } else {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        clearInterval(interval);
        res.end();
      }
    }, 100);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET /chat/sessions/:sessionId
// Get chat session history
// =============================================================================
chatRouter.get('/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    // In production, fetch from database
    res.json({
      success: true,
      data: {
        session_id: sessionId,
        messages: [],
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// DELETE /chat/sessions/:sessionId
// Delete a chat session
// =============================================================================
chatRouter.delete('/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
});
