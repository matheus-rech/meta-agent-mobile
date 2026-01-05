/**
 * AgentSkills Loader
 * 
 * Loads and parses SKILL.md files following the AgentSkills format.
 * This is a TypeScript implementation that reads the skill definitions
 * without requiring the Python Mini-Agent framework.
 * 
 * AgentSkills Format (SKILL.md):
 * - YAML frontmatter with metadata
 * - Markdown body with instructions
 * - Optional sections for examples, tools, and references
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
  requires?: string[];
  tools?: string[];
  models?: string[];
  priority?: number;
  enabled?: boolean;
}

/**
 * Parsed skill definition
 */
export interface Skill {
  id: string;
  metadata: SkillMetadata;
  instructions: string;
  examples?: SkillExample[];
  tools?: SkillTool[];
  references?: SkillReference[];
  rawContent: string;
}

/**
 * Example usage of the skill
 */
export interface SkillExample {
  title: string;
  input: string;
  output: string;
  explanation?: string;
}

/**
 * Tool that the skill can use
 */
export interface SkillTool {
  name: string;
  description: string;
  parameters?: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
}

/**
 * Reference material for the skill
 */
export interface SkillReference {
  title: string;
  url?: string;
  citation?: string;
  content?: string;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseYamlFrontmatter(content: string): { metadata: Record<string, unknown>; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const yamlContent = match[1];
  const body = match[2];
  
  // Simple YAML parser for basic key-value pairs and arrays
  const metadata: Record<string, unknown> = {};
  const lines = yamlContent.split('\n');
  let currentKey = '';
  let currentArray: string[] | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Check for array item
    if (trimmed.startsWith('- ') && currentArray !== null) {
      currentArray.push(trimmed.slice(2).trim());
      continue;
    }
    
    // Check for key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      // Save previous array if exists
      if (currentArray !== null && currentKey) {
        metadata[currentKey] = currentArray;
        currentArray = null;
      }
      
      currentKey = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      
      if (value === '') {
        // Start of array or nested object
        currentArray = [];
      } else {
        // Simple value
        metadata[currentKey] = parseYamlValue(value);
        currentKey = '';
      }
    }
  }
  
  // Save final array if exists
  if (currentArray !== null && currentKey) {
    metadata[currentKey] = currentArray;
  }
  
  return { metadata, body };
}

/**
 * Parse a YAML value (string, number, boolean)
 */
function parseYamlValue(value: string): string | number | boolean {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Number
  const num = Number(value);
  if (!isNaN(num)) return num;
  
  return value;
}

/**
 * Parse examples section from markdown
 */
function parseExamples(content: string): SkillExample[] {
  const examples: SkillExample[] = [];
  const exampleRegex = /### Example[:\s]*([^\n]*)\n([\s\S]*?)(?=### Example|## |$)/gi;
  
  let match;
  while ((match = exampleRegex.exec(content)) !== null) {
    const title = match[1].trim() || 'Example';
    const body = match[2];
    
    // Extract input and output
    const inputMatch = body.match(/\*\*Input[:\s]*\*\*\s*\n```[^\n]*\n([\s\S]*?)```/i);
    const outputMatch = body.match(/\*\*Output[:\s]*\*\*\s*\n```[^\n]*\n([\s\S]*?)```/i);
    const explanationMatch = body.match(/\*\*Explanation[:\s]*\*\*\s*\n([\s\S]*?)(?=\*\*|$)/i);
    
    examples.push({
      title,
      input: inputMatch?.[1]?.trim() || '',
      output: outputMatch?.[1]?.trim() || '',
      explanation: explanationMatch?.[1]?.trim(),
    });
  }
  
  return examples;
}

/**
 * Parse tools section from markdown
 */
