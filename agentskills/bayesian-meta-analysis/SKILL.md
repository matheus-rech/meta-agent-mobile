---
name: bayesian-meta-analysis
description: Teach Bayesian approaches to meta-analysis including prior specification, MCMC methods, and interpretation of posterior distributions. Use when users want to incorporate prior knowledge, need probabilistic interpretations, or are working with sparse data.
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

# Bayesian Meta-Analysis

This skill teaches Bayesian approaches to meta-analysis, enabling probabilistic inference, incorporation of prior knowledge, and more intuitive interpretation of results.

## Overview

Bayesian meta-analysis provides a framework for combining prior beliefs with observed data to produce posterior probability distributions. It offers advantages in handling sparse data, complex models, and provides direct probability statements about effects.

## When to Use This Skill

Activate this skill when users:
- Ask about Bayesian meta-analysis or priors
- Want to incorporate prior knowledge or expert opinion
- Need probability statements ("What's the probability the effect is > 0?")
- Have sparse data (few studies, rare events)
- Are working with complex hierarchical models
- Want to compare multiple models formally

## Core Concepts to Teach

### 1. Bayesian vs Frequentist Paradigm

**Key Differences:**

| Aspect | Frequentist | Bayesian |
|--------|-------------|----------|
| Parameters | Fixed but unknown | Random variables |
| Probability | Long-run frequency | Degree of belief |
| Prior info | Not formally used | Explicitly incorporated |
| Results | Point estimate + CI | Posterior distribution |
| Interpretation | "95% of CIs contain true value" | "95% probability effect is in this range" |

**Socratic Questions:**
- "What does a 95% confidence interval really mean?"
- "How might previous research inform our current analysis?"
- "When might we want to make probability statements about effects?"

### 2. Bayes' Theorem in Meta-Analysis

**The Formula:**
```
Posterior ∝ Likelihood × Prior

P(θ|data) ∝ P(data|θ) × P(θ)
```

**Components:**
- **Prior P(θ):** What we believe before seeing data
- **Likelihood P(data|θ):** How probable is data given θ
- **Posterior P(θ|data):** Updated belief after seeing data

**Teaching Framework:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Prior Knowledge  +  New Data  =  Updated      │
│   (Previous MA,       (Current    Belief        │
│    Expert opinion)     studies)   (Posterior)   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3. Prior Specification

**Types of Priors:**

| Prior Type | Description | When to Use |
|------------|-------------|-------------|
| Non-informative | Vague, minimal influence | Default, let data speak |
| Weakly informative | Constrains to plausible range | Regularization |
| Informative | Based on previous evidence | Historical data available |
| Skeptical | Centered on null | Conservative analysis |
| Enthusiastic | Favors effect | Sensitivity analysis |

**Common Priors for Effect Sizes:**
```r
# Non-informative for log-OR
prior_effect <- normal(0, 10)  # Very wide

# Weakly informative
prior_effect <- normal(0, 1)   # Most effects within ±2

# For heterogeneity (tau)
prior_tau <- half_cauchy(0, 0.5)  # Recommended
prior_tau <- half_normal(0, 1)    # Alternative
```

**Prior Sensitivity Analysis:**
- Always run with different priors
- If conclusions change dramatically, data is weak
- Report results under multiple prior specifications

### 4. MCMC Methods

**What is MCMC?**
- Markov Chain Monte Carlo
- Samples from posterior distribution
- Approximates intractable integrals

**Key Concepts:**
- **Chains:** Multiple independent sampling sequences
- **Iterations:** Number of samples per chain
- **Burn-in/Warmup:** Initial samples discarded
- **Thinning:** Keep every nth sample (reduces autocorrelation)

**Convergence Diagnostics:**
```r
# R-hat (should be < 1.01)
# Effective sample size (ESS > 400)
# Trace plots (should look like "fuzzy caterpillars")
# Autocorrelation (should decay quickly)
```

### 5. Implementation in R

**Using brms (recommended for beginners):**
```r
library(brms)

# Prepare data
data <- data.frame(
  yi = effect_sizes,
  sei = standard_errors,
  study = study_names
)

# Bayesian random-effects meta-analysis
fit <- brm(
  yi | se(sei) ~ 1 + (1|study),
  data = data,
  prior = c(
    prior(normal(0, 1), class = Intercept),
    prior(half_cauchy(0, 0.5), class = sd)
  ),
  chains = 4,
  iter = 4000,
  warmup = 1000,
  cores = 4
)

# Results
summary(fit)
plot(fit)
```

