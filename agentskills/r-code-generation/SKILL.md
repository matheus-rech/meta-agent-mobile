---
name: r-code-generation
description: Generate R code for meta-analysis using the metafor package, including data preparation, model fitting, visualization, and sensitivity analyses. Use when users need executable R code for their meta-analysis workflow.
license: Apache-2.0
compatibility: Requires R 4.0+ with metafor package
metadata:
  author: meta-agent
  version: "1.0.0"
  category: programming
  domain: evidence-synthesis
  difficulty: intermediate
  estimated-time: "15 minutes"
  prerequisites: meta-analysis-fundamentals
allowed-tools: code_execution
---

# R Code Generation for Meta-Analysis

This skill enables generation of production-ready R code for meta-analysis using the metafor package.

## Overview

The metafor package is the gold standard for meta-analysis in R. This skill teaches how to generate correct, efficient, and well-documented R code for common meta-analysis tasks.

## When to Use This Skill

Activate this skill when users:
- Ask for R code to run a meta-analysis
- Need help with metafor syntax
- Want to automate their analysis workflow
- Need code for specific analyses (subgroup, sensitivity, etc.)
- Ask about WebR or running R in the browser

## Complete Meta-Analysis Workflow

### Step 1: Setup and Data Preparation

```r
# Install and load packages
if (!require("metafor")) install.packages("metafor")
library(metafor)

# Create or load data
dat <- data.frame(
  study = c("Smith 2020", "Jones 2021", "Lee 2022", "Chen 2023", "Kim 2024"),
  year = c(2020, 2021, 2022, 2023, 2024),
  
  # For binary outcomes
  ai = c(15, 22, 8, 30, 12),   # events in treatment
  bi = c(85, 78, 42, 70, 88),  # non-events in treatment
  ci = c(25, 28, 15, 35, 20),  # events in control
  di = c(75, 72, 35, 65, 80),  # non-events in control
  
  # For continuous outcomes
  m1i = c(12.5, 11.8, 13.2, 10.5, 12.0),  # mean treatment
  sd1i = c(3.2, 2.8, 4.1, 3.5, 3.0),      # SD treatment
  n1i = c(50, 60, 45, 80, 55),            # n treatment
  m2i = c(15.2, 14.5, 16.0, 13.8, 14.2),  # mean control
  sd2i = c(3.5, 3.0, 4.5, 3.8, 3.2),      # SD control
  n2i = c(50, 60, 45, 80, 55)             # n control
)
```

### Step 2: Calculate Effect Sizes

```r
# Binary outcomes - Odds Ratio
dat_or <- escalc(measure = "OR",
                 ai = ai, bi = bi, ci = ci, di = di,
                 data = dat,
                 slab = study)

# Binary outcomes - Risk Ratio
dat_rr <- escalc(measure = "RR",
                 ai = ai, bi = bi, ci = ci, di = di,
                 data = dat,
                 slab = study)

# Continuous outcomes - Standardized Mean Difference
dat_smd <- escalc(measure = "SMD",
                  m1i = m1i, sd1i = sd1i, n1i = n1i,
                  m2i = m2i, sd2i = sd2i, n2i = n2i,
                  data = dat,
                  slab = study)

# Continuous outcomes - Mean Difference
dat_md <- escalc(measure = "MD",
                 m1i = m1i, sd1i = sd1i, n1i = n1i,
                 m2i = m2i, sd2i = sd2i, n2i = n2i,
                 data = dat,
                 slab = study)
```

### Step 3: Fit Meta-Analysis Model

```r
# Random-effects model (recommended default)
res <- rma(yi, vi, data = dat_or, method = "REML")

# Alternative estimators
res_dl <- rma(yi, vi, data = dat_or, method = "DL")    # DerSimonian-Laird
res_pm <- rma(yi, vi, data = dat_or, method = "PM")    # Paule-Mandel
res_ml <- rma(yi, vi, data = dat_or, method = "ML")    # Maximum Likelihood

# Fixed-effect model
res_fe <- rma(yi, vi, data = dat_or, method = "FE")

# View results
print(res)
summary(res)
```

### Step 4: Forest Plot

```r
# Basic forest plot
forest(res)

# Customized forest plot
forest(res,
       header = c("Study", "Log OR [95% CI]"),
       xlab = "Log Odds Ratio",
       mlab = "Random Effects Model",
       xlim = c(-3, 2),
       alim = c(-2, 1),
       at = c(-2, -1, 0, 1),
       refline = 0,
       digits = 2,
       cex = 0.9)

# Add prediction interval
forest(res, addpred = TRUE)

# Back-transform to OR scale
forest(res, 
       atransf = exp,
       at = log(c(0.25, 0.5, 1, 2, 4)),
       xlim = c(-3, 3),
       xlab = "Odds Ratio")
```

### Step 5: Heterogeneity Assessment

```r
# Heterogeneity statistics are in model output
res$tau2    # tau-squared
res$I2      # I-squared
res$H2      # H-squared
res$QE      # Q statistic
res$QEp     # p-value for Q

# Confidence intervals for heterogeneity
confint(res)

# Prediction interval
predict(res)
```