function parseTools(content: string): SkillTool[] {
  const tools: SkillTool[] = [];
  const toolsSection = content.match(/## Tools\n([\s\S]*?)(?=## |$)/i);
  
  if (!toolsSection) return tools;
  
  const toolRegex = /### (\w+)\n([\s\S]*?)(?=### |## |$)/gi;
  let match;
  
  while ((match = toolRegex.exec(toolsSection[1])) !== null) {
    const name = match[1];
    const body = match[2];
    
    // Extract description
    const descMatch = body.match(/^([^\n]+)/);
    const description = descMatch?.[1]?.trim() || '';
    
    tools.push({ name, description });
  }
  
  return tools;
}

/**
 * Parse references section from markdown
 */
function parseReferences(content: string): SkillReference[] {
  const references: SkillReference[] = [];
  const refsSection = content.match(/## References\n([\s\S]*?)(?=## |$)/i);
  
  if (!refsSection) return references;
  
  // Parse bullet list of references
  const refRegex = /- \[([^\]]+)\]\(([^)]+)\)(?:\s*-\s*(.*))?/g;
  let match;
  
  while ((match = refRegex.exec(refsSection[1])) !== null) {
    references.push({
      title: match[1],
      url: match[2],
      citation: match[3],
    });
  }
  
  // Also parse plain text references
  const plainRefRegex = /- ([^[\n]+)(?:\n|$)/g;
  while ((match = plainRefRegex.exec(refsSection[1])) !== null) {
    if (!match[1].startsWith('[')) {
      references.push({
        title: match[1].trim(),
      });
    }
  }
  
  return references;
}

/**
 * Parse a SKILL.md file content into a Skill object
 */
export function parseSkillFile(content: string, id: string): Skill {
  const { metadata, body } = parseYamlFrontmatter(content);
  
  // Extract instructions (everything before ## sections)
  const instructionsMatch = body.match(/^([\s\S]*?)(?=## |$)/);
  const instructions = instructionsMatch?.[1]?.trim() || body;
  
  // Parse sections
  const examples = parseExamples(body);
  const tools = parseTools(body);
  const references = parseReferences(body);
  
  return {
    id,
    metadata: {
      name: (metadata.name as string) || id,
      version: (metadata.version as string) || '1.0.0',
      description: (metadata.description as string) || '',
      author: metadata.author as string | undefined,
      tags: metadata.tags as string[] | undefined,
      requires: metadata.requires as string[] | undefined,
      tools: metadata.tools as string[] | undefined,
      models: metadata.models as string[] | undefined,
      priority: metadata.priority as number | undefined,
      enabled: metadata.enabled !== false,
    },
    instructions,
    examples: examples.length > 0 ? examples : undefined,
    tools: tools.length > 0 ? tools : undefined,
    references: references.length > 0 ? references : undefined,
    rawContent: content,
  };
}

/**
 * Skills registry for managing loaded skills
 */
export class SkillsRegistry {
  private skills: Map<string, Skill> = new Map();
  private storageKey = 'agent_skills_registry';
  
  /**
   * Register a skill
   */
  register(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }
  
  /**
   * Register a skill from SKILL.md content
   */
  registerFromContent(content: string, id: string): Skill {
    const skill = parseSkillFile(content, id);
    this.register(skill);
    return skill;
  }
  
  /**
   * Get a skill by ID
   */
  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }
  
  /**
   * Get all registered skills
   */
  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }
  
  /**
   * Get enabled skills
   */
  getEnabled(): Skill[] {
    return this.getAll().filter(s => s.metadata.enabled !== false);
  }
  
  /**
   * Get skills by tag
   */
  getByTag(tag: string): Skill[] {
    return this.getAll().filter(s => s.metadata.tags?.includes(tag));
  }
  
  /**
   * Search skills by query
   */
  search(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(s => 
      s.metadata.name.toLowerCase().includes(lowerQuery) ||
      s.metadata.description.toLowerCase().includes(lowerQuery) ||
      s.metadata.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }
  
  /**
   * Build system prompt from enabled skills
   */
  buildSystemPrompt(): string {
    const enabledSkills = this.getEnabled()
      .sort((a, b) => (b.metadata.priority || 0) - (a.metadata.priority || 0));
    
    if (enabledSkills.length === 0) {
      return '';
    }
    
    const sections = enabledSkills.map(skill => {
      let section = `## ${skill.metadata.name}\n\n`;
      section += skill.instructions;
      
      if (skill.references && skill.references.length > 0) {
        section += '\n\n### Key References\n';
        skill.references.forEach(ref => {
          section += `- ${ref.title}`;
          if (ref.url) section += ` (${ref.url})`;
          section += '\n';
        });
      }
      
      return section;
    });
    
    return `# Agent Skills\n\n${sections.join('\n\n---\n\n')}`;
  }
  
  /**
   * Save registry to persistent storage
   */
  async save(): Promise<void> {
    const data = Array.from(this.skills.entries()).map(([id, skill]) => ({
      id,
      content: skill.rawContent,
    }));
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
  }
  
  /**
   * Load registry from persistent storage
   */
  async load(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        const entries = JSON.parse(data) as Array<{ id: string; content: string }>;
        entries.forEach(({ id, content }) => {
          this.registerFromContent(content, id);
        });
      }
    } catch (error) {
      console.error('Failed to load skills registry:', error);
    }
  }
  
  /**
   * Clear all skills
   */
  clear(): void {
    this.skills.clear();
  }
  
  /**
   * Get count of registered skills
   */
  get count(): number {
    return this.skills.size;
  }
}

