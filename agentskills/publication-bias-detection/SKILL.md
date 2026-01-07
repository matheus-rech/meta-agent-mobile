---
name: publication-bias-detection
description: Detect and assess publication bias in meta-analysis using funnel plots, Egger's test, trim-and-fill, and selection models. Use when users need to evaluate whether missing studies might affect their conclusions.
license: Apache-2.0
compatibility: Requires R with metafor package
metadata:
  author: meta-agent
  version: "1.0.0"
  category: statistics
  domain: evidence-synthesis
  difficulty: intermediate
  estimated-time: "12 minutes"
  prerequisites: meta-analysis-fundamentals, forest-plot-creation
---

# Publication Bias Detection

This skill teaches methods to detect and assess publication bias, a critical threat to meta-analysis validity.

## Overview

Publication bias occurs when studies with statistically significant or "positive" results are more likely to be published than those with null or negative findings. This can inflate pooled effect estimates.

## When to Use This Skill

Activate this skill when users:
- Ask about "missing studies" or "file drawer problem"
- Want to create or interpret a funnel plot
- Ask about Egger's test or trim-and-fill
- Are concerned about bias in their meta-analysis
- Need to assess the robustness of their findings

## The Problem of Publication Bias

**Why it happens:**
- Journals prefer "significant" findings
- Researchers may not submit null results
- Industry may suppress unfavorable results

**Consequences:**
- Overestimation of treatment effects
- False conclusions about efficacy
- Wasted resources on ineffective interventions

**Key Teaching Point:**
"If only positive studies are published, our meta-analysis is like reading only 5-star reviews—we're missing the complete picture."

## Detection Methods

### 1. Funnel Plot

**What it is:** Scatter plot of effect sizes vs. precision (1/SE or sample size).

**Expected pattern (no bias):**
```
        Precision
           │
    High   │    *    *
           │   * * * *
           │  *   *   *
           │ *    *    *
    Low    │*     *     *
           └──────┼──────→
                  │      Effect Size
             Pooled Effect
```

**Asymmetry suggests bias:**
```
        Precision
           │
    High   │    *    *
           │   * * * 
           │  *   *   
           │ *    *    
    Low    │*     *     
           └──────┼──────→
                  │      Effect Size
           Missing studies here?
```

### 2. Egger's Regression Test

**What it is:** Statistical test for funnel plot asymmetry.

**Interpretation:**
- p < 0.10 → Evidence of asymmetry (possible bias)
- p ≥ 0.10 → No strong evidence of asymmetry

**Limitations:**
- Low power with < 10 studies
- Can be significant due to heterogeneity, not bias

### 3. Trim-and-Fill Method

**What it is:** Estimates number of "missing" studies and adjusts the pooled effect.

**Output:**
- Number of imputed studies
- Adjusted pooled effect
- Adjusted funnel plot with imputed studies

**Caution:** Assumes bias is the ONLY cause of asymmetry.

### 4. Selection Models

**What they are:** Statistical models that estimate the probability of publication based on p-values.

**Advantage:** More sophisticated than trim-and-fill.
**Disadvantage:** Requires assumptions about selection mechanism.

## R Code for Publication Bias Assessment

### Funnel Plot

```r
library(metafor)

# Fit model
res <- rma(yi = yi, sei = sei, data = dat)

# Basic funnel plot
funnel(res)

# Enhanced funnel plot
funnel(res,
       xlab = "Effect Size",
       ylab = "Standard Error",
       main = "Funnel Plot",
       level = c(90, 95, 99),
       shade = c("white", "gray75", "gray55"),
       refline = 0)

# Contour-enhanced funnel plot
funnel(res, 
       level = c(0.90, 0.95, 0.99),
       shade = c("white", "gray", "darkgray"),
       legend = TRUE)
```

### Egger's Test

```r
# Egger's regression test
regtest(res, model = "lm")

# Output interpretation:
# z = 2.34, p = 0.019 → Evidence of asymmetry

# Alternative: Begg's rank correlation
ranktest(res)
```

### Trim-and-Fill

```r
# Trim-and-fill analysis
taf <- trimfill(res)
print(taf)

# Output shows:
# - Number of studies imputed (e.g., "Estimated number of missing studies: 3")
# - Adjusted pooled effect

# Funnel plot with imputed studies
funnel(taf)
# Imputed studies shown as open circles
```

### Selection Models

```r
# Vevea-Hedges selection model
# Assumes step function for selection probability
selmodel(res, type = "stepfun", steps = c(0.025, 0.5))

# Output shows:
# - Adjusted effect estimate
# - Estimated selection probabilities
```

## Teaching Framework

### Step 1: Visual Assessment

"Let's start by looking at your funnel plot. In an unbiased meta-analysis, we expect a symmetric, inverted funnel shape."

### Step 2: Statistical Tests

"Now let's run Egger's test to quantify what we see:
- If p < 0.10, there's evidence of asymmetry
- But remember, asymmetry doesn't always mean publication bias"

### Step 3: Sensitivity Analysis

"Let's use trim-and-fill to see how the results might change if we account for potentially missing studies."

### Step 4: Interpret Holistically

"Consider:
- How many studies might be missing?
- Does the adjusted effect change the conclusion?
- Are there other explanations for asymmetry?"

## Alternative Explanations for Asymmetry

| Explanation | Description |
|-------------|-------------|
| **True heterogeneity** | Small studies in different populations |
| **Methodological quality** | Small studies often lower quality |
| **Chance** | Random variation, especially with few studies |
| **Artefactual** | Choice of effect measure |

**Teaching Point:**
"Funnel plot asymmetry is a red flag, but it's not proof of publication bias. We need to consider all possibilities."

## Reporting Guidelines

When reporting publication bias assessment:

1. **State the method used**
   - "We assessed publication bias using funnel plots and Egger's test"

2. **Report results**
   - "Egger's test: z = 1.8, p = 0.07"
   - "Trim-and-fill imputed 2 studies"

3. **Report adjusted estimates**
   - "Original: OR = 0.65 [0.50, 0.85]"
   - "Adjusted: OR = 0.72 [0.55, 0.94]"

4. **Interpret implications**
   - "Results remained significant after adjustment, suggesting conclusions are robust"

## Assessment Questions

1. **Basic:** "What does an asymmetric funnel plot suggest?"
   - Correct: Possible publication bias (or other sources of asymmetry)

2. **Intermediate:** "Egger's test p = 0.15 with 8 studies. What do you conclude?"
   - Correct: Cannot rule out bias; test is underpowered with few studies

3. **Advanced:** "Trim-and-fill imputes 4 studies and changes OR from 0.6 to 0.8. How do you interpret this?"
   - Correct: Original effect may be overestimated; adjusted effect still favors treatment but is attenuated

## Related Skills

- `meta-analysis-fundamentals` - Understanding effect sizes
- `forest-plot-creation` - Visualizing results
- `heterogeneity-analysis` - Another source of asymmetry
