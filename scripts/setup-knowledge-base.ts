#!/usr/bin/env npx tsx
/**
 * Meta Agent Knowledge Base Setup Script
 * 
 * Uploads documents to Gemini File Search stores for RAG-grounded responses.
 * 
 * Usage:
 *   GEMINI_API_KEY=your-key npx tsx scripts/setup-knowledge-base.ts
 * 
 * Or with specific stores:
 *   npx tsx scripts/setup-knowledge-base.ts --store cochrane
 *   npx tsx scripts/setup-knowledge-base.ts --store seminal-papers
 *   npx tsx scripts/setup-knowledge-base.ts --store r-docs
 *   npx tsx scripts/setup-knowledge-base.ts --list
 *   npx tsx scripts/setup-knowledge-base.ts --delete cochrane
 * 
 * @see https://ai.google.dev/gemini-api/docs/file-search
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// File Search Store names (globally scoped)
const STORES = {
  'cochrane': 'meta-agent-cochrane-handbook',
  'seminal-papers': 'meta-agent-seminal-papers',
  'r-docs': 'meta-agent-r-documentation',
  'r-errors': 'meta-agent-r-error-patterns',
  'teaching': 'meta-agent-teaching-resources',
} as const;

type StoreKey = keyof typeof STORES;

// ============================================================================
// API Client
// ============================================================================

interface FileSearchStore {
  name: string;
  displayName: string;
  createTime?: string;
  updateTime?: string;
}

interface Operation {
  name: string;
  done: boolean;
  error?: { code: number; message: string };
  response?: unknown;
}

async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown
): Promise<unknown> {
  const url = `${BASE_URL}${endpoint}?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

async function createFileSearchStore(displayName: string): Promise<FileSearchStore> {
  console.log(`📦 Creating File Search Store: ${displayName}`);
  
  const result = await apiRequest('/fileSearchStores', 'POST', {
    displayName,
  });
  
  console.log(`   ✓ Created: ${(result as FileSearchStore).name}`);
  return result as FileSearchStore;
}

async function listFileSearchStores(): Promise<FileSearchStore[]> {
  const result = await apiRequest('/fileSearchStores') as { fileSearchStores?: FileSearchStore[] };
  return result.fileSearchStores || [];
}

async function deleteFileSearchStore(name: string, force = true): Promise<void> {
  console.log(`🗑️  Deleting File Search Store: ${name}`);
  await apiRequest(`/${name}?force=${force}`, 'DELETE');
  console.log(`   ✓ Deleted`);
}

async function uploadFile(filePath: string, displayName: string): Promise<string> {
  console.log(`📄 Uploading file: ${displayName}`);
  
  const fileContent = fs.readFileSync(filePath);
  const mimeType = filePath.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
  
  // Use multipart upload for files
  const boundary = '---MetaAgentUpload' + Date.now();
  const metadata = JSON.stringify({ displayName });
  
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
    Buffer.from(metadata + '\r\n'),
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload Error ${response.status}: ${error}`);
  }

  const result = await response.json() as { file: { name: string } };
  console.log(`   ✓ Uploaded: ${result.file.name}`);
  return result.file.name;
}

async function importFileToStore(
  storeName: string,
  fileName: string,
  metadata?: { key: string; string_value?: string; numeric_value?: number }[]
): Promise<Operation> {
  console.log(`📥 Importing to store: ${storeName}`);
  
  const body: Record<string, unknown> = { fileName };
  if (metadata) {
    body.customMetadata = metadata;
  }
  
  const result = await apiRequest(`/${storeName}:importFile`, 'POST', body);
  return result as Operation;
}

async function waitForOperation(operationName: string): Promise<void> {
  console.log(`⏳ Waiting for operation: ${operationName}`);
  
  let operation: Operation;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  do {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await apiRequest(`/${operationName}`) as Operation;
    attempts++;
    process.stdout.write('.');
  } while (!operation.done && attempts < maxAttempts);
  
  console.log('');
  
  if (operation.error) {
    throw new Error(`Operation failed: ${operation.error.message}`);
  }
  
  console.log(`   ✓ Operation complete`);
}

// ============================================================================
// Knowledge Base Content
// ============================================================================

interface KnowledgeDocument {
  title: string;
  filename: string;
  content: string;
  metadata: { key: string; string_value: string }[];
}

function getCochraneHandbookContent(): KnowledgeDocument[] {
  return [
    {
      title: 'Cochrane Handbook - Chapter 6: Choosing Effect Measures',
      filename: 'cochrane-ch6-effect-measures.md',
      content: `# Cochrane Handbook Chapter 6: Choosing Effect Measures and Computing Estimates of Effect

## 6.1 Introduction to Effect Measures

Effect measures quantify the relationship between an intervention and an outcome. The choice of effect measure depends on the type of outcome data.

## 6.2 Effect Measures for Dichotomous Outcomes

### 6.2.1 Risk Ratio (Relative Risk, RR)
The risk ratio is the ratio of the risk of an event in the intervention group to the risk in the control group.

**Formula:** RR = (a/n1) / (c/n2)

Where:
- a = events in intervention group
- n1 = total in intervention group  
- c = events in control group
- n2 = total in control group

**Interpretation:**
- RR = 1: No difference between groups
- RR < 1: Intervention reduces risk
- RR > 1: Intervention increases risk

**When to use:** Preferred for cohort studies and RCTs. Intuitive interpretation.

### 6.2.2 Odds Ratio (OR)
The odds ratio is the ratio of the odds of an event in the intervention group to the odds in the control group.

**Formula:** OR = (a/b) / (c/d) = (a×d) / (b×c)

Where:
- a = events in intervention group
- b = non-events in intervention group
- c = events in control group
- d = non-events in control group

**Interpretation:**
- OR ≈ RR when events are rare (<10%)
- OR overestimates RR for common outcomes
- OR is symmetric (OR for event = 1/OR for non-event)

**When to use:** Required for case-control studies. Mathematically convenient properties.

### 6.2.3 Risk Difference (RD)
The absolute difference in risk between intervention and control groups.

**Formula:** RD = (a/n1) - (c/n2)

**Interpretation:**
- RD = 0: No difference
- Directly interpretable as absolute change in probability
- Can calculate Number Needed to Treat: NNT = 1/|RD|

## 6.3 Effect Measures for Continuous Outcomes

### 6.3.1 Mean Difference (MD)
Used when all studies measure the outcome on the same scale.

**Formula:** MD = Mean_intervention - Mean_control

**When to use:** Same measurement scale across studies (e.g., all using mmHg for blood pressure).

### 6.3.2 Standardized Mean Difference (SMD)
Used when studies measure the same concept but on different scales.

**Formula:** SMD = (Mean_intervention - Mean_control) / SD_pooled

**Interpretation (Cohen's conventions):**
- SMD = 0.2: Small effect
- SMD = 0.5: Medium effect
- SMD = 0.8: Large effect

**When to use:** Different scales measuring same construct (e.g., different pain scales).

## 6.4 Variance and Standard Error

For meta-analysis, we need both the effect estimate and its variance (or standard error).

**Standard Error of log(RR):**
SE(log RR) = √(1/a - 1/n1 + 1/c - 1/n2)

**Standard Error of log(OR):**
SE(log OR) = √(1/a + 1/b + 1/c + 1/d)

**Standard Error of RD:**
SE(RD) = √((a×b)/n1³ + (c×d)/n2³)

**Standard Error of MD:**
SE(MD) = √(SD1²/n1 + SD2²/n2)

## 6.5 Converting Between Effect Measures

### OR to RR conversion (when baseline risk known):
RR = OR / (1 - p_control + p_control × OR)

### SMD to OR (logistic approximation):
log(OR) ≈ SMD × π/√3 ≈ SMD × 1.81

## Key Teaching Points

1. **Always report confidence intervals** - Point estimates alone are insufficient
2. **Consider clinical significance** - Statistical significance ≠ clinical importance
3. **Match effect measure to study design** - OR for case-control, RR/RD for cohort/RCT
4. **Be consistent within a meta-analysis** - Don't mix effect measures
5. **Consider absolute vs relative effects** - RR may be misleading without baseline risk context
`,
      metadata: [
        { key: 'source', string_value: 'Cochrane Handbook' },
        { key: 'chapter', string_value: '6' },
        { key: 'topic', string_value: 'effect-measures' },
      ],
    },
    {
      title: 'Cochrane Handbook - Chapter 10: Analysing Data and Undertaking Meta-analyses',
      filename: 'cochrane-ch10-meta-analysis.md',
      content: `# Cochrane Handbook Chapter 10: Analysing Data and Undertaking Meta-analyses

## 10.1 Introduction

Meta-analysis is the statistical combination of results from two or more separate studies. The goal is to obtain a more precise estimate of the effect of an intervention.

## 10.2 Fixed-Effect vs Random-Effects Models

### 10.2.1 Fixed-Effect Model (Inverse Variance Method)

Assumes all studies estimate the same underlying true effect.

**Pooled estimate:**
θ_pooled = Σ(w_i × θ_i) / Σw_i

**Weight:** w_i = 1/SE_i²

**When to use:**
- Studies are functionally identical
- Heterogeneity is minimal (I² < 25%)
- Interest is in the specific studies included

### 10.2.2 Random-Effects Model (DerSimonian-Laird)

Assumes true effects vary between studies, following a distribution.

**Between-study variance (τ²):**
τ² = max(0, (Q - df) / C)

Where:
- Q = Cochran's Q statistic
- df = number of studies - 1
- C = Σw_i - Σw_i²/Σw_i

**Adjusted weights:**
w*_i = 1/(SE_i² + τ²)

**When to use:**
- Clinical or methodological diversity expected
- Heterogeneity is substantial (I² > 50%)
- Generalizing beyond included studies

### 10.2.3 REML and Other Estimators

DerSimonian-Laird can underestimate τ². Alternatives include:
- **REML (Restricted Maximum Likelihood):** More accurate τ² estimation
- **Paule-Mandel:** Iterative estimator
- **Hartung-Knapp adjustment:** Better CI coverage for small number of studies

## 10.3 Heterogeneity Assessment

### 10.3.1 Cochran's Q Test

**Formula:** Q = Σw_i(θ_i - θ_pooled)²

**Interpretation:**
- Tests H0: all studies share same true effect
- Low power with few studies
- p < 0.10 often used as threshold (not 0.05)

### 10.3.2 I² Statistic (Higgins & Thompson)

**Formula:** I² = max(0, (Q - df)/Q × 100%)

**Interpretation:**
- I² = 0%: No heterogeneity
- I² = 25%: Low heterogeneity
- I² = 50%: Moderate heterogeneity
- I² = 75%: High heterogeneity

**Advantages over Q:**
- Not dependent on number of studies
- Intuitive percentage interpretation
- Comparable across meta-analyses

### 10.3.3 Prediction Interval

Shows the range where the true effect of a new study would likely fall.

**Formula:** θ_pooled ± t_(df, 0.975) × √(SE²_pooled + τ²)

More informative than confidence interval when heterogeneity exists.

## 10.4 Subgroup Analysis

### Purpose
- Explain heterogeneity
- Examine effect modification
- Generate hypotheses (not confirm)

### Methods
1. **Separate meta-analyses:** Pool within subgroups
2. **Meta-regression:** Continuous or categorical moderators
3. **Interaction test:** Compare subgroup effects formally

### Cautions
- Pre-specify subgroups in protocol
- Limit number of subgroup analyses
- Ecological fallacy: subgroup effects ≠ individual effects
- Multiple testing increases false positives

## 10.5 Sensitivity Analysis

### Purpose
Test robustness of conclusions to analytical decisions.

### Common Approaches
1. **Leave-one-out:** Remove each study sequentially
2. **Risk of bias:** Exclude high-risk studies
3. **Model choice:** Compare fixed vs random effects
4. **Effect measure:** Compare OR vs RR
5. **Outlier removal:** Exclude statistical outliers

## 10.6 Meta-regression

**Model:** θ_i = β_0 + β_1×X_i + ε_i + ζ_i

Where:
- X_i = study-level covariate
- ε_i = within-study error
- ζ_i = between-study error (random effects)

**Cautions:**
- Requires ≥10 studies per covariate
- Ecological bias (aggregation fallacy)
- Confounding between covariates
- Overfitting with multiple covariates

## Key Teaching Points

1. **Random effects is not always "safer"** - Can give too much weight to small studies
2. **I² alone is insufficient** - Report τ² and prediction intervals too
3. **Heterogeneity is expected** - Clinical diversity is normal
4. **Subgroups need pre-specification** - Post-hoc fishing is unreliable
5. **Sensitivity analysis is essential** - Test robustness of conclusions
`,
      metadata: [
        { key: 'source', string_value: 'Cochrane Handbook' },
        { key: 'chapter', string_value: '10' },
        { key: 'topic', string_value: 'meta-analysis-methods' },
      ],
    },
    {
      title: 'Cochrane Handbook - Chapter 8: Risk of Bias Assessment',
      filename: 'cochrane-ch8-risk-of-bias.md',
      content: `# Cochrane Handbook Chapter 8: Assessing Risk of Bias in Included Studies

## 8.1 Introduction to Bias

Bias is a systematic error that leads to deviation of results from the truth. Risk of bias assessment evaluates the likelihood that study design, conduct, or reporting introduced bias.

## 8.2 The Cochrane Risk of Bias Tool (RoB 2)

RoB 2 assesses bias in randomized trials across five domains:

### Domain 1: Randomization Process

**Signalling questions:**
1.1 Was the allocation sequence random?
1.2 Was the allocation sequence concealed until participants were enrolled?
1.3 Did baseline differences suggest a problem with randomization?

**Low risk:** Computer-generated sequence + central allocation
**High risk:** Alternation, birth dates, or allocation known before enrollment

### Domain 2: Deviations from Intended Interventions

**For effect of assignment (intention-to-treat):**
2.1 Were participants aware of their assigned intervention?
2.2 Were carers/people delivering aware?
2.3 Were there deviations due to the trial context?
2.4 Were deviations balanced between groups?

**For effect of adhering (per-protocol):**
2.5 Was an appropriate analysis used to estimate the effect of adhering?

### Domain 3: Missing Outcome Data

**Signalling questions:**
3.1 Were data available for all/nearly all participants?
3.2 Is there evidence that result was not biased by missing data?
3.3 Could missingness depend on the true value?

**Low risk:** <5% missing, balanced between groups, reasons unrelated to outcome
**High risk:** Differential dropout, missing data related to outcome

### Domain 4: Measurement of the Outcome

**Signalling questions:**
4.1 Was the method of measuring appropriate?
4.2 Could measurement differ between groups?
4.3 Were outcome assessors aware of intervention?
4.4 Could assessment be influenced by knowledge of intervention?

**Low risk:** Objective outcomes or blinded assessment
**High risk:** Subjective outcomes with unblinded assessment

### Domain 5: Selection of the Reported Result

**Signalling questions:**
5.1 Were data analyzed according to a pre-specified plan?
5.2 Is the numerical result likely selected from multiple analyses?
5.3 Is the numerical result likely selected from multiple measurements?

**Low risk:** Protocol available, analysis matches protocol
**High risk:** Multiple outcomes measured but only some reported

## 8.3 Overall Risk of Bias Judgment

**Low risk:** Low risk in all domains
**Some concerns:** Some concerns in at least one domain, no high risk
**High risk:** High risk in at least one domain, or some concerns in multiple domains

## 8.4 ROBINS-I for Non-Randomized Studies

Seven domains for non-randomized studies of interventions:

1. **Confounding:** Were important confounders controlled?
2. **Selection:** Was selection into the study related to intervention and outcome?
3. **Classification of interventions:** Was intervention status well-defined?
4. **Deviations from intended interventions:** Similar to RoB 2
5. **Missing data:** Similar to RoB 2
6. **Measurement of outcomes:** Similar to RoB 2
7. **Selection of reported result:** Similar to RoB 2

## 8.5 Presenting Risk of Bias

### Traffic Light Plot
Visual summary showing risk for each study × domain combination.
- Green = Low risk
- Yellow = Some concerns
- Red = High risk

### Summary Bar Chart
Proportion of studies at each risk level per domain.

## 8.6 Incorporating Risk of Bias in Synthesis

### Approaches:
1. **Restrict analysis:** Include only low-risk studies
2. **Sensitivity analysis:** Compare results with/without high-risk studies
3. **Subgroup analysis:** Stratify by risk of bias level
4. **GRADE assessment:** Downgrade certainty for serious risk of bias

## Key Teaching Points

1. **Assess risk of bias, not quality** - Focus on systematic error, not reporting quality
2. **Domain-specific judgments** - Don't combine into single score
3. **Outcome-specific assessment** - Bias may differ by outcome
4. **Use signalling questions** - Structured approach reduces subjectivity
5. **Two reviewers independently** - Resolve disagreements by discussion
6. **Document rationale** - Explain judgments with supporting quotes
`,
      metadata: [
        { key: 'source', string_value: 'Cochrane Handbook' },
        { key: 'chapter', string_value: '8' },
        { key: 'topic', string_value: 'risk-of-bias' },
      ],
    },
    {
      title: 'Cochrane Handbook - Chapter 13: Publication Bias',
      filename: 'cochrane-ch13-publication-bias.md',
      content: `# Cochrane Handbook Chapter 13: Assessing Risk of Bias Due to Missing Results

## 13.1 Introduction to Publication Bias

Publication bias occurs when the publication of research depends on the nature and direction of results. Studies with statistically significant, positive results are more likely to be published.

## 13.2 Types of Reporting Bias

### 13.2.1 Publication Bias
Studies with significant results more likely to be published.

### 13.2.2 Time-lag Bias
Significant results published more quickly.

### 13.2.3 Language Bias
Significant results more likely published in English.

### 13.2.4 Citation Bias
Significant results more likely to be cited.

### 13.2.5 Outcome Reporting Bias
Selective reporting of outcomes within published studies.

## 13.3 Detecting Publication Bias

### 13.3.1 Funnel Plot

A scatter plot of effect estimates against their precision (usually SE or 1/SE).

**Expected pattern (no bias):**
- Symmetric, inverted funnel shape
- Large studies cluster at top near pooled estimate
- Small studies scatter widely at bottom

**Asymmetry suggests:**
- Publication bias (missing small negative studies)
- Small-study effects (different mechanisms)
- Heterogeneity
- Chance (especially with <10 studies)

### 13.3.2 Egger's Test

Linear regression of effect estimates on their standard errors.

**Test:** H0: intercept = 0
**Interpretation:** Significant intercept suggests asymmetry

**Formula:** θ_i/SE_i = β_0 + β_1 × (1/SE_i) + ε_i

**Limitations:**
- Low power with <10 studies
- Inflated Type I error with binary outcomes
- Can be significant due to heterogeneity

### 13.3.3 Begg's Test (Rank Correlation)

Kendall's tau between effect estimates and their variances.

**Less powerful than Egger's but fewer assumptions.**

### 13.3.4 Peters' Test

For binary outcomes, regresses log(OR) on 1/total sample size.
More appropriate than Egger's for odds ratios.

## 13.4 Adjusting for Publication Bias

### 13.4.1 Trim and Fill

1. Estimate number of "missing" studies from asymmetry
2. Impute missing studies as mirror images
3. Re-calculate pooled estimate

**Limitations:**
- Assumes asymmetry is solely due to publication bias
- May over-correct if heterogeneity present
- Imputed studies are hypothetical

### 13.4.2 Selection Models

Model the selection process mathematically.

**Copas selection model:**
- Models probability of publication as function of study characteristics
- Provides sensitivity analysis across selection scenarios

### 13.4.3 PET-PEESE

**PET (Precision-Effect Test):**
θ_i = β_0 + β_1 × SE_i + ε_i

If β_0 significant, use as bias-corrected estimate.

**PEESE (Precision-Effect Estimate with Standard Error):**
θ_i = β_0 + β_1 × SE_i² + ε_i

Use PEESE if PET rejects H0: β_0 = 0.

## 13.5 Preventing Publication Bias

### 13.5.1 Prospective Registration
- Register protocols before conducting studies
- ClinicalTrials.gov, PROSPERO, OSF

### 13.5.2 Comprehensive Searching
- Grey literature (dissertations, conference abstracts)
- Trial registries for unpublished results
- Contact authors for unpublished data

### 13.5.3 Reporting Guidelines
- CONSORT for trials
- PRISMA for systematic reviews
- Require complete outcome reporting

## 13.6 GRADE Assessment for Publication Bias

**Downgrade certainty when:**
- Funnel plot shows clear asymmetry
- Statistical tests significant
- Comprehensive search was not possible
- Commercial interests may influence publication

**Do not downgrade when:**
- <10 studies (tests unreliable)
- Asymmetry explained by heterogeneity
- Comprehensive search conducted

## Key Teaching Points

1. **Funnel plots need ≥10 studies** - Unreliable with fewer
2. **Asymmetry ≠ publication bias** - Consider other explanations
3. **Prevention > detection** - Register protocols, search comprehensively
4. **Trim-and-fill is sensitivity analysis** - Not a correction
5. **Report but interpret cautiously** - Tests have limitations
6. **Consider outcome reporting bias** - Within-study selective reporting
`,
      metadata: [
        { key: 'source', string_value: 'Cochrane Handbook' },
        { key: 'chapter', string_value: '13' },
        { key: 'topic', string_value: 'publication-bias' },
      ],
    },
  ];
}

function getSeminalPapersContent(): KnowledgeDocument[] {
  return [
    {
      title: 'DerSimonian & Laird 1986 - Random Effects Meta-Analysis',
      filename: 'dersimonian-laird-1986.md',
      content: `# DerSimonian & Laird (1986): Meta-analysis in Clinical Trials

## Citation
DerSimonian R, Laird N. Meta-analysis in clinical trials. Control Clin Trials. 1986;7(3):177-188.

## Historical Significance
This paper introduced the most widely used method for random-effects meta-analysis. It remains the default method in most meta-analysis software 40 years later.

## The Problem Addressed
Before 1986, most meta-analyses used fixed-effect models assuming all studies estimate the same true effect. DerSimonian and Laird recognized that clinical and methodological differences between studies create genuine variation in true effects.

## The DerSimonian-Laird Method

### Model
Y_i = θ + u_i + ε_i

Where:
- Y_i = observed effect in study i
- θ = overall mean effect
- u_i ~ N(0, τ²) = between-study variation
- ε_i ~ N(0, σ_i²) = within-study sampling error

### Estimating Between-Study Variance (τ²)

**Step 1:** Calculate Q statistic
Q = Σw_i(Y_i - Ȳ_w)²

Where w_i = 1/σ_i² and Ȳ_w = Σw_iY_i/Σw_i

**Step 2:** Estimate τ²
τ² = max(0, (Q - (k-1))/C)

Where:
- k = number of studies
- C = Σw_i - Σw_i²/Σw_i

### Pooled Estimate

**Adjusted weights:** w*_i = 1/(σ_i² + τ²)

**Pooled effect:** θ̂ = Σw*_iY_i / Σw*_i

**Variance:** Var(θ̂) = 1/Σw*_i

## Key Insights from the Paper

1. **Heterogeneity is expected:** "In practice, it is unlikely that studies are ever exactly comparable."

2. **Random effects as default:** When heterogeneity exists, random effects provides more appropriate inference.

3. **Conservative approach:** Random effects gives wider confidence intervals, reflecting uncertainty about between-study variation.

4. **Method of moments:** The τ² estimator is simple and doesn't require distributional assumptions.

## Limitations (Recognized Later)

1. **Underestimates τ²:** Especially with few studies
2. **CI coverage:** Confidence intervals can be too narrow
3. **Negative τ² truncated to 0:** Loses information

## Modern Alternatives

- **REML:** Restricted maximum likelihood (less biased)
- **Paule-Mandel:** Iterative method
- **Hartung-Knapp:** Better CI coverage
- **Bayesian methods:** Full uncertainty quantification

## Impact
- Over 50,000 citations
- Default method in RevMan, Stata, R packages
- Foundation for all subsequent random-effects developments

## R Implementation
\`\`\`r
library(metafor)
# DerSimonian-Laird is the default
rma(yi, vi, data = dat, method = "DL")

# Compare with REML
rma(yi, vi, data = dat, method = "REML")
\`\`\`
`,
      metadata: [
        { key: 'source', string_value: 'Seminal Paper' },
        { key: 'year', string_value: '1986' },
        { key: 'topic', string_value: 'random-effects' },
        { key: 'authors', string_value: 'DerSimonian, Laird' },
      ],
    },
    {
      title: 'Higgins & Thompson 2002 - I² Statistic',
      filename: 'higgins-thompson-2002.md',
      content: `# Higgins & Thompson (2002): Quantifying Heterogeneity

## Citation
Higgins JPT, Thompson SG. Quantifying heterogeneity in a meta-analysis. Stat Med. 2002;21(11):1539-1558.

## Historical Significance
This paper introduced the I² statistic, which has become the standard measure for reporting heterogeneity in meta-analyses. It solved the problem that Cochran's Q depends on the number of studies.

## The Problem with Cochran's Q

**Q statistic:** Q = Σw_i(θ_i - θ̄)²

**Problems:**
1. Power depends on number of studies (k)
2. Not comparable across meta-analyses
3. Difficult to interpret magnitude

## The I² Statistic

### Definition
I² = max(0, (Q - df)/Q × 100%)

Where df = k - 1 (degrees of freedom)

### Interpretation
I² represents the percentage of total variability due to heterogeneity rather than sampling error.

**Benchmarks (from the paper):**
- I² = 25%: Low heterogeneity
- I² = 50%: Moderate heterogeneity  
- I² = 75%: High heterogeneity

### Advantages over Q

1. **Scale-free:** Percentage from 0-100%
2. **Comparable:** Can compare across meta-analyses
3. **Intuitive:** "75% of variance is real, not sampling error"
4. **Independent of k:** Doesn't increase with more studies

## Related Measures Introduced

### H² Statistic
H² = Q/df

**Interpretation:** Ratio of observed to expected variance
- H² = 1: No heterogeneity
- H² > 1: Heterogeneity present

**Relationship:** I² = (H² - 1)/H²

### Confidence Intervals for I²

The paper also introduced methods for calculating CIs:

**Test-based CI:**
Uses the distribution of Q under heterogeneity.

**Important:** I² can have wide confidence intervals, especially with few studies.

## Key Quotes from the Paper

> "We propose a new quantity, I², which describes the percentage of total variation across studies that is due to heterogeneity rather than chance."

> "Unlike Q, I² does not inherently depend on the number of studies."

> "Values of I² of 25%, 50%, and 75% might be considered as low, moderate, and high heterogeneity."

## Limitations (Recognized Later)

1. **Depends on precision:** Same τ² gives different I² with different study sizes
2. **Benchmarks are arbitrary:** Clinical context matters more
3. **CI often wide:** Especially with <10 studies
4. **Not a test:** I² describes, doesn't test

## What I² Does NOT Tell You

1. **Direction of heterogeneity:** Which studies differ?
2. **Clinical importance:** Is the variation meaningful?
3. **Source of heterogeneity:** Why do studies differ?

## Modern Recommendations

1. **Report τ² alongside I²:** Absolute measure of heterogeneity
2. **Report prediction interval:** Range of true effects
3. **Don't rely on benchmarks:** Consider clinical context
4. **Investigate heterogeneity:** Subgroups, meta-regression

## R Implementation
\`\`\`r
library(metafor)
res <- rma(yi, vi, data = dat)

# I² is automatically calculated
res$I2

# Confidence interval for I²
confint(res)

# Also get H² and τ²
res$H2
res$tau2
\`\`\`

## Impact
- Over 40,000 citations
- Required reporting in Cochrane reviews
- Standard output in all meta-analysis software
`,
      metadata: [
        { key: 'source', string_value: 'Seminal Paper' },
        { key: 'year', string_value: '2002' },
        { key: 'topic', string_value: 'heterogeneity' },
        { key: 'authors', string_value: 'Higgins, Thompson' },
      ],
    },
    {
      title: 'Egger et al 1997 - Publication Bias Detection',
      filename: 'egger-1997.md',
      content: `# Egger et al (1997): Bias in Meta-analysis Detected by a Simple, Graphical Test

## Citation
Egger M, Davey Smith G, Schneider M, Minder C. Bias in meta-analysis detected by a simple, graphical test. BMJ. 1997;315(7109):629-634.

## Historical Significance
This paper introduced Egger's test, the most widely used statistical test for funnel plot asymmetry and potential publication bias.

## The Problem Addressed
Funnel plots (Light & Pillemer, 1984) visualize potential publication bias, but assessment was subjective. Egger et al. provided a formal statistical test.

## The Funnel Plot

### Construction
- X-axis: Effect estimate (OR, RR, SMD)
- Y-axis: Precision (1/SE or SE)

### Expected Pattern (No Bias)
- Symmetric inverted funnel
- Large studies at top, clustered around true effect
- Small studies scattered at bottom

### Asymmetry Suggests
- Publication bias (missing small negative studies)
- Small-study effects
- Heterogeneity
- Chance

## Egger's Regression Test

### The Model
Standardized effect = α + β × precision + ε

Or equivalently:
θ_i/SE_i = α + β × (1/SE_i) + ε_i

### Interpretation
- **β (slope):** Estimates the true effect (if no bias)
- **α (intercept):** Measures asymmetry
- **H0:** α = 0 (symmetric funnel)

### Test Statistic
t = α/SE(α)

Compared to t-distribution with k-2 degrees of freedom.

## Key Findings from the Paper

### Simulation Results
- Test has reasonable power with ≥10 studies
- Type I error controlled at nominal level
- More powerful than Begg's rank correlation

### Empirical Examples
Applied to 38 published meta-analyses:
- 5 showed significant asymmetry (p < 0.1)
- These had evidence of publication bias from other sources

## Limitations Identified

1. **Low power:** Needs ≥10 studies for reliable results
2. **False positives:** Can be significant due to:
   - True heterogeneity
   - Chance with few studies
   - Different effect in small vs large studies (not bias)

3. **Binary outcomes:** Inflated Type I error with odds ratios
   - Use Peters' test instead for OR

## The "Small-Study Effect"

The paper introduced this concept:
> "Asymmetry could arise because of publication bias, but there are other possible explanations."

**Alternative explanations for asymmetry:**
1. True heterogeneity (effect varies by study size)
2. Methodological differences (small studies lower quality)
3. Clinical differences (small studies in sicker patients)
4. Chance (especially with few studies)

## Recommendations from the Paper

1. **Visual inspection first:** Always examine the funnel plot
2. **Use test as supplement:** Not replacement for judgment
3. **Interpret cautiously:** Significant test ≠ publication bias
4. **Consider alternatives:** Other causes of asymmetry

## Modern Developments

### Peters' Test (for OR)
Regresses log(OR) on 1/n (total sample size)
Less prone to false positives with binary outcomes.

### Harbord's Test
Modified Egger's test for odds ratios.

### Contour-Enhanced Funnel Plots
Add significance contours to aid interpretation.

## R Implementation
\`\`\`r
library(metafor)
res <- rma(yi, vi, data = dat)

# Egger's test
regtest(res, model = "lm")

# Funnel plot
funnel(res)

# Peters' test for OR
regtest(res, model = "lm", predictor = "ni")

# Trim and fill
trimfill(res)
\`\`\`

## Impact
- Over 25,000 citations
- Standard test in Cochrane reviews
- Included in all meta-analysis software
- Led to development of many refinements
`,
      metadata: [
        { key: 'source', string_value: 'Seminal Paper' },
        { key: 'year', string_value: '1997' },
        { key: 'topic', string_value: 'publication-bias' },
        { key: 'authors', string_value: 'Egger, Smith, Schneider, Minder' },
      ],
    },
    {
      title: 'PRISMA 2020 Statement',
      filename: 'prisma-2020.md',
      content: `# PRISMA 2020: Updated Guidelines for Reporting Systematic Reviews

## Citation
Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71.

## What is PRISMA?
PRISMA (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) is an evidence-based minimum set of items for reporting systematic reviews and meta-analyses.

## Key Changes from PRISMA 2009

### New Items Added
1. **Registration and protocol:** Report registration number and protocol access
2. **Automation tools:** Report use of automation in screening/extraction
3. **Certainty assessment:** Report methods for assessing certainty (e.g., GRADE)
4. **Data availability:** State whether data are available and how to access

### Expanded Items
1. **Search strategy:** Full strategy for at least one database
2. **Study selection:** Report number of reviewers at each stage
3. **Risk of bias:** Specify tool used and how incorporated in synthesis
4. **Synthesis methods:** More detail on statistical methods

## The PRISMA 2020 Checklist (27 Items)

### Title
1. Identify as systematic review, meta-analysis, or both

### Abstract
2. Structured summary (background, objectives, methods, results, conclusions)

### Introduction
3. Rationale for the review
4. Objectives with PICO elements

### Methods
5. Protocol and registration
6. Eligibility criteria
7. Information sources
8. Search strategy
9. Selection process
10. Data collection process
11. Data items
12. Study risk of bias assessment
13. Effect measures
14. Synthesis methods
15. Reporting bias assessment
16. Certainty assessment

### Results
17. Study selection (with flow diagram)
18. Study characteristics
19. Risk of bias in studies
20. Results of individual studies
21. Results of syntheses
22. Reporting biases
23. Certainty of evidence

### Discussion
24. Discussion of results
25. Limitations
26. Conclusions

### Other
27. Funding and conflicts of interest

## The PRISMA 2020 Flow Diagram

### Structure
**Identification:**
- Records from databases (n = )
- Records from registers (n = )
- Records from other sources (n = )

**Screening:**
- Records after duplicates removed (n = )
- Records screened (n = )
- Records excluded (n = )

**Eligibility:**
- Reports sought for retrieval (n = )
- Reports not retrieved (n = )
- Reports assessed for eligibility (n = )
- Reports excluded with reasons (n = )

**Included:**
- Studies included in review (n = )
- Studies included in meta-analysis (n = )

### New Features in 2020
- Separate tracking for databases vs other sources
- Reports vs studies distinction
- Automation reporting

## PRISMA Extensions

### PRISMA-P (Protocols)
For systematic review protocols.

### PRISMA-IPD (Individual Patient Data)
For IPD meta-analyses.

### PRISMA-NMA (Network Meta-Analysis)
For network meta-analyses.

### PRISMA-S (Search)
Detailed search reporting.

### PRISMA-ScR (Scoping Reviews)
For scoping reviews.

## Key Recommendations

### Registration
> "Authors should register their systematic review in a publicly accessible registry before starting the review."

Registries: PROSPERO, OSF, Cochrane Library

### Protocol
> "Authors should prepare a protocol that describes the planned methods."

### Transparency
> "Authors should report sufficient detail to allow readers to assess the validity and applicability of the findings."

## Common Reporting Deficiencies

1. **Incomplete search strategy:** Only keywords, not full strategy
2. **Missing flow diagram:** Or incomplete flow diagram
3. **No risk of bias assessment:** Or not incorporated in synthesis
4. **Vague synthesis methods:** "Meta-analysis was performed"
5. **No certainty assessment:** GRADE or equivalent not used

## R Implementation for Flow Diagram
\`\`\`r
library(PRISMA2020)

# Create flow diagram data
prisma_data <- prisma_data_template()

# Fill in numbers
prisma_data$n_database_records <- 1500
prisma_data$n_other_records <- 50
# ... etc

# Generate diagram
prisma_flowdiagram(prisma_data)
\`\`\`

## Impact
- Required by most journals for systematic reviews
- Endorsed by Cochrane
- Over 10,000 citations (2020 version)
- Improves transparency and reproducibility
`,
      metadata: [
        { key: 'source', string_value: 'Reporting Guideline' },
        { key: 'year', string_value: '2020' },
        { key: 'topic', string_value: 'reporting-guidelines' },
        { key: 'authors', string_value: 'Page, McKenzie, Bossuyt, et al' },
      ],
    },
  ];
}

function getRDocumentationContent(): KnowledgeDocument[] {
  return [
    {
      title: 'metafor Package - Core Functions Reference',
      filename: 'metafor-reference.md',
      content: `# metafor Package Reference Guide

## Overview
metafor is the most comprehensive R package for meta-analysis, developed by Wolfgang Viechtbauer. It provides functions for fitting various meta-analytic models.

## Installation
\`\`\`r
install.packages("metafor")
library(metafor)
\`\`\`

## Core Functions

### escalc() - Calculate Effect Sizes

**Purpose:** Calculate effect sizes and sampling variances from study data.

**Syntax:**
\`\`\`r
escalc(measure, ai, bi, ci, di, n1i, n2i, m1i, m2i, sd1i, sd2i, ...)
\`\`\`

**Common Measures:**

| Measure | Description | Data Required |
|---------|-------------|---------------|
| "OR" | Odds Ratio | ai, bi, ci, di |
| "RR" | Risk Ratio | ai, bi, ci, di |
| "RD" | Risk Difference | ai, bi, ci, di |
| "MD" | Mean Difference | m1i, sd1i, n1i, m2i, sd2i, n2i |
| "SMD" | Standardized Mean Difference | m1i, sd1i, n1i, m2i, sd2i, n2i |
| "COR" | Correlation | ri, ni |
| "ZCOR" | Fisher's z transformed r | ri, ni |
| "PLO" | Log Odds (proportion) | xi, ni |
| "PR" | Raw Proportion | xi, ni |

**Example:**
\`\`\`r
# Binary outcome (2x2 table)
dat <- escalc(measure = "OR", 
              ai = events_treat, bi = nonevents_treat,
              ci = events_ctrl, di = nonevents_ctrl,
              data = mydata)

# Continuous outcome
dat <- escalc(measure = "SMD",
              m1i = mean_treat, sd1i = sd_treat, n1i = n_treat,
              m2i = mean_ctrl, sd2i = sd_ctrl, n2i = n_ctrl,
              data = mydata)
\`\`\`

### rma() - Random/Fixed Effects Meta-Analysis

**Purpose:** Fit meta-analytic models.

**Syntax:**
\`\`\`r
rma(yi, vi, sei, data, method = "REML", mods, ...)
\`\`\`

**Key Arguments:**
- \`yi\`: Effect size estimates
- \`vi\`: Sampling variances (or \`sei\` for standard errors)
- \`method\`: Estimation method
  - "FE" = Fixed effect
  - "DL" = DerSimonian-Laird
  - "REML" = Restricted maximum likelihood (default)
  - "ML" = Maximum likelihood
  - "PM" = Paule-Mandel
  - "EB" = Empirical Bayes
- \`mods\`: Moderator formula for meta-regression

**Example:**
\`\`\`r
# Basic random-effects meta-analysis
res <- rma(yi, vi, data = dat)
summary(res)

# Fixed-effect model
res_fe <- rma(yi, vi, data = dat, method = "FE")

# Meta-regression with moderator
res_mr <- rma(yi, vi, mods = ~ year + quality, data = dat)
\`\`\`

**Output Interpretation:**
\`\`\`r
# Key statistics
res$b        # Pooled estimate
res$se       # Standard error
res$zval     # z-value
res$pval     # p-value
res$ci.lb    # CI lower bound
res$ci.ub    # CI upper bound
res$tau2     # Between-study variance
res$I2       # I² statistic
res$H2       # H² statistic
res$QE       # Q statistic for heterogeneity
res$QEp      # p-value for Q test
\`\`\`

### forest() - Forest Plot

**Purpose:** Create forest plots.

**Syntax:**
\`\`\`r
forest(x, annotate = TRUE, addfit = TRUE, addpred = FALSE, 
       showweights = FALSE, header = TRUE, ...)
\`\`\`

**Key Arguments:**
- \`addpred\`: Add prediction interval
- \`showweights\`: Show study weights
- \`order\`: Order studies ("obs", "prec", "year", etc.)
- \`xlim\`: x-axis limits
- \`refline\`: Reference line (default = 0 or 1)
- \`slab\`: Study labels

**Example:**
\`\`\`r
# Basic forest plot
forest(res)

# Customized forest plot
forest(res,
       addpred = TRUE,           # Add prediction interval
       showweights = TRUE,       # Show weights
       header = "Author(s), Year",
       xlab = "Odds Ratio",
       refline = 1,              # Reference at OR = 1
       order = "prec")           # Order by precision
\`\`\`

### funnel() - Funnel Plot

**Purpose:** Create funnel plots for publication bias assessment.

**Syntax:**
\`\`\`r
funnel(x, yaxis = "sei", xlim, ylim, ...)
\`\`\`

**Key Arguments:**
- \`yaxis\`: "sei" (SE), "vi" (variance), "seinv" (1/SE), "vinv" (1/variance)
- \`level\`: Confidence levels for contours
- \`shade\`: Shade significance regions

**Example:**
\`\`\`r
# Basic funnel plot
funnel(res)

# Contour-enhanced funnel plot
funnel(res, level = c(90, 95, 99), shade = c("white", "gray", "darkgray"))
\`\`\`

### regtest() - Egger's Test

**Purpose:** Test for funnel plot asymmetry.

**Syntax:**
\`\`\`r
regtest(x, model = "rma", predictor = "sei", ...)
\`\`\`

**Example:**
\`\`\`r
# Egger's test
regtest(res)

# Peters' test (for odds ratios)
regtest(res, predictor = "ni")
\`\`\`

### trimfill() - Trim and Fill

**Purpose:** Estimate and impute missing studies.

**Syntax:**
\`\`\`r
trimfill(x, side = "left", estimator = "L0", ...)
\`\`\`

**Example:**
\`\`\`r
# Trim and fill analysis
res_tf <- trimfill(res)
summary(res_tf)
funnel(res_tf)  # Shows imputed studies
\`\`\`

### leave1out() - Leave-One-Out Analysis

**Purpose:** Sensitivity analysis removing one study at a time.

**Example:**
\`\`\`r
# Leave-one-out analysis
l1o <- leave1out(res)
print(l1o)
forest(l1o)
\`\`\`

### influence() - Influence Diagnostics

**Purpose:** Identify influential studies.

**Example:**
\`\`\`r
# Influence diagnostics
inf <- influence(res)
plot(inf)
\`\`\`

## Common Workflows

### Complete Binary Outcome Analysis
\`\`\`r
library(metafor)

# 1. Calculate effect sizes
dat <- escalc(measure = "OR", 
              ai = events_t, bi = nonevents_t,
              ci = events_c, di = nonevents_c,
              data = mydata)

# 2. Fit model
res <- rma(yi, vi, data = dat, method = "REML")
summary(res)

# 3. Forest plot
forest(res, addpred = TRUE, header = TRUE)

# 4. Funnel plot and tests
funnel(res)
regtest(res)

# 5. Sensitivity analysis
leave1out(res)
influence(res)
\`\`\`

### Meta-Regression
\`\`\`r
# Single moderator
res_mr <- rma(yi, vi, mods = ~ year, data = dat)

# Multiple moderators
res_mr2 <- rma(yi, vi, mods = ~ year + quality + dose, data = dat)

# Categorical moderator
res_sub <- rma(yi, vi, mods = ~ factor(region), data = dat)
\`\`\`

## Troubleshooting Common Errors

### "Studies with non-positive sampling variances"
\`\`\`r
# Check for zero cells
dat[dat$vi <= 0, ]

# Add continuity correction
dat <- escalc(measure = "OR", ..., add = 0.5, to = "only0")
\`\`\`

### "Model did not converge"
\`\`\`r
# Try different optimizer
res <- rma(yi, vi, data = dat, control = list(optimizer = "optim"))

# Or different method
res <- rma(yi, vi, data = dat, method = "DL")
\`\`\`
`,
      metadata: [
        { key: 'source', string_value: 'R Documentation' },
        { key: 'package', string_value: 'metafor' },
        { key: 'topic', string_value: 'reference-guide' },
      ],
    },
    {
      title: 'meta Package - Quick Reference',
      filename: 'meta-reference.md',
      content: `# meta Package Quick Reference

## Overview
The meta package by Guido Schwarzer provides user-friendly functions for common meta-analysis tasks with sensible defaults.

## Installation
\`\`\`r
install.packages("meta")
library(meta)
\`\`\`

## Main Functions

### metabin() - Binary Outcomes

**Purpose:** Meta-analysis of binary outcome data.

**Syntax:**
\`\`\`r
metabin(event.e, n.e, event.c, n.c, studlab, data,
        sm = "OR", method = "MH", ...)
\`\`\`

**Key Arguments:**
- \`event.e\`, \`n.e\`: Events and total in experimental group
- \`event.c\`, \`n.c\`: Events and total in control group
- \`sm\`: Summary measure ("OR", "RR", "RD")
- \`method\`: Pooling method ("MH" = Mantel-Haenszel, "Inverse", "Peto")
- \`method.tau\`: τ² estimator ("DL", "REML", "PM", etc.)

**Example:**
\`\`\`r
m <- metabin(events_treat, n_treat, events_ctrl, n_ctrl,
             studlab = study, data = mydata,
             sm = "OR", method.tau = "REML")
summary(m)
forest(m)
\`\`\`

### metacont() - Continuous Outcomes

**Purpose:** Meta-analysis of continuous outcome data.

**Syntax:**
\`\`\`r
metacont(n.e, mean.e, sd.e, n.c, mean.c, sd.c, studlab, data,
         sm = "MD", ...)
\`\`\`

**Key Arguments:**
- \`n.e\`, \`mean.e\`, \`sd.e\`: Sample size, mean, SD in experimental group
- \`n.c\`, \`mean.c\`, \`sd.c\`: Sample size, mean, SD in control group
- \`sm\`: Summary measure ("MD", "SMD", "ROM")

**Example:**
\`\`\`r
m <- metacont(n_treat, mean_treat, sd_treat,
              n_ctrl, mean_ctrl, sd_ctrl,
              studlab = study, data = mydata,
              sm = "SMD")
summary(m)
\`\`\`

### metagen() - Generic Meta-Analysis

**Purpose:** Meta-analysis with pre-calculated effect sizes.

**Syntax:**
\`\`\`r
metagen(TE, seTE, studlab, data, sm = "", ...)
\`\`\`

**Example:**
\`\`\`r
m <- metagen(TE = log_or, seTE = se_log_or,
             studlab = study, data = mydata,
             sm = "OR")
\`\`\`

### metaprop() - Proportions

**Purpose:** Meta-analysis of single proportions.

**Syntax:**
\`\`\`r
metaprop(event, n, studlab, data, sm = "PLOGIT", ...)
\`\`\`

**Example:**
\`\`\`r
m <- metaprop(events, total, studlab = study, data = mydata)
\`\`\`

### metacor() - Correlations

**Purpose:** Meta-analysis of correlations.

**Syntax:**
\`\`\`r
metacor(cor, n, studlab, data, sm = "ZCOR", ...)
\`\`\`

## Output and Visualization

### forest() - Forest Plot
\`\`\`r
forest(m,
       sortvar = year,           # Sort by year
       prediction = TRUE,        # Add prediction interval
       print.tau2 = TRUE,        # Print τ²
       leftcols = c("studlab", "n.e", "n.c"),
       leftlabs = c("Study", "N Treat", "N Ctrl"))
\`\`\`

### funnel() - Funnel Plot
\`\`\`r
funnel(m, studlab = TRUE)

# Contour-enhanced
funnel(m, contour = c(0.9, 0.95, 0.99))
\`\`\`

### metabias() - Publication Bias Tests
\`\`\`r
# Egger's test
metabias(m, method.bias = "linreg")

# Begg's test
metabias(m, method.bias = "rank")

# Peters' test (for OR)
metabias(m, method.bias = "peters")
\`\`\`

### trimfill() - Trim and Fill
\`\`\`r
tf <- trimfill(m)
summary(tf)
funnel(tf)
\`\`\`

## Subgroup Analysis

\`\`\`r
# Define subgroups
m <- metabin(..., subgroup = region, data = mydata)

# Forest plot with subgroups
forest(m, subgroup = TRUE)

# Test for subgroup differences
m$pval.Q.b.random  # p-value for between-subgroup heterogeneity
\`\`\`

## Meta-Regression

\`\`\`r
# Single moderator
mr <- metareg(m, ~ year)
summary(mr)

# Multiple moderators
mr <- metareg(m, ~ year + quality)

# Bubble plot
bubble(mr)
\`\`\`

## Sensitivity Analysis

### Influence Analysis
\`\`\`r
# Leave-one-out
metainf(m)

# Influence diagnostics
metainf(m, pooled = "random")
\`\`\`

### Cumulative Meta-Analysis
\`\`\`r
metacum(m, sortvar = year)
\`\`\`

## Settings and Defaults

\`\`\`r
# Set global options
settings.meta(method.tau = "REML",
              hakn = TRUE,  # Hartung-Knapp adjustment
              adhoc.hakn = "ci")

# Reset to defaults
settings.meta("reset")
\`\`\`

## Comparison: meta vs metafor

| Feature | meta | metafor |
|---------|------|---------|
| Ease of use | Higher | Lower |
| Flexibility | Lower | Higher |
| Data input | Raw data | Effect sizes |
| Defaults | Sensible | Minimal |
| Multivariate | Limited | Full support |
| Network MA | No | No (use netmeta) |
`,
      metadata: [
        { key: 'source', string_value: 'R Documentation' },
        { key: 'package', string_value: 'meta' },
        { key: 'topic', string_value: 'quick-reference' },
      ],
    },
  ];
}

// ============================================================================
// Main Script
// ============================================================================

async function setupStore(storeKey: StoreKey): Promise<void> {
  const storeName = STORES[storeKey];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Setting up store: ${storeName}`);
  console.log('='.repeat(60));

  // Create the store
  const store = await createFileSearchStore(storeName);

  // Get content based on store type
  let documents: KnowledgeDocument[];
  switch (storeKey) {
    case 'cochrane':
      documents = getCochraneHandbookContent();
      break;
    case 'seminal-papers':
      documents = getSeminalPapersContent();
      break;
    case 'r-docs':
      documents = getRDocumentationContent();
      break;
    default:
      console.log(`   ⚠️  No content defined for store: ${storeKey}`);
      return;
  }

  // Create temp directory for files
  const tempDir = path.join(process.cwd(), '.kb-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Upload each document
  for (const doc of documents) {
    console.log(`\n📚 Processing: ${doc.title}`);
    
    // Write content to temp file
    const filePath = path.join(tempDir, doc.filename);
    fs.writeFileSync(filePath, doc.content);

    try {
      // Upload file
      const fileName = await uploadFile(filePath, doc.title);

      // Import to store with metadata
      const operation = await importFileToStore(store.name, fileName, doc.metadata);

      // Wait for indexing
      if (!operation.done) {
        await waitForOperation(operation.name);
      }

      console.log(`   ✓ Indexed: ${doc.title}`);
    } catch (error) {
      console.error(`   ✗ Failed: ${error}`);
    }
  }

  // Cleanup temp files
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`\n✅ Store setup complete: ${storeName}`);
}

async function listStores(): Promise<void> {
  console.log('\n📦 Existing File Search Stores:\n');
  
  const stores = await listFileSearchStores();
  
  if (stores.length === 0) {
    console.log('   No stores found.');
    return;
  }

  for (const store of stores) {
    console.log(`   • ${store.displayName}`);
    console.log(`     Name: ${store.name}`);
    if (store.createTime) {
      console.log(`     Created: ${store.createTime}`);
    }
    console.log('');
  }
}

async function deleteStore(storeKey: StoreKey): Promise<void> {
  const storeName = STORES[storeKey];
  
  // Find the full store name
  const stores = await listFileSearchStores();
  const store = stores.find(s => s.displayName === storeName);
  
  if (!store) {
    console.log(`   ⚠️  Store not found: ${storeName}`);
    return;
  }

  await deleteFileSearchStore(store.name);
}

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Meta Agent Knowledge Base Setup                        ║');
  console.log('║     Gemini File Search Integration                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check for API key
  if (!GEMINI_API_KEY) {
    console.error('\n❌ Error: GEMINI_API_KEY environment variable not set');
    console.log('\nUsage:');
    console.log('  GEMINI_API_KEY=your-key npx tsx scripts/setup-knowledge-base.ts');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    await listStores();
    return;
  }

  if (args.includes('--delete')) {
    const idx = args.indexOf('--delete');
    const storeKey = args[idx + 1] as StoreKey;
    if (!storeKey || !STORES[storeKey]) {
      console.error('Invalid store key. Options:', Object.keys(STORES).join(', '));
      process.exit(1);
    }
    await deleteStore(storeKey);
    return;
  }

  if (args.includes('--store')) {
    const idx = args.indexOf('--store');
    const storeKey = args[idx + 1] as StoreKey;
    if (!storeKey || !STORES[storeKey]) {
      console.error('Invalid store key. Options:', Object.keys(STORES).join(', '));
      process.exit(1);
    }
    await setupStore(storeKey);
    return;
  }

  // Default: setup all stores
  console.log('\nSetting up all knowledge base stores...\n');
  
  for (const storeKey of Object.keys(STORES) as StoreKey[]) {
    if (storeKey === 'r-errors' || storeKey === 'teaching') {
      console.log(`\n⏭️  Skipping ${storeKey} (content not yet defined)`);
      continue;
    }
    await setupStore(storeKey);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Knowledge base setup complete!');
  console.log('='.repeat(60));
  console.log('\nStores created:');
  for (const [key, name] of Object.entries(STORES)) {
    if (key !== 'r-errors' && key !== 'teaching') {
      console.log(`  • ${name}`);
    }
  }
  console.log('\nYou can now use these stores with the Meta Agent for RAG-grounded responses.');
}

main().catch(console.error);