// Singleton instance
let registryInstance: SkillsRegistry | null = null;

export function getSkillsRegistry(): SkillsRegistry {
  if (!registryInstance) {
    registryInstance = new SkillsRegistry();
  }
  return registryInstance;
}

/**
 * Load bundled skills from the app
 */
export async function loadBundledSkills(registry: SkillsRegistry): Promise<void> {
  // These are the bundled skills that come with the app
  // In a real implementation, these would be loaded from the assets folder
  const bundledSkills = getBundledSkillDefinitions();
  
  for (const [id, content] of Object.entries(bundledSkills)) {
    registry.registerFromContent(content, id);
  }
}

/**
 * Get bundled skill definitions
 * These are embedded directly in the app for offline access
 */
function getBundledSkillDefinitions(): Record<string, string> {
  return {
    'meta-analysis': META_ANALYSIS_SKILL,
    'data-extraction': DATA_EXTRACTION_SKILL,
    'risk-of-bias': RISK_OF_BIAS_SKILL,
    'forest-plot': FOREST_PLOT_SKILL,
    'funnel-plot': FUNNEL_PLOT_SKILL,
  };
}

// Bundled skill definitions in SKILL.md format
const META_ANALYSIS_SKILL = `---
name: Meta-Analysis
version: 1.0.0
description: Conduct meta-analyses of clinical studies using R and the metafor package
author: Meta Agent Team
tags:
  - statistics
  - meta-analysis
  - evidence-synthesis
requires:
  - r-execution
  - metafor
tools:
  - execute_r
  - generate_forest_plot
priority: 100
---

You are an expert in conducting meta-analyses for systematic reviews. You help researchers synthesize quantitative evidence from multiple studies.

## Core Capabilities

1. **Effect Size Calculation**: Calculate appropriate effect sizes (OR, RR, RD, MD, SMD, correlation) based on study data
2. **Pooled Estimates**: Compute pooled effect estimates using fixed-effect or random-effects models
3. **Heterogeneity Assessment**: Evaluate between-study heterogeneity using I², τ², Q statistic, and prediction intervals
4. **Subgroup Analysis**: Conduct subgroup analyses to explore sources of heterogeneity
5. **Meta-Regression**: Perform meta-regression to examine moderator effects
6. **Sensitivity Analysis**: Conduct leave-one-out and influence diagnostics
7. **Publication Bias**: Assess publication bias using funnel plots, Egger's test, and trim-and-fill

## Workflow

1. First, understand the research question and outcome type (binary, continuous, correlation)
2. Verify the data structure and required variables
3. Calculate effect sizes if not already computed
4. Fit the appropriate meta-analysis model
5. Generate forest plot for visualization
6. Assess heterogeneity and conduct subgroup/meta-regression if needed
7. Evaluate publication bias
8. Summarize findings with interpretation

## R Code Templates

For binary outcomes (OR):
\`\`\`r
library(metafor)
dat <- escalc(measure="OR", ai=events_treat, bi=no_events_treat, 
              ci=events_ctrl, di=no_events_ctrl, data=mydata)
res <- rma(yi, vi, data=dat, method="REML")
summary(res)
forest(res)
\`\`\`

For continuous outcomes (SMD):
\`\`\`r
library(metafor)
dat <- escalc(measure="SMD", m1i=mean_treat, sd1i=sd_treat, n1i=n_treat,
              m2i=mean_ctrl, sd2i=sd_ctrl, n2i=n_ctrl, data=mydata)
res <- rma(yi, vi, data=dat, method="REML")
summary(res)
forest(res)
\`\`\`

## References

- [Cochrane Handbook Chapter 10](https://training.cochrane.org/handbook/current/chapter-10) - Analysing data and undertaking meta-analyses
- [metafor Package Documentation](https://www.metafor-project.org/) - Comprehensive R package for meta-analysis
- DerSimonian R, Laird N (1986). Meta-analysis in clinical trials. Controlled Clinical Trials.
- Higgins JPT, Thompson SG (2002). Quantifying heterogeneity in a meta-analysis. Statistics in Medicine.
`;