### Step 6: Publication Bias

```r
# Funnel plot
funnel(res)

# Contour-enhanced funnel plot
funnel(res,
       level = c(0.90, 0.95, 0.99),
       shade = c("white", "gray75", "gray55"),
       legend = TRUE)

# Egger's test
regtest(res, model = "lm")

# Begg's rank correlation
ranktest(res)

# Trim-and-fill
taf <- trimfill(res)
print(taf)
funnel(taf)
```

### Step 7: Subgroup Analysis

```r
# Add subgroup variable
dat_or$subgroup <- c("RCT", "RCT", "Observational", "RCT", "Observational")

# Subgroup analysis using moderator
res_sub <- rma(yi, vi, mods = ~ subgroup, data = dat_or)
print(res_sub)

# Separate analyses by subgroup
res_rct <- rma(yi, vi, data = dat_or, subset = (subgroup == "RCT"))
res_obs <- rma(yi, vi, data = dat_or, subset = (subgroup == "Observational"))

# Forest plot with subgroups
forest(res, 
       order = order(dat_or$subgroup),
       rows = c(1:2, 5:7),
       ylim = c(-1, 10))
text(-3, c(3, 8), c("Observational", "RCT"), font = 2, pos = 4)
```

### Step 8: Sensitivity Analysis

```r
# Leave-one-out analysis
leave1out <- leave1out(res)
print(leave1out)
forest(leave1out)

# Influence diagnostics
inf <- influence(res)
print(inf)
plot(inf)

# Cumulative meta-analysis (by year)
dat_or <- dat_or[order(dat_or$year), ]
res_ordered <- rma(yi, vi, data = dat_or)
cumul <- cumul(res_ordered)
forest(cumul)
```

### Step 9: Meta-Regression

```r
# Add continuous moderator
dat_or$mean_age <- c(45, 52, 38, 60, 55)

# Meta-regression
res_reg <- rma(yi, vi, mods = ~ mean_age, data = dat_or)
print(res_reg)

# Bubble plot
regplot(res_reg, xlab = "Mean Age", ylab = "Log OR")

# Multiple moderators
res_reg2 <- rma(yi, vi, mods = ~ mean_age + year, data = dat_or)
```

## WebR Integration

For browser-based execution:

```r
# WebR-compatible code (no file I/O)
library(metafor)

# Data as vectors (WebR-friendly)
yi <- c(-0.51, -0.32, -0.89, -0.22, -0.45)
vi <- c(0.08, 0.05, 0.15, 0.04, 0.06)
study <- c("Smith", "Jones", "Lee", "Chen", "Kim")

# Run analysis
res <- rma(yi = yi, vi = vi, slab = study)
print(res)

# Generate forest plot
forest(res)
```

## Code Templates by Analysis Type

### Template: Basic Meta-Analysis

```r
# === META-ANALYSIS TEMPLATE ===
library(metafor)

# 1. Data
dat <- escalc(measure = "OR",
              ai = events_tx, bi = nonevents_tx,
              ci = events_ctrl, di = nonevents_ctrl,
              data = mydata, slab = study)

# 2. Model
res <- rma(yi, vi, data = dat, method = "REML")

# 3. Results
print(res)
forest(res, atransf = exp)
funnel(res)

# 4. Heterogeneity
confint(res)

# 5. Bias
regtest(res)
trimfill(res)
```

### Template: Subgroup Analysis

```r
# === SUBGROUP ANALYSIS TEMPLATE ===
# Test for subgroup differences
res_mod <- rma(yi, vi, mods = ~ subgroup - 1, data = dat)
print(res_mod)

# Q-test for heterogeneity between subgroups
anova(res_mod, btt = 1:nlevels(factor(dat$subgroup)))
```

### Template: Network Meta-Analysis Setup

```r
# === NETWORK META-ANALYSIS (requires netmeta) ===
library(netmeta)

# Pairwise data format
nma <- netmeta(TE, seTE, treat1, treat2, studlab,
               data = dat, sm = "OR", reference = "placebo")
print(nma)
netgraph(nma)
forest(nma)
```

## Error Handling

```r
# Wrap in tryCatch for robust execution
result <- tryCatch({
  res <- rma(yi, vi, data = dat)
  list(success = TRUE, model = res)
}, error = function(e) {
  list(success = FALSE, error = e$message)
})

if (result$success) {
  print(result$model)
} else {
  cat("Error:", result$error)
}
```

## Assessment Questions

1. **Basic:** "What function calculates effect sizes in metafor?"
   - Correct: `escalc()`

2. **Intermediate:** "How do you specify a random-effects model with REML estimation?"
   - Correct: `rma(yi, vi, data = dat, method = "REML")`

3. **Advanced:** "How do you create a forest plot with back-transformed odds ratios?"
   - Correct: `forest(res, atransf = exp)`

## Related Skills

- `meta-analysis-fundamentals` - Understanding the statistics
- `forest-plot-creation` - Visualization details
- `data-extraction` - Preparing data for analysis
