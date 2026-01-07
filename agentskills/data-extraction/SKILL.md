---
name: data-extraction
description: Extract and prepare study data for meta-analysis including effect size calculation, variance estimation, and handling missing data. Use when users need to convert reported statistics into analyzable format or calculate effect sizes from raw data.
license: Apache-2.0
compatibility: Requires R with metafor and escalc functions
metadata:
  author: meta-agent
  version: "1.0.0"
  category: data-preparation
  domain: evidence-synthesis
  difficulty: intermediate
  estimated-time: "15 minutes"
  prerequisites: meta-analysis-fundamentals
---

# Data Extraction for Meta-Analysis

This skill teaches how to extract, convert, and prepare study data for meta-analysis.

## Overview

Before running a meta-analysis, you need to extract effect sizes and their variances from each study. Studies report results in different formats, requiring conversion to a common metric.

## When to Use This Skill

Activate this skill when users:
- Have study data in different formats
- Need to calculate effect sizes from raw data
- Ask about converting between effect size types
- Have missing standard deviations or standard errors
- Need to extract data from figures or tables

## Data Requirements

### Minimum Data Needed

| Outcome Type | Required Data |
|--------------|---------------|
| **Binary** | Events and totals for each group, OR 2x2 table |
| **Continuous** | Means, SDs, and sample sizes for each group |
| **Correlation** | Correlation coefficient (r) and sample size |
| **Pre-calculated** | Effect size and SE (or CI or variance) |

## Effect Size Calculations

### Binary Outcomes

#### From 2x2 Table

```
              Treatment    Control
Event            a           b
No Event         c           d
Total           n1          n2
```

**Odds Ratio:**
```r
OR = (a/c) / (b/d) = (a*d) / (b*c)
log_OR = log(OR)
SE_log_OR = sqrt(1/a + 1/b + 1/c + 1/d)
```

**Risk Ratio:**
```r
RR = (a/n1) / (b/n2)
log_RR = log(RR)
SE_log_RR = sqrt(1/a - 1/n1 + 1/b - 1/n2)
```

**Risk Difference:**
```r
RD = (a/n1) - (b/n2)
SE_RD = sqrt((a*c/n1^3) + (b*d/n2^3))
```

### Continuous Outcomes

#### Standardized Mean Difference (SMD/Hedges' g)

```r
# Pooled SD
s_pooled = sqrt(((n1-1)*sd1^2 + (n2-1)*sd2^2) / (n1+n2-2))

# Cohen's d
d = (mean1 - mean2) / s_pooled

# Hedges' g (bias-corrected)
J = 1 - (3 / (4*(n1+n2-2) - 1))
g = J * d

# Variance
var_g = (n1+n2)/(n1*n2) + g^2/(2*(n1+n2))
```

#### Mean Difference (MD)

```r
MD = mean1 - mean2
SE_MD = sqrt(sd1^2/n1 + sd2^2/n2)
```

## R Code for Effect Size Calculation

### Using escalc() Function

```r
library(metafor)

# Binary outcomes - Odds Ratio
dat_binary <- escalc(measure = "OR",
                     ai = events_treat, bi = nonevents_treat,
                     ci = events_ctrl, di = nonevents_ctrl,
                     data = mydata)

# Binary outcomes - Risk Ratio
dat_rr <- escalc(measure = "RR",
                 ai = events_treat, bi = nonevents_treat,
                 ci = events_ctrl, di = nonevents_ctrl,
                 data = mydata)

# Continuous outcomes - SMD (Hedges' g)
dat_smd <- escalc(measure = "SMD",
                  m1i = mean_treat, sd1i = sd_treat, n1i = n_treat,
                  m2i = mean_ctrl, sd2i = sd_ctrl, n2i = n_ctrl,
                  data = mydata)

# Continuous outcomes - Mean Difference
dat_md <- escalc(measure = "MD",
                 m1i = mean_treat, sd1i = sd_treat, n1i = n_treat,
                 m2i = mean_ctrl, sd2i = sd_ctrl, n2i = n_ctrl,
                 data = mydata)

# Correlations
dat_cor <- escalc(measure = "ZCOR",  # Fisher's z
                  ri = correlation, ni = sample_size,
                  data = mydata)
```

### From Pre-calculated Statistics

```r
# From OR and 95% CI
log_or <- log(OR)
se_log_or <- (log(CI_upper) - log(CI_lower)) / (2 * 1.96)

# From SMD and 95% CI
se_smd <- (CI_upper - CI_lower) / (2 * 1.96)

# From p-value and sample size (approximate)
# For t-test
t_value <- qt(1 - p_value/2, df = n1 + n2 - 2)
d <- t_value * sqrt(1/n1 + 1/n2)
```

