/**
 * AgentSkills Definitions
 * 
 * Comprehensive skill definitions following the AgentSkills specification.
 * These skills are injected into all LLM providers to ensure consistent
 * meta-analysis and teaching capabilities across models.
 * 
 * Format: YAML frontmatter + Markdown body (AgentSkills spec compliant)
 * @see https://agentskills.io/specification
 */

export { SKILLS_METADATA, SKILL_DEFINITIONS, getSkillByName, getAllSkills } from './definitions';
export { buildAvailableSkillsXML, buildSystemPromptWithSkills, getSkillInstructions } from './prompt-builder';
export type { SkillDefinition, SkillMetadata } from './types';
