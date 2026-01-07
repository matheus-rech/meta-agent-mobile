---
name: forest-plot-creation
description: Generate and interpret forest plots for meta-analysis visualization using R and the metafor package. Use when users need to create forest plots, understand visual representation of pooled effects, or interpret study weights and confidence intervals.
license: Apache-2.0
compatibility: Requires R with metafor package installed
metadata:
  author: meta-agent
  version: "1.0.0"
  category: visualization
  domain: evidence-synthesis
  difficulty: intermediate
  estimated-time: "10 minutes"
  prerequisites: meta-analysis-fundamentals
allowed-tools: code_execution
---

# Forest Plot Creation

This skill enables creation and interpretation of forest plots, the standard visualization for meta-analysis results.

## Overview

A forest plot displays individual study results alongside the pooled estimate, showing effect sizes, confidence intervals, and study weights at a glance.

## When to Use This Skill

Activate this skill when users:
- Ask to "create a forest plot"
- Want to visualize meta-analysis results
- Need to interpret forest plot components
- Ask about study weights or diamonds
- Mention "blobbogram" (alternative name)

## Forest Plot Anatomy

```
Study            Effect [95% CI]        Weight
─────────────────────────────────────────────────
Smith 2020       ──■──                   15.2%
                 0.75 [0.52, 1.08]
                 
Jones 2021         ──■──                 22.1%
                   0.82 [0.65, 1.03]
                   
Lee 2022        ─■─                      8.4%
                0.45 [0.22, 0.92]
─────────────────────────────────────────────────
Overall         ◆                        100%
                0.72 [0.58, 0.89]
                
        ←Favors Treatment | Favors Control→
                    │
                   1.0 (null)
```

**Key Components:**
- **Square (■):** Point estimate for each study
- **Horizontal line:** 95% confidence interval
- **Square size:** Proportional to study weight
- **Diamond (◆):** Pooled effect estimate
- **Diamond width:** Confidence interval of pooled effect
- **Vertical line:** Line of no effect (OR=1, SMD=0)

## R Code for Forest Plots

### Basic Forest Plot

```r
library(metafor)

# Example data: effect sizes and standard errors
dat <- data.frame(
  study = c("Smith 2020", "Jones 2021", "Lee 2022", "Chen 2023"),
  yi = c(-0.29, -0.20, -0.80, -0.35),  # log odds ratios
  sei = c(0.18, 0.12, 0.37, 0.15)       # standard errors
)

# Fit random-effects model
res <- rma(yi = yi, sei = sei, data = dat, method = "REML")

# Create forest plot
forest(res, 
       slab = dat$study,
       header = "Study",
       xlab = "Log Odds Ratio",
       mlab = "Random Effects Model")
```

### Customized Forest Plot

```r
# Enhanced forest plot with more options
forest(res,
       slab = dat$study,
       header = c("Study", "Log OR [95% CI]"),
       xlab = "Log Odds Ratio",
       mlab = "RE Model (DL)",
       xlim = c(-2.5, 1.5),
       alim = c(-1.5, 0.5),
       at = c(-1.5, -1, -0.5, 0, 0.5),
       refline = 0,
       col = "navy",
       border = "navy",
       fonts = 1,
       cex = 0.9)

# Add text annotations
text(-2.5, -1, "Favors Treatment", pos = 4, cex = 0.8)
text(1.5, -1, "Favors Control", pos = 2, cex = 0.8)
```

### Forest Plot with Subgroups

```r
# Add subgroup variable
dat$subgroup <- c("RCT", "RCT", "Observational", "RCT")

# Fit model with moderator
res_sub <- rma(yi = yi, sei = sei, mods = ~ subgroup, data = dat)

# Forest plot with subgroups
forest(res_sub,
       slab = dat$study,
       order = order(dat$subgroup),
       rows = c(1:2, 5:6),
       ylim = c(-1, 9),
       header = TRUE)

# Add subgroup labels
text(-2.5, c(3, 7), c("Observational", "RCT"), font = 2, pos = 4)
```

## Teaching Interpretation

### Guide Users Through Reading

1. **Start with the overall effect (diamond)**
   - "The diamond shows our pooled estimate"
   - "Its position tells us the direction of effect"
   - "Its width shows our uncertainty"

2. **Check if it crosses the null line**
   - "Does the diamond touch or cross the vertical line?"
   - "If not, the effect is statistically significant"

3. **Examine individual studies**
   - "Look at how studies cluster or spread"
   - "Wide spread = heterogeneity"
   - "Larger squares = more influential studies"

4. **Assess consistency**
   - "Do most studies point the same direction?"
   - "Are there outliers?"

### Socratic Questions for Interpretation

- "What does the size of each square tell you?"
- "Why might one study have a much wider confidence interval?"
- "If the diamond crosses 1 (or 0), what does that mean?"
- "Looking at this plot, would you say the studies agree with each other?"

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Overlapping labels | Use `rows` argument to space studies |
| Axis too wide | Set `xlim` and `alim` manually |
| Studies in wrong order | Use `order` argument |
| Need back-transformed values | Use `atransf = exp` for odds ratios |

## Assessment Questions

1. **Basic:** "What does a larger square in a forest plot indicate?"
   - Correct: Greater study weight (usually from larger sample/smaller variance)

2. **Intermediate:** "The diamond doesn't touch the line at 1. What does this tell us?"
   - Correct: The pooled effect is statistically significant

3. **Advanced:** "Studies show effects on both sides of the null line. What should we investigate?"
   - Correct: Heterogeneity - examine I² and consider subgroup analysis

## Related Skills

- `meta-analysis-fundamentals` - Understanding effect sizes
- `heterogeneity-analysis` - When studies disagree
- `r-code-generation` - Advanced R programming

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