const DATA_EXTRACTION_SKILL = `---
name: Data Extraction
version: 1.0.0
description: Extract and organize data from primary studies for systematic reviews
author: Meta Agent Team
tags:
  - data-extraction
  - systematic-review
requires:
  - pdf-reading
tools:
  - read_pdf
  - create_extraction_form
priority: 90
---

You are an expert in extracting data from primary studies for systematic reviews and meta-analyses.

## Data Extraction Principles

1. **Standardization**: Use consistent extraction forms across all studies
2. **Completeness**: Extract all relevant data points, noting missing information
3. **Accuracy**: Double-check extracted values against source
4. **Documentation**: Record page numbers and table/figure references

## Standard Data Points

### Study Characteristics
- First author, year, country
- Study design (RCT, cohort, case-control)
- Setting (hospital, community, etc.)
- Follow-up duration

### Population
- Sample size (total and per group)
- Age (mean, SD, or median, IQR)
- Sex distribution
- Inclusion/exclusion criteria
- Baseline characteristics

### Intervention/Exposure
- Type and description
- Dose, frequency, duration
- Comparison/control details

### Outcomes
- Primary and secondary outcomes
- Measurement methods
- Timing of assessment
- Effect estimates with confidence intervals

## References

- [Cochrane Handbook Chapter 5](https://training.cochrane.org/handbook/current/chapter-05) - Collecting data
`;

const RISK_OF_BIAS_SKILL = `---
name: Risk of Bias Assessment
version: 1.0.0
description: Assess risk of bias in primary studies using validated tools
author: Meta Agent Team
tags:
  - risk-of-bias
  - quality-assessment
  - RoB2
  - ROBINS-I
requires:
  - rob-tools
priority: 85
---

You are an expert in assessing risk of bias in primary studies using validated assessment tools.

## Available Tools

### RoB 2 (for Randomized Trials)
Domains:
1. Randomization process
2. Deviations from intended interventions
3. Missing outcome data
4. Measurement of the outcome
5. Selection of the reported result

Judgments: Low risk, Some concerns, High risk

### ROBINS-I (for Non-Randomized Studies)
Domains:
1. Confounding
2. Selection of participants
3. Classification of interventions
4. Deviations from intended interventions
5. Missing data
6. Measurement of outcomes
7. Selection of the reported result

Judgments: Low, Moderate, Serious, Critical, No information

### Newcastle-Ottawa Scale (for Observational Studies)
Categories:
1. Selection (0-4 stars)
2. Comparability (0-2 stars)
3. Outcome/Exposure (0-3 stars)

## Assessment Process

1. Select appropriate tool based on study design
2. Assess each domain independently
3. Provide supporting rationale with quotes
4. Determine overall risk of bias
5. Generate traffic light visualization

## References

- [RoB 2 Tool](https://www.riskofbias.info/) - Revised Cochrane risk-of-bias tool
- [ROBINS-I Tool](https://www.riskofbias.info/welcome/home/current-version-of-robins-i) - Risk Of Bias In Non-randomised Studies
`;

