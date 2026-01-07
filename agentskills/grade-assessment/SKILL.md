---
name: grade-assessment
description: Apply the GRADE framework to assess certainty of evidence in systematic reviews. Use when users need to rate evidence quality, create Summary of Findings tables, or understand the factors that affect confidence in effect estimates.
license: Apache-2.0
compatibility: Works with any AI agent; GRADE methodology is universal
metadata:
  author: meta-agent
  version: "1.0.0"
  category: evidence-assessment
  domain: evidence-synthesis
  difficulty: advanced
  estimated-time: "20 minutes"
  prerequisites: meta-analysis-fundamentals, heterogeneity-analysis
---

# GRADE Assessment

This skill teaches the GRADE (Grading of Recommendations Assessment, Development and Evaluation) framework for assessing certainty of evidence.

## Overview

GRADE is the internationally recognized standard for rating the quality of evidence in systematic reviews. It provides a systematic approach to moving from evidence to recommendations.

## When to Use This Skill

Activate this skill when users:
- Ask about "quality of evidence" or "certainty"
- Need to create a Summary of Findings (SoF) table
- Want to understand GRADE ratings
- Ask about downgrading or upgrading evidence
- Are preparing a Cochrane review or guideline

## GRADE Certainty Levels

| Level | Symbol | Meaning |
|-------|--------|---------|
| **High** | ⊕⊕⊕⊕ | Very confident the true effect is close to the estimate |
| **Moderate** | ⊕⊕⊕◯ | Moderately confident; true effect likely close to estimate |
| **Low** | ⊕⊕◯◯ | Limited confidence; true effect may be substantially different |
| **Very Low** | ⊕◯◯◯ | Very little confidence; true effect likely substantially different |

## Starting Point

| Study Design | Starting Certainty |
|--------------|-------------------|
| Randomized trials | High (⊕⊕⊕⊕) |
| Observational studies | Low (⊕⊕◯◯) |

## Factors That Lower Certainty (Downgrade)

### 1. Risk of Bias

**What to assess:**
- Randomization and allocation concealment
- Blinding of participants, personnel, outcome assessors
- Incomplete outcome data
- Selective reporting
- Other biases

**When to downgrade:**
- Serious limitations → Down 1 level
- Very serious limitations → Down 2 levels

**Socratic Questions:**
- "Were the studies properly randomized?"
- "Could the lack of blinding have affected results?"
- "Was there substantial loss to follow-up?"

### 2. Inconsistency (Heterogeneity)

**What to assess:**
- Point estimates vary widely
- Confidence intervals show minimal overlap
- I² is high
- Studies show different directions of effect

**When to downgrade:**
- Unexplained heterogeneity with I² > 50%
- Studies show conflicting results
- Prediction interval crosses null

**Key Teaching Point:**
"Inconsistency is different from imprecision. Inconsistency means studies disagree; imprecision means we're uncertain about each estimate."

### 3. Indirectness

**Types of indirectness:**

| Type | Example |
|------|---------|
| **Population** | Studies in adults, question about children |
| **Intervention** | Studies of drug A, question about drug B |
| **Comparator** | Studies vs. placebo, question vs. active treatment |
| **Outcome** | Studies measure surrogate, question about clinical outcome |

**When to downgrade:**
- Important differences between evidence and question
- Surrogate outcomes used instead of patient-important outcomes

### 4. Imprecision

**What to assess:**
- Wide confidence intervals
- Small sample size / few events
- Optimal Information Size (OIS) not met

**Rules of thumb:**
- Binary: < 300 events total → consider downgrading
- Continuous: < 400 participants total → consider downgrading
- CI crosses thresholds of clinical importance

**When to downgrade:**
- CI includes both appreciable benefit and appreciable harm
- CI includes no effect and appreciable benefit (or harm)

### 5. Publication Bias

**What to assess:**
- Funnel plot asymmetry
- Egger's test significant
- Industry funding with positive results only
- Small study effects

**When to downgrade:**
- Strong suspicion of missing studies
- Trim-and-fill suggests meaningful impact

## Factors That Raise Certainty (Upgrade)

*Only for observational studies starting at Low*

