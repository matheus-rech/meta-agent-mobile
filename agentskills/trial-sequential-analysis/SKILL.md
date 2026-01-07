---
name: trial-sequential-analysis
description: Teach Trial Sequential Analysis (TSA) for controlling type I and II errors in cumulative meta-analyses. Use when users need to assess if meta-analysis has sufficient information, want to avoid premature conclusions, or need to plan future trials.
license: Apache-2.0
compatibility: Works with any AI agent capable of statistical reasoning
metadata:
  author: meta-agent
  version: "1.0.0"
  category: statistics
  domain: evidence-synthesis
  difficulty: advanced
  estimated-time: "25 minutes"
  prerequisites:
    - meta-analysis-fundamentals
    - heterogeneity-analysis
---

# Trial Sequential Analysis (TSA)

This skill teaches Trial Sequential Analysis, a method that applies formal stopping boundaries to cumulative meta-analysis to control the risks of type I and II errors due to sparse data and repetitive testing.

## Overview

Trial Sequential Analysis combines cumulative meta-analysis with group sequential monitoring boundaries. It helps determine whether the evidence in a meta-analysis is conclusive or if more trials are needed, preventing both premature claims of effect and unnecessary continuation of research.

## When to Use This Skill

Activate this skill when users:
- Ask about "trial sequential analysis" or "TSA"
- Want to know if their meta-analysis has enough information
- Are concerned about type I errors from repeated testing
- Need to calculate required information size (RIS)
- Want to create TSA plots or monitoring boundaries
- Are planning future trials based on existing evidence

## Core Concepts to Teach

### 1. The Problem TSA Solves

**Why Standard Meta-Analysis Can Mislead:**
- Cumulative MA updates with each new trial
- Multiple testing inflates type I error
- Early results often exaggerate effects
- Small samples lead to random high/low findings

**Analogy:**
> "Imagine checking your stock portfolio every hour vs once a year. The more you check, the more likely you'll see extreme values that don't reflect true performance. TSA is like setting rules for when to actually act on what you see."

**Socratic Questions:**
- "If you update a meta-analysis after every new trial, how does this affect your error rate?"
- "Why might the first few trials in a field show larger effects than later trials?"
- "How is cumulative meta-analysis similar to interim analyses in a single trial?"

### 2. Key Concepts

**Required Information Size (RIS):**
- The "sample size" needed for conclusive meta-analysis
- Analogous to sample size calculation for single trial
- Depends on: expected effect, variance, α, β, heterogeneity

**Information Fraction:**
- Current information / Required information
- Indicates how close we are to conclusive evidence
- Similar to interim analysis timing

