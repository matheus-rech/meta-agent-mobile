/**
 * Skills Routes
 * 
 * Endpoints for accessing Glass AgentSkills.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error';

export const skillsRouter = Router();

// Available skills (in production, load from agentskills directory)
const AVAILABLE_SKILLS = [
  {
    id: 'meta-analysis',
    name: 'Meta-Analysis',
    description: 'Perform standard pairwise meta-analysis with forest plots and heterogeneity assessment',
    category: 'analysis',
  },
  {
    id: 'network-meta-analysis',
    name: 'Network Meta-Analysis',
    description: 'Compare multiple interventions simultaneously using network meta-analysis',
    category: 'analysis',
  },
  {
    id: 'diagnostic-meta-analysis',
    name: 'Diagnostic Meta-Analysis',
    description: 'Analyze diagnostic test accuracy studies with bivariate models',
    category: 'analysis',
  },
  {
    id: 'bayesian-meta-analysis',
    name: 'Bayesian Meta-Analysis',
    description: 'Perform Bayesian meta-analysis with prior specification and MCMC sampling',
    category: 'analysis',
  },
  {
    id: 'trial-sequential-analysis',
    name: 'Trial Sequential Analysis',
    description: 'Control for random errors and assess if more studies are needed',
    category: 'analysis',
  },
  {
    id: 'ipd-meta-analysis',
    name: 'IPD Meta-Analysis',
    description: 'Analyze individual participant data for more detailed insights',
    category: 'analysis',
  },
  {
    id: 'risk-of-bias',
    name: 'Risk of Bias Assessment',
    description: 'Assess study quality using RoB 2, ROBINS-I, or Newcastle-Ottawa Scale',
    category: 'quality',
  },
  {
    id: 'grade-assessment',
    name: 'GRADE Assessment',
    description: 'Rate certainty of evidence using the GRADE approach',
    category: 'quality',
  },
  {
    id: 'prisma-flowchart',
    name: 'PRISMA Flowchart',
    description: 'Generate PRISMA 2020 compliant study selection flowchart',
    category: 'reporting',
  },
  {
    id: 'manuscript-generator',
    name: 'Manuscript Generator',
    description: 'Generate methods and results sections following reporting guidelines',
    category: 'reporting',
  },
  {
    id: 'publication-bias',
    name: 'Publication Bias',
    description: 'Assess and adjust for publication bias using funnel plots and statistical tests',
    category: 'analysis',
  },
  {
    id: 'sensitivity-analysis',
    name: 'Sensitivity Analysis',
    description: 'Perform leave-one-out and influence diagnostics',
    category: 'analysis',
  },
  {
    id: 'subgroup-analysis',
    name: 'Subgroup Analysis',
    description: 'Explore heterogeneity through categorical moderator analysis',
    category: 'analysis',
  },
];

// =============================================================================
// GET /skills
// List all available skills
// =============================================================================
skillsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;

    let skills = AVAILABLE_SKILLS;

    if (category && typeof category === 'string') {
      skills = skills.filter(s => s.category === category);
    }

    res.json({
      success: true,
      data: {
        skills,
        categories: ['analysis', 'quality', 'reporting'],
        total: skills.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET /skills/:skillId
// Get details for a specific skill
// =============================================================================
skillsRouter.get('/:skillId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skillId } = req.params;

    const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);
    if (!skill) {
      throw ApiError.notFound('Skill');
    }

    // In production, load full skill documentation from SKILL.md
    res.json({
      success: true,
      data: {
        ...skill,
        documentation: `# ${skill.name}\n\n${skill.description}\n\n## Usage\n\nThis skill can be invoked through the Glass API.`,
        parameters: [],
        examples: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// POST /skills/:skillId/invoke
// Invoke a skill with parameters
// =============================================================================
skillsRouter.post('/:skillId/invoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skillId } = req.params;
    const { parameters = {} } = req.body;

    const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);
    if (!skill) {
      throw ApiError.notFound('Skill');
    }

    // In production, this would invoke the actual skill
    res.json({
      success: true,
      data: {
        skill_id: skillId,
        status: 'completed',
        result: {
          message: `Skill "${skill.name}" invoked successfully`,
          parameters_received: parameters,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
