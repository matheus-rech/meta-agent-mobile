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

// R/Statistical Analysis skill
const rStatisticsSkill: Skill = {
  name: "r-statistics",
  description: "Execute R code for statistical analysis and visualization",
  triggers: ["r code", "run r", "execute r", "rscript", "r script", "statistical analysis"],
  tools: [
    {
      name: "r_execute",
      description: "Execute arbitrary R code",
      handler: async (args) => {
        return { type: "r_execute", message: "R code execution", params: args };
      },
    },
    {
      name: "r_status",
      description: "Check R environment status",
      handler: async (args) => {
        return { type: "r_status", message: "Check R environment" };
      },
    },
  ],
};

// Meta-Analysis skill
const metaAnalysisSkill: Skill = {
  name: "meta-analysis",
  description: "Run meta-analyses with forest plots, funnel plots, and statistical summaries",
  triggers: [
    "meta-analysis", "meta analysis", "metaanalysis",
    "forest plot", "funnel plot",
    "pooled effect", "heterogeneity",
    "systematic review", "effect size",
    "odds ratio", "risk ratio", "mean difference",
    "i-squared", "i2", "tau-squared", "tau2"
  ],
  tools: [
    {
      name: "meta_binary",
      description: "Run meta-analysis for binary outcomes (events/totals)",
      handler: async (args) => {
        return { type: "meta_analysis", subtype: "binary", params: args };
      },
    },
    {
      name: "meta_continuous",
      description: "Run meta-analysis for continuous outcomes (means/SDs)",
      handler: async (args) => {
        return { type: "meta_analysis", subtype: "continuous", params: args };
      },
    },
    {
      name: "meta_proportion",
      description: "Run meta-analysis for proportions",
      handler: async (args) => {
        return { type: "meta_analysis", subtype: "proportion", params: args };
      },
    },
    {
      name: "forest_plot",
      description: "Generate a forest plot from meta-analysis data",
      handler: async (args) => {
        return { type: "forest_plot", params: args };
      },
    },
    {
      name: "funnel_plot",
      description: "Generate a funnel plot for publication bias assessment",
      handler: async (args) => {
        return { type: "funnel_plot", params: args };
      },
    },
  ],
};

// PRISMA/Systematic Review skill
const systematicReviewSkill: Skill = {
  name: "systematic-review",
  description: "Support systematic review workflow including PRISMA diagrams and risk of bias",
  triggers: [
    "prisma", "prisma diagram", "flow diagram",
    "risk of bias", "rob", "quality assessment",
    "screening", "inclusion criteria", "exclusion criteria",
    "grade assessment", "evidence quality"
  ],
  tools: [
    {
      name: "prisma_diagram",
      description: "Generate PRISMA flow diagram",
      handler: async (args) => {
        return { type: "prisma_diagram", params: args };
      },
    },
    {
      name: "risk_of_bias",
      description: "Assess risk of bias using standard tools",
      handler: async (args) => {
        return { type: "risk_of_bias", params: args };
      },
    },
  ],
};

// Data Visualization skill
const dataVisualizationSkill: Skill = {
  name: "visualization",
  description: "Create data visualizations and plots using R",
  triggers: [
    "plot", "chart", "graph", "visualize", "visualization",
    "histogram", "scatter plot", "bar chart", "box plot",
    "ggplot", "ggplot2"
  ],
  tools: [
    {
      name: "r_plot",
      description: "Generate plots using R/ggplot2",
      handler: async (args) => {
        return { type: "r_plot", params: args };
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
  rStatisticsSkill,
  metaAnalysisSkill,
  systematicReviewSkill,
  dataVisualizationSkill,
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
      const emoji = getSkillEmoji(skill.name);
      descriptions.push(`${emoji} ${skill.name}: ${skill.description}`);
    }

    return descriptions.join("\n");
  }

  /**
   * Check if a skill exists
   */
  has(name: string): boolean {
    return this.skills.has(name);
  }

  /**
   * Get R-related skills
   */
  getRSkills(): Skill[] {
    return this.getAll().filter(s => 
      s.name === "r-statistics" || 
      s.name === "meta-analysis" || 
      s.name === "systematic-review" ||
      s.name === "visualization"
    );
  }
}

/**
 * Get emoji for skill
 */
function getSkillEmoji(skillName: string): string {
  const emojiMap: Record<string, string> = {
    "research": "🔍",
    "analysis": "📊",
    "writing": "✍️",
    "code": "💻",
    "tools": "🔧",
    "r-statistics": "📈",
    "meta-analysis": "🔬",
    "systematic-review": "📋",
    "visualization": "📉",
  };
  return emojiMap[skillName] || "📌";
}

// Singleton instance
let registryInstance: SkillRegistry | null = null;

export function getSkillRegistry(): SkillRegistry {
  if (!registryInstance) {
    registryInstance = new SkillRegistry();
  }
  return registryInstance;
}
