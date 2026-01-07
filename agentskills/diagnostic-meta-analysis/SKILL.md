---
name: diagnostic-meta-analysis
description: Teach meta-analysis of diagnostic test accuracy studies including sensitivity, specificity, SROC curves, and bivariate models. Use when users need to synthesize diagnostic accuracy data, understand SROC curves, or assess quality with QUADAS-2.
license: Apache-2.0
compatibility: Works with any AI agent capable of statistical reasoning
metadata:
  author: meta-agent
  version: "1.0.0"
  category: statistics
  domain: evidence-synthesis
  difficulty: advanced
  estimated-time: "30 minutes"
  prerequisites:
    - meta-analysis-fundamentals
    - heterogeneity-analysis
---

# Diagnostic Meta-Analysis

This skill teaches meta-analysis of diagnostic test accuracy (DTA) studies, enabling synthesis of sensitivity, specificity, and other accuracy measures across multiple studies evaluating the same diagnostic test.

## Overview

Diagnostic meta-analysis differs fundamentally from intervention meta-analysis because it deals with paired accuracy measures (sensitivity and specificity) that are inherently correlated and subject to threshold effects. Specialized methods like bivariate models and SROC curves are essential.

## When to Use This Skill

Activate this skill when users:
- Want to pool diagnostic accuracy studies
- Ask about sensitivity, specificity, or likelihood ratios
- Need to create SROC (Summary ROC) curves
- Mention QUADAS-2 or diagnostic test quality
- Have 2x2 tables from diagnostic studies
- Ask about threshold effects or bivariate models

## Core Concepts to Teach

### 1. Diagnostic Accuracy Measures

**The 2x2 Table:**
```
                    Disease Status
                    +           -
Test Result  +     TP          FP      → PPV = TP/(TP+FP)
             -     FN          TN      → NPV = TN/(FN+TN)
                   ↓           ↓
              Sens=TP/(TP+FN)  Spec=TN/(FP+TN)
```

**Key Measures:**

| Measure | Formula | Interpretation |
|---------|---------|----------------|
| **Sensitivity** | TP/(TP+FN) | Probability of positive test given disease |
| **Specificity** | TN/(FP+TN) | Probability of negative test given no disease |
| **PPV** | TP/(TP+FP) | Probability of disease given positive test |
| **NPV** | TN/(FN+TN) | Probability of no disease given negative test |
| **LR+** | Sens/(1-Spec) | How much positive test increases disease odds |
| **LR-** | (1-Sens)/Spec | How much negative test decreases disease odds |
| **DOR** | (TP×TN)/(FP×FN) | Overall discriminative ability |

**Socratic Questions:**
- "Why can't we simply average sensitivities across studies?"
- "What happens to sensitivity when you lower the test threshold?"
- "Why might PPV vary dramatically across settings with the same test?"

### 2. The Threshold Effect

**Critical Concept:** Sensitivity and specificity are inversely related through the diagnostic threshold.

**Visualization:**
```
Sensitivity
    1.0 ┃●
        ┃ ●
        ┃  ●
        ┃   ●●
        ┃     ●●
        ┃       ●●●
    0.0 ┗━━━━━━━━━━━━━
        0.0         1.0
           1 - Specificity

Each ● = one study
Curve = SROC (Summary ROC)
```

**Why It Matters:**
- Different studies may use different thresholds
- Pooling sens/spec separately ignores this correlation
- Need methods that account for threshold variation

### 3. SROC Curves

**What is SROC?**
- Summary Receiver Operating Characteristic curve
- Shows trade-off between sensitivity and specificity
- Each study is a point; curve summarizes relationship

**Key SROC Elements:**
- **Summary point:** Best estimate of sens/spec
- **Confidence region:** Uncertainty around summary point
- **Prediction region:** Where future studies might fall
- **AUC:** Area under SROC curve (overall accuracy)

**Interpretation of AUC:**
| AUC | Interpretation |
|-----|----------------|
| 0.9-1.0 | Excellent |
| 0.8-0.9 | Good |
| 0.7-0.8 | Fair |
| 0.6-0.7 | Poor |
| 0.5-0.6 | Fail |

