/**
 * Skills System
 * Domain-specific capabilities for the agent based on meta-agent SKILL.md implementations
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

// Meta-Analysis skill (from meta-analysis/SKILL.md)
const metaAnalysisSkill: Skill = {
  name: "meta-analysis",
  description: "Run meta-analyses with forest plots, funnel plots, heterogeneity assessment, and publication bias tests",
  triggers: [
    "meta-analysis", "meta analysis", "metaanalysis",
    "forest plot", "funnel plot",
    "pooled effect", "heterogeneity",
    "systematic review", "effect size",
    "odds ratio", "risk ratio", "mean difference",
    "i-squared", "i2", "tau-squared", "tau2",
    "random effects", "fixed effects",
    "publication bias", "egger", "trim-and-fill",
    "sensitivity analysis", "leave-one-out",
    "subgroup analysis", "meta-regression"
  ],
  tools: [
    {
      name: "meta_binary",
      description: "Meta-analysis for binary outcomes (OR, RR, RD) using events and totals",
      handler: async (args) => {
        return { type: "meta_analysis", subtype: "binary", params: args };
      },
    },
    {
      name: "meta_continuous",
      description: "Meta-analysis for continuous outcomes (MD, SMD) using means and SDs",
      handler: async (args) => {
        return { type: "meta_analysis", subtype: "continuous", params: args };
      },
    },
    {
      name: "meta_proportion",
      description: "Meta-analysis for single proportions using Freeman-Tukey transformation",
      handler: async (args) => {
        return { type: "meta_analysis", subtype: "proportion", params: args };
      },
    },
    {
      name: "meta_survival",
      description: "Meta-analysis for survival outcomes using hazard ratios",
      handler: async (args) => {
        return { type: "meta_analysis", subtype: "survival", params: args };
      },
    },
    {
      name: "forest_plot",
      description: "Generate forest plot with pooled estimate, prediction interval, and heterogeneity stats",
      handler: async (args) => {
        return { type: "forest_plot", params: args };
      },
    },
    {
      name: "funnel_plot",
      description: "Generate funnel plot with contour enhancement for publication bias assessment",
      handler: async (args) => {
        return { type: "funnel_plot", params: args };
      },
    },
    {
      name: "heterogeneity_assessment",
      description: "Calculate I², τ², H², Q-statistic, and prediction intervals",
      handler: async (args) => {
        return { type: "heterogeneity", params: args };
      },
    },
    {
      name: "publication_bias",
      description: "Run Egger's test, Peters' test, and trim-and-fill analysis",
      handler: async (args) => {
        return { type: "publication_bias", params: args };
      },
    },
    {
      name: "sensitivity_analysis",
      description: "Leave-one-out analysis, influence diagnostics, and cumulative meta-analysis",
      handler: async (args) => {
        return { type: "sensitivity", params: args };
      },
    },
    {
      name: "subgroup_analysis",
      description: "Subgroup meta-analysis with test for interaction",
      handler: async (args) => {
        return { type: "subgroup", params: args };
      },
    },
  ],
};

// Data Extraction skill (from data-extraction/SKILL.md)
const dataExtractionSkill: Skill = {
  name: "data-extraction",
  description: "Extract and structure data from studies for systematic reviews",
  triggers: [
    "extract data", "data extraction",
    "study characteristics", "baseline characteristics",
    "outcome data", "extract outcomes",
    "2x2 table", "contingency table",
    "mean", "standard deviation", "median", "iqr",
    "convert median", "convert se", "convert ci"
  ],
  tools: [
    {
      name: "extract_study_characteristics",
      description: "Extract study design, setting, country, sample size, and follow-up",
      handler: async (args) => {
        return { type: "extract", subtype: "study_characteristics", params: args };
      },
    },
    {
      name: "extract_population",
      description: "Extract demographics, inclusion/exclusion criteria, and baseline characteristics",
      handler: async (args) => {
        return { type: "extract", subtype: "population", params: args };
      },
    },
    {
      name: "extract_intervention",
      description: "Extract intervention details, dosage, duration, and comparator",
      handler: async (args) => {
        return { type: "extract", subtype: "intervention", params: args };
      },
    },
    {
      name: "extract_outcomes",
      description: "Extract outcome definitions, measurement tools, and timing",
      handler: async (args) => {
        return { type: "extract", subtype: "outcomes", params: args };
      },
    },
    {
      name: "convert_statistics",
      description: "Convert median/IQR to mean/SD, SE to SD, CI to SD (Wan et al. method)",
      handler: async (args) => {
        return { type: "convert_stats", params: args };
      },
    },
  ],
};

// Risk of Bias skill (from risk-of-bias/SKILL.md)
const riskOfBiasSkill: Skill = {
  name: "risk-of-bias",
  description: "Assess risk of bias using RoB 2, Newcastle-Ottawa Scale, and ROBINS-I",
  triggers: [
    "risk of bias", "rob", "rob2", "rob 2",
    "quality assessment", "study quality",
    "newcastle-ottawa", "newcastle ottawa", "nos",
    "robins-i", "robins i",
    "bias assessment", "methodological quality",
    "traffic light plot", "rob summary"
  ],
  tools: [
    {
      name: "assess_rob2",
      description: "RoB 2 assessment for randomized controlled trials (5 domains)",
      handler: async (args) => {
        return { type: "rob", subtype: "rob2", params: args };
      },
    },
    {
      name: "assess_nos",
      description: "Newcastle-Ottawa Scale for cohort and case-control studies (0-9 stars)",
      handler: async (args) => {
        return { type: "rob", subtype: "nos", params: args };
      },
    },
    {
      name: "assess_robins_i",
      description: "ROBINS-I for non-randomized studies of interventions (7 domains)",
      handler: async (args) => {
        return { type: "rob", subtype: "robins_i", params: args };
      },
    },
    {
      name: "generate_rob_plots",
      description: "Generate traffic light and summary plots using robvis",
      handler: async (args) => {
        return { type: "rob_plots", params: args };
      },
    },
  ],
};

// Network Meta-Analysis skill (from network-meta-analysis/SKILL.md)
const networkMetaAnalysisSkill: Skill = {
  name: "network-meta-analysis",
  description: "Compare multiple treatments with network plots, league tables, and rankings",
  triggers: [
    "network meta-analysis", "nma",
    "multiple treatments", "indirect comparison",
    "mixed treatment comparison",
    "network plot", "league table",
    "sucra", "p-score", "ranking",
    "consistency", "transitivity",
    "netmeta", "gemtc"
  ],
  tools: [
    {
      name: "run_nma",
      description: "Run network meta-analysis comparing multiple treatments",
      handler: async (args) => {
        return { type: "nma", subtype: "run", params: args };
      },
    },
    {
      name: "generate_network_plot",
      description: "Generate network geometry plot showing treatment comparisons",
      handler: async (args) => {
        return { type: "nma", subtype: "network_plot", params: args };
      },
    },
    {
      name: "generate_league_table",
      description: "Generate league table of all pairwise comparisons",
      handler: async (args) => {
        return { type: "nma", subtype: "league_table", params: args };
      },
    },
    {
      name: "rank_treatments",
      description: "Calculate SUCRA/P-scores and generate rankograms",
      handler: async (args) => {
        return { type: "nma", subtype: "ranking", params: args };
      },
    },
    {
      name: "assess_consistency",
      description: "Assess local and global consistency (node-splitting)",
      handler: async (args) => {
        return { type: "nma", subtype: "consistency", params: args };
      },
    },
  ],
};

// Trial Sequential Analysis skill (from tsa-integration/SKILL.md)
const tsaSkill: Skill = {
  name: "trial-sequential-analysis",
  description: "Perform TSA with information size calculations and monitoring boundaries",
  triggers: [
    "trial sequential analysis", "tsa",
    "information size", "required information size", "ris",
    "cumulative z-score", "z-curve",
    "monitoring boundaries", "o'brien-fleming", "obf",
    "futility", "alpha spending",
    "conclusive evidence", "sufficient power"
  ],
  tools: [
    {
      name: "calculate_ris",
      description: "Calculate Required Information Size for meta-analysis",
      handler: async (args) => {
        return { type: "tsa", subtype: "ris", params: args };
      },
    },
    {
      name: "generate_tsa_plot",
      description: "Generate TSA plot with O'Brien-Fleming boundaries",
      handler: async (args) => {
        return { type: "tsa", subtype: "plot", params: args };
      },
    },
    {
      name: "interpret_tsa",
      description: "Interpret TSA results (conclusive/inconclusive)",
      handler: async (args) => {
        return { type: "tsa", subtype: "interpret", params: args };
      },
    },
  ],
};

// Manuscript Writing skill (from manuscript-writing/SKILL.md)
const manuscriptWritingSkill: Skill = {
  name: "manuscript-writing",
  description: "Draft PRISMA 2020-compliant manuscript sections for systematic reviews",
  triggers: [
    "write manuscript", "draft manuscript",
    "methods section", "results section", "discussion",
    "abstract", "introduction",
    "prisma", "prisma 2020",
    "journal submission", "manuscript draft"
  ],
  tools: [
    {
      name: "draft_abstract",
      description: "Generate structured abstract with background, methods, results, conclusions",
      handler: async (args) => {
        return { type: "manuscript", subtype: "abstract", params: args };
      },
    },
    {
      name: "draft_introduction",
      description: "Draft introduction with rationale and objectives (PRISMA items 3-4)",
      handler: async (args) => {
        return { type: "manuscript", subtype: "introduction", params: args };
      },
    },
    {
      name: "draft_methods",
      description: "Draft methods section covering PRISMA items 5-16",
      handler: async (args) => {
        return { type: "manuscript", subtype: "methods", params: args };
      },
    },
    {
      name: "draft_results",
      description: "Draft results section covering PRISMA items 17-23",
      handler: async (args) => {
        return { type: "manuscript", subtype: "results", params: args };
      },
    },
    {
      name: "draft_discussion",
      description: "Draft discussion with evidence summary, limitations, and conclusions",
      handler: async (args) => {
        return { type: "manuscript", subtype: "discussion", params: args };
      },
    },
  ],
};

// Neurosurgery Literature Search skill (from neurosurgery-literature/SKILL.md)
const neurosurgeryLiteratureSkill: Skill = {
  name: "neurosurgery-literature",
  description: "Domain-specific literature search for neurosurgery systematic reviews",
  triggers: [
    "neurosurgery", "neurosurgical",
    "vascular neurosurgery", "aneurysm", "avm", "stroke",
    "neuro-oncology", "glioma", "glioblastoma", "meningioma",
    "spine surgery", "acdf", "laminectomy", "fusion",
    "functional neurosurgery", "dbs", "deep brain stimulation",
    "pediatric neurosurgery", "hydrocephalus", "chiari",
    "trauma", "tbi", "traumatic brain injury",
    "mesh terms", "pubmed search", "search strategy"
  ],
  tools: [
    {
      name: "build_search_strategy",
      description: "Build PICO-based search strategy with MeSH terms and free text",
      handler: async (args) => {
        return { type: "literature", subtype: "search_strategy", params: args };
      },
    },
    {
      name: "get_mesh_terms",
      description: "Get relevant MeSH terms for neurosurgery conditions and procedures",
      handler: async (args) => {
        return { type: "literature", subtype: "mesh_terms", params: args };
      },
    },
    {
      name: "get_outcome_scales",
      description: "Get outcome scales reference (GCS, GOS, mRS, KPS, ODI, etc.)",
      handler: async (args) => {
        return { type: "literature", subtype: "outcome_scales", params: args };
      },
    },
  ],
};

// PRISMA/Systematic Review skill
const systematicReviewSkill: Skill = {
  name: "systematic-review",
  description: "Support systematic review workflow including PRISMA diagrams and GRADE assessment",
  triggers: [
    "prisma", "prisma diagram", "flow diagram",
    "screening", "inclusion criteria", "exclusion criteria",
    "grade assessment", "evidence quality", "certainty of evidence",
    "prospero", "protocol registration"
  ],
  tools: [
    {
      name: "prisma_diagram",
      description: "Generate PRISMA 2020 flow diagram data",
      handler: async (args) => {
        return { type: "prisma_diagram", params: args };
      },
    },
    {
      name: "grade_assessment",
      description: "Assess certainty of evidence using GRADE approach",
      handler: async (args) => {
        return { type: "grade", params: args };
      },
    },
  ],
};

// Data Visualization skill
const dataVisualizationSkill: Skill = {
  name: "visualization",
  description: "Create data visualizations and plots using R/ggplot2",
  triggers: [
    "plot", "chart", "graph", "visualize", "visualization",
    "histogram", "scatter plot", "bar chart", "box plot",
    "ggplot", "ggplot2", "dplyr", "tidyverse"
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
  dataExtractionSkill,
  riskOfBiasSkill,
  networkMetaAnalysisSkill,
  tsaSkill,
  manuscriptWritingSkill,
  neurosurgeryLiteratureSkill,
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
      descriptions.push(`${emoji} **${skill.name}**: ${skill.description}`);
    }

    return descriptions.join("\n");
  }

  /**
   * Get detailed skill info
   */
  getSkillDetails(name: string): string | null {
    const skill = this.skills.get(name);
    if (!skill) return null;

    const emoji = getSkillEmoji(name);
    const tools = (skill.tools || []).map(t => `  • ${t.name}: ${t.description}`).join("\n");
    const triggers = skill.triggers.slice(0, 5).join(", ");

    return `${emoji} **${skill.name}**\n${skill.description}\n\n**Tools:**\n${tools}\n\n**Triggers:** ${triggers}...`;
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
      s.name === "data-extraction" ||
      s.name === "risk-of-bias" ||
      s.name === "network-meta-analysis" ||
      s.name === "trial-sequential-analysis" ||
      s.name === "systematic-review" ||
      s.name === "visualization"
    );
  }

  /**
   * Get systematic review workflow skills
   */
  getSystematicReviewSkills(): Skill[] {
    return this.getAll().filter(s =>
      s.name === "data-extraction" ||
      s.name === "risk-of-bias" ||
      s.name === "meta-analysis" ||
      s.name === "network-meta-analysis" ||
      s.name === "trial-sequential-analysis" ||
      s.name === "manuscript-writing" ||
      s.name === "systematic-review"
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
    "data-extraction": "📋",
    "risk-of-bias": "⚖️",
    "network-meta-analysis": "🕸️",
    "trial-sequential-analysis": "📉",
    "manuscript-writing": "📝",
    "neurosurgery-literature": "🧠",
    "systematic-review": "📚",
    "visualization": "📊",
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
