/**
 * AgentSkills Prompt Builder
 * 
 * Builds system prompts with skill metadata and instructions.
 * Following AgentSkills specification for XML format.
 * @see https://agentskills.io/integrate-skills
 */

import { SKILLS_METADATA, SKILL_DEFINITIONS, getSkillByName } from './definitions';
import type { SkillMetadata, SkillDefinition } from './types';

/**
 * Build <available_skills> XML for system prompt injection
 * This is the metadata section loaded at startup (~100 tokens per skill)
 */
export function buildAvailableSkillsXML(): string {
  const skills = Object.values(SKILLS_METADATA);
  
  const skillsXML = skills.map(skill => `  <skill>
    <name>${escapeXML(skill.name)}</name>
    <description>${escapeXML(skill.description)}</description>
  </skill>`).join('\n');
  
  return `<available_skills>
${skillsXML}
</available_skills>`;
}

/**
 * Build complete system prompt with skills
 * Includes base prompt, available skills, and active skill instructions
 */
export function buildSystemPromptWithSkills(
  basePrompt: string,
  activeSkillName?: string
): string {
  const parts: string[] = [];
  
  // Base system prompt
  parts.push(basePrompt);
  
  // Available skills metadata (always included)
  parts.push('\n\n## Available Skills\n');
  parts.push('You have access to the following specialized skills for meta-analysis and systematic review tasks:\n');
  parts.push(buildAvailableSkillsXML());
  
  // Skill activation instructions
  parts.push(`
When a user's request matches a skill's description, activate that skill by following its instructions.
You can use multiple skills together when needed (e.g., data extraction followed by meta-analysis).
`);
  
  // Active skill instructions (if specified)
  if (activeSkillName) {
    const skill = getSkillByName(activeSkillName);
    if (skill) {
      parts.push(`\n\n## Active Skill: ${skill.metadata.name}\n`);
      parts.push(skill.instructions);
    }
  }
  
  return parts.join('');
}

/**
 * Get full instructions for a specific skill
 */
export function getSkillInstructions(skillName: string): string | undefined {
  const skill = getSkillByName(skillName);
  return skill?.instructions;
}

/**
 * Match user query to relevant skills
 * Returns skills sorted by relevance
 */
export function matchSkillsToQuery(query: string): SkillDefinition[] {
  const lowerQuery = query.toLowerCase();
  const keywords = extractKeywords(lowerQuery);
  
  const scored = Object.values(SKILL_DEFINITIONS).map(skill => {
    let score = 0;
    const desc = skill.metadata.description.toLowerCase();
    const name = skill.metadata.name.toLowerCase();
    
    // Exact name match
    if (lowerQuery.includes(name.replace(/-/g, ' '))) {
      score += 10;
    }
    
    // Keyword matches in description
    for (const keyword of keywords) {
      if (desc.includes(keyword)) {
        score += 2;
      }
      if (name.includes(keyword)) {
        score += 3;
      }
    }
    
    // Specific trigger phrases
    const triggers: Record<string, string[]> = {
      'meta-analysis-core': ['meta-analysis', 'pool', 'combine studies', 'synthesize', 'effect size'],
      'data-extraction': ['extract data', 'extraction form', 'study characteristics', 'collect data'],
      'risk-of-bias': ['risk of bias', 'rob', 'quality assessment', 'bias assessment', 'robins'],
      'heterogeneity-analysis': ['heterogeneity', 'i-squared', 'i²', 'tau-squared', 'subgroup', 'meta-regression'],
      'publication-bias': ['publication bias', 'funnel plot', 'egger', 'trim and fill', 'reporting bias'],
      'forest-plot': ['forest plot', 'visualize', 'plot results', 'create figure'],
      'teaching-meta-analysis': ['explain', 'teach', 'learn', 'what is', 'how does', 'understand', 'concept'],
      'r-code-generation': ['r code', 'script', 'metafor', 'generate code', 'write code'],
    };
    
    const skillTriggers = triggers[skill.id] || [];
    for (const trigger of skillTriggers) {
      if (lowerQuery.includes(trigger)) {
        score += 5;
      }
    }
    
    return { skill, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.skill);
}

/**
 * Build context-aware system prompt based on user query
 * Automatically activates relevant skills
 */
export function buildContextAwarePrompt(
  basePrompt: string,
  userQuery: string
): string {
  const matchedSkills = matchSkillsToQuery(userQuery);
  
  const parts: string[] = [];
  
  // Base system prompt
  parts.push(basePrompt);
  
  // Available skills metadata
  parts.push('\n\n## Available Skills\n');
  parts.push('You have access to specialized skills for meta-analysis and systematic review tasks:\n');
  parts.push(buildAvailableSkillsXML());
  
  // Activated skills (top matches)
  if (matchedSkills.length > 0) {
    // Include top 2 most relevant skills
    const activeSkills = matchedSkills.slice(0, 2);
    
    parts.push('\n\n## Activated Skills\n');
    parts.push('Based on the user\'s request, the following skills are activated:\n');
    
    for (const skill of activeSkills) {
      parts.push(`\n### ${skill.metadata.name}\n`);
      parts.push(skill.instructions);
    }
  }
  
  // General instructions
  parts.push(`

## Response Guidelines

1. Use the activated skills to provide expert assistance
2. Generate R code using metafor package when appropriate
3. Explain concepts clearly when teaching
4. Provide step-by-step guidance for complex tasks
5. Reference Cochrane methodology and best practices
6. Be precise with statistical terminology
`);
  
  return parts.join('');
}

/**
 * Extract keywords from query
 */
function extractKeywords(query: string): string[] {
  // Remove common words
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'about',
    'against', 'both', 'any', 'this', 'that', 'these', 'those', 'what',
    'which', 'who', 'whom', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
    'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
    'please', 'help', 'want', 'need', 'like', 'know', 'think', 'make',
  ]);
  
  return query
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9-]/g, ''))
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
