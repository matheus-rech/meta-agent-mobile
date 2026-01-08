/**
 * Heterogeneity Analysis Tutorial
 * 
 * A step-by-step guide to understanding and interpreting
 * heterogeneity in meta-analysis (I², Q, tau², prediction intervals)
 */

import type { TutorialStepConfig } from '@/components/tutorial/InteractiveTutorialScreen';

export const HETEROGENEITY_TUTORIAL_ID = 'heterogeneity-analysis';
export const HETEROGENEITY_TUTORIAL_TITLE = 'Understanding Heterogeneity';

export const heterogeneityTutorialSteps: TutorialStepConfig[] = [
  // Step 1: Introduction
  {
    id: 'intro',
    type: 'info',
    title: 'What is Heterogeneity?',
    message: "Welcome! 🦊 In this tutorial, we'll explore **heterogeneity** - one of the most important concepts in meta-analysis. Heterogeneity tells us how much the results of different studies vary beyond what we'd expect from random chance alone.",
    pose: 'greeting',
    hint: 'Understanding heterogeneity helps you decide if combining studies is appropriate.',
  },
  
  // Step 2: Why it matters
  {
    id: 'why-matters',
    type: 'info',
    title: 'Why Heterogeneity Matters',
    message: "Imagine you're combining results from 10 studies. If they all show similar effects, you can be confident in the pooled result. But if some show large benefits and others show harm, the average might be misleading! 📊\n\nHeterogeneity helps us detect and quantify this variability.",
    pose: 'teaching',
    hint: 'High heterogeneity suggests the studies might be measuring different things.',
  },
  
  // Step 3: Q Statistic
  {
    id: 'q-statistic',
    type: 'info',
    title: 'The Q Statistic',
    message: "The **Q statistic** (Cochran's Q) tests whether the observed variability is greater than expected by chance.\n\n**Formula:** Q = Σwᵢ(θᵢ - θ̄)²\n\nWhere:\n• wᵢ = weight of study i\n• θᵢ = effect size of study i\n• θ̄ = pooled effect size\n\nA significant Q (p < 0.10) suggests heterogeneity is present.",
    pose: 'thinking',
    hint: 'Q follows a chi-squared distribution with k-1 degrees of freedom.',
  },
  
  // Step 4: Quiz on Q
  {
    id: 'quiz-q',
    type: 'quiz',
    title: 'Quick Check: Q Statistic',
    message: "If a meta-analysis with 8 studies has Q = 25.3 and p = 0.001, what does this suggest?",
    pose: 'thinking',
    quizOptions: [
      { id: 'a', text: 'No heterogeneity - studies are consistent', isCorrect: false },
      { id: 'b', text: 'Significant heterogeneity - studies vary more than expected', isCorrect: true },
      { id: 'c', text: 'The pooled effect is statistically significant', isCorrect: false },
      { id: 'd', text: 'More studies are needed', isCorrect: false },
    ],
    hint: 'Remember: p < 0.10 for Q suggests significant heterogeneity.',
  },
  
  // Step 5: I² Statistic
  {
    id: 'i-squared',
    type: 'info',
    title: 'The I² Statistic',
    message: "**I²** quantifies the *percentage* of variability due to heterogeneity rather than chance.\n\n**Formula:** I² = ((Q - df) / Q) × 100%\n\n**Interpretation:**\n• 0-25%: Low heterogeneity\n• 25-50%: Moderate heterogeneity\n• 50-75%: Substantial heterogeneity\n• 75-100%: Considerable heterogeneity\n\nI² is preferred because it doesn't depend on the number of studies!",
    pose: 'teaching',
    hint: 'I² tells you what proportion of the total variance is real, not due to sampling error.',
  },
  
  // Step 6: Quiz on I²
  {
    id: 'quiz-i2',
    type: 'quiz',
    title: 'Quick Check: I² Interpretation',
    message: "A forest plot shows I² = 78%. How would you interpret this?",
    pose: 'thinking',
    quizOptions: [
      { id: 'a', text: '78% of studies showed positive effects', isCorrect: false },
      { id: 'b', text: '78% of the variability is due to true differences between studies', isCorrect: true },
      { id: 'c', text: 'The effect size is 78% larger than expected', isCorrect: false },
      { id: 'd', text: '78% confidence in the pooled result', isCorrect: false },
    ],
    hint: 'I² represents the proportion of variance due to heterogeneity.',
  },
  
  // Step 7: Tau² (Between-study variance)
  {
    id: 'tau-squared',
    type: 'info',
    title: 'Tau² (τ²): Between-Study Variance',
    message: "While I² is a percentage, **τ² (tau-squared)** gives the actual variance between studies in the same units as your effect size.\n\n**Why it matters:**\n• τ² = 0 means no heterogeneity\n• Larger τ² = more variability between studies\n• Used to calculate prediction intervals\n\n**Estimation methods:**\n• DerSimonian-Laird (DL)\n• REML (Restricted Maximum Likelihood)\n• Paule-Mandel",
    pose: 'teaching',
    hint: 'REML is generally preferred for more accurate τ² estimation.',
  },
  
  // Step 8: Prediction Intervals
  {
    id: 'prediction-intervals',
    type: 'info',
    title: 'Prediction Intervals',
    message: "A **prediction interval** tells you the range where a *new study's* effect might fall.\n\n**Formula:** θ̄ ± t(df) × √(SE² + τ²)\n\nUnlike confidence intervals (which describe uncertainty in the mean), prediction intervals account for heterogeneity.\n\n**Example:**\n• Pooled OR = 0.75 (95% CI: 0.65-0.87)\n• 95% PI: 0.45-1.25\n\nThe CI excludes 1, but the PI includes it - meaning a new study might show no effect or even harm!",
    pose: 'thinking',
    hint: 'Always report prediction intervals when heterogeneity is substantial.',
  },
  
  // Step 9: Action - View heterogeneity in R
  {
    id: 'action-r-code',
    type: 'action',
    title: 'See It in Action',
    message: "Let's look at how to calculate and interpret heterogeneity statistics in R using the metafor package! 📊\n\nTap 'Show R Code' to see the commands.",
    pose: 'pointing',
    actionDescription: 'View R code for heterogeneity analysis',
    hint: 'The metafor package provides all these statistics automatically.',
    codeExample: `# Load the metafor package
library(metafor)

# Fit a random-effects model
res <- rma(yi = effect_size, 
           vi = variance, 
           data = my_data,
           method = "REML")

# View heterogeneity statistics
print(res)
# Look for: Q, I², τ², H²

# Get prediction interval
predict(res, transf = exp)

# Forest plot with heterogeneity
forest(res, 
       header = TRUE,
       mlab = paste0("RE Model (I² = ", 
                     round(res$I2, 1), "%)"))`,
  },
  
  // Step 10: Quiz on interpretation
  {
    id: 'quiz-interpretation',
    type: 'quiz',
    title: 'Putting It Together',
    message: "A meta-analysis reports: Q = 45.2 (p < 0.001), I² = 82%, τ² = 0.15. The 95% CI for the pooled effect excludes the null, but the 95% prediction interval includes it. What's the best interpretation?",
    pose: 'thinking',
    quizOptions: [
      { id: 'a', text: 'Strong evidence of a consistent beneficial effect across all settings', isCorrect: false },
      { id: 'b', text: 'On average there is a benefit, but effects vary considerably and some settings may see no benefit', isCorrect: true },
      { id: 'c', text: 'The analysis is flawed and should be discarded', isCorrect: false },
      { id: 'd', text: 'More studies are needed before any conclusions can be drawn', isCorrect: false },
    ],
    hint: 'High I² and wide prediction intervals suggest the effect varies across contexts.',
  },
  
  // Step 11: What to do about heterogeneity
  {
    id: 'what-to-do',
    type: 'info',
    title: 'Addressing Heterogeneity',
    message: "When you find substantial heterogeneity, consider:\n\n**1. Explore sources:**\n• Subgroup analysis by study characteristics\n• Meta-regression with moderators\n\n**2. Use appropriate models:**\n• Random-effects model (accounts for τ²)\n• Robust variance estimation\n\n**3. Report transparently:**\n• Present all heterogeneity statistics\n• Show prediction intervals\n• Discuss clinical implications\n\n**4. Consider sensitivity analyses:**\n• Leave-one-out analysis\n• Outlier detection",
    pose: 'teaching',
    hint: 'The next tutorial covers subgroup analysis in detail!',
  },
  
  // Step 12: Celebration
  {
    id: 'celebration',
    type: 'celebration',
    title: 'Heterogeneity Expert! 🎉',
    message: "Congratulations! 🦊✨ You now understand:\n\n✅ Q statistic for testing heterogeneity\n✅ I² for quantifying heterogeneity\n✅ τ² for between-study variance\n✅ Prediction intervals for real-world applicability\n\nYou've earned the **Heterogeneity Detective** badge! 🔍\n\nReady to learn how to explore sources of heterogeneity? Try the Subgroup Analysis tutorial next!",
    pose: 'celebrating',
  },
];

/**
 * Get tutorial metadata for display
 */
export function getHeterogeneityTutorialMeta() {
  return {
    id: HETEROGENEITY_TUTORIAL_ID,
    title: HETEROGENEITY_TUTORIAL_TITLE,
    description: 'Learn to interpret I², Q, τ², and prediction intervals to understand variability in meta-analysis results.',
    icon: '🔍',
    durationMinutes: 12,
    difficulty: 'intermediate' as const,
    stepsCount: heterogeneityTutorialSteps.length,
    prerequisites: [HETEROGENEITY_TUTORIAL_ID.replace('heterogeneity-analysis', 'forest-plot')],
    badge: {
      id: 'heterogeneity-detective',
      name: 'Heterogeneity Detective',
      icon: '🔍',
      description: 'Mastered the art of detecting and interpreting heterogeneity in meta-analysis.',
    },
  };
}
