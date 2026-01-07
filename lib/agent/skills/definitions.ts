/**
 * AgentSkills Definitions
 * 
 * Comprehensive skill definitions for meta-analysis and teaching.
 * Following AgentSkills specification: https://agentskills.io/specification
 * 
 * These skills are injected into ALL LLM providers to ensure consistent
 * capabilities across OpenAI, Anthropic, Gemini, MiniMax, OpenRouter, and local models.
 */

import type { SkillMetadata, SkillDefinition } from './types';

/**
 * Skill metadata for quick discovery (~100 tokens each)
 * Used in system prompt for skill selection
 */
export const SKILLS_METADATA: Record<string, SkillMetadata> = {
  'meta-analysis-core': {
    name: 'meta-analysis-core',
    description: 'Conducts meta-analyses of clinical studies using R and metafor. Calculates effect sizes (OR, RR, SMD), fits random-effects models, assesses heterogeneity (I², τ²), and generates forest plots. Use when synthesizing quantitative evidence from multiple studies.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
  'data-extraction': {
    name: 'data-extraction',
    description: 'Extracts and organizes data from primary studies for systematic reviews. Creates standardized extraction forms, captures study characteristics, population data, interventions, and outcomes. Use when preparing data from research papers.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
  'risk-of-bias': {
    name: 'risk-of-bias',
    description: 'Assesses risk of bias using RoB 2 (randomized trials), ROBINS-I (non-randomized), and Newcastle-Ottawa Scale. Evaluates domains like randomization, blinding, missing data. Use when evaluating study quality.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
  'heterogeneity-analysis': {
    name: 'heterogeneity-analysis',
    description: 'Analyzes between-study heterogeneity in meta-analyses. Calculates I², τ², Q statistic, prediction intervals. Conducts subgroup analyses and meta-regression to explore sources. Use when studies show inconsistent results.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
  'publication-bias': {
    name: 'publication-bias',
    description: 'Assesses publication bias using funnel plots, Egger regression test, Begg rank correlation, and trim-and-fill method. Interprets asymmetry and estimates adjusted effects. Use when evaluating reporting bias.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
  'forest-plot': {
    name: 'forest-plot',
    description: 'Generates publication-quality forest plots showing study effects, confidence intervals, weights, and pooled estimates. Customizes labels, scales, subgroups. Use when visualizing meta-analysis results.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
  'teaching-meta-analysis': {
    name: 'teaching-meta-analysis',
    description: 'Teaches meta-analysis concepts step-by-step with clear explanations and examples. Covers effect sizes, pooling methods, heterogeneity interpretation, and bias assessment. Use when user wants to learn or understand concepts.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
  'r-code-generation': {
    name: 'r-code-generation',
    description: 'Generates R code for meta-analysis using metafor package. Creates reproducible scripts for data preparation, model fitting, visualization, and sensitivity analyses. Use when user needs R code or scripts.',
    license: 'MIT',
    metadata: {
      author: 'Meta Agent',
      version: '2.0.0',
    },
  },
};

/**
 * Full skill definitions with instructions
 * Loaded when skill is activated (<5000 tokens each recommended)
 */
// Note: SKILL_DEFINITIONS is created lazily to avoid variable hoisting issues
let _skillDefinitions: Record<string, SkillDefinition> | null = null;

function getSkillDefinitions(): Record<string, SkillDefinition> {
  if (!_skillDefinitions) {
    _skillDefinitions = {
      'meta-analysis-core': {
        id: 'meta-analysis-core',
        metadata: SKILLS_METADATA['meta-analysis-core'],
        content: META_ANALYSIS_CORE_SKILL,
        instructions: extractInstructions(META_ANALYSIS_CORE_SKILL),
      },
      'data-extraction': {
        id: 'data-extraction',
        metadata: SKILLS_METADATA['data-extraction'],
        content: DATA_EXTRACTION_SKILL,
        instructions: extractInstructions(DATA_EXTRACTION_SKILL),
      },
      'risk-of-bias': {
        id: 'risk-of-bias',
        metadata: SKILLS_METADATA['risk-of-bias'],
        content: RISK_OF_BIAS_SKILL,
        instructions: extractInstructions(RISK_OF_BIAS_SKILL),
      },
      'heterogeneity-analysis': {
        id: 'heterogeneity-analysis',
        metadata: SKILLS_METADATA['heterogeneity-analysis'],
        content: HETEROGENEITY_ANALYSIS_SKILL,
        instructions: extractInstructions(HETEROGENEITY_ANALYSIS_SKILL),
      },
      'publication-bias': {
        id: 'publication-bias',
        metadata: SKILLS_METADATA['publication-bias'],
        content: PUBLICATION_BIAS_SKILL,
        instructions: extractInstructions(PUBLICATION_BIAS_SKILL),
      },
      'forest-plot': {
        id: 'forest-plot',
        metadata: SKILLS_METADATA['forest-plot'],
        content: FOREST_PLOT_SKILL,
        instructions: extractInstructions(FOREST_PLOT_SKILL),
      },
      'teaching-meta-analysis': {
        id: 'teaching-meta-analysis',
        metadata: SKILLS_METADATA['teaching-meta-analysis'],
        content: TEACHING_META_ANALYSIS_SKILL,
        instructions: extractInstructions(TEACHING_META_ANALYSIS_SKILL),
      },
      'r-code-generation': {
        id: 'r-code-generation',
        metadata: SKILLS_METADATA['r-code-generation'],
        content: R_CODE_GENERATION_SKILL,
        instructions: extractInstructions(R_CODE_GENERATION_SKILL),
      },
    };
  }
  return _skillDefinitions;
}

// Export as getter for lazy initialization
export const SKILL_DEFINITIONS = new Proxy({} as Record<string, SkillDefinition>, {
  get(_, prop: string) {
    return getSkillDefinitions()[prop];
  },
  ownKeys() {
    return Object.keys(getSkillDefinitions());
  },
  getOwnPropertyDescriptor(_, prop: string) {
    const defs = getSkillDefinitions();
    if (prop in defs) {
      return { enumerable: true, configurable: true, value: defs[prop] };
    }
    return undefined;
  },
});

/**
 * Get skill by name
 */
export function getSkillByName(name: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS[name];
}

/**
 * Get all skills
 */
export function getAllSkills(): SkillDefinition[] {
  return Object.values(getSkillDefinitions());
}

/**
 * Extract instructions from SKILL.md content (body after frontmatter)
 */
function extractInstructions(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : content;
}

// ============================================================================
// SKILL DEFINITIONS (SKILL.md format)
// ============================================================================

const META_ANALYSIS_CORE_SKILL = `---
name: meta-analysis-core
description: Conducts meta-analyses of clinical studies using R and metafor. Calculates effect sizes (OR, RR, SMD), fits random-effects models, assesses heterogeneity (I², τ²), and generates forest plots. Use when synthesizing quantitative evidence from multiple studies.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Conducts meta-analyses following Cochrane methodology. Synthesizes quantitative evidence from multiple studies to estimate pooled effects.

## Workflow

1. Identify outcome type (binary, continuous, correlation, time-to-event)
2. Calculate effect sizes using escalc() if raw data provided
3. Fit random-effects model with REML estimation
4. Report pooled estimate with 95% CI
5. Assess heterogeneity (I², τ², Q, prediction interval)
6. Generate forest plot
7. Conduct sensitivity analyses if needed

## Effect Size Selection

| Outcome Type | Measures | When to Use |
|--------------|----------|-------------|
| Binary | OR, RR, RD | Events in treatment vs control |
| Continuous | MD, SMD | Means with same/different scales |
| Correlation | COR, ZCOR | Association between variables |
| Time-to-event | HR | Survival data |

## R Code Templates

Binary outcomes (Odds Ratio):
\`\`\`r
library(metafor)
dat <- escalc(measure="OR", 
              ai=events_treat, bi=no_events_treat,
              ci=events_ctrl, di=no_events_ctrl, 
              data=mydata)
res <- rma(yi, vi, data=dat, method="REML")
summary(res)
forest(res, atransf=exp, header=TRUE)
\`\`\`

Continuous outcomes (Standardized Mean Difference):
\`\`\`r
dat <- escalc(measure="SMD",
              m1i=mean_treat, sd1i=sd_treat, n1i=n_treat,
              m2i=mean_ctrl, sd2i=sd_ctrl, n2i=n_ctrl,
              data=mydata)
res <- rma(yi, vi, data=dat, method="REML")
summary(res)
forest(res, header=TRUE)
\`\`\`

## Interpretation Guidelines

- Report effect on original scale (exponentiate log OR/RR)
- Include 95% CI and p-value
- Interpret heterogeneity: I² <25% low, 25-75% moderate, >75% high
- Consider prediction interval for clinical relevance
- Note number of studies and total participants
`;

const DATA_EXTRACTION_SKILL = `---
name: data-extraction
description: Extracts and organizes data from primary studies for systematic reviews. Creates standardized extraction forms, captures study characteristics, population data, interventions, and outcomes. Use when preparing data from research papers.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Extracts data from primary studies using standardized forms following Cochrane guidelines.

## Standard Extraction Fields

### Study Identification
- First author, publication year
- Journal, DOI
- Study design (RCT, cohort, case-control, cross-sectional)
- Country, setting, funding source

### Population
- Total sample size, per-group sizes
- Age: mean (SD) or median (IQR)
- Sex distribution (% female)
- Key inclusion/exclusion criteria
- Baseline disease severity

### Intervention/Exposure
- Intervention description
- Dose, frequency, duration
- Control/comparator details
- Co-interventions

### Outcomes
- Primary outcome definition
- Measurement instrument/method
- Timing of assessment
- Results: effect estimate, CI, p-value
- Missing data handling

## Data Extraction Tips

1. Extract from Results section, verify in Tables
2. Record page/table numbers for verification
3. Note if data calculated vs directly reported
4. Flag unclear or missing data for author contact
5. Use ITT results when available

## Output Format

Provide extracted data in structured table format:
| Study | N | Intervention | Control | Outcome | Effect (95% CI) |
|-------|---|--------------|---------|---------|-----------------|
`;

const RISK_OF_BIAS_SKILL = `---
name: risk-of-bias
description: Assesses risk of bias using RoB 2 (randomized trials), ROBINS-I (non-randomized), and Newcastle-Ottawa Scale. Evaluates domains like randomization, blinding, missing data. Use when evaluating study quality.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Assesses risk of bias using validated tools appropriate to study design.

## Tool Selection

| Study Design | Tool | Domains |
|--------------|------|---------|
| Randomized trial | RoB 2 | 5 domains |
| Non-randomized intervention | ROBINS-I | 7 domains |
| Cohort/Case-control | Newcastle-Ottawa | 3 categories |

## RoB 2 Assessment (Randomized Trials)

### Domains and Signaling Questions

**Domain 1: Randomization process**
- Was allocation sequence random?
- Was allocation concealed?
- Were baseline differences due to chance?

**Domain 2: Deviations from intended interventions**
- Were participants aware of assignment?
- Were there deviations due to trial context?
- Was analysis appropriate (ITT)?

**Domain 3: Missing outcome data**
- Were outcome data available for all/most?
- Could missingness depend on true value?

**Domain 4: Measurement of outcome**
- Was outcome measurement appropriate?
- Could assessment differ between groups?
- Were assessors aware of assignment?

**Domain 5: Selection of reported result**
- Was analysis pre-specified?
- Were multiple measurements handled appropriately?

### Judgments
- Low risk: All domains low risk
- Some concerns: Some concerns in ≥1 domain
- High risk: High risk in ≥1 domain

## Output Format

Provide assessment as table with supporting quotes:
| Domain | Judgment | Support |
|--------|----------|---------|
`;

const HETEROGENEITY_ANALYSIS_SKILL = `---
name: heterogeneity-analysis
description: Analyzes between-study heterogeneity in meta-analyses. Calculates I², τ², Q statistic, prediction intervals. Conducts subgroup analyses and meta-regression to explore sources. Use when studies show inconsistent results.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Analyzes and explores heterogeneity in meta-analysis results.

## Heterogeneity Statistics

| Statistic | Interpretation | Calculation |
|-----------|----------------|-------------|
| Q | Tests null of homogeneity | Weighted sum of squared deviations |
| I² | % variability due to heterogeneity | 100% × (Q-df)/Q |
| τ² | Between-study variance | REML or DL estimator |
| H² | Ratio of total to sampling variance | Q/df |

## I² Interpretation

- 0-25%: Low heterogeneity
- 25-50%: Moderate heterogeneity
- 50-75%: Substantial heterogeneity
- 75-100%: Considerable heterogeneity

Note: I² depends on precision; consider τ² for absolute magnitude.

## Prediction Interval

The 95% prediction interval estimates the range of true effects in similar future studies:
\`\`\`r
predict(res)  # Returns prediction interval
\`\`\`

More clinically meaningful than CI of pooled effect.

## Exploring Heterogeneity

### Subgroup Analysis
\`\`\`r
# Categorical moderator
res.sub <- rma(yi, vi, data=dat, mods=~factor(region))
summary(res.sub)

# Test for subgroup differences
anova(res.sub)
\`\`\`

### Meta-Regression
\`\`\`r
# Continuous moderator
res.reg <- rma(yi, vi, data=dat, mods=~year)
summary(res.reg)

# Multiple moderators
res.reg2 <- rma(yi, vi, data=dat, mods=~year+dose)
\`\`\`

## Reporting Guidelines

1. Report Q statistic with df and p-value
2. Report I² with 95% CI
3. Report τ² and τ (SD scale)
4. Report prediction interval
5. Pre-specify subgroup analyses
6. Interpret clinical significance of heterogeneity
`;

const PUBLICATION_BIAS_SKILL = `---
name: publication-bias
description: Assesses publication bias using funnel plots, Egger regression test, Begg rank correlation, and trim-and-fill method. Interprets asymmetry and estimates adjusted effects. Use when evaluating reporting bias.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Assesses publication bias and small-study effects in meta-analyses.

## Assessment Methods

| Method | Type | Best For |
|--------|------|----------|
| Funnel plot | Visual | Initial assessment |
| Egger's test | Regression | Continuous outcomes |
| Begg's test | Rank correlation | Any outcome |
| Trim-and-fill | Imputation | Adjusted estimate |
| Selection models | Modeling | Sensitivity analysis |

## Funnel Plot

Plots effect size vs. precision (SE). Symmetric funnel suggests no bias.

\`\`\`r
library(metafor)
funnel(res, main="Funnel Plot")

# Enhanced funnel plot
funnel(res, level=c(90, 95, 99), shade=c("white", "gray55", "gray75"))
\`\`\`

## Statistical Tests

### Egger's Regression Test
\`\`\`r
regtest(res, model="lm")
# p < 0.10 suggests asymmetry
\`\`\`

### Begg's Rank Correlation
\`\`\`r
ranktest(res)
\`\`\`

### Trim-and-Fill
\`\`\`r
tf <- trimfill(res)
summary(tf)  # Adjusted estimate
funnel(tf)   # Plot with imputed studies
\`\`\`

## Interpretation Cautions

1. Tests have low power with <10 studies
2. Asymmetry ≠ publication bias (could be heterogeneity, chance, true small-study effects)
3. Trim-and-fill assumes missing studies mirror observed
4. Report as exploratory, not definitive
5. Consider multiple methods

## Reporting

- Describe funnel plot appearance
- Report test statistics and p-values
- If trim-and-fill used, report original and adjusted estimates
- Acknowledge limitations
`;

const FOREST_PLOT_SKILL = `---
name: forest-plot
description: Generates publication-quality forest plots showing study effects, confidence intervals, weights, and pooled estimates. Customizes labels, scales, subgroups. Use when visualizing meta-analysis results.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Creates publication-quality forest plots for meta-analysis visualization.

## Forest Plot Components

1. Study labels (author, year)
2. Effect estimates with 95% CI
3. Weight (inverse variance)
4. Point estimates (squares, size = weight)
5. Confidence intervals (horizontal lines)
6. Summary diamond (pooled effect)
7. Vertical reference line (null effect)
8. Heterogeneity statistics

## Basic Forest Plot

\`\`\`r
library(metafor)

# Basic plot
forest(res, header=TRUE)

# With study labels
forest(res, 
       slab=paste(author, year, sep=", "),
       header=c("Study", "Effect [95% CI]"))
\`\`\`

## Customized Forest Plot

\`\`\`r
forest(res,
       atransf=exp,                    # Back-transform log OR
       at=log(c(0.25, 0.5, 1, 2, 4)), # X-axis ticks
       xlim=c(-16, 6),                 # Plot limits
       ilab=cbind(n_treat, n_ctrl),    # Additional columns
       ilab.xpos=c(-9, -7),            # Column positions
       cex=0.75,                       # Font size
       header=TRUE,
       xlab="Odds Ratio (95% CI)",
       refline=1)                      # Reference line at OR=1

# Add column headers
text(c(-9, -7), res$k+2, c("Treatment", "Control"), font=2, cex=0.75)
\`\`\`

## Subgroup Forest Plot

\`\`\`r
# Add subgroup rows
forest(res,
       rows=c(3:6, 10:14),            # Row positions
       ylim=c(-1, 18))

# Add subgroup labels
text(-16, c(7, 15), c("Subgroup A", "Subgroup B"), pos=4, font=2)
\`\`\`

## Export Settings

- Resolution: 300+ DPI for publication
- Format: PDF for vector, PNG/TIFF for raster
- Width: 7-10 inches typical
- Font: Match journal requirements
`;

const TEACHING_META_ANALYSIS_SKILL = `---
name: teaching-meta-analysis
description: Teaches meta-analysis concepts step-by-step with clear explanations and examples. Covers effect sizes, pooling methods, heterogeneity interpretation, and bias assessment. Use when user wants to learn or understand concepts.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Teaches meta-analysis concepts with clear explanations, analogies, and practical examples.

## Teaching Approach

1. Start with the concept in plain language
2. Provide a real-world analogy
3. Show the mathematical foundation (optional)
4. Give a worked example
5. Highlight common mistakes
6. Connect to practical application

## Core Concepts to Teach

### What is Meta-Analysis?

Meta-analysis combines results from multiple studies to get a more precise estimate of an effect. Think of it like averaging test scores from multiple classes to understand overall student performance—individual classes might vary, but the average gives a clearer picture.

### Effect Sizes

An effect size quantifies the magnitude of a difference or relationship. Common types:

**Odds Ratio (OR)**: For binary outcomes. OR=2 means the odds of the event are twice as high in the treatment group.

**Risk Ratio (RR)**: Also for binary outcomes. RR=0.5 means the risk is halved with treatment.

**Standardized Mean Difference (SMD)**: For continuous outcomes on different scales. SMD=0.5 is a "medium" effect (Cohen's d).

### Heterogeneity

Heterogeneity is variation in true effects across studies. Some variation is expected—studies differ in populations, interventions, and settings.

**I² statistic**: The percentage of variability due to true differences rather than chance. I²=75% means 75% of the observed variation reflects real differences between studies.

**Why it matters**: High heterogeneity means the pooled estimate may not apply uniformly. You need to explore why studies differ.

### Fixed vs Random Effects

**Fixed-effect model**: Assumes all studies estimate the same true effect. Differences are due to sampling error only.

**Random-effects model**: Assumes true effects vary across studies. Accounts for both within-study and between-study variance.

**When to use**: Random-effects is usually preferred because studies inevitably differ. Fixed-effect only if studies are truly identical.

## Common Misconceptions

1. "More studies = better meta-analysis" — Quality matters more than quantity
2. "Non-significant = no effect" — May lack power; look at effect size and CI
3. "I² tells you if pooling is valid" — High I² doesn't prohibit pooling; explore sources
4. "Funnel plot asymmetry = publication bias" — Could be heterogeneity or chance
`;

const R_CODE_GENERATION_SKILL = `---
name: r-code-generation
description: Generates R code for meta-analysis using metafor package. Creates reproducible scripts for data preparation, model fitting, visualization, and sensitivity analyses. Use when user needs R code or scripts.
license: MIT
metadata:
  author: Meta Agent
  version: "2.0.0"
---

Generates clean, well-commented R code for meta-analysis using the metafor package.

## Code Generation Principles

1. Include library loading at top
2. Add comments explaining each step
3. Use meaningful variable names
4. Follow tidyverse style guide
5. Make code reproducible (set.seed for simulations)
6. Include error handling where appropriate

## Complete Analysis Template

\`\`\`r
# Meta-Analysis Script
# Generated by Meta Agent
# Date: [Current Date]

# Load packages
library(metafor)
library(tidyverse)

# ============================================
# 1. DATA PREPARATION
# ============================================

# Load your data
# dat <- read_csv("your_data.csv")

# Example: BCG vaccine trials
data(dat.bcg)
dat <- dat.bcg

# Calculate effect sizes (log odds ratio)
dat <- escalc(measure = "OR",
              ai = tpos, bi = tneg,
              ci = cpos, di = cneg,
              data = dat,
              slab = paste(author, year, sep = ", "))

# ============================================
# 2. FIT META-ANALYSIS MODEL
# ============================================

# Random-effects model with REML estimation
res <- rma(yi, vi, data = dat, method = "REML")

# Print summary
summary(res)

# ============================================
# 3. ASSESS HETEROGENEITY
# ============================================

# Heterogeneity statistics are in summary
# I² = percentage of variability due to heterogeneity
# τ² = between-study variance
# Q = test of homogeneity

# Prediction interval
predict(res)

# ============================================
# 4. FOREST PLOT
# ============================================

# Basic forest plot
forest(res,
       atransf = exp,
       at = log(c(0.05, 0.25, 1, 4)),
       xlim = c(-16, 6),
       header = c("Study", "OR [95% CI]"),
       xlab = "Odds Ratio")

# ============================================
# 5. PUBLICATION BIAS
# ============================================

# Funnel plot
funnel(res, main = "Funnel Plot")

# Egger's test
regtest(res)

# Trim-and-fill
tf <- trimfill(res)
summary(tf)

# ============================================
# 6. SENSITIVITY ANALYSES
# ============================================

# Leave-one-out analysis
leave1out(res)

# Influence diagnostics
inf <- influence(res)
plot(inf)
\`\`\`

## Code Snippets for Common Tasks

### Subgroup Analysis
\`\`\`r
# Subgroup by categorical variable
res_sub <- rma(yi, vi, data = dat, mods = ~ factor(region))
summary(res_sub)
\`\`\`

### Meta-Regression
\`\`\`r
# Continuous moderator
res_reg <- rma(yi, vi, data = dat, mods = ~ year + ablat)
summary(res_reg)
\`\`\`

### Cumulative Meta-Analysis
\`\`\`r
# Studies added chronologically
cumul(res, order = year)
\`\`\`
`;
