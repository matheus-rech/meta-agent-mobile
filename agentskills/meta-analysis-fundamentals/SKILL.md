---
name: meta-analysis-fundamentals
description: Teach the foundational concepts of meta-analysis including effect sizes, statistical models, and evidence synthesis. Use when users ask about meta-analysis basics, want to understand pooled effects, or need guidance on fixed vs random effects models.
license: Apache-2.0
compatibility: Works with any AI agent capable of statistical reasoning
metadata:
  author: meta-agent
  version: "1.0.0"
  category: statistics
  domain: evidence-synthesis
  difficulty: beginner
  estimated-time: "15 minutes"
---

# Meta-Analysis Fundamentals

This skill teaches the foundational concepts of meta-analysis, enabling you to explain and guide users through evidence synthesis methodology.

## Overview

Meta-analysis is a statistical technique that combines results from multiple studies to arrive at a more precise estimate of an effect. It is the cornerstone of evidence-based medicine and research synthesis.

## When to Use This Skill

Activate this skill when users:
- Ask "What is meta-analysis?"
- Want to understand effect sizes (OR, RR, SMD, MD)
- Need to choose between fixed and random effects models
- Ask about combining studies or pooling results
- Mention systematic reviews or evidence synthesis

## Core Concepts to Teach

### 1. What is Meta-Analysis?

**Definition:** A "study of studies" that statistically combines results from multiple independent studies.

**Key Teaching Points:**
- Individual studies have limitations (small samples, specific populations)
- Combining studies increases statistical power
- Allows detection of smaller effects
- Improves generalizability of findings

**Socratic Questions:**
- "Why might a single study not give us the complete picture?"
- "What happens to our confidence when we have more data?"
- "Can you think of situations where combining studies might be problematic?"

### 2. Effect Sizes

Effect sizes quantify the magnitude of a treatment effect in a standardized way.

| Type | Use Case | Interpretation |
|------|----------|----------------|
| **Odds Ratio (OR)** | Binary outcomes | OR=1 means no effect; OR<1 favors treatment; OR>1 favors control |
| **Risk Ratio (RR)** | Binary outcomes | RR=0.5 means 50% risk reduction |
| **SMD (Hedges' g)** | Continuous outcomes, different scales | 0.2=small, 0.5=medium, 0.8=large |
| **Mean Difference (MD)** | Continuous outcomes, same scale | Direct interpretation in original units |

**Teaching Approach:**
1. First identify the outcome type (binary vs continuous)
2. Then consider whether scales are comparable
3. Guide user to appropriate effect size choice

### 3. Fixed vs Random Effects Models

**Fixed-Effect Model:**
- Assumes ONE true effect across all studies
- Differences between studies = sampling error only
- Use when: Studies are functionally identical

**Random-Effects Model:**
- Assumes true effects VARY between studies
- Accounts for both within-study and between-study variance
- Use when: Studies differ in populations, interventions, or settings
- Most common in medical research (DerSimonian-Laird method)

**Decision Framework:**
```
Are studies measuring the exact same thing 
in the exact same population?
    │
    ├── YES → Consider Fixed-Effect
    │
    └── NO → Use Random-Effects (default choice)
```

## Assessment Questions

Use these to verify understanding:

1. **Basic:** "What is the main advantage of meta-analysis over a single study?"
   - Correct: Increased statistical power
   - Common misconception: "It's faster" or "It eliminates bias"

2. **Intermediate:** "When should you use a random-effects model?"
   - Correct: When true effects are expected to vary between studies
   - Common misconception: "When you have fewer studies"

3. **Advanced:** "An OR of 0.5 with 95% CI [0.3, 0.8] - is this statistically significant and clinically meaningful?"
   - Guide: CI doesn't cross 1 → significant; 50% odds reduction → likely meaningful

## Common Misconceptions to Address

1. **"Meta-analysis eliminates bias"**
   - Reality: Can amplify biases if studies are biased
   - Teach: "Garbage in, garbage out"

2. **"More studies = better meta-analysis"**
   - Reality: Quality matters more than quantity
   - Teach: Risk of bias assessment is crucial

3. **"The pooled effect is the 'true' effect"**
   - Reality: It's an estimate with uncertainty
   - Teach: Always report confidence intervals

## Example Dialogue

**User:** "I want to combine results from 5 studies on aspirin for heart disease. How do I start?"

**Response Framework:**
1. Acknowledge the goal
2. Ask about outcome type (heart attacks? deaths? continuous measure?)
3. Guide to appropriate effect size
4. Discuss model choice (likely random-effects given clinical heterogeneity)
5. Mention data requirements

## References

See [references/cochrane-handbook.md](references/cochrane-handbook.md) for detailed methodology.
See [references/effect-size-formulas.md](references/effect-size-formulas.md) for calculations.

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

## Related Skills

- `forest-plot-creation` - Visualizing meta-analysis results
- `heterogeneity-analysis` - Assessing between-study variation
- `publication-bias-detection` - Identifying missing studies
