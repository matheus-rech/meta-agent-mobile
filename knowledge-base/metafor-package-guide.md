# metafor R Package Guide

The `metafor` package is the most comprehensive R package for conducting meta-analyses. This guide covers essential functions for Glass 🦊 to teach.

## Installation

```r
install.packages("metafor")
library(metafor)
```

## Core Functions

### 1. Effect Size Calculation: `escalc()`

Calculate effect sizes from study data.

```r
# For continuous outcomes (standardized mean difference)
dat <- escalc(measure = "SMD", 
              m1i = mean_treatment, m2i = mean_control,
              sd1i = sd_treatment, sd2i = sd_control,
              n1i = n_treatment, n2i = n_control,
              data = mydata)

# For dichotomous outcomes (odds ratio)
dat <- escalc(measure = "OR",
              ai = events_treatment, bi = nonevents_treatment,
              ci = events_control, di = nonevents_control,
              data = mydata)
```

**Common Measures:**
| Measure | Description | Data Type |
|---------|-------------|-----------|
| SMD | Standardized Mean Difference (Hedges' g) | Continuous |
| MD | Raw Mean Difference | Continuous |
| ROM | Ratio of Means | Continuous |
| OR | Odds Ratio (log scale) | Dichotomous |
| RR | Risk Ratio (log scale) | Dichotomous |
| RD | Risk Difference | Dichotomous |
| COR | Correlation Coefficient | Correlation |
| ZCOR | Fisher's z-transformed correlation | Correlation |

### 2. Meta-Analysis Models: `rma()`

Fit meta-analytic models.

```r
# Fixed-effect model
res_fe <- rma(yi, vi, data = dat, method = "FE")

# Random-effects model (DerSimonian-Laird)
res_re <- rma(yi, vi, data = dat, method = "DL")

# Random-effects model (REML - recommended)
res_reml <- rma(yi, vi, data = dat, method = "REML")
```

**Method Options:**
- `"FE"` - Fixed-effect
- `"DL"` - DerSimonian-Laird
- `"REML"` - Restricted Maximum Likelihood (default, recommended)
- `"ML"` - Maximum Likelihood
- `"PM"` - Paule-Mandel
- `"EB"` - Empirical Bayes

### 3. Forest Plots: `forest()`

```r
# Basic forest plot
forest(res)

# Customized forest plot
forest(res,
       slab = dat$study,           # Study labels
       xlim = c(-2, 3),            # X-axis limits
       xlab = "Standardized Mean Difference",
       header = "Study",
       showweights = TRUE)         # Show study weights
```

### 4. Funnel Plots: `funnel()`

Assess publication bias visually.

```r
# Basic funnel plot
funnel(res)

# Enhanced funnel plot
funnel(res, 
       level = c(90, 95, 99),      # Confidence regions
       shade = c("white", "gray75", "gray55"),
       refline = 0)
```

### 5. Publication Bias Tests

```r
# Egger's regression test
regtest(res)

# Rank correlation test (Begg & Mazumdar)
ranktest(res)

# Trim and fill method
trimfill(res)
```

### 6. Heterogeneity Assessment

```r
# Results include:
res$QE      # Q statistic
res$QEp     # p-value for Q
res$I2      # I² statistic
res$H2      # H² statistic
res$tau2    # Between-study variance

# Prediction interval
predict(res, digits = 2)
```

### 7. Subgroup Analysis

```r
# Subgroup analysis using moderator
res_sub <- rma(yi, vi, mods = ~ subgroup - 1, data = dat)

# Test for subgroup differences
res_sub$QM   # Test statistic
res_sub$QMp  # p-value
```

### 8. Meta-Regression

```r
# Single moderator
res_reg <- rma(yi, vi, mods = ~ year, data = dat)

# Multiple moderators
res_reg <- rma(yi, vi, mods = ~ year + quality, data = dat)
```

## Example: Complete Analysis

```r
library(metafor)

# Example data: BCG vaccine trials
data(dat.bcg)

# Calculate log risk ratios
dat <- escalc(measure = "RR", 
              ai = tpos, bi = tneg,
              ci = cpos, di = cneg,
              data = dat.bcg)

# Random-effects meta-analysis
res <- rma(yi, vi, data = dat, method = "REML")

# View results
summary(res)

# Forest plot
forest(res, slab = dat$author, header = "Author(s) and Year")

# Funnel plot
funnel(res)

# Test for publication bias
regtest(res)

# Subgroup by latitude
res_lat <- rma(yi, vi, mods = ~ ablat, data = dat)
summary(res_lat)
```

## Interpreting Output

```
Random-Effects Model (k = 13; tau^2 estimator: REML)

tau^2 (estimated amount of total heterogeneity): 0.3132
tau (square root of estimated tau^2 value):      0.5597
I^2 (total heterogeneity / total variability):   92.22%
H^2 (total variability / sampling variability):  12.86

Test for Heterogeneity:
Q(df = 12) = 152.2330, p-val < .0001

Model Results:
estimate      se     zval    pval    ci.lb   ci.ub
 -0.7145  0.1787  -3.9987  <.0001  -1.0648  -0.3643
```

**Key Interpretations:**
- `estimate`: Pooled effect size (log RR = -0.71 → RR = 0.49)
- `tau^2`: Between-study variance
- `I^2`: 92% of variability due to heterogeneity (high)
- `Q test`: Significant heterogeneity (p < 0.0001)
- `ci.lb/ci.ub`: 95% confidence interval

## Network Meta-Analysis with netmeta

```r
library(netmeta)

# Pairwise data format
net <- netmeta(TE, seTE, treat1, treat2, studlab,
               data = pairwise_data,
               sm = "OR",
               random = TRUE)

# Network plot
netgraph(net)

# Forest plot of all comparisons
forest(net, ref = "placebo")

# League table
netleague(net)
```

## Diagnostic Meta-Analysis with mada

```r
library(mada)

# Bivariate model
fit <- reitsma(data = diagnostic_data,
               TP = "TP", FN = "FN", 
               FP = "FP", TN = "TN")

# Summary (pooled sensitivity/specificity)
summary(fit)

# SROC curve
plot(fit, sroclwd = 2)
```

## Teaching Tips for Glass 🦊

1. **Start simple**: Begin with `escalc()` and `rma()` before advanced topics
2. **Visualize first**: Forest plots help students understand what meta-analysis does
3. **Interpret I²**: Not just "high/low" but what it means for the question
4. **Check assumptions**: Always assess heterogeneity before pooling
5. **Report fully**: Effect size, CI, I², τ², prediction interval
