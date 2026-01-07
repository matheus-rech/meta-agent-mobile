---
name: ipd-meta-analysis
description: Teach Individual Patient Data (IPD) meta-analysis methods for analyzing raw participant-level data from multiple studies. Use when users have access to original datasets, need to explore treatment-effect modifiers, or want to conduct time-to-event analyses.
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
    - data-extraction
---

# Individual Patient Data (IPD) Meta-Analysis

This skill teaches IPD meta-analysis, the "gold standard" of evidence synthesis that uses raw participant-level data from multiple studies.

## Overview

IPD meta-analysis analyzes the original individual-level data from each study rather than summary statistics. This enables more powerful analyses, proper handling of time-to-event data, and exploration of patient-level effect modifiers.

## When to Use This Skill

Activate this skill when users:
- Have access to individual patient data from multiple trials
- Want to explore subgroup effects or treatment-effect modifiers
- Need to analyze time-to-event (survival) outcomes
- Ask about one-stage vs two-stage approaches
- Want to standardize outcomes across studies
- Need to handle missing data properly

## Core Concepts to Teach

### 1. IPD vs Aggregate Data Meta-Analysis

**Comparison:**

| Aspect | Aggregate Data | IPD |
|--------|---------------|-----|
| Data level | Study summaries | Individual patients |
| Subgroup analysis | Ecological bias risk | Patient-level, unbiased |
| Time-to-event | Requires approximations | Exact analysis |
| Missing data | Cannot address | Can model properly |
| Standardization | Limited | Full flexibility |
| Effort | Low | High (data collection) |

**Socratic Questions:**
- "Why might analyzing individual data give different results than combining averages?"
- "What is ecological bias and why does it matter for subgroup analyses?"
- "When would the extra effort of IPD collection be worthwhile?"

### 2. One-Stage vs Two-Stage Approaches

**Two-Stage Approach:**
```
Stage 1: Analyze each study separately
         → Get study-specific estimates

Stage 2: Combine estimates using standard MA
         → Pool using random effects
```

**One-Stage Approach:**
```
Single model: All data in one hierarchical model
              → Accounts for clustering within studies
              → More flexible for complex analyses
```

**When to Use Each:**

| Situation | Recommended Approach |
|-----------|---------------------|
| Simple outcomes, many studies | Two-stage (simpler) |
| Few studies, sparse data | One-stage (more stable) |
| Complex interactions | One-stage (more flexible) |
| Time-to-event | One-stage (preferred) |
| Non-linear effects | One-stage (necessary) |

### 3. Two-Stage IPD Meta-Analysis

**Stage 1 - Study-Level Analysis:**
```r
library(dplyr)
library(broom)

# Analyze each study separately
study_results <- ipd_data %>%
  group_by(study_id) %>%
  do(tidy(glm(outcome ~ treatment + age + sex, 
              data = ., 
              family = binomial))) %>%
  filter(term == "treatment")

# Extract treatment effects and SEs
effects <- study_results %>%
  select(study_id, estimate, std.error)
```

**Stage 2 - Meta-Analysis:**
```r
library(metafor)

# Standard random-effects MA
ma_result <- rma(
  yi = effects$estimate,
  sei = effects$std.error,
  method = "REML"
)

summary(ma_result)
forest(ma_result)
```

### 4. One-Stage IPD Meta-Analysis

**Mixed-Effects Model:**
```r
library(lme4)

# One-stage with random intercepts and slopes
model <- glmer(
  outcome ~ treatment + age + sex + 
    (1 + treatment | study_id),
  data = ipd_data,
  family = binomial
)

summary(model)
```

**Interpretation:**
- Fixed effects: Overall treatment effect adjusted for covariates
- Random intercepts: Study-specific baseline risks
- Random slopes: Study-specific treatment effects (heterogeneity)

**For Time-to-Event:**
```r
library(survival)
library(coxme)

# Stratified Cox model (two-stage equivalent)
cox_stratified <- coxph(
  Surv(time, event) ~ treatment + age + sex + strata(study_id),
  data = ipd_data
)

# Frailty model (one-stage)
cox_frailty <- coxme(
  Surv(time, event) ~ treatment + age + sex + (1 | study_id),
  data = ipd_data
)
```

### 5. Exploring Treatment-Effect Modifiers

**Why IPD is Essential:**
- Aggregate data subgroups → ecological bias
- IPD → true patient-level interactions

**Interaction Analysis:**
```r
# Test treatment-covariate interaction
model_interaction <- glmer(
  outcome ~ treatment * age_group + sex + 
    (1 + treatment | study_id),
  data = ipd_data,
  family = binomial
)

# Compare with main effects model
anova(model_main, model_interaction)
```

**Visualization:**
```r
library(ggplot2)

# Forest plot by subgroup
ggplot(subgroup_effects, aes(x = estimate, y = subgroup)) +
  geom_point() +
  geom_errorbarh(aes(xmin = ci_low, xmax = ci_high), height = 0.2) +
  geom_vline(xintercept = 0, linetype = "dashed") +
  labs(x = "Treatment Effect (log OR)", y = "Subgroup")
```

