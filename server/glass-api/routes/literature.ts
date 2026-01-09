/**
 * Literature Routes
 * 
 * Endpoints for PubMed and CrossRef literature search.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/error';

export const literatureRouter = Router();

// =============================================================================
// POST /literature/search
// Search PubMed and CrossRef for studies
// =============================================================================
literatureRouter.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, source = 'pubmed', limit = 20 } = req.body;

    if (!query || typeof query !== 'string') {
      throw new ValidationError([
        { field: 'query', message: 'query must be a non-empty string' }
      ]);
    }

    // In production, this would call the actual PubMed/CrossRef APIs
    // For now, return a simulated response
    res.json({
      success: true,
      data: {
        query,
        source,
        results: [],
        total: 0,
        message: 'Literature search API - connect to PubMed/CrossRef in production',
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET /literature/pubmed/:pmid
// Get study details by PubMed ID
// =============================================================================
literatureRouter.get('/pubmed/:pmid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pmid } = req.params;

    // In production, fetch from PubMed E-utilities
    res.json({
      success: true,
      data: {
        pmid,
        message: 'PubMed lookup API - connect to E-utilities in production',
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET /literature/doi/:doi
// Get study details by DOI
// =============================================================================
literatureRouter.get('/doi/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doi = req.params[0];

    // In production, fetch from CrossRef
    res.json({
      success: true,
      data: {
        doi,
        message: 'CrossRef lookup API - connect to CrossRef in production',
      },
    });
  } catch (error) {
    next(error);
  }
});
