---
name: heterogeneity-analysis
description: Assess and interpret between-study heterogeneity in meta-analysis using I², Q statistic, tau², and prediction intervals. Use when users need to evaluate consistency across studies, understand sources of variation, or decide if pooling is appropriate.
license: Apache-2.0
compatibility: Requires R with metafor package
metadata:
  author: meta-agent
  version: "1.0.0"
  category: statistics
  domain: evidence-synthesis
  difficulty: intermediate
  estimated-time: "12 minutes"
  prerequisites: meta-analysis-fundamentals
---

# Heterogeneity Analysis

This skill teaches assessment and interpretation of between-study heterogeneity, a critical component of meta-analysis quality.

## Overview

Heterogeneity refers to variation in true effects across studies beyond what we'd expect from sampling error alone. High heterogeneity questions whether pooling is meaningful.

## When to Use This Skill

Activate this skill when users:
- Ask about I², tau², or Q statistic
- Want to know if studies are "too different to combine"
- See conflicting results in their forest plot
- Ask about "inconsistency" or "variability"
- Need to interpret heterogeneity statistics

## Key Heterogeneity Measures

### 1. Cochran's Q Statistic

**What it is:** Tests null hypothesis that all studies share a common effect.

**Interpretation:**
- Significant Q (p < 0.10) → Evidence of heterogeneity
- Non-significant Q → Does NOT prove homogeneity (low power)

**Limitation:** Underpowered with few studies, overpowered with many.

### 2. I² (I-squared)

**What it is:** Percentage of variability due to heterogeneity rather than chance.

**Interpretation Guidelines (Cochrane):**

| I² Value | Interpretation |
|----------|----------------|
| 0-40% | Might not be important |
| 30-60% | May represent moderate heterogeneity |
| 50-90% | May represent substantial heterogeneity |
| 75-100% | Considerable heterogeneity |

**Key Teaching Points:**
- I² is a proportion, not an absolute measure
- Overlapping ranges are intentional—context matters
- Always consider clinical and methodological diversity

**Socratic Questions:**
- "If I² is 75%, what does that tell us about the studies?"
- "Can we still do a meta-analysis with high I²?"
- "What might cause studies to have different true effects?"

### 3. Tau² (Tau-squared)

**What it is:** Estimated variance of true effects across studies.

**Interpretation:**
- Tau² = 0 → No heterogeneity (all studies estimate same effect)
- Larger tau² → Greater spread of true effects
- Tau (square root) is on same scale as effect size

**Advantage:** Absolute measure, unlike I² which is relative.

### 4. Prediction Interval

**What it is:** Range where we expect the true effect of a NEW study to fall.

**Why it matters:**
- Wider than confidence interval
- Shows practical implications of heterogeneity
- Critical for clinical decision-making

**Example:**
```
Pooled effect: OR = 0.70, 95% CI [0.55, 0.89]
Prediction interval: [0.35, 1.40]

Interpretation: While the average effect favors treatment,
a new study might find effects ranging from strongly 
beneficial (0.35) to slightly harmful (1.40).
```

## R Code for Heterogeneity Assessment

### Basic Heterogeneity Statistics

```r
library(metafor)

# Fit random-effects model
res <- rma(yi = yi, sei = sei, data = dat, method = "REML")

# View heterogeneity statistics
print(res)
# Look for: tau², I², H², Q, p-value

# Extract specific values
res$tau2   # tau-squared
res$I2     # I-squared (as proportion)
res$QE     # Q statistic
res$QEp    # p-value for Q test
```

### Confidence Intervals for I²

```r
# Get confidence interval for I²
confint(res)

# Output includes:
#        estimate   ci.lb   ci.ub
# tau^2    0.0234  0.0012  0.1456
# I^2(%)  62.4000 12.3000 89.2000
```

### Prediction Interval

```r
# Calculate prediction interval
predict(res)

# Or manually:
pi_lower <- res$beta - qt(0.975, res$k-2) * sqrt(res$tau2 + res$se^2)
pi_upper <- res$beta + qt(0.975, res$k-2) * sqrt(res$tau2 + res$se^2)
```

### Visualizing Heterogeneity

```r
# Forest plot with prediction interval
forest(res, 
       slab = dat$study,
       addpred = TRUE,  # Adds prediction interval
       header = TRUE)

# Baujat plot (identifies outliers)
baujat(res)

# GOSH plot (sensitivity to study inclusion)
gosh_res <- gosh(res)
plot(gosh_res)
```

## Teaching Framework

### Step 1: Report the Statistics

"Let's look at your heterogeneity results:
- Q = 24.5, p = 0.003 (significant)
- I² = 67% [42%, 82%]
- Tau² = 0.08"

### Step 2: Interpret in Context

"This suggests substantial heterogeneity. About 67% of the variation we see is due to real differences between studies, not just chance."

### Step 3: Discuss Implications

"With this level of heterogeneity, we should:
1. Still report the pooled effect, but with caution
2. Explore sources of heterogeneity
3. Consider subgroup or meta-regression analysis
4. Report the prediction interval"

### Step 4: Investigate Sources

"Let's think about what might cause these differences:
- Different populations (age, severity)?
- Different interventions (dose, duration)?
- Different outcome measures?
- Different study designs?"

## Decision Framework

```
I² Assessment
    │
    ├── I² < 40%
    │   └── Heterogeneity likely unimportant
    │       → Proceed with pooled estimate
    │
    ├── I² 40-75%
    │   └── Moderate heterogeneity
    │       → Report pooled estimate
    │       → Explore sources (subgroups)
    │       → Report prediction interval
    │
    └── I² > 75%
        └── Substantial heterogeneity
            → Question if pooling is meaningful
            → Mandatory exploration of sources
            → Consider narrative synthesis
            → Always report prediction interval
```

## Common Misconceptions

1. **"High I² means we can't do meta-analysis"**
   - Reality: High I² means we need to investigate and interpret carefully
   - Pooling may still be appropriate with proper caveats

2. **"Non-significant Q means no heterogeneity"**
   - Reality: Q test has low power with few studies
   - Always report I² and tau² alongside Q

3. **"I² tells us about clinical importance"**
   - Reality: I² is statistical, not clinical
   - A small I² can hide clinically important variation

## Assessment Questions

1. **Basic:** "What does I² = 50% mean?"
   - Correct: About half the observed variation is due to true differences between studies

2. **Intermediate:** "Q test is non-significant but I² = 45%. How do you interpret this?"
   - Correct: Q test may be underpowered; moderate heterogeneity may still exist

3. **Advanced:** "Pooled OR = 0.6 [0.4, 0.9] but prediction interval is [0.3, 1.2]. What's the clinical implication?"
   - Correct: While average effect is beneficial, a new setting might see no effect or even harm

## Related Skills

- `meta-analysis-fundamentals` - Understanding pooled effects
- `forest-plot-creation` - Visualizing heterogeneity
- `publication-bias-detection` - Another source of concern