### 6. Handling Missing Data

**Common Approaches:**

| Method | Description | Assumption |
|--------|-------------|------------|
| Complete case | Exclude missing | MCAR (rarely true) |
| Single imputation | Fill with mean/mode | Underestimates uncertainty |
| Multiple imputation | Create multiple datasets | MAR |
| Pattern mixture | Model missingness | MNAR sensitivity |

**Multiple Imputation with IPD:**
```r
library(mice)

# Impute within each study
imputed_data <- ipd_data %>%
  group_by(study_id) %>%
  group_modify(~ {
    mice(.x, m = 20, method = "pmm", printFlag = FALSE) %>%
      complete("long")
  })

# Analyze each imputed dataset
results <- imputed_data %>%
  group_by(.imp) %>%
  do(tidy(glmer(outcome ~ treatment + (1|study_id), 
                data = ., family = binomial)))

# Pool results using Rubin's rules
pool(results)
```

### 7. Data Harmonization

**Common Challenges:**
- Different outcome definitions
- Different covariate coding
- Different follow-up times
- Different measurement scales

**Harmonization Steps:**
```r
# Standardize variables across studies
harmonized <- ipd_data %>%
  mutate(
    # Standardize age (z-score within study)
    age_std = (age - mean(age)) / sd(age),
    
    # Harmonize outcome timing
    outcome_6mo = case_when(
      study_id == "A" ~ outcome_week24,
      study_id == "B" ~ outcome_month6,
      TRUE ~ outcome_6months
    ),
    
    # Recode categorical variables
    sex = case_when(
      sex %in% c("M", "male", "1") ~ "Male",
      sex %in% c("F", "female", "2") ~ "Female"
    )
  )
```

### 8. Reporting IPD Meta-Analysis

**PRISMA-IPD Checklist Items:**
- Data collection and integrity checking
- Proportion of IPD obtained vs available
- Handling of studies without IPD
- Missing data approach
- One-stage vs two-stage justification

## Assessment Questions

1. **Basic:** "What is the main advantage of IPD over aggregate data meta-analysis?"
   - Correct: Avoids ecological bias in subgroup analyses; enables patient-level effect modifier exploration

2. **Intermediate:** "When would you choose a one-stage over a two-stage approach?"
   - Correct: Few studies, sparse events, complex interactions, time-to-event outcomes

3. **Advanced:** "How would you handle a situation where you have IPD for 60% of studies and only aggregate data for the rest?"
   - Guide: Combined IPD + AD analysis; sensitivity analysis comparing IPD-only vs combined

## Common Misconceptions

1. **"IPD always gives different results than aggregate MA"**
   - Reality: Often similar for main effects; differs mainly for subgroups

2. **"One-stage is always better than two-stage"**
   - Reality: Two-stage is often sufficient and more transparent

3. **"IPD eliminates all bias"**
   - Reality: Still subject to selection bias, publication bias if not all trials share data

## Example Dialogue

**User:** "I'm coordinating an IPD meta-analysis of 8 cancer trials. How do I analyze survival outcomes?"

**Response Framework:**
1. Congratulate on IPD collection effort
2. Discuss one-stage vs two-stage for survival
3. Recommend stratified Cox or frailty models
4. Address censoring and follow-up differences
5. Guide through effect modifier analysis
6. Discuss PRISMA-IPD reporting

## References

- Riley RD et al. IPD Meta-Analysis. BMJ 2010
- Stewart LA, Tierney JF. IPD Meta-Analysis of Randomized Trials. Cochrane Handbook
- Debray TPA et al. Get real in IPD meta-analysis. BMC Med Res Methodol 2015
- PRISMA-IPD Statement

## Adaptation Guidelines

**Glass (the teaching agent) MUST adapt this content to the learner:**

1. **Language Detection:** Detect the user's language from their messages and respond naturally in that language
2. **Cultural Context:** Adapt examples to local healthcare systems and research contexts when relevant
3. **Technical Terms:** Maintain standard English terms (e.g., "IPD", "one-stage", "frailty model") but explain them in the user's language
4. **Level Adaptation:** Adjust complexity based on user's demonstrated knowledge level
5. **Socratic Method:** Ask guiding questions in the detected language to promote deep understanding
6. **Local Examples:** When possible, reference studies or guidelines familiar to the user's region

**Example Adaptations:**
- 🇧🇷 Portuguese: Reference Brazilian IPD collaborations (e.g., oncology networks)
- 🇪🇸 Spanish: Include Latin American clinical trial networks
- 🇨🇳 Chinese: Reference Chinese IPD initiatives and data sharing policies

## Related Skills

- `meta-analysis-fundamentals` - Basic concepts prerequisite
- `data-extraction` - Data collection principles
- `heterogeneity-analysis` - Understanding between-study variation
- `bayesian-meta-analysis` - Alternative modeling framework