**Monitoring Boundaries:**
- Lines that define when to stop for benefit/harm/futility
- Derived from group sequential methods (O'Brien-Fleming, etc.)
- Adjusted for heterogeneity in meta-analysis

### 3. TSA Boundaries Explained

**Types of Boundaries:**

| Boundary | Meaning | Action |
|----------|---------|--------|
| **Benefit** | Effect is conclusively positive | Stop, recommend intervention |
| **Harm** | Effect is conclusively negative | Stop, do not recommend |
| **Futility** | Effect unlikely to reach significance | Stop, effect too small to matter |
| **Inner wedge** | Inconclusive | Continue research |

**Visual Representation:**
```
                    Benefit Boundary
                   /
                  /
    Z-score      /
                /
    ─────────────────────────────── No effect line
                \
                 \
                  \
                   \
                    Futility/Harm Boundary
    
    ──────────────────────────────────────────►
                Information Fraction (%)
```

### 4. Calculating Required Information Size

**Formula Components:**
```
RIS = f(α, β, δ, σ², D²)

Where:
α = Type I error (usually 0.05)
β = Type II error (usually 0.20 for 80% power)
δ = Minimal clinically important difference
σ² = Variance of outcome
D² = Diversity (heterogeneity adjustment)
```

**Heterogeneity Adjustment:**
```
RIS_adjusted = RIS × (1 + D²)

Where D² ≈ I²/(100 - I²) for I² < 100%
```

**Example Calculation:**
```r
# For binary outcome (OR)
# Assuming OR = 0.80, control event rate = 20%
# α = 0.05 (two-sided), β = 0.20, I² = 50%

# Unadjusted RIS
ris_unadjusted <- 2 * ((1.96 + 0.84)^2) / (log(0.80)^2 * 0.20 * 0.80)
# ≈ 3,900 participants

# Adjusted for heterogeneity
D2 <- 0.50 / (1 - 0.50)  # = 1.0
ris_adjusted <- ris_unadjusted * (1 + D2)
# ≈ 7,800 participants
```

### 5. Performing TSA in R

**Using the RTSA package:**
```r
# Install if needed
# install.packages("RTSA")
library(RTSA)

# Prepare data
data <- data.frame(
  study = c("Trial1", "Trial2", "Trial3", "Trial4", "Trial5"),
  year = c(2010, 2012, 2014, 2016, 2018),
  events_treat = c(15, 22, 18, 25, 20),
  n_treat = c(100, 150, 120, 180, 140),
  events_ctrl = c(20, 28, 25, 32, 28),
  n_ctrl = c(100, 150, 120, 180, 140)
)

# Perform TSA
tsa_result <- RTSA(
  type = "binary",
  outcome = "RR",
  data = data,
  alpha = 0.05,
  beta = 0.20,
  RRR = 0.20,  # 20% relative risk reduction
  Pc = 0.20,   # Control event rate
  fixed = FALSE,
  tau2 = "DL"
)

# View results
summary(tsa_result)
plot(tsa_result)
```

**Using TSA Software (Copenhagen Trial Unit):**
```
# TSA software provides GUI interface
# Available at: https://ctu.dk/tsa/

# Key inputs:
# - Effect measure (OR, RR, MD, SMD)
# - Alpha and beta spending functions
# - Anticipated intervention effect
# - Control group event rate/mean
# - Heterogeneity correction
```

### 6. Interpreting TSA Results

**Scenario 1: Crosses Benefit Boundary**
```
Interpretation: "The cumulative Z-curve has crossed the 
monitoring boundary for benefit. The evidence is sufficient 
to conclude that the intervention is effective. Further 
trials may not be necessary for this outcome."
```

**Scenario 2: Within Inner Wedge**
```
Interpretation: "The cumulative Z-curve remains within the 
futility boundaries. The current evidence is inconclusive. 
The information fraction is X%, meaning we have collected 
only X% of the required information size. More trials are 
needed before firm conclusions can be drawn."
```

**Scenario 3: Crosses Futility Boundary**
```
Interpretation: "The cumulative Z-curve has crossed the 
futility boundary. Even if future trials show positive 
results, it is unlikely the pooled effect will reach 
statistical significance. The intervention effect, if 
any, is likely too small to be clinically meaningful."
```

### 7. Reporting TSA Results

**Essential Elements:**
1. RIS calculation with assumptions stated
2. Current information fraction
3. TSA plot with boundaries
4. Interpretation of where Z-curve lies
5. Implications for future research

**Example Reporting:**
> "Trial sequential analysis was conducted with α=5% (two-sided), β=20%, anticipated RRR=20%, and control event rate=25%. The diversity-adjusted required information size was 4,500 participants. The current meta-analysis includes 2,800 participants (62% of RIS). The cumulative Z-curve has not crossed any monitoring boundaries, indicating that the evidence remains inconclusive. Additional trials enrolling approximately 1,700 participants would be needed to reach firm conclusions."

### 8. Limitations and Caveats

**Important Considerations:**
1. **Assumption sensitivity:** RIS depends heavily on assumed effect size
2. **Heterogeneity estimation:** Uncertain with few studies
3. **Not a replacement:** TSA complements, doesn't replace, quality assessment
4. **Publication bias:** TSA doesn't account for missing studies
5. **Outcome selection:** Results may differ across outcomes

## Assessment Questions

1. **Basic:** "What problem does TSA solve that standard meta-analysis doesn't address?"
   - Correct: Controls type I error from repeated testing as evidence accumulates

2. **Intermediate:** "What is the Required Information Size and how is it affected by heterogeneity?"
   - Correct: RIS is the sample size needed for conclusive evidence; heterogeneity increases RIS

3. **Advanced:** "A TSA shows the Z-curve within the inner wedge at 40% information fraction. What do you conclude?"
   - Guide: Evidence is inconclusive; 60% more information needed; cannot claim effect or no effect

## Common Misconceptions

1. **"Crossing the conventional significance line (Z=1.96) is sufficient"**
   - Reality: May be false positive due to repeated testing; need to cross TSA boundary

2. **"TSA can prove no effect exists"**
   - Reality: Can only show futility (effect too small to detect with planned power)

3. **"TSA boundaries are the same as in single trials"**
   - Reality: Adjusted for heterogeneity and information-based (not time-based)

## Example Dialogue

**User:** "My meta-analysis shows a significant effect (p=0.03) with 5 trials. Is this conclusive?"

**Response Framework:**
1. Acknowledge the finding
2. Explain why p<0.05 may not be conclusive in cumulative MA
3. Guide through RIS calculation
4. Discuss information fraction
5. Interpret position relative to boundaries
6. Recommend next steps

## References

- Wetterslev J et al. Trial sequential analysis may establish when firm evidence is reached. J Clin Epidemiol 2008
- Thorlund K et al. User manual for TSA. Copenhagen Trial Unit 2011
- Brok J et al. Trial sequential analysis reveals insufficient information size. J Clin Epidemiol 2008
- Cochrane Handbook section on TSA

## Adaptation Guidelines

**Glass (the teaching agent) MUST adapt this content to the learner:**

1. **Language Detection:** Detect the user's language from their messages and respond naturally in that language
2. **Cultural Context:** Adapt examples to local healthcare systems and research contexts when relevant
3. **Technical Terms:** Maintain standard English terms (e.g., "TSA", "RIS", "monitoring boundary") but explain them in the user's language
4. **Level Adaptation:** Adjust complexity based on user's demonstrated knowledge level
5. **Socratic Method:** Ask guiding questions in the detected language to promote deep understanding
6. **Local Examples:** When possible, reference studies or guidelines familiar to the user's region

**Example Adaptations:**
- 🇧🇷 Portuguese: Reference Brazilian clinical trial networks and REBEC registry
- 🇪🇸 Spanish: Include examples from Latin American Cochrane centers
- 🇨🇳 Chinese: Reference Chinese clinical trial registry and local MA examples

## Related Skills

- `meta-analysis-fundamentals` - Basic concepts prerequisite
- `heterogeneity-analysis` - Understanding D² adjustment
- `publication-bias-detection` - Complementary quality assessment
- `bayesian-meta-analysis` - Alternative approach to sequential updating