### 4. Statistical Models

**Bivariate Model (Reitsma et al. 2005):**
- Models logit(sens) and logit(spec) jointly
- Accounts for correlation between measures
- Estimates between-study heterogeneity for each
- Produces summary sensitivity and specificity

**HSROC Model (Rutter & Gatsonis 2001):**
- Hierarchical Summary ROC
- Models threshold and accuracy parameters
- Equivalent to bivariate under certain conditions
- Better for exploring threshold effects

**When to Use Each:**

| Situation | Recommended Model |
|-----------|-------------------|
| Summary sens/spec needed | Bivariate |
| Comparing tests at same threshold | Bivariate |
| Exploring threshold variation | HSROC |
| Few studies (<4) | Consider simpler methods |

### 5. Implementation in R

**Using mada package:**
```r
library(mada)

# Prepare data (2x2 table counts)
data <- data.frame(
  study = c("Study1", "Study2", "Study3", "Study4", "Study5"),
  TP = c(45, 52, 38, 61, 44),
  FP = c(8, 12, 5, 15, 9),
  FN = c(5, 8, 7, 9, 6),
  TN = c(92, 78, 100, 65, 91)
)

# Bivariate model
fit <- reitsma(data)
summary(fit)

# Summary operating point
summary(fit)$coefficients

# SROC plot
plot(fit, sroclwd = 2,
     main = "SROC Curve for Diagnostic Test X")
points(fpr(data), sens(data), pch = 19)

# Add confidence and prediction regions
plot(fit, sroclwd = 2, predict = TRUE)
```

**Forest Plots for Sens/Spec:**
```r
# Paired forest plot
forest(fit, type = "sens", main = "Sensitivity")
forest(fit, type = "spec", main = "Specificity")

# Or use madad for separate plots
madad(data)
```

**Using metafor for DTA:**
```r
library(metafor)

# Calculate logit sens and spec
data$yi_sens <- log(data$TP / data$FN)  # logit sensitivity
data$yi_spec <- log(data$TN / data$FP)  # logit specificity

# Variance (approximate)
data$vi_sens <- 1/data$TP + 1/data$FN
data$vi_spec <- 1/data$TN + 1/data$FP

# Bivariate model using rma.mv
# (More complex setup required - see metafor documentation)
```

### 6. Assessing Quality with QUADAS-2

**QUADAS-2 Domains:**

| Domain | Risk of Bias | Applicability |
|--------|--------------|---------------|
| Patient Selection | ✓ | ✓ |
| Index Test | ✓ | ✓ |
| Reference Standard | ✓ | ✓ |
| Flow and Timing | ✓ | - |

**Key Signaling Questions:**

**Patient Selection:**
- Was a consecutive or random sample enrolled?
- Was a case-control design avoided?
- Did the study avoid inappropriate exclusions?

**Index Test:**
- Were results interpreted without knowledge of reference?
- Was threshold pre-specified?

**Reference Standard:**
- Is the reference standard likely to correctly classify?
- Were results interpreted without knowledge of index test?

**Flow and Timing:**
- Was there appropriate interval between tests?
- Did all patients receive the same reference standard?
- Were all patients included in analysis?

### 7. Handling Heterogeneity

**Sources of Heterogeneity in DTA:**
1. Threshold variation (expected)
2. Population differences (disease spectrum)
3. Test execution differences
4. Reference standard variation
5. Study quality differences

**Investigating Heterogeneity:**
```r
# Meta-regression in bivariate model
fit_cov <- reitsma(data, 
                   formula = cbind(tsens, tfpr) ~ covariate)
summary(fit_cov)

# Compare models
anova(fit, fit_cov)
```

**Visual Assessment:**
```r
# ROC space plot - look for clustering
ROCellipse(data, pch = 19)

# If studies cluster in different regions,
# investigate sources of heterogeneity
```

### 8. Reporting DTA Meta-Analysis

