/**
 * AgentSkills Type Definitions
 * 
 * Types following the AgentSkills specification.
 * @see https://agentskills.io/specification
 */

/**
 * Skill metadata from YAML frontmatter
 * Required fields: name, description
 * Optional fields: license, compatibility, metadata, allowed-tools
 */
export interface SkillMetadata {
  /** Skill name (1-64 chars, lowercase alphanumeric + hyphens) */
  name: string;
  /** Description of what the skill does and when to use it (1-1024 chars) */
  description: string;
  /** License information */
  license?: string;
  /** Environment requirements */
  compatibility?: string;
  /** Additional metadata key-value pairs */
  metadata?: Record<string, string>;
  /** Pre-approved tools (experimental) */
  allowedTools?: string[];
}

/**
 * Complete skill definition
 */
export interface SkillDefinition {
  /** Unique skill identifier */
  id: string;
  /** Skill metadata from frontmatter */
  metadata: SkillMetadata;
  /** Full SKILL.md content */
  content: string;
  /** Parsed instructions (body after frontmatter) */
  instructions: string;
  /** Optional reference files */
  references?: SkillReference[];
}

/**
 * Reference file for a skill
 */
export interface SkillReference {
  /** Reference file name */
  name: string;
  /** Reference content */
  content: string;
}

/**
 * Skill activation context
 */
export interface SkillContext {
  /** Currently active skill */
  activeSkill?: SkillDefinition;
  /** Loaded reference files */
  loadedReferences: Map<string, string>;
  /** User's query that triggered the skill */
  triggerQuery?: string;
}