const FOREST_PLOT_SKILL = `---
name: Forest Plot Generation
version: 1.0.0
description: Generate publication-quality forest plots for meta-analyses
author: Meta Agent Team
tags:
  - visualization
  - forest-plot
  - meta-analysis
requires:
  - r-execution
  - metafor
tools:
  - execute_r
  - save_plot
priority: 80
---

You are an expert in creating publication-quality forest plots for meta-analysis results.

## Forest Plot Components

1. **Study labels**: Author, year on left side
2. **Effect estimates**: Point estimates with confidence intervals
3. **Weight**: Study weights (inverse variance)
4. **Summary diamond**: Pooled effect estimate
5. **Heterogeneity statistics**: I², τ², Q, p-value
6. **Scale**: Appropriate axis with null line

## R Code for Forest Plots

Basic forest plot:
\`\`\`r
library(metafor)
forest(res, 
       slab = paste(author, year, sep=", "),
       header = c("Study", "Effect [95% CI]"),
       xlab = "Odds Ratio",
       refline = 1,
       showweights = TRUE)
\`\`\`

Customized forest plot:
\`\`\`r
forest(res,
       atransf = exp,  # For log-transformed effects
       at = log(c(0.25, 0.5, 1, 2, 4)),
       xlim = c(-16, 6),
       ilab = cbind(n_treat, n_ctrl),
       ilab.xpos = c(-9, -7),
       cex = 0.75,
       header = TRUE)
\`\`\`

## Best Practices

- Use appropriate transformation for effect measure
- Include heterogeneity statistics
- Order studies meaningfully (by year, effect size, or subgroup)
- Use consistent formatting across figures
- Export at high resolution (300+ DPI)
`;

const FUNNEL_PLOT_SKILL = `---
name: Funnel Plot and Publication Bias
version: 1.0.0
description: Assess publication bias using funnel plots and statistical tests
author: Meta Agent Team
tags:
  - publication-bias
  - funnel-plot
  - meta-analysis
requires:
  - r-execution
  - metafor
tools:
  - execute_r
  - save_plot
priority: 75
---

You are an expert in assessing publication bias in meta-analyses.

## Publication Bias Assessment

### Visual Assessment
- Funnel plot: Effect size vs. precision (SE or sample size)
- Asymmetry suggests potential bias
- Consider small-study effects

### Statistical Tests
1. **Egger's test**: Regression test for funnel plot asymmetry
2. **Begg's test**: Rank correlation test
3. **Trim-and-fill**: Imputes missing studies
4. **Selection models**: Vevea-Hedges, Copas models

## R Code

Funnel plot:
\`\`\`r
library(metafor)
funnel(res, main = "Funnel Plot")
\`\`\`

Egger's test:
\`\`\`r
regtest(res, model = "lm")
\`\`\`

Trim-and-fill:
\`\`\`r
tf <- trimfill(res)
funnel(tf)
\`\`\`

## Interpretation Guidelines

- Asymmetry ≠ publication bias (could be heterogeneity, chance)
- Tests have low power with few studies (<10)
- Consider multiple methods
- Report limitations in interpretation

## References

- Egger M et al. (1997). Bias in meta-analysis detected by a simple, graphical test. BMJ.
- Sterne JAC et al. (2011). Recommendations for examining and interpreting funnel plot asymmetry. BMJ.
`;