## Handling Missing Data

### Missing SDs

**Option 1: Impute from other studies**
```r
# Use median SD from studies that report it
median_sd <- median(dat$sd, na.rm = TRUE)
dat$sd[is.na(dat$sd)] <- median_sd
```

**Option 2: Calculate from CI or SE**
```r
# From 95% CI for mean
SD = sqrt(n) * (CI_upper - CI_lower) / (2 * 1.96)

# From SE
SD = SE * sqrt(n)
```

**Option 3: Calculate from IQR (for skewed data)**
```r
# Wan et al. method
SD = IQR / 1.35
```

### Missing Sample Sizes

**Option 1: Use reported total N**
```r
# If only total N given, assume equal groups
n1 = n2 = N / 2
```

**Option 2: Contact authors**
- Always the best option for critical missing data

### Zero Events

```r
# Add continuity correction (0.5 to all cells)
dat_corrected <- escalc(measure = "OR",
                        ai = events_treat + 0.5,
                        bi = nonevents_treat + 0.5,
                        ci = events_ctrl + 0.5,
                        di = nonevents_ctrl + 0.5,
                        data = mydata)

# Or use Peto OR (handles zeros better)
dat_peto <- escalc(measure = "PETO",
                   ai = events_treat, bi = nonevents_treat,
                   ci = events_ctrl, di = nonevents_ctrl,
                   data = mydata)
```

## Data Extraction Checklist

```
□ Study identifier (author, year)
□ Sample sizes (treatment and control)
□ Outcome data:
  □ Binary: events in each group
  □ Continuous: means and SDs
□ Effect size (if pre-calculated)
□ Confidence interval or SE
□ Follow-up duration
□ Subgroup information
□ Risk of bias assessment
```

## Common Conversion Scenarios

### Scenario 1: Only p-value reported

```r
# Convert p-value to effect size (approximate)
# Requires sample sizes
z <- qnorm(1 - p_value/2)
d <- z * sqrt(1/n1 + 1/n2)
```

### Scenario 2: Median and IQR reported

```r
# Estimate mean and SD (Wan et al. 2014)
# For sample size n:
mean_est <- (q1 + median + q3) / 3
sd_est <- (q3 - q1) / 1.35
```

### Scenario 3: Different scales across studies

```r
# Use SMD to standardize
# This puts all studies on same scale
dat <- escalc(measure = "SMD", ...)
```

## Teaching Framework

### Step 1: Identify What's Reported

"What statistics does the study report?
- Raw data (means, SDs, events)?
- Effect size with CI?
- Just a p-value?"

### Step 2: Determine Target Effect Size

"What effect size is appropriate for your research question?
- Binary outcome → OR or RR
- Continuous, same scale → MD
- Continuous, different scales → SMD"

### Step 3: Calculate or Convert

"Now let's calculate the effect size and its variance..."

### Step 4: Verify

"Let's double-check:
- Does the direction make sense?
- Is the magnitude plausible?
- Does the CI seem reasonable?"

## Assessment Questions

1. **Basic:** "What data do you need to calculate an odds ratio?"
   - Correct: Events and non-events (or totals) for each group

2. **Intermediate:** "A study reports mean difference = 5, p = 0.03, n = 50 per group. How do you get the SE?"
   - Correct: Use p-value to get t-statistic, then SE = MD / t

3. **Advanced:** "Studies use different depression scales (BDI, HDRS). How do you combine them?"
   - Correct: Use standardized mean difference (SMD) to put on common scale

## Related Skills

- `meta-analysis-fundamentals` - Understanding effect sizes
- `r-code-generation` - Automating calculations
- `grade-assessment` - Evaluating certainty of evidence

## Adaptation Guidelines

**Glass (the teaching agent) MUST adapt this content to the learner:**

1. **Language Detection:** Detect the user's language from their messages and respond naturally in that language
2. **Cultural Context:** Adapt examples to local healthcare systems and research contexts when relevant
3. **Technical Terms:** Maintain standard English terms (e.g., "forest plot", "effect size", "I²") but explain them in the user's language
4. **Level Adaptation:** Adjust complexity based on user's demonstrated knowledge level
5. **Socratic Method:** Ask guiding questions in the detected language to promote deep understanding
6. **Local Examples:** When possible, reference studies or guidelines familiar to the user's region

**Example Adaptations:**
- 🇧🇷 Portuguese: Use Brazilian health system examples (SUS, ANVISA guidelines)
- 🇪🇸 Spanish: Reference PAHO/OPS guidelines for Latin America
- 🇨🇳 Chinese: Include examples from Chinese medical literature
