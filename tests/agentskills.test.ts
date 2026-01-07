/**
 * AgentSkills Integration Tests
 * 
 * Tests for skill definitions, prompt building, and skill matching.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock SecureStore
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

// Mock Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Import after mocks
import {
  SKILLS_METADATA,
  getSkillByName,
  getAllSkills,
} from '../lib/agent/skills/definitions';
import {
  buildAvailableSkillsXML,
  buildSystemPromptWithSkills,
  buildContextAwarePrompt,
  getSkillInstructions,
  matchSkillsToQuery,
} from '../lib/agent/skills/prompt-builder';
import {
  getMatchedSkillsForQuery,
  getFullSystemPrompt,
  META_AGENT_BASE_PROMPT,
} from '../lib/api-keys/skill-provider';

describe('AgentSkills Definitions', () => {
  it('should have all required skills defined', () => {
    const requiredSkills = [
      'meta-analysis-core',
      'data-extraction',
      'risk-of-bias',
      'heterogeneity-analysis',
      'publication-bias',
      'forest-plot',
      'teaching-meta-analysis',
      'r-code-generation',
    ];

    for (const skillName of requiredSkills) {
      expect(SKILLS_METADATA[skillName]).toBeDefined();
      expect(SKILLS_METADATA[skillName].name).toBe(skillName);
      expect(SKILLS_METADATA[skillName].description.length).toBeGreaterThan(50);
    }
  });

  it('should have valid skill metadata format', () => {
    for (const [name, metadata] of Object.entries(SKILLS_METADATA)) {
      // Name constraints (AgentSkills spec)
      expect(name.length).toBeLessThanOrEqual(64);
      expect(name).toMatch(/^[a-z0-9-]+$/);
      expect(name).not.toMatch(/^-|-$/);
      expect(name).not.toMatch(/--/);
      
      // Description constraints
      expect(metadata.description.length).toBeLessThanOrEqual(1024);
      expect(metadata.description.length).toBeGreaterThan(0);
      
      // License should be present
      expect(metadata.license).toBeDefined();
    }
  });

  it('should get skill by name', () => {
    const skill = getSkillByName('meta-analysis-core');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('meta-analysis-core');
    expect(skill?.instructions).toContain('metafor');
  });

  it('should get all skills', () => {
    const skills = getAllSkills();
    expect(skills.length).toBe(8);
    expect(skills.every(s => s.id && s.metadata && s.instructions)).toBe(true);
  });

  it('should have instructions for each skill', () => {
    const skills = getAllSkills();
    for (const skill of skills) {
      expect(skill.instructions.length).toBeGreaterThan(100);
      // Instructions should not include frontmatter
      expect(skill.instructions).not.toContain('---\nname:');
    }
  });
});

describe('Prompt Builder', () => {
  it('should build available skills XML', () => {
    const xml = buildAvailableSkillsXML();
    
    expect(xml).toContain('<available_skills>');
    expect(xml).toContain('</available_skills>');
    expect(xml).toContain('<skill>');
    expect(xml).toContain('<name>meta-analysis-core</name>');
    expect(xml).toContain('<description>');
  });

  it('should build system prompt with skills', () => {
    const basePrompt = 'You are a helpful assistant.';
    const prompt = buildSystemPromptWithSkills(basePrompt);
    
    expect(prompt).toContain(basePrompt);
    expect(prompt).toContain('## Available Skills');
    expect(prompt).toContain('<available_skills>');
  });

  it('should build system prompt with active skill', () => {
    const basePrompt = 'You are a helpful assistant.';
    const prompt = buildSystemPromptWithSkills(basePrompt, 'meta-analysis-core');
    
    expect(prompt).toContain(basePrompt);
    expect(prompt).toContain('## Active Skill: meta-analysis-core');
    expect(prompt).toContain('metafor');
  });

  it('should get skill instructions', () => {
    const instructions = getSkillInstructions('forest-plot');
    expect(instructions).toBeDefined();
    expect(instructions).toContain('forest');
  });
});

describe('Skill Matching', () => {
  it('should match meta-analysis queries', () => {
    const queries = [
      'run a meta-analysis',
      'pool these studies',
      'calculate effect sizes',
    ];

    for (const query of queries) {
      const matched = matchSkillsToQuery(query);
      expect(matched.length).toBeGreaterThan(0);
      expect(matched[0].id).toBe('meta-analysis-core');
    }
  });

  it('should match forest plot queries', () => {
    const queries = [
      'create a forest plot',
      'visualize the results',
    ];

    for (const query of queries) {
      const matched = matchSkillsToQuery(query);
      expect(matched.some(s => s.id === 'forest-plot')).toBe(true);
    }
  });

  it('should match teaching queries', () => {
    const queries = [
      'explain heterogeneity',
      'teach me about I-squared',
      'how does meta-analysis work',
    ];

    for (const query of queries) {
      const matched = matchSkillsToQuery(query);
      expect(matched.some(s => s.id === 'teaching-meta-analysis')).toBe(true);
    }
  });

  it('should match R code queries', () => {
    const queries = [
      'write R code',
      'generate a script',
    ];

    for (const query of queries) {
      const matched = matchSkillsToQuery(query);
      expect(matched.some(s => s.id === 'r-code-generation')).toBe(true);
    }
  });

  it('should match risk of bias queries', () => {
    const queries = [
      'assess risk of bias',
      'RoB assessment',
    ];

    for (const query of queries) {
      const matched = matchSkillsToQuery(query);
      expect(matched.some(s => s.id === 'risk-of-bias')).toBe(true);
    }
  });

  it('should match publication bias queries', () => {
    const queries = [
      'check for publication bias',
      'funnel plot',
    ];

    for (const query of queries) {
      const matched = matchSkillsToQuery(query);
      expect(matched.some(s => s.id === 'publication-bias')).toBe(true);
    }
  });
});

describe('Context-Aware Prompt', () => {
  it('should build context-aware prompt for meta-analysis query', () => {
    const prompt = buildContextAwarePrompt(
      'You are an assistant.',
      'run a meta-analysis on these studies'
    );
    
    expect(prompt).toContain('You are an assistant.');
    expect(prompt).toContain('## Activated Skills');
    expect(prompt).toContain('meta-analysis-core');
  });

  it('should include response guidelines', () => {
    const prompt = buildContextAwarePrompt(
      'You are an assistant.',
      'any query'
    );
    
    expect(prompt).toContain('## Response Guidelines');
    expect(prompt).toContain('Cochrane');
  });
});

describe('Skill Provider Integration', () => {
  it('should have base prompt defined', () => {
    expect(META_AGENT_BASE_PROMPT).toBeDefined();
    expect(META_AGENT_BASE_PROMPT).toContain('Meta Agent');
    expect(META_AGENT_BASE_PROMPT).toContain('meta-analysis');
  });

  it('should get matched skills for query', () => {
    const matched = getMatchedSkillsForQuery('run a meta-analysis');
    expect(matched.length).toBeGreaterThan(0);
    expect(matched[0].name).toBe('meta-analysis-core');
    expect(matched[0].description).toBeDefined();
  });

  it('should get full system prompt', () => {
    const prompt = getFullSystemPrompt();
    expect(prompt).toContain(META_AGENT_BASE_PROMPT);
    expect(prompt).toContain('<available_skills>');
  });
});

describe('Skill Content Quality', () => {
  it('should have R code examples in relevant skills', () => {
    const rSkills = ['meta-analysis-core', 'forest-plot', 'publication-bias', 'r-code-generation', 'heterogeneity-analysis'];
    
    for (const skillName of rSkills) {
      const skill = getSkillByName(skillName);
      // All R skills should have code blocks
      expect(skill?.instructions).toContain('```r');
      // At least one should reference metafor
    }
    
    // Verify at least one skill has metafor reference
    const coreSkill = getSkillByName('meta-analysis-core');
    expect(coreSkill?.instructions).toContain('metafor');
  });

  it('should have structured content in teaching skill', () => {
    const skill = getSkillByName('teaching-meta-analysis');
    // Teaching skill should have headers and structured content
    expect(skill?.instructions).toContain('##');
    expect(skill?.instructions).toContain('Heterogeneity');
  });

  it('should reference meta-analysis methodology in core skill', () => {
    const skill = getSkillByName('meta-analysis-core');
    // Should contain metafor and effect size references
    expect(skill?.instructions).toContain('metafor');
    expect(skill?.instructions).toContain('effect');
  });

  it('should have RoB 2 and ROBINS-I in risk of bias skill', () => {
    const skill = getSkillByName('risk-of-bias');
    expect(skill?.instructions).toContain('RoB 2');
    expect(skill?.instructions).toContain('ROBINS-I');
  });

  it('should have I² interpretation in heterogeneity skill', () => {
    const skill = getSkillByName('heterogeneity-analysis');
    expect(skill?.instructions).toContain('I²');
    expect(skill?.instructions).toContain('τ²');
  });
});