**Using bayesmeta:**
```r
library(bayesmeta)

# Bayesian meta-analysis
bma <- bayesmeta(
  y = effect_sizes,
  sigma = standard_errors,
  labels = study_names,
  tau.prior = function(t) dhalfcauchy(t, scale = 0.5)
)

# Summary and plots
summary(bma)
forestplot(bma)
```

**Using JAGS/Stan directly:**
```r
# Stan model for meta-analysis
stan_model <- "
data {
  int<lower=0> N;           // number of studies
  vector[N] y;              // effect sizes
  vector<lower=0>[N] sigma; // standard errors
}
parameters {
  real mu;                  // overall effect
  real<lower=0> tau;        // heterogeneity
  vector[N] theta;          // study effects
}
model {
  // Priors
  mu ~ normal(0, 1);
  tau ~ cauchy(0, 0.5);
  
  // Likelihood
  theta ~ normal(mu, tau);
  y ~ normal(theta, sigma);
}
"
```

### 6. Interpreting Posterior Results

**Key Outputs:**
- **Posterior mean/median:** Point estimate
- **Credible interval (CrI):** 95% probability effect is in this range
- **Probability of direction:** P(effect > 0) or P(effect < 0)
- **ROPE:** Region of practical equivalence

**Example Interpretation:**
```
Posterior mean: OR = 0.72
95% CrI: [0.58, 0.89]
P(OR < 1): 99.8%
P(OR < 0.8): 78%

Interpretation: "There is a 99.8% probability that the treatment 
reduces the odds of the outcome. There is a 78% probability that 
the odds reduction is at least 20%."
```

### 7. Model Comparison

**Methods:**
- **WAIC:** Widely Applicable Information Criterion
- **LOO-CV:** Leave-one-out cross-validation
- **Bayes Factor:** Ratio of marginal likelihoods

```r
# Compare models in brms
loo1 <- loo(model1)
loo2 <- loo(model2)
loo_compare(loo1, loo2)

# Bayes Factor
bayes_factor(model1, model2)
```

## Assessment Questions

1. **Basic:** "What is the main difference between a confidence interval and a credible interval?"
   - Correct: CrI gives direct probability statement about parameter; CI is about procedure

2. **Intermediate:** "Why might you choose a weakly informative prior over a non-informative one?"
   - Correct: Regularization, computational stability, incorporates reasonable constraints

3. **Advanced:** "How would you assess whether your prior is having too much influence on the posterior?"
   - Guide: Prior sensitivity analysis, compare posterior to prior, check data-to-prior ratio

## Common Misconceptions

1. **"Bayesian = subjective, Frequentist = objective"**
   - Reality: Both involve subjective choices; Bayesian is explicit about them

2. **"Non-informative priors are always best"**
   - Reality: Can cause computational issues; weakly informative often better

3. **"More iterations = better results"**
   - Reality: Convergence matters more than raw number of iterations

## Example Dialogue

**User:** "I have only 3 small studies on a rare disease treatment. Can I still do meta-analysis?"

**Response Framework:**
1. Acknowledge challenge of sparse data
2. Explain Bayesian advantages for small samples
3. Discuss informative priors from related conditions
4. Guide through model specification
5. Emphasize uncertainty quantification
6. Discuss sensitivity to prior choice

## References

- Sutton AJ, Abrams KR. Bayesian methods in meta-analysis. Stat Methods Med Res 2001
- Röver C. Bayesian random-effects meta-analysis. Methods Inf Med 2020
- Cochrane Handbook Chapter on Bayesian methods
- Stan User's Guide: Meta-analysis section

## Adaptation Guidelines

**Glass (the teaching agent) MUST adapt this content to the learner:**

1. **Language Detection:** Detect the user's language from their messages and respond naturally in that language
2. **Cultural Context:** Adapt examples to local healthcare systems and research contexts when relevant
3. **Technical Terms:** Maintain standard English terms (e.g., "posterior", "prior", "credible interval", "MCMC") but explain them in the user's language
4. **Level Adaptation:** Adjust complexity based on user's demonstrated knowledge level
5. **Socratic Method:** Ask guiding questions in the detected language to promote deep understanding
6. **Local Examples:** When possible, reference studies or guidelines familiar to the user's region

**Example Adaptations:**
- 🇧🇷 Portuguese: Use examples from Brazilian rare disease registries
- 🇪🇸 Spanish: Reference Latin American collaborative networks
- 🇨🇳 Chinese: Include examples from Chinese Bayesian MA publications

## Related Skills

- `meta-analysis-fundamentals` - Basic concepts prerequisite
- `heterogeneity-analysis` - Understanding tau parameter
- `network-meta-analysis` - Often uses Bayesian framework
- `r-code-generation` - Implementation support
