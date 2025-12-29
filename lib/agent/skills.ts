/**
 * Skills System
 * Domain-specific capabilities for the agent
 */

import { Skill, SkillTool } from "./types";

// Research skill
const researchSkill: Skill = {
  name: "research",
  description: "Search and analyze information from various sources",
  triggers: ["search", "find", "lookup", "research", "what is", "who is", "when did"],
  tools: [
    {
      name: "web_search",
      description: "Search the web for information",
      handler: async (args) => {
        // This would be handled by the AI backend
        return { type: "delegated", message: "Search delegated to AI" };
      },
    },
  ],
};

// Analysis skill
const analysisSkill: Skill = {
  name: "analysis",
  description: "Perform data analysis and generate insights",
  triggers: ["analyze", "analysis", "compare", "statistics", "calculate", "compute"],
  tools: [
    {
      name: "data_analysis",
      description: "Analyze data and provide insights",
      handler: async (args) => {
        return { type: "delegated", message: "Analysis delegated to AI" };
      },
    },
  ],
};

// Writing skill
const writingSkill: Skill = {
  name: "writing",
  description: "Help with writing, editing, and summarization",
  triggers: ["write", "draft", "edit", "summarize", "rewrite", "proofread", "compose"],
  tools: [
    {
      name: "text_generation",
      description: "Generate or edit text content",
      handler: async (args) => {
        return { type: "delegated", message: "Writing delegated to AI" };
      },
    },
  ],
};

// Code skill
const codeSkill: Skill = {
  name: "code",
  description: "Assist with coding tasks and explanations",
  triggers: ["code", "program", "function", "debug", "implement", "fix bug", "explain code"],
  tools: [
    {
      name: "code_assistance",
      description: "Help with coding tasks",
      handler: async (args) => {
        return { type: "delegated", message: "Code assistance delegated to AI" };
      },
    },
  ],
};

// Tools skill
const toolsSkill: Skill = {
  name: "tools",
  description: "Execute various utility functions",
  triggers: ["convert", "format", "transform", "generate", "create"],
  tools: [
    {
      name: "utility",
      description: "Execute utility functions",
      handler: async (args) => {
        return { type: "delegated", message: "Utility delegated to AI" };
      },
    },
  ],
};

// All available skills
export const availableSkills: Skill[] = [
  researchSkill,
  analysisSkill,
  writingSkill,
  codeSkill,
  toolsSkill,
];

/**
 * Skill Registry
 * Manages and matches skills based on user input
 */
export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  constructor() {
    // Register default skills
    for (const skill of availableSkills) {
      this.register(skill);
    }
  }

  /**
   * Register a skill
   */
  register(skill: Skill): void {
    this.skills.set(skill.name, skill);
  }

  /**
   * Get a skill by name
   */
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all registered skills
   */
  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Find skills that match a user message
   */
  matchSkills(message: string): Skill[] {
    const lowerMessage = message.toLowerCase();
    const matched: Skill[] = [];

    for (const skill of this.skills.values()) {
      for (const trigger of skill.triggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          matched.push(skill);
          break;
        }
      }
    }

    return matched;
  }

  /**
   * Get skill descriptions for display
   */
  getSkillDescriptions(): string {
    const descriptions: string[] = [];

    for (const skill of this.skills.values()) {
      descriptions.push(`📌 ${skill.name}: ${skill.description}`);
    }

    return descriptions.join("\n");
  }

  /**
   * Check if a skill exists
   */
  has(name: string): boolean {
    return this.skills.has(name);
  }
}

// Singleton instance
let registryInstance: SkillRegistry | null = null;

export function getSkillRegistry(): SkillRegistry {
  if (!registryInstance) {
    registryInstance = new SkillRegistry();
  }
  return registryInstance;
}
