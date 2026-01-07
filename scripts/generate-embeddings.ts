#!/usr/bin/env npx tsx
/**
 * Meta Agent Embeddings Generator
 * 
 * Generates embeddings for knowledge base content using Gemini Embeddings API.
 * Creates a local vector store JSON file for offline semantic search.
 * 
 * Usage:
 *   GEMINI_API_KEY=your-key npx tsx scripts/generate-embeddings.ts
 * 
 * Options:
 *   --output <path>     Output file path (default: assets/knowledge-base/embeddings.json)
 *   --dimensions <n>    Embedding dimensions: 768, 1536, or 3072 (default: 768)
 *   --category <name>   Generate only specific category (cochrane, seminal, r-docs)
 * 
 * @see https://ai.google.dev/gemini-api/docs/embeddings
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const EMBEDDING_MODEL = 'gemini-embedding-001';

// Default output path
const DEFAULT_OUTPUT = 'assets/knowledge-base/embeddings.json';

// Embedding dimensions (768 recommended for mobile - good balance of quality/size)
const DEFAULT_DIMENSIONS = 768;

// Task types for different content
const TASK_TYPES = {
  document: 'RETRIEVAL_DOCUMENT',
  query: 'RETRIEVAL_QUERY',
  qa: 'QUESTION_ANSWERING',
  similarity: 'SEMANTIC_SIMILARITY',
} as const;

// ============================================================================
// Types
// ============================================================================

interface EmbeddingChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    category: string;
    title: string;
    section?: string;
    keywords?: string[];
  };
}

interface VectorStore {
  version: string;
  model: string;
  dimensions: number;
  created: string;
  chunks: EmbeddingChunk[];
  stats: {
    totalChunks: number;
    totalTokens: number;
    categories: Record<string, number>;
  };
}

interface GeminiEmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

interface GeminiBatchEmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

// ============================================================================
// Gemini Embeddings API
// ============================================================================

async function generateEmbeddings(
  texts: string[],
  taskType: string = TASK_TYPES.document,
  dimensions: number = DEFAULT_DIMENSIONS
): Promise<number[][]> {
  // Use batchEmbedContents for multiple texts
  const url = `${BASE_URL}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`;
  
  // Process in batches of 100 (API limit)
  const batchSize = 100;
  const allEmbeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: batch.map(text => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: {
            parts: [{ text }],
          },
          taskType,
          outputDimensionality: dimensions,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embeddings API Error ${response.status}: ${error}`);
    }

    const result = await response.json() as GeminiBatchEmbeddingResponse;
    
    // Check if embeddings exist
    if (!result.embeddings || !Array.isArray(result.embeddings)) {
      console.error('Unexpected API response:', JSON.stringify(result).slice(0, 500));
      throw new Error('Invalid embeddings response from API');
    }
    
    // Normalize embeddings for dimensions < 3072
    const embeddings = result.embeddings.map(e => {
      const values = e.values;
      if (!values || !Array.isArray(values)) {
        console.error('Invalid embedding values:', e);
        throw new Error('Invalid embedding values in response');
      }
      if (dimensions < 3072) {
        const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
        return norm > 0 ? values.map(v => v / norm) : values;
      }
      return values;
    });
    
    allEmbeddings.push(...embeddings);
    
    // Rate limiting - wait between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allEmbeddings;
}

// ============================================================================
// Content Chunking
// ============================================================================

interface ContentChunk {
  text: string;
  metadata: {
    source: string;
    category: string;
    title: string;
    section?: string;
    keywords?: string[];
  };
}

function chunkText(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of previous chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + '\n\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

function extractKeywords(text: string): string[] {
  // Extract key meta-analysis terms
  const metaTerms = [
    'meta-analysis', 'systematic review', 'forest plot', 'funnel plot',
    'heterogeneity', 'I²', 'I-squared', 'tau²', 'tau-squared',
    'odds ratio', 'risk ratio', 'relative risk', 'risk difference',
    'mean difference', 'standardized mean difference', 'SMD',
    'fixed effect', 'random effects', 'DerSimonian-Laird', 'REML',
    'publication bias', 'Egger', 'trim and fill',
    'risk of bias', 'RoB', 'ROBINS-I', 'GRADE',
    'Cochrane', 'PRISMA', 'metafor', 'escalc', 'rma',
    'confidence interval', 'prediction interval',
    'subgroup analysis', 'meta-regression', 'sensitivity analysis',
  ];
  
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const term of metaTerms) {
    if (lowerText.includes(term.toLowerCase())) {
      found.push(term);
    }
  }
  
  return [...new Set(found)].slice(0, 10);
}

// ============================================================================
// Knowledge Base Content
// ============================================================================

function getCochraneContent(): ContentChunk[] {
  const chunks: ContentChunk[] = [];
  
  // Chapter 6: Effect Measures
  const ch6Content = `
# Effect Measures in Meta-Analysis

## Risk Ratio (Relative Risk, RR)
The risk ratio compares the probability of an event in the intervention group to the control group.
Formula: RR = (a/n1) / (c/n2)
Interpretation: RR = 1 means no difference, RR < 1 means intervention reduces risk, RR > 1 means intervention increases risk.
Best used for cohort studies and RCTs with intuitive interpretation.

## Odds Ratio (OR)
The odds ratio compares the odds of an event between groups.
Formula: OR = (a×d) / (b×c)
OR approximates RR when events are rare (<10%). Required for case-control studies.
OR is symmetric: OR for event = 1/OR for non-event.

## Risk Difference (RD)
The absolute difference in risk between groups.
Formula: RD = (a/n1) - (c/n2)
Directly interpretable as change in probability. NNT = 1/|RD|.

## Mean Difference (MD)
Used when all studies use the same measurement scale.
Formula: MD = Mean_intervention - Mean_control

## Standardized Mean Difference (SMD)
Used when studies measure the same concept on different scales.
Formula: SMD = (Mean_intervention - Mean_control) / SD_pooled
Cohen's conventions: 0.2 = small, 0.5 = medium, 0.8 = large effect.
`;

  const ch6Chunks = chunkText(ch6Content);
  ch6Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 6: Effect Measures',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 10: Meta-Analysis Methods
  const ch10Content = `
# Meta-Analysis Statistical Methods

## Fixed-Effect Model (Inverse Variance)
Assumes all studies estimate the same true effect.
Pooled estimate: θ_pooled = Σ(w_i × θ_i) / Σw_i
Weight: w_i = 1/SE_i²
Use when: studies are functionally identical, I² < 25%.

## Random-Effects Model (DerSimonian-Laird)
Assumes true effects vary between studies following a distribution.
Between-study variance: τ² = max(0, (Q - df) / C)
Adjusted weights: w*_i = 1/(SE_i² + τ²)
Use when: clinical diversity expected, I² > 50%, generalizing beyond included studies.

## REML Estimator
Restricted Maximum Likelihood provides more accurate τ² estimation than DerSimonian-Laird.
Recommended for most random-effects analyses.

## Heterogeneity Assessment

### Cochran's Q Test
Q = Σw_i(θ_i - θ_pooled)²
Tests if all studies share the same true effect.
Low power with few studies. Use p < 0.10 threshold.

### I² Statistic (Higgins & Thompson)
I² = max(0, (Q - df)/Q × 100%)
Interpretation: 25% low, 50% moderate, 75% high heterogeneity.
Advantages: not dependent on number of studies, intuitive percentage.

### Prediction Interval
Shows range where true effect of a new study would likely fall.
Formula: θ_pooled ± t × √(SE²_pooled + τ²)
More informative than CI when heterogeneity exists.

## Subgroup Analysis
Purpose: explain heterogeneity, examine effect modification.
Methods: separate meta-analyses, meta-regression, interaction test.
Cautions: pre-specify subgroups, limit number, beware ecological fallacy.

## Meta-Regression
Model: θ_i = β_0 + β_1×X_i + ε_i + ζ_i
Requires ≥10 studies per covariate.
Watch for ecological bias and confounding.
`;

  const ch10Chunks = chunkText(ch10Content);
  ch10Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 10: Meta-Analysis Methods',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 8: Risk of Bias
  const ch8Content = `
# Risk of Bias Assessment

## RoB 2 Tool for Randomized Trials
Assesses bias across five domains:

### Domain 1: Randomization Process
Was allocation sequence random? Was it concealed? Any baseline imbalances?
Low risk: Computer-generated sequence + central allocation.
High risk: Alternation, birth dates, or allocation known before enrollment.

### Domain 2: Deviations from Intended Interventions
Were participants/carers aware of assignment? Were there deviations due to trial context?
Consider intention-to-treat vs per-protocol effects.

### Domain 3: Missing Outcome Data
Were data available for all/nearly all participants?
Low risk: <5% missing, balanced, reasons unrelated to outcome.
High risk: Differential dropout, missing data related to outcome.

### Domain 4: Measurement of Outcome
Was measurement appropriate? Could it differ between groups?
Low risk: Objective outcomes or blinded assessment.
High risk: Subjective outcomes with unblinded assessment.

### Domain 5: Selection of Reported Result
Were data analyzed per pre-specified plan?
Low risk: Protocol available, analysis matches protocol.
High risk: Multiple outcomes measured but only some reported.

## Overall Judgment
Low risk: Low in all domains.
Some concerns: Some concerns in at least one domain.
High risk: High risk in at least one domain.

## ROBINS-I for Non-Randomized Studies
Seven domains: confounding, selection, classification, deviations, missing data, measurement, reporting.

## Presenting Risk of Bias
Traffic light plot: Green = low, Yellow = concerns, Red = high.
Summary bar chart: Proportion at each level per domain.
`;

  const ch8Chunks = chunkText(ch8Content);
  ch8Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 8: Risk of Bias',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 13: Publication Bias
  const ch13Content = `
# Publication Bias

## Types of Reporting Bias
- Publication bias: Significant results more likely published
- Time-lag bias: Significant results published faster
- Language bias: Significant results in English journals
- Outcome reporting bias: Selective reporting within studies

## Funnel Plot
Scatter plot of effect estimates vs precision (1/SE).
Expected: Symmetric inverted funnel shape.
Asymmetry suggests: publication bias, small-study effects, heterogeneity.

## Egger's Test
Linear regression: θ_i/SE_i = α + β × (1/SE_i) + ε
Tests H0: intercept α = 0 (symmetric funnel).
Limitations: Low power with <10 studies, inflated Type I error with binary outcomes.

## Begg's Test
Kendall's tau between effect estimates and variances.
Less powerful than Egger's but fewer assumptions.

## Peters' Test
For binary outcomes, regresses log(OR) on 1/total sample size.
More appropriate than Egger's for odds ratios.

## Trim and Fill
1. Estimate number of "missing" studies
2. Impute as mirror images
3. Re-calculate pooled estimate
Limitations: Assumes asymmetry is solely due to publication bias.

## PET-PEESE
PET: θ_i = β_0 + β_1 × SE_i + ε_i
PEESE: θ_i = β_0 + β_1 × SE_i² + ε_i
Use PEESE if PET rejects H0.

## Prevention
- Prospective registration (PROSPERO, ClinicalTrials.gov)
- Comprehensive searching (grey literature, trial registries)
- Reporting guidelines (CONSORT, PRISMA)
`;

  const ch13Chunks = chunkText(ch13Content);
  ch13Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 13: Publication Bias',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 5: Defining the Review Question
  const ch5Content = `
# Defining the Review Question and Developing Criteria

## PICO Framework
Population: Who are the participants? (age, condition, setting)
Intervention: What is being tested? (drug, procedure, program)
Comparison: What is the alternative? (placebo, standard care, no treatment)
Outcome: What are we measuring? (primary, secondary, timing)

## Eligibility Criteria
Must be pre-specified and explicit. Include:
- Study design (RCTs only, or include observational?)
- Participants (inclusion/exclusion criteria)
- Interventions (dose, duration, delivery)
- Comparators (acceptable controls)
- Outcomes (which ones, how measured, timing)
- Setting (hospital, community, country)
- Language/date restrictions (justify if any)

## Hierarchy of Evidence
1. Systematic reviews of RCTs
2. Individual RCTs
3. Cohort studies
4. Case-control studies
5. Case series/reports
6. Expert opinion

## Protocol Development
Register on PROSPERO before starting searches.
Include: rationale, objectives, methods, analysis plan.
Amendments must be documented and justified.
`;

  const ch5Chunks = chunkText(ch5Content);
  ch5Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 5: Defining the Review Question',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 7: Searching for Studies
  const ch7Content = `
# Searching for and Selecting Studies

## Comprehensive Searching
Goal: Find all relevant studies to minimize selection bias.
Sources: Bibliographic databases, trial registries, grey literature, reference lists, experts.

## Database Selection
MEDLINE: Biomedical literature, 1946-present
Embase: European focus, more drug/pharma coverage
CENTRAL: Cochrane's RCT database, highly specific
PsycINFO: Psychology and behavioral sciences
CINAHL: Nursing and allied health

## Search Strategy Development
1. Break PICO into concepts
2. Identify synonyms and related terms
3. Use MeSH/Emtree subject headings
4. Combine with Boolean operators (AND, OR, NOT)
5. Apply filters cautiously (may miss relevant studies)

## Search Filters
RCT filters: Validated, but may miss some studies
Systematic review filters: Use Cochrane's validated filters
Avoid: Date limits unless justified, language restrictions

## Grey Literature
Conference abstracts, dissertations, regulatory documents.
Trial registries: ClinicalTrials.gov, WHO ICTRP, ISRCTN
Important for reducing publication bias.

## Study Selection
Two reviewers independently screen titles/abstracts.
Full-text review of potentially eligible studies.
Resolve disagreements by discussion or third reviewer.
Document reasons for exclusion at full-text stage.

## PRISMA Flow Diagram
Document: Records identified, duplicates removed, screened, excluded (with reasons), included.
`;

  const ch7Chunks = chunkText(ch7Content);
  ch7Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 7: Searching for Studies',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 9: Summarizing Study Characteristics
  const ch9Content = `
# Summarizing Study Characteristics and Risk of Bias

## Data Extraction
Use standardized forms (paper or electronic).
Pilot test on 2-3 studies before full extraction.
Two reviewers extract independently, compare, resolve.

## What to Extract
Study identifiers: Author, year, country, funding
Methods: Design, randomization, blinding, duration
Participants: N, age, sex, condition severity, setting
Interventions: Details, dose, duration, co-interventions
Outcomes: Definition, measurement, timing, completeness
Results: Effect estimates, variability, sample sizes

## Dealing with Missing Data
Contact authors (allow 2-4 weeks for response).
Use available data methods when possible.
Document what was missing and how handled.

## Risk of Bias Tables
Present assessment for each study and domain.
Provide supporting quotes or evidence.
Use traffic light visualization.

## Characteristics of Included Studies Table
Standardized format for each study.
Include: Methods, Participants, Interventions, Outcomes, Notes.

## Characteristics of Excluded Studies
List studies excluded at full-text with reasons.
Group by reason if many exclusions.
`;

  const ch9Chunks = chunkText(ch9Content);
  ch9Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 9: Summarizing Study Characteristics',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 11: Network Meta-Analysis
  const ch11Content = `
# Network Meta-Analysis

## What is Network Meta-Analysis?
Extension of pairwise meta-analysis to compare multiple interventions simultaneously.
Combines direct evidence (head-to-head trials) with indirect evidence (via common comparator).

## When to Use NMA
- Multiple treatment options exist
- No single trial compares all treatments
- Need to rank treatments
- Want to estimate effects for comparisons lacking direct evidence

## Key Assumptions
Transitivity: Indirect comparisons are valid if studies are similar in effect modifiers.
Consistency: Direct and indirect evidence agree.

## Network Geometry
Nodes: Treatments being compared
Edges: Direct comparisons from trials
Well-connected networks are more reliable.

## Statistical Models
Frequentist: netmeta package in R
Bayesian: gemtc, multinma packages
Both give similar results with sufficient data.

## Assessing Consistency
Node-splitting: Compare direct vs indirect for each comparison.
Design-by-treatment interaction: Global test.
Inconsistency suggests transitivity violation.

## Ranking Treatments
SUCRA (Surface Under Cumulative Ranking): 0-100%, higher = better
P-scores: Frequentist equivalent of SUCRA
Mean ranks: Average position across simulations
Caution: Rankings can be misleading with overlapping CIs.

## Presenting Results
Network plot: Shows geometry and evidence
Forest plot: Effect estimates vs reference
League table: All pairwise comparisons
Rankogram: Probability of each rank
`;

  const ch11Chunks = chunkText(ch11Content);
  ch11Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 11: Network Meta-Analysis',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 12: GRADE
  const ch12Content = `
# GRADE: Certainty of Evidence

## What is GRADE?
Grading of Recommendations Assessment, Development and Evaluation.
Standardized approach to rating certainty of evidence.

## Starting Point
RCTs start at HIGH certainty.
Observational studies start at LOW certainty.

## Factors That Lower Certainty

### Risk of Bias
Serious limitations in study design or execution.
Down one level for serious, two for very serious.

### Inconsistency
Unexplained heterogeneity in results.
Consider: I², prediction intervals, direction of effects.

### Indirectness
Evidence doesn't directly apply to PICO.
Types: Population, intervention, comparator, outcome differences.

### Imprecision
Wide confidence intervals, few events.
Consider: CI crosses clinical decision threshold, OIS not met.
Optimal Information Size (OIS): Sample size for adequate power.

### Publication Bias
Suspected missing studies.
Evidence: Funnel plot asymmetry, small-study effects.

## Factors That Raise Certainty (Observational Only)
- Large effect (RR > 2 or < 0.5)
- Dose-response gradient
- Plausible confounding would reduce effect

## Certainty Levels
HIGH: Very confident effect is close to true effect.
MODERATE: Moderately confident; true effect likely close.
LOW: Limited confidence; true effect may be different.
VERY LOW: Very little confidence; true effect likely different.

## Summary of Findings Table
Present: Outcomes, effect estimates, certainty, plain language summary.
Use GRADEpro GDT software.
`;

  const ch12Chunks = chunkText(ch12Content);
  ch12Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 12: GRADE Certainty of Evidence',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Chapter 14: Interpreting Results
  const ch14Content = `
# Interpreting Results and Drawing Conclusions

## Statistical vs Clinical Significance
Statistical: p < 0.05, CI excludes null.
Clinical: Effect size is meaningful for patients.
A statistically significant result may not be clinically important.

## Minimal Clinically Important Difference (MCID)
Smallest change patients perceive as beneficial.
Use to interpret effect sizes.
CI crossing MCID = uncertain clinical importance.

## Interpreting Heterogeneity
I² tells you heterogeneity exists, not why.
Explore with subgroup analysis, meta-regression.
Consider clinical and methodological diversity.

## Interpreting Subgroup Analyses
Pre-specified subgroups are more credible.
Test for interaction, not just within-subgroup significance.
Beware of multiple testing and ecological fallacy.

## Interpreting Publication Bias
Funnel asymmetry ≠ publication bias.
Consider alternative explanations.
Adjusted estimates (trim-fill) are sensitivity analyses.

## Drawing Conclusions
Implications for practice: What should clinicians do?
Implications for research: What studies are needed?
Be appropriately cautious with limited evidence.

## Plain Language Summary
Write for patients and public.
Avoid jargon, explain uncertainty.
State what the evidence shows, not what to do.

## Updating Reviews
Plan for updates at protocol stage.
Consider: New studies, new methods, changed practice.
Document search date and update frequency.
`;

  const ch14Chunks = chunkText(ch14Content);
  ch14Chunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane Handbook',
        category: 'cochrane',
        title: 'Chapter 14: Interpreting Results',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  return chunks;
}

function getSeminalPapersContent(): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // DerSimonian & Laird 1986
  const dlContent = `
# DerSimonian & Laird (1986): Random-Effects Meta-Analysis

## Citation
DerSimonian R, Laird N. Meta-analysis in clinical trials. Control Clin Trials. 1986;7(3):177-188.

## Key Contribution
Introduced the most widely used method for random-effects meta-analysis. Default in most software 40 years later.

## The Model
Y_i = θ + u_i + ε_i
Where: Y_i = observed effect, θ = overall mean, u_i ~ N(0, τ²) = between-study variation, ε_i ~ N(0, σ_i²) = within-study error.

## Estimating τ² (Between-Study Variance)
Step 1: Calculate Q = Σw_i(Y_i - Ȳ_w)²
Step 2: τ² = max(0, (Q - (k-1))/C)
Where C = Σw_i - Σw_i²/Σw_i

## Pooled Estimate
Adjusted weights: w*_i = 1/(σ_i² + τ²)
Pooled effect: θ̂ = Σw*_iY_i / Σw*_i

## Key Insights
- Heterogeneity is expected in practice
- Random effects provides appropriate inference when heterogeneity exists
- Method of moments is simple, no distributional assumptions needed

## Limitations
- Can underestimate τ², especially with few studies
- Confidence intervals may be too narrow
- Negative τ² truncated to 0

## Modern Alternatives
REML, Paule-Mandel, Hartung-Knapp adjustment, Bayesian methods.
`;

  const dlChunks = chunkText(dlContent);
  dlChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'DerSimonian & Laird 1986',
        category: 'seminal',
        title: 'Random-Effects Meta-Analysis Method',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Higgins & Thompson 2002
  const htContent = `
# Higgins & Thompson (2002): The I² Statistic

## Citation
Higgins JPT, Thompson SG. Quantifying heterogeneity in a meta-analysis. Stat Med. 2002;21(11):1539-1558.

## Key Contribution
Introduced I², the standard measure for reporting heterogeneity. Solved the problem that Cochran's Q depends on number of studies.

## The Problem with Q
Q statistic power depends on k (number of studies), not comparable across meta-analyses.

## I² Definition
I² = max(0, (Q - df)/Q × 100%)
Where df = k - 1

## Interpretation
I² = percentage of variability due to heterogeneity rather than sampling error.
Benchmarks: 25% low, 50% moderate, 75% high.

## Advantages over Q
- Scale-free (0-100%)
- Comparable across meta-analyses
- Intuitive interpretation
- Independent of number of studies

## H² Statistic
H² = Q/df
Ratio of observed to expected variance.
Relationship: I² = (H² - 1)/H²

## Confidence Intervals
I² can have wide CIs, especially with few studies. Always report uncertainty.

## Limitations
- Depends on study precision (same τ² gives different I² with different study sizes)
- Benchmarks are arbitrary
- Doesn't tell direction or source of heterogeneity

## Recommendations
Report τ² alongside I², report prediction interval, investigate heterogeneity sources.
`;

  const htChunks = chunkText(htContent);
  htChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Higgins & Thompson 2002',
        category: 'seminal',
        title: 'I² Statistic for Heterogeneity',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Egger 1997
  const eggerContent = `
# Egger et al (1997): Publication Bias Detection

## Citation
Egger M, et al. Bias in meta-analysis detected by a simple, graphical test. BMJ. 1997;315:629-634.

## Key Contribution
Introduced Egger's test, the most widely used statistical test for funnel plot asymmetry.

## Egger's Regression Test
Model: θ_i/SE_i = α + β × (1/SE_i) + ε
β estimates true effect, α measures asymmetry.
Test: H0: α = 0 (symmetric funnel)

## Interpretation
Significant intercept suggests asymmetry, possibly publication bias.

## The "Small-Study Effect"
Asymmetry could arise from:
- Publication bias
- True heterogeneity
- Methodological differences
- Clinical differences
- Chance

## Limitations
- Low power with <10 studies
- False positives due to heterogeneity
- Inflated Type I error with binary outcomes (use Peters' test instead)

## Recommendations
- Visual inspection first
- Use test as supplement, not replacement
- Interpret cautiously
- Consider alternative explanations
`;

  const eggerChunks = chunkText(eggerContent);
  eggerChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Egger et al 1997',
        category: 'seminal',
        title: 'Publication Bias Detection Test',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // PRISMA 2020
  const prismaContent = `
# PRISMA 2020: Reporting Guidelines for Systematic Reviews

## Citation
Page MJ, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71.

## What is PRISMA?
Preferred Reporting Items for Systematic Reviews and Meta-Analyses.
Checklist of 27 items for transparent reporting.

## Key Sections

### Title and Abstract
- Identify as systematic review in title
- Structured abstract with background, methods, results, conclusions

### Introduction
- Rationale: Why is review needed?
- Objectives: PICO question

### Methods
- Protocol registration (PROSPERO)
- Eligibility criteria
- Information sources and search strategy
- Selection process
- Data extraction
- Risk of bias assessment
- Effect measures and synthesis methods

### Results
- Study selection (flow diagram)
- Study characteristics
- Risk of bias in studies
- Results of syntheses
- Reporting biases
- Certainty of evidence

### Discussion
- Summary of evidence
- Limitations
- Implications

## PRISMA Flow Diagram
Boxes show: Identification, Screening, Eligibility, Included
Must report numbers at each stage with exclusion reasons.

## PRISMA Extensions
- PRISMA-P: Protocols
- PRISMA-NMA: Network meta-analysis
- PRISMA-IPD: Individual participant data
- PRISMA-S: Searches
- PRISMA-ScR: Scoping reviews
`;

  const prismaChunks = chunkText(prismaContent);
  prismaChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'PRISMA 2020',
        category: 'seminal',
        title: 'PRISMA Reporting Guidelines',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // GRADE Working Group
  const gradeContent = `
# GRADE: Certainty of Evidence Framework

## Citation
Guyatt GH, et al. GRADE: an emerging consensus on rating quality of evidence and strength of recommendations. BMJ. 2008;336:924-926.

## What is GRADE?
Grading of Recommendations Assessment, Development and Evaluation.
Systematic approach to rating certainty of evidence.

## Certainty Levels

### High Certainty
Very confident that true effect lies close to estimate.
Further research unlikely to change confidence.

### Moderate Certainty
Moderately confident in effect estimate.
Further research may change estimate.

### Low Certainty
Limited confidence in effect estimate.
Further research likely to change estimate.

### Very Low Certainty
Very little confidence in effect estimate.
True effect likely substantially different.

## Domains for Rating Down

### Risk of Bias
Limitations in study design affecting internal validity.
Consider: randomization, blinding, attrition, reporting.

### Inconsistency
Unexplained variability in results across studies.
Consider: I², prediction intervals, direction of effects.

### Indirectness
Evidence doesn't directly address the question.
Types: population, intervention, comparator, outcome.

### Imprecision
Wide confidence intervals around effect estimate.
Consider: sample size, number of events, CI width.

### Publication Bias
Systematic non-publication of studies.
Evidence: funnel plot asymmetry, registry comparisons.

## Domains for Rating Up (Observational)
- Large magnitude of effect (RR > 2 or < 0.5)
- Dose-response gradient
- Plausible confounding would reduce effect

## Summary of Findings Tables
Present key outcomes with:
- Absolute and relative effects
- Certainty rating
- Plain language interpretation
`;

  const gradeChunks = chunkText(gradeContent);
  gradeChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'GRADE Working Group',
        category: 'seminal',
        title: 'GRADE Certainty Framework',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Bradford Hill Criteria
  const hillContent = `
# Bradford Hill Criteria for Causation

## Citation
Hill AB. The Environment and Disease: Association or Causation? Proc R Soc Med. 1965;58:295-300.

## Context
Developed to assess whether observed associations are causal.
Originally for occupational/environmental epidemiology.
Widely applied in evidence synthesis.

## The Nine Criteria

### 1. Strength of Association
Larger effects more likely causal.
Weak associations may still be causal if confounding unlikely.

### 2. Consistency
Repeated observation across different populations, settings, times.
Inconsistency doesn't rule out causation (effect modification).

### 3. Specificity
Specific exposure leads to specific outcome.
Less applicable in modern epidemiology (multiple causes common).

### 4. Temporality
Cause must precede effect.
The only criterion that is essential.

### 5. Biological Gradient
Dose-response relationship.
Absence doesn't rule out causation (threshold effects).

### 6. Plausibility
Biologically plausible mechanism.
Limited by current knowledge.

### 7. Coherence
Association coherent with known facts.
Shouldn't contradict established knowledge.

### 8. Experiment
Experimental evidence supports causation.
RCTs provide strongest evidence.

### 9. Analogy
Similar exposures cause similar effects.
Weakest criterion.

## Modern Interpretation
Not a checklist - use judgment.
No single criterion sufficient.
Temporality is necessary but not sufficient.
Strength of evidence varies by context.
`;

  const hillChunks = chunkText(hillContent);
  hillChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Bradford Hill 1965',
        category: 'seminal',
        title: 'Criteria for Causation',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Cochrane 1972
  const cochraneContent = `
# Archie Cochrane: Effectiveness and Efficiency

## Citation
Cochrane AL. Effectiveness and Efficiency: Random Reflections on Health Services. London: Nuffield Provincial Hospitals Trust; 1972.

## Historical Significance
Foundational text for evidence-based medicine.
Inspired creation of Cochrane Collaboration.

## Key Concepts

### Effectiveness vs Efficacy
Efficacy: Does it work under ideal conditions?
Effectiveness: Does it work in real practice?

### The RCT as Gold Standard
"The RCT is a very beautiful technique, of wide applicability, but as with everything else there are snags."
Advocated for randomized trials to evaluate treatments.

### Efficiency
Maximizing health outcomes with limited resources.
Need to know what works before spending.

### Criticism of Medical Practice
Many treatments adopted without evidence.
Need for systematic evaluation.

## Famous Quote
"It is surely a great criticism of our profession that we have not organised a critical summary, by specialty or subspecialty, adapted periodically, of all relevant randomised controlled trials."

## Legacy
- Cochrane Collaboration (1993)
- Cochrane Library
- Systematic review methodology
- Evidence-based medicine movement

## Relevance Today
Principles remain fundamental.
Systematic reviews address his call.
Meta-analysis provides the "critical summary."
`;

  const cochraneChunks = chunkText(cochraneContent);
  cochraneChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'Cochrane 1972',
        category: 'seminal',
        title: 'Effectiveness and Efficiency',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  return chunks;
}

function getRDocsContent(): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // metafor package
  const metaforContent = `
# metafor Package Reference

## Installation
install.packages("metafor")
library(metafor)

## escalc() - Calculate Effect Sizes
escalc(measure, ai, bi, ci, di, n1i, n2i, m1i, m2i, sd1i, sd2i, data)

Common measures:
- "OR": Odds Ratio (ai, bi, ci, di)
- "RR": Risk Ratio (ai, bi, ci, di)
- "RD": Risk Difference (ai, bi, ci, di)
- "MD": Mean Difference (m1i, sd1i, n1i, m2i, sd2i, n2i)
- "SMD": Standardized Mean Difference
- "COR": Correlation (ri, ni)

Example:
dat <- escalc(measure = "OR", ai = events_t, bi = nonevents_t, ci = events_c, di = nonevents_c, data = mydata)

## rma() - Random/Fixed Effects Meta-Analysis
rma(yi, vi, sei, data, method = "REML", mods)

Methods: "FE" (fixed), "DL" (DerSimonian-Laird), "REML" (default), "ML", "PM", "EB"

Example:
res <- rma(yi, vi, data = dat)
res <- rma(yi, vi, mods = ~ year + quality, data = dat)

Output: res$b (estimate), res$se, res$tau2, res$I2, res$QE

## forest() - Forest Plot
forest(x, addpred = FALSE, showweights = FALSE, header = TRUE)

Example:
forest(res, addpred = TRUE, showweights = TRUE, order = "prec")

## funnel() - Funnel Plot
funnel(x, yaxis = "sei")

Example:
funnel(res, level = c(90, 95, 99), shade = c("white", "gray", "darkgray"))

## regtest() - Egger's Test
regtest(x, model = "rma", predictor = "sei")

Example:
regtest(res)  # Egger's test
regtest(res, predictor = "ni")  # Peters' test

## trimfill() - Trim and Fill
trimfill(x, side = "left")

Example:
res_tf <- trimfill(res)
funnel(res_tf)

## leave1out() - Sensitivity Analysis
l1o <- leave1out(res)
forest(l1o)

## influence() - Influence Diagnostics
inf <- influence(res)
plot(inf)
`;

  const metaforChunks = chunkText(metaforContent);
  metaforChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'metafor R package',
        category: 'r-docs',
        title: 'metafor Package Reference',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // meta package
  const metaContent = `
# meta Package Reference

## Installation
install.packages("meta")
library(meta)

## metabin() - Binary Outcomes
metabin(event.e, n.e, event.c, n.c, studlab, data, sm = "OR", method = "MH")

sm: "OR", "RR", "RD"
method: "MH" (Mantel-Haenszel), "Inverse", "Peto"

Example:
m <- metabin(events_t, n_t, events_c, n_c, studlab = study, data = mydata, sm = "OR")

## metacont() - Continuous Outcomes
metacont(n.e, mean.e, sd.e, n.c, mean.c, sd.c, studlab, data, sm = "MD")

sm: "MD", "SMD", "ROM"

Example:
m <- metacont(n_t, mean_t, sd_t, n_c, mean_c, sd_c, studlab = study, data = mydata)

## metagen() - Generic Meta-Analysis
metagen(TE, seTE, studlab, data, sm = "")

Example:
m <- metagen(TE = log_or, seTE = se_log_or, studlab = study, data = mydata, sm = "OR")

## metaprop() - Proportions
metaprop(event, n, studlab, data)

## metacor() - Correlations
metacor(cor, n, studlab, data)

## forest() - Forest Plot
forest(m, sortvar = year, prediction = TRUE, print.tau2 = TRUE)

## funnel() - Funnel Plot
funnel(m, studlab = TRUE, contour = c(0.9, 0.95, 0.99))

## metabias() - Publication Bias Tests
metabias(m, method.bias = "linreg")  # Egger's
metabias(m, method.bias = "rank")    # Begg's
metabias(m, method.bias = "peters")  # Peters'

## trimfill() - Trim and Fill
tf <- trimfill(m)

## Subgroup Analysis
m <- metabin(..., subgroup = region, data = mydata)
forest(m, subgroup = TRUE)

## Meta-Regression
mr <- metareg(m, ~ year)
bubble(mr)
`;

  const metaChunks = chunkText(metaContent);
  metaChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'meta R package',
        category: 'r-docs',
        title: 'meta Package Reference',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  // Common R errors
  const errorsContent = `
# Common R Errors in Meta-Analysis

## "Studies with non-positive sampling variances"
Cause: Zero cells in 2x2 table, or calculated variance ≤ 0.
Fix: Add continuity correction.
dat <- escalc(measure = "OR", ..., add = 0.5, to = "only0")

## "Model did not converge"
Cause: Optimization failed, often with few studies or extreme values.
Fix: Try different optimizer or method.
res <- rma(yi, vi, data = dat, control = list(optimizer = "optim"))
res <- rma(yi, vi, data = dat, method = "DL")

## "yi and vi must be of the same length"
Cause: Mismatched data vectors.
Fix: Check for NA values, ensure same number of rows.
dat <- na.omit(dat[, c("yi", "vi")])

## "Cannot compute Q-test"
Cause: Only one study or all identical effects.
Fix: Need at least 2 studies with different effects.

## "Redundant predictors in model"
Cause: Perfect collinearity in meta-regression.
Fix: Remove redundant variables.
res <- rma(yi, vi, mods = ~ var1, data = dat)  # Remove var2

## "Fisher scoring algorithm did not converge"
Cause: REML estimation failed.
Fix: Use simpler method or check data.
res <- rma(yi, vi, data = dat, method = "DL")

## "Object 'yi' not found"
Cause: Effect sizes not calculated or wrong column names.
Fix: Run escalc() first, check column names.
dat <- escalc(measure = "OR", ...)
names(dat)  # Check yi and vi exist

## Debugging Tips
1. Check data: summary(dat), str(dat)
2. Look for NA: sum(is.na(dat$yi))
3. Check variance: any(dat$vi <= 0)
4. Start simple: method = "FE" first
5. Inspect individual studies: dat[dat$vi <= 0, ]
`;

  const errorChunks = chunkText(errorsContent);
  errorChunks.forEach((text, i) => {
    chunks.push({
      text,
      metadata: {
        source: 'R Error Patterns',
        category: 'r-docs',
        title: 'Common R Errors and Solutions',
        section: `Part ${i + 1}`,
        keywords: extractKeywords(text),
      },
    });
  });

  return chunks;
}

// ============================================================================
// Main Script
// ============================================================================

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Meta Agent Embeddings Generator                        ║');
  console.log('║     Gemini Embeddings API                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check for API key
  if (!GEMINI_API_KEY) {
    console.error('\n❌ Error: GEMINI_API_KEY environment variable not set');
    console.log('\nUsage:');
    console.log('  GEMINI_API_KEY=your-key npx tsx scripts/generate-embeddings.ts');
    process.exit(1);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  let outputPath = DEFAULT_OUTPUT;
  let dimensions = DEFAULT_DIMENSIONS;
  let categoryFilter: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[++i];
    } else if (args[i] === '--dimensions' && args[i + 1]) {
      dimensions = parseInt(args[++i], 10);
      if (![768, 1536, 3072].includes(dimensions)) {
        console.error('Invalid dimensions. Use 768, 1536, or 3072.');
        process.exit(1);
      }
    } else if (args[i] === '--category' && args[i + 1]) {
      categoryFilter = args[++i];
    }
  }

  console.log(`\n📊 Configuration:`);
  console.log(`   Model: ${EMBEDDING_MODEL}`);
  console.log(`   Dimensions: ${dimensions}`);
  console.log(`   Output: ${outputPath}`);
  if (categoryFilter) {
    console.log(`   Category: ${categoryFilter}`);
  }

  // Collect all content chunks
  console.log('\n📚 Collecting content chunks...');
  
  let allChunks: ContentChunk[] = [];
  
  if (!categoryFilter || categoryFilter === 'cochrane') {
    const cochrane = getCochraneContent();
    allChunks.push(...cochrane);
    console.log(`   ✓ Cochrane Handbook: ${cochrane.length} chunks`);
  }
  
  if (!categoryFilter || categoryFilter === 'seminal') {
    const seminal = getSeminalPapersContent();
    allChunks.push(...seminal);
    console.log(`   ✓ Seminal Papers: ${seminal.length} chunks`);
  }
  
  if (!categoryFilter || categoryFilter === 'r-docs') {
    const rdocs = getRDocsContent();
    allChunks.push(...rdocs);
    console.log(`   ✓ R Documentation: ${rdocs.length} chunks`);
  }

  console.log(`\n   Total chunks: ${allChunks.length}`);

  // Generate embeddings
  console.log('\n🔄 Generating embeddings...');
  
  const texts = allChunks.map(c => c.text);
  const embeddings = await generateEmbeddings(texts, TASK_TYPES.document, dimensions);
  
  console.log(`   ✓ Generated ${embeddings.length} embeddings`);

  // Create vector store
  const vectorStore: VectorStore = {
    version: '1.0.0',
    model: EMBEDDING_MODEL,
    dimensions,
    created: new Date().toISOString(),
    chunks: allChunks.map((chunk, i) => ({
      id: `chunk_${i}_${chunk.metadata.category}`,
      text: chunk.text,
      embedding: embeddings[i],
      metadata: chunk.metadata,
    })),
    stats: {
      totalChunks: allChunks.length,
      totalTokens: texts.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0),
      categories: allChunks.reduce((acc, c) => {
        acc[c.metadata.category] = (acc[c.metadata.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
  };

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write vector store
  console.log('\n💾 Saving vector store...');
  fs.writeFileSync(outputPath, JSON.stringify(vectorStore, null, 2));
  
  const fileSizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  console.log(`   ✓ Saved to: ${outputPath}`);
  console.log(`   ✓ File size: ${fileSizeKB} KB`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`   Total chunks: ${vectorStore.stats.totalChunks}`);
  console.log(`   Estimated tokens: ${vectorStore.stats.totalTokens}`);
  console.log(`   Categories:`);
  for (const [cat, count] of Object.entries(vectorStore.stats.categories)) {
    console.log(`     - ${cat}: ${count} chunks`);
  }
  console.log('\n✅ Embeddings generation complete!');
  console.log('\nYou can now use this vector store for offline semantic search.');
}

main().catch(console.error);
