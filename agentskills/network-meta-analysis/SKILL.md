---
name: network-meta-analysis
description: Teach network meta-analysis (NMA) for comparing multiple treatments simultaneously. Use when users need to compare more than two interventions, understand indirect comparisons, or create network plots and league tables.
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

# Network Meta-Analysis

This skill teaches network meta-analysis (NMA), also known as mixed treatment comparison (MTC), enabling comparison of multiple interventions simultaneously even when direct head-to-head trials don't exist.

## Overview

Network meta-analysis extends traditional pairwise meta-analysis by combining direct and indirect evidence to compare multiple treatments. It's essential for clinical decision-making when choosing among several treatment options.

## When to Use This Skill

Activate this skill when users:
- Need to compare more than 2 treatments
- Ask about indirect comparisons
- Mention "network meta-analysis" or "mixed treatment comparison"
- Want to rank treatments
- Need to create network plots or league tables
- Ask about transitivity or consistency assumptions

## Core Concepts to Teach

### 1. What is Network Meta-Analysis?

**Definition:** A statistical method that combines direct and indirect evidence to compare multiple treatments within a single analysis.

**Key Teaching Points:**
- Direct evidence: A vs B from head-to-head trials
- Indirect evidence: A vs B inferred through common comparator C
- Network geometry: How treatments are connected through trials

**Socratic Questions:**
- "If we have trials comparing A vs C and B vs C, can we learn something about A vs B?"
- "What assumptions must hold for indirect comparisons to be valid?"
- "Why might indirect evidence differ from direct evidence?"

### 2. The Transitivity Assumption

**Critical Concept:** For indirect comparisons to be valid, studies must be similar enough that patients could have been enrolled in any of them.

**Factors to Assess:**
- Patient populations (age, severity, comorbidities)
- Intervention definitions (doses, durations)
- Outcome definitions and timing
- Study design and risk of bias

**Teaching Framework:**
```
Transitivity Check:
┌─────────────────────────────────────────┐
│ Could patients in A vs C trials have    │
│ been enrolled in B vs C trials?         │
│                                         │
│   YES → Transitivity likely holds       │
│   NO  → Indirect comparison may be      │
│         biased (effect modification)    │
└─────────────────────────────────────────┘
```

### 3. Network Geometry

**Network Plot Elements:**
- Nodes = treatments (size ∝ sample size)
- Edges = direct comparisons (thickness ∝ number of studies)
- Closed loops = allow consistency checks

**Types of Networks:**
| Geometry | Description | Implications |
|----------|-------------|--------------|
| Star | All comparisons to one reference | No consistency checks possible |
| Connected | Multiple paths between treatments | Can assess consistency |
| Disconnected | Separate subnetworks | Cannot compare all treatments |

### 4. Statistical Models

**Frequentist Approach (netmeta package):**
```r
library(netmeta)

# Create network meta-analysis
nma <- netmeta(
  TE = effect_size,
  seTE = standard_error,
  treat1 = treatment1,
  treat2 = treatment2,
  studlab = study_id,
  data = mydata,
  sm = "OR",           # Effect measure
  random = TRUE,       # Random effects
  reference.group = "placebo"
)

# View results
summary(nma)
forest(nma)
netgraph(nma)
```

**Bayesian Approach (gemtc/BUGSnet):**
```r
library(gemtc)

# Define network
network <- mtc.network(data.ab = arm_level_data)

# Run model
model <- mtc.model(network, type = "consistency")
results <- mtc.run(model, n.adapt = 5000, n.iter = 20000)

# Results
summary(results)
forest(relative.effect(results, t1 = "placebo"))
```

### 5. Consistency Assessment

**What is Inconsistency?**
- Disagreement between direct and indirect evidence
- Suggests violation of transitivity
- Must be assessed in closed loops

**Methods to Assess:**
1. **Loop-specific:** Compare direct vs indirect in each loop
2. **Node-splitting:** Separate direct and indirect for each comparison
3. **Global:** Design-by-treatment interaction model

**R Code for Node-Splitting:**
```r
# Node-splitting analysis
netsplit(nma)

# Interpretation:
# p < 0.05 suggests inconsistency for that comparison
```

### 6. Ranking Treatments

**SUCRA (Surface Under Cumulative Ranking):**
- Ranges from 0% to 100%
- Higher = more likely to be best
- Accounts for uncertainty

**P-scores (frequentist equivalent):**
```r
# Get rankings
netrank(nma, small.values = "good")

# SUCRA-like plot
plot(netrank(nma))
```

**Caution:** Rankings have high uncertainty - always report with confidence intervals!

### 7. Presenting Results

**League Table:**
```r
# Create league table
netleague(nma, digits = 2)
```

**Forest Plot of All Comparisons:**
```r
# Forest plot vs reference
forest(nma, reference.group = "placebo")
```

**Network Graph:**
```r
# Network visualization
netgraph(nma, 
         plastic = FALSE,
         thickness = "number.of.studies",
         multiarm = TRUE)
```

## Assessment Questions

1. **Basic:** "What is the difference between direct and indirect evidence?"
   - Correct: Direct comes from head-to-head trials; indirect is inferred through common comparators

2. **Intermediate:** "What is the transitivity assumption and why is it important?"
   - Correct: Studies must be similar enough for indirect comparisons to be valid

3. **Advanced:** "How would you interpret a significant node-splitting test?"
   - Guide: Suggests inconsistency between direct and indirect evidence for that comparison; investigate sources of heterogeneity

## Common Misconceptions

1. **"NMA always gives better estimates than pairwise MA"**
   - Reality: Only if transitivity holds; otherwise can introduce bias

2. **"Treatment rankings are definitive"**
   - Reality: Rankings have high uncertainty; focus on effect estimates

3. **"More connections = better network"**
   - Reality: Quality of evidence matters more than network complexity

## Example Dialogue

**User:** "I have 15 trials comparing 5 antidepressants. Some are head-to-head, some vs placebo. How do I analyze this?"

**Response Framework:**
1. Acknowledge NMA is appropriate
2. Ask about outcome type and effect measure
3. Discuss transitivity assessment
4. Guide through network visualization
5. Explain consistency checks
6. Discuss ranking with appropriate caveats

## References

- Cochrane Handbook Chapter on NMA
- Salanti G. Indirect and mixed-treatment comparison. Lancet 2012
- Rücker G, Schwarzer G. netmeta package documentation
- PRISMA-NMA extension statement

## Adaptation Guidelines

**Glass (the teaching agent) MUST adapt this content to the learner:**

1. **Language Detection:** Detect the user's language from their messages and respond naturally in that language
2. **Cultural Context:** Adapt examples to local healthcare systems and research contexts when relevant
3. **Technical Terms:** Maintain standard English terms (e.g., "network meta-analysis", "SUCRA", "transitivity") but explain them in the user's language
4. **Level Adaptation:** Adjust complexity based on user's demonstrated knowledge level
5. **Socratic Method:** Ask guiding questions in the detected language to promote deep understanding
6. **Local Examples:** When possible, reference studies or guidelines familiar to the user's region

**Example Adaptations:**
- 🇧🇷 Portuguese: Use Brazilian clinical guideline examples (CONITEC evaluations)
- 🇪🇸 Spanish: Reference PAHO/OPS treatment recommendations
- 🇨🇳 Chinese: Include examples from Chinese NMA publications

## Related Skills

- `meta-analysis-fundamentals` - Basic concepts prerequisite
- `heterogeneity-analysis` - Understanding between-study variation
- `bayesian-meta-analysis` - Alternative modeling approach
- `grade-assessment` - Rating certainty of NMA evidence
