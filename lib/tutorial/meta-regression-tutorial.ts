/**
 * Meta-Regression Tutorial
 * 
 * Comprehensive tutorial covering continuous moderators, mixed-effects models,
 * and advanced meta-regression techniques using the BCG vaccine example.
 */

import { TutorialStepConfig } from '@/components/tutorial/InteractiveTutorialScreen';

export const metaRegressionTutorialSteps: TutorialStepConfig[] = [
  // Step 1: Introduction
  {
    id: 'intro',
    type: 'info',
    title: 'Meta-Regression: Beyond Subgroups',
    message: `Welcome to the Meta-Regression tutorial! 🦊

In the previous tutorials, you learned about heterogeneity and subgroup analysis. Now we'll explore **meta-regression** - a powerful technique for investigating **continuous moderators**.

**What you'll learn:**
• How continuous variables can explain heterogeneity
• The difference between fixed and random slopes
• How to interpret regression coefficients
• Bubble plots and model diagnostics

Let's continue with our BCG vaccine example!`,
    glassMessage: 'Meta-regression is like fitting a regression line through your effect sizes, weighted by precision!',
    glassEmotion: 'excited',
  },
  
  // Step 2: Why Meta-Regression?
  {
    id: 'why-meta-regression',
    type: 'info',
    title: 'Why Meta-Regression?',
    message: `**Limitations of Subgroup Analysis:**

In subgroup analysis, we split studies into categories (e.g., "far from equator" vs "near equator"). But this has problems:

• **Loss of information**: Converting continuous to categorical loses precision
• **Arbitrary cutoffs**: Where do we draw the line?
• **Multiple comparisons**: Many subgroups = inflated false positives

**Meta-regression solves this** by modeling the continuous relationship directly:

\`Effect Size = β₀ + β₁ × Moderator + ε\`

Where:
• **β₀** = intercept (effect when moderator = 0)
• **β₁** = slope (change in effect per unit change in moderator)
• **ε** = residual heterogeneity`,
    glassMessage: 'Think of it as asking "how does the effect change as latitude increases?" rather than "is the effect different in high vs low latitude?"',
    glassEmotion: 'teaching',
  },
  
  // Step 3: Quiz - Why Meta-Regression
  {
    id: 'quiz-why',
    type: 'quiz',
    title: 'Quick Check',
    message: 'What is the main advantage of meta-regression over subgroup analysis for continuous moderators?',
    quizOptions: [
      { id: 'a', text: 'It requires fewer studies', isCorrect: false },
      { id: 'b', text: 'It preserves the continuous nature of the moderator', isCorrect: true },
      { id: 'c', text: 'It always shows significant results', isCorrect: false },
      { id: 'd', text: 'It eliminates heterogeneity completely', isCorrect: false },
    ],
    glassMessage: 'Converting continuous to categorical is like measuring height as "tall" or "short" instead of in centimeters!',
    glassEmotion: 'curious',
  },
  
  // Step 4: The BCG Example
  {
    id: 'bcg-example',
    type: 'info',
    title: 'BCG Vaccine & Latitude',
    message: `Let's revisit the BCG vaccine data with meta-regression.

**Research Question:** Does the effectiveness of BCG vaccine against tuberculosis depend on the latitude where the trial was conducted?

**Hypothesis:** BCG vaccine may be more effective at higher latitudes (farther from equator) due to:
• Less environmental mycobacteria exposure
• Different TB strains
• Population immunity differences

**Our moderator:** Absolute latitude (0° at equator, 90° at poles)

**The data:**
| Study | Latitude | Log RR | SE |
|-------|----------|--------|-----|
| Aronson | 44° | -0.89 | 0.41 |
| Ferguson | 55° | -1.59 | 0.14 |
| Rosenthal | 42° | -0.48 | 0.61 |
| Hart | 53° | -0.02 | 0.13 |
| ... | ... | ... | ... |`,
    glassMessage: 'We have 13 studies spanning from 13° to 55° latitude - perfect for regression!',
    glassEmotion: 'excited',
  },
  
  // Step 5: Running Meta-Regression in R
  {
    id: 'r-code-basic',
    type: 'action',
    title: 'Running Meta-Regression in R',
    message: `Let's run a meta-regression using the **metafor** package:

\`\`\`r
library(metafor)

# Load BCG vaccine data
data(dat.bcg)

# Calculate log risk ratios
dat <- escalc(measure="RR", ai=tpos, bi=tneg, 
              ci=cpos, di=cneg, data=dat.bcg)

# Run meta-regression with absolute latitude
res <- rma(yi, vi, mods = ~ ablat, data=dat)

# View results
summary(res)
\`\`\`

**Key output to look for:**
• **Intercept (intrcpt)**: Effect when latitude = 0
• **ablat coefficient**: Change in log RR per degree latitude
• **QM (test of moderators)**: Is the relationship significant?
• **R² (I² reduction)**: How much heterogeneity is explained?`,
    codeExample: `library(metafor)
data(dat.bcg)
dat <- escalc(measure="RR", ai=tpos, bi=tneg, 
              ci=cpos, di=cneg, data=dat.bcg)
res <- rma(yi, vi, mods = ~ ablat, data=dat)
summary(res)`,
    glassMessage: 'The mods argument specifies our moderator variable. The ~ ablat formula means "model effect as a function of absolute latitude".',
    glassEmotion: 'teaching',
  },
  
  // Step 6: Interpreting Results
  {
    id: 'interpret-results',
    type: 'info',
    title: 'Interpreting the Results',
    message: `**Typical output from BCG meta-regression:**

\`\`\`
Model Results:

         estimate    se      zval    pval
intrcpt    0.3429  0.1108   3.09   0.0020
ablat     -0.0291  0.0065  -4.47   <.0001

Test of Moderators: QM(1) = 20.00, p < .0001
R² = 64.25%
\`\`\`

**Interpretation:**

• **Intercept (0.34)**: At latitude 0° (equator), the log RR is 0.34 (RR = 1.41), meaning BCG increases TB risk slightly

• **Slope (-0.029)**: For each degree increase in latitude, log RR decreases by 0.029

• **At 50° latitude**: log RR = 0.34 + (-0.029 × 50) = -1.11 (RR = 0.33), meaning BCG reduces TB risk by 67%

• **R² = 64%**: Latitude explains 64% of the heterogeneity!`,
    glassMessage: 'The negative slope means BCG becomes MORE protective (more negative log RR) as latitude increases!',
    glassEmotion: 'excited',
  },
  
  // Step 7: Quiz - Interpretation
  {
    id: 'quiz-interpret',
    type: 'quiz',
    title: 'Interpretation Check',
    message: 'If the meta-regression slope for latitude is -0.029, what does this mean?',
    quizOptions: [
      { id: 'a', text: 'BCG is 2.9% less effective overall', isCorrect: false },
      { id: 'b', text: 'For each degree increase in latitude, the log RR decreases by 0.029', isCorrect: true },
      { id: 'c', text: 'The effect is not significant', isCorrect: false },
      { id: 'd', text: 'Latitude has no relationship with BCG effectiveness', isCorrect: false },
    ],
    glassMessage: 'Remember: negative log RR means protective effect. A negative slope means the protective effect gets stronger!',
    glassEmotion: 'teaching',
  },
  
  // Step 8: Bubble Plots
  {
    id: 'bubble-plots',
    type: 'info',
    title: 'Visualizing with Bubble Plots',
    message: `A **bubble plot** is the standard visualization for meta-regression:

**Elements:**
• **X-axis**: Moderator (latitude)
• **Y-axis**: Effect size (log RR)
• **Bubble size**: Study precision (larger = more precise)
• **Regression line**: Fitted relationship
• **Confidence band**: 95% CI around the line

\`\`\`r
# Create bubble plot
regplot(res, xlab="Absolute Latitude", 
        ylab="Log Risk Ratio",
        main="BCG Effectiveness by Latitude")

# Add reference line at null effect
abline(h=0, lty=2, col="gray")
\`\`\`

**What to look for:**
• Do bubbles follow the regression line?
• Are there outliers?
• Is the relationship linear?`,
    glassMessage: 'Bubble plots are like scatter plots, but the bubble size shows study weight - bigger bubbles had more influence on the regression!',
    glassEmotion: 'teaching',
  },
  
  // Step 9: Mixed-Effects Models
  {
    id: 'mixed-effects',
    type: 'info',
    title: 'Mixed-Effects Models',
    message: `So far we've used a **random-effects meta-regression**, which assumes:
• Fixed slope (same relationship for all studies)
• Random intercepts (studies vary around the regression line)

**Mixed-effects models** can also include **random slopes**:

\`\`\`r
# Standard random-effects meta-regression
res_re <- rma(yi, vi, mods = ~ ablat, data=dat)

# This is actually a mixed-effects model:
# - Fixed effect: ablat (the moderator)
# - Random effect: residual heterogeneity (τ²)
\`\`\`

**When to consider random slopes:**
• When you have multiple moderators
• When studies are clustered (e.g., by country)
• When the relationship might vary across contexts

**Note:** With only one moderator and independent studies, the standard \`rma()\` model is appropriate.`,
    glassMessage: 'Mixed-effects models are more flexible but need more data. For most meta-regressions, the standard approach works well!',
    glassEmotion: 'teaching',
  },
  
  // Step 10: Multiple Moderators
  {
    id: 'multiple-moderators',
    type: 'info',
    title: 'Multiple Moderators',
    message: `You can include multiple moderators in meta-regression:

\`\`\`r
# Multiple continuous moderators
res_multi <- rma(yi, vi, 
                 mods = ~ ablat + year, 
                 data=dat)

# Mix of continuous and categorical
res_mixed <- rma(yi, vi, 
                 mods = ~ ablat + factor(alloc), 
                 data=dat)
\`\`\`

**Caution with multiple moderators:**

• **Power**: Need ~10 studies per moderator
• **Collinearity**: Check if moderators are correlated
• **Overfitting**: Don't include too many moderators
• **Multiple testing**: Adjust for multiple comparisons

**Rule of thumb:** With 13 studies, we can reliably test 1-2 moderators.`,
    codeExample: `# Multiple moderators example
res_multi <- rma(yi, vi, 
                 mods = ~ ablat + year, 
                 data=dat)
summary(res_multi)

# Check for collinearity
cor(dat$ablat, dat$year, use="complete.obs")`,
    glassMessage: 'More moderators isn\'t always better! Each moderator "costs" statistical power.',
    glassEmotion: 'teaching',
  },
  
  // Step 11: Quiz - Multiple Moderators
  {
    id: 'quiz-multiple',
    type: 'quiz',
    title: 'Multiple Moderators Check',
    message: 'With 13 studies in your meta-analysis, how many moderators can you reliably test?',
    quizOptions: [
      { id: 'a', text: '5-6 moderators', isCorrect: false },
      { id: 'b', text: '1-2 moderators', isCorrect: true },
      { id: 'c', text: '10+ moderators', isCorrect: false },
      { id: 'd', text: 'As many as you want', isCorrect: false },
    ],
    glassMessage: 'The rule of thumb is ~10 studies per moderator. With 13 studies, we have limited power!',
    glassEmotion: 'teaching',
  },
  
  // Step 12: Model Diagnostics
  {
    id: 'diagnostics',
    type: 'info',
    title: 'Model Diagnostics',
    message: `Always check your meta-regression model:

**1. Residual Heterogeneity (τ²)**
\`\`\`r
# Check if heterogeneity remains
res$tau2  # Residual τ²
res$I2    # Residual I²
\`\`\`

**2. Influential Studies**
\`\`\`r
# Leave-one-out analysis
inf <- influence(res)
plot(inf)
\`\`\`

**3. Publication Bias**
\`\`\`r
# Funnel plot with regression line
funnel(res)
regtest(res)  # Egger's test
\`\`\`

**4. Model Comparison**
\`\`\`r
# Compare models with AIC/BIC
res0 <- rma(yi, vi, data=dat)  # No moderator
res1 <- rma(yi, vi, mods=~ablat, data=dat)
anova(res0, res1)
\`\`\``,
    codeExample: `# Full diagnostic workflow
res <- rma(yi, vi, mods = ~ ablat, data=dat)

# 1. Check residual heterogeneity
cat("Residual τ²:", res$tau2, "\\n")
cat("Residual I²:", res$I2, "%\\n")

# 2. Influential studies
inf <- influence(res)
plot(inf)

# 3. Model comparison
res0 <- rma(yi, vi, data=dat)
anova(res0, res)`,
    glassMessage: 'Even if latitude is significant, check if there\'s still unexplained heterogeneity - other factors might matter too!',
    glassEmotion: 'teaching',
  },
  
  // Step 13: Reporting Guidelines
  {
    id: 'reporting',
    type: 'info',
    title: 'Reporting Meta-Regression',
    message: `**What to report in your paper:**

**Methods section:**
• Moderator(s) examined and rationale
• Model type (random-effects meta-regression)
• Software used (metafor package in R)
• How you handled missing moderator data

**Results section:**
• Number of studies included
• Regression coefficients with 95% CI
• Test of moderators (QM statistic, p-value)
• R² (proportion of heterogeneity explained)
• Residual heterogeneity (τ², I²)

**Example text:**
> "Meta-regression revealed a significant negative association between absolute latitude and BCG effectiveness (β = -0.029, 95% CI: -0.042 to -0.016, p < 0.001). Latitude explained 64% of the between-study heterogeneity (R² = 64.25%)."

**Include:**
• Bubble plot
• Forest plot (optional, if few studies)`,
    glassMessage: 'Good reporting helps others understand and replicate your analysis!',
    glassEmotion: 'teaching',
  },
  
  // Step 14: Common Pitfalls
  {
    id: 'pitfalls',
    type: 'info',
    title: 'Common Pitfalls',
    message: `**Avoid these meta-regression mistakes:**

**1. Ecological Fallacy**
• Study-level associations ≠ individual-level associations
• "Higher latitude studies show more protection" doesn't mean "people at higher latitudes are more protected"

**2. Insufficient Power**
• Meta-regression needs many studies
• Minimum ~10 studies per moderator
• Non-significant ≠ no relationship

**3. Data Dredging**
• Pre-specify moderators before analysis
• Exploratory analyses should be labeled as such
• Adjust for multiple testing

**4. Ignoring Residual Heterogeneity**
• Significant moderator doesn't mean heterogeneity is "solved"
• Always report residual τ² and I²

**5. Extrapolation**
• Don't predict beyond your data range
• BCG data: 13°-55° latitude only`,
    glassMessage: 'The ecological fallacy is particularly important - we\'re analyzing studies, not individuals!',
    glassEmotion: 'teaching',
  },
  
  // Step 15: Final Quiz
  {
    id: 'quiz-final',
    type: 'quiz',
    title: 'Final Challenge',
    message: 'In the BCG meta-regression, R² = 64%. What does this mean?',
    quizOptions: [
      { id: 'a', text: '64% of studies showed a significant effect', isCorrect: false },
      { id: 'b', text: 'Latitude explains 64% of the between-study heterogeneity', isCorrect: true },
      { id: 'c', text: 'BCG reduces TB risk by 64%', isCorrect: false },
      { id: 'd', text: '64% of the variance in latitude is explained', isCorrect: false },
    ],
    glassMessage: 'R² in meta-regression tells us how much of the heterogeneity (not the effect itself) is explained by the moderator!',
    glassEmotion: 'curious',
  },
  
  // Step 16: Summary
  {
    id: 'summary',
    type: 'info',
    title: 'Tutorial Summary',
    message: `**Congratulations! You've mastered meta-regression! 🎉**

**Key takeaways:**

✅ **When to use**: Continuous moderators, exploring dose-response relationships

✅ **Interpretation**: 
• Slope = change in effect per unit change in moderator
• R² = proportion of heterogeneity explained

✅ **Visualization**: Bubble plots show the relationship with study weights

✅ **Caution**:
• Need sufficient studies (~10 per moderator)
• Pre-specify moderators
• Report residual heterogeneity
• Beware ecological fallacy

**R code summary:**
\`\`\`r
res <- rma(yi, vi, mods = ~ moderator, data=dat)
regplot(res)  # Bubble plot
\`\`\`

You're now ready to explore moderators in your own meta-analyses!`,
    glassMessage: 'You\'ve completed all the core meta-analysis tutorials! You\'re ready to tackle real research questions!',
    glassEmotion: 'celebrating',
  },
  
  // Step 17: Celebration
  {
    id: 'celebration',
    type: 'celebration',
    title: '🎓 Meta-Regression Master!',
    message: `**Achievement Unlocked: Meta-Regression Master!**

You've completed the advanced meta-regression tutorial and earned a new badge!

**Skills mastered:**
• Running meta-regression in R
• Interpreting regression coefficients
• Creating bubble plots
• Understanding mixed-effects models
• Avoiding common pitfalls

**Your learning journey:**
1. ✅ Forest Plots
2. ✅ Heterogeneity Analysis
3. ✅ Subgroup Analysis
4. ✅ Meta-Regression

**Next steps:**
• Practice with your own data
• Explore network meta-analysis
• Learn about publication bias methods

Keep exploring! 🦊`,
    glassMessage: 'You\'ve completed all four core tutorials! You\'re now a meta-analysis expert!',
    glassEmotion: 'celebrating',
    badge: {
      id: 'meta-regression-master',
      name: 'Meta-Regression Master',
      icon: '📈',
      description: 'Completed the meta-regression tutorial and mastered continuous moderator analysis',
    },
  },
];

// Tutorial metadata
export const getMetaRegressionTutorialMeta = () => ({
  id: 'meta-regression',
  title: 'Meta-Regression',
  description: 'Learn to analyze continuous moderators and mixed-effects models',
  difficulty: 'advanced' as const,
  estimatedMinutes: 25,
  prerequisites: ['heterogeneity-analysis', 'subgroup-analysis'],
  stepsCount: metaRegressionTutorialSteps.length,
  badge: {
    id: 'meta-regression-master',
    name: 'Meta-Regression Master',
    icon: '📈',
    description: 'Completed the meta-regression tutorial',
  },
  topics: [
    'Continuous moderators',
    'Mixed-effects models',
    'Bubble plots',
    'R² interpretation',
    'Model diagnostics',
  ],
});

export default metaRegressionTutorialSteps;