**Essential Elements (PRISMA-DTA):**
1. Summary sensitivity and specificity with 95% CI
2. SROC curve with confidence/prediction regions
3. Heterogeneity assessment (visual and statistical)
4. QUADAS-2 quality assessment results
5. Subgroup/sensitivity analyses if applicable

**Example Results Section:**
> "The bivariate meta-analysis of 12 studies (N=2,450 patients) yielded a summary sensitivity of 0.85 (95% CI: 0.79-0.90) and specificity of 0.92 (95% CI: 0.87-0.95). The positive likelihood ratio was 10.6 (95% CI: 6.8-16.5) and negative likelihood ratio was 0.16 (95% CI: 0.11-0.24). The area under the SROC curve was 0.94, indicating excellent overall accuracy. Substantial heterogeneity was observed for sensitivity (I²=78%) but not specificity (I²=32%). QUADAS-2 assessment identified high risk of bias in patient selection for 4 studies due to case-control design."

## Assessment Questions

1. **Basic:** "Why can't we simply pool sensitivities using standard meta-analysis methods?"
   - Correct: Sensitivity and specificity are correlated; threshold effects create dependence

2. **Intermediate:** "What does the prediction region on an SROC curve represent?"
   - Correct: The region where we expect 95% of future studies to fall, accounting for heterogeneity

3. **Advanced:** "A diagnostic MA shows high sensitivity (0.95) but moderate specificity (0.70). How would you advise using this test clinically?"
   - Guide: Good for ruling out (high NPV when negative); positive results need confirmation; consider two-stage testing

## Common Misconceptions

1. **"Higher AUC always means better test"**
   - Reality: Clinical utility depends on where on the curve you operate; context matters

2. **"We should only include studies with the same threshold"**
   - Reality: Bivariate/HSROC models handle threshold variation; excluding studies loses information

3. **"Sensitivity and specificity are fixed properties of a test"**
   - Reality: They vary with threshold, population, and disease spectrum

## Example Dialogue

**User:** "I have 8 studies evaluating a rapid antigen test for COVID-19. How do I combine the results?"

**Response Framework:**
1. Acknowledge DTA-specific methods needed
2. Ask about data format (2x2 tables available?)
3. Discuss bivariate model approach
4. Guide through SROC curve creation
5. Emphasize QUADAS-2 quality assessment
6. Discuss clinical interpretation of results

## References

- Reitsma JB et al. Bivariate analysis of sensitivity and specificity. J Clin Epidemiol 2005
- Macaskill P et al. Cochrane Handbook Chapter on DTA reviews
- Whiting PF et al. QUADAS-2: A revised tool. Ann Intern Med 2011
- Doebler P. mada: Meta-Analysis of Diagnostic Accuracy. R package

## Adaptation Guidelines

**Glass (the teaching agent) MUST adapt this content to the learner:**

1. **Language Detection:** Detect the user's language from their messages and respond naturally in that language
2. **Cultural Context:** Adapt examples to local healthcare systems and diagnostic practices when relevant
3. **Technical Terms:** Maintain standard English terms (e.g., "SROC", "sensitivity", "QUADAS-2") but explain them in the user's language
4. **Level Adaptation:** Adjust complexity based on user's demonstrated knowledge level
5. **Socratic Method:** Ask guiding questions in the detected language to promote deep understanding
6. **Local Examples:** When possible, reference diagnostic tests and guidelines familiar to the user's region

**Example Adaptations:**
- 🇧🇷 Portuguese: Reference Brazilian diagnostic guidelines (CONITEC) and local test validations
- 🇪🇸 Spanish: Include examples from PAHO diagnostic recommendations
- 🇨🇳 Chinese: Reference Chinese diagnostic accuracy studies and local guidelines

## Related Skills

- `meta-analysis-fundamentals` - Basic concepts prerequisite
- `heterogeneity-analysis` - Understanding between-study variation
- `data-extraction` - Extracting 2x2 tables from studies
- `grade-assessment` - Rating certainty of DTA evidence