### 1. Large Effect

| Magnitude | Upgrade |
|-----------|---------|
| RR > 2 or < 0.5 | Consider +1 |
| RR > 5 or < 0.2 | Consider +2 |

### 2. Dose-Response Gradient

- Clear relationship between dose/exposure and outcome
- Biological plausibility

### 3. Plausible Confounding

- All plausible confounders would reduce the effect
- Yet effect is still observed

## GRADE Assessment Process

```
Step 1: Define the Question (PICO)
    │
Step 2: Identify Study Designs
    │
    ├── RCTs → Start at HIGH
    └── Observational → Start at LOW
    │
Step 3: Assess Downgrade Factors
    │
    ├── Risk of Bias?
    ├── Inconsistency?
    ├── Indirectness?
    ├── Imprecision?
    └── Publication Bias?
    │
Step 4: Assess Upgrade Factors (if observational)
    │
    ├── Large Effect?
    ├── Dose-Response?
    └── Confounding?
    │
Step 5: Determine Final Rating
    │
Step 6: Write Certainty Statement
```

## Summary of Findings Table

### Template

| Outcome | № of studies (participants) | Certainty | Relative effect (95% CI) | Anticipated absolute effects |
|---------|----------------------------|-----------|-------------------------|------------------------------|
| Mortality | 5 RCTs (2,340) | ⊕⊕⊕◯ Moderate | RR 0.75 (0.60-0.94) | 50 fewer per 1000 (from 80 fewer to 12 fewer) |

### Creating Absolute Effects

```r
# From relative risk
baseline_risk <- 0.20  # 20% in control group
RR <- 0.75
RR_lower <- 0.60
RR_upper <- 0.94

# Absolute risk reduction
ARR <- baseline_risk * (1 - RR)  # 5% = 50 per 1000
ARR_lower <- baseline_risk * (1 - RR_upper)
ARR_upper <- baseline_risk * (1 - RR_lower)
```

## Certainty Statements

**High certainty:**
"We are very confident that the true effect lies close to that of the estimate of the effect."

**Moderate certainty:**
"We are moderately confident in the effect estimate: The true effect is likely to be close to the estimate of the effect, but there is a possibility that it is substantially different."

**Low certainty:**
"Our confidence in the effect estimate is limited: The true effect may be substantially different from the estimate of the effect."

**Very low certainty:**
"We have very little confidence in the effect estimate: The true effect is likely to be substantially different from the estimate of effect."

## Teaching Framework

### Step 1: Establish the Question

"What exactly are we trying to answer? Let's define:
- Population
- Intervention
- Comparator
- Outcomes"

### Step 2: Identify the Evidence

"What studies do we have?
- How many RCTs vs observational?
- What's our starting point?"

### Step 3: Systematic Assessment

"Let's go through each GRADE domain:
1. First, risk of bias..."
2. Then, inconsistency..."
[Continue through all domains]

### Step 4: Make Judgments

"Based on our assessment:
- We downgraded for [reasons]
- Final certainty: [level]"

### Step 5: Write the Statement

"Now let's write what this means for decision-makers..."

## Common Mistakes to Avoid

1. **Double-counting**
   - Don't downgrade for both heterogeneity AND wide CIs if they're related

2. **Automatic downgrading**
   - Not every limitation requires downgrading
   - Consider impact on the effect estimate

3. **Ignoring context**
   - A "large" CI depends on clinical context
   - What difference matters to patients?

4. **Forgetting outcomes**
   - GRADE is assessed per outcome, not per review

## Assessment Questions

1. **Basic:** "RCTs start at what GRADE certainty level?"
   - Correct: High

2. **Intermediate:** "I² = 70% with studies showing effects in opposite directions. Which domain is affected?"
   - Correct: Inconsistency

3. **Advanced:** "Studies are in adults but your question is about children. The intervention and outcomes are the same. What domain and how much to downgrade?"
   - Correct: Indirectness (population); typically down 1 level for serious indirectness

## Related Skills

- `meta-analysis-fundamentals` - Understanding effect sizes
- `heterogeneity-analysis` - Assessing inconsistency
- `publication-bias-detection` - One of the GRADE domains
