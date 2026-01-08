/**
 * Forest Plot Tutorial
 * 
 * Step-by-step interactive tutorial for creating and interpreting
 * a forest plot with Glass as the guide.
 */

import { TutorialStepConfig } from '@/components/tutorial/InteractiveTutorialScreen';

export const FOREST_PLOT_TUTORIAL_ID = 'forest-plot-basics';
export const FOREST_PLOT_TUTORIAL_TITLE = '🌲 Your First Forest Plot';

export const forestPlotTutorialSteps: TutorialStepConfig[] = [
  // Step 1: Introduction
  {
    id: 'intro',
    title: 'Welcome! 🦊',
    message: `Olá! I'm Glass, your meta-analysis guide. Today we'll create your first forest plot together!

A forest plot is THE signature visualization of meta-analysis. By the end of this tutorial, you'll know how to create one and interpret what it means.

Ready to begin?`,
    hint: 'This tutorial takes about 8 minutes. You can pause anytime!',
    pose: 'greeting',
    type: 'info',
  },
  
  // Step 2: What is a Forest Plot?
  {
    id: 'what-is-forest-plot',
    title: 'What is a Forest Plot?',
    message: `A forest plot shows results from multiple studies combined into one visualization.

Each row represents one study. The squares show the effect size, and the lines show the confidence interval.

At the bottom, a diamond shows the combined (pooled) effect of ALL studies together. That's the power of meta-analysis!`,
    hint: 'The name "forest plot" comes from the appearance - many vertical lines like trees in a forest!',
    pose: 'teaching',
    type: 'info',
  },
  
  // Step 3: Understanding the Components
  {
    id: 'components',
    title: 'Reading the Plot',
    message: `Let me explain each part:

📊 **Square** = Point estimate (the study's result)
📏 **Horizontal line** = 95% confidence interval
⬜ **Square size** = Study weight (bigger = more precise)
💎 **Diamond** = Pooled effect (combined result)
│ **Vertical line** = Line of no effect

If a study's line crosses the vertical line, it's not statistically significant on its own.`,
    pose: 'pointing',
    type: 'info',
  },
  
  // Step 4: Quiz - Components
  {
    id: 'quiz-components',
    title: 'Quick Check! 🧠',
    message: 'What does the SIZE of the square represent in a forest plot?',
    pose: 'thinking',
    type: 'quiz',
    quizOptions: [
      { id: 'a', text: 'The statistical significance of the study', isCorrect: false },
      { id: 'b', text: 'The weight/precision of the study', isCorrect: true },
      { id: 'c', text: 'The number of participants', isCorrect: false },
      { id: 'd', text: 'The year the study was published', isCorrect: false },
    ],
  },
  
  // Step 5: Sample Data Introduction
  {
    id: 'sample-data',
    title: 'Our Example: BCG Vaccine',
    message: `We'll use a famous dataset: BCG vaccine trials for tuberculosis prevention.

This includes 13 clinical trials from 1948-1980, studying whether BCG vaccination prevents TB.

It's perfect for learning because it shows **heterogeneity** - the effects vary quite a bit between studies. This is common in real meta-analyses!`,
    hint: 'BCG stands for Bacillus Calmette-Guérin, named after the French scientists who developed it.',
    pose: 'teaching',
    type: 'info',
  },
  
  // Step 6: Creating the Plot - Action
  {
    id: 'create-plot-action',
    title: 'Let\'s Create It! 🎨',
    message: `Now it's your turn! Go to the terminal and type this command:

\`/r forest_plot_bcg\`

This will load the BCG data and generate a forest plot using the metafor package in R.

Press "Done" when you've run the command and see the plot!`,
    hint: 'The /r command runs R code directly. forest_plot_bcg is a shortcut we\'ve set up for you.',
    pose: 'excited',
    type: 'action',
    actionDescription: 'Type /r forest_plot_bcg in the terminal',
  },
  
  // Step 7: Interpreting Results
  {
    id: 'interpret-results',
    title: 'Reading Your Plot',
    message: `Look at your forest plot! Here's what you should notice:

1. **Most squares are LEFT of the vertical line** → BCG appears protective
2. **Some confidence intervals are WIDE** → Those studies had more uncertainty
3. **The diamond is LEFT of 1** → Overall, BCG reduces TB risk
4. **Studies vary quite a bit** → There's heterogeneity

An Odds Ratio < 1 means the treatment (BCG) reduces the outcome (TB).`,
    pose: 'teaching',
    type: 'info',
  },
  
  // Step 8: Quiz - Interpretation
  {
    id: 'quiz-interpretation',
    title: 'Interpretation Check! 🔍',
    message: 'Based on a typical BCG forest plot, what can we conclude about BCG vaccination?',
    pose: 'thinking',
    type: 'quiz',
    quizOptions: [
      { id: 'a', text: 'BCG has no effect on TB prevention', isCorrect: false },
      { id: 'b', text: 'BCG appears to reduce TB risk, but effects vary between studies', isCorrect: true },
      { id: 'c', text: 'BCG increases TB risk', isCorrect: false },
      { id: 'd', text: 'We cannot draw any conclusions', isCorrect: false },
    ],
  },
  
  // Step 9: Understanding Heterogeneity
  {
    id: 'heterogeneity',
    title: 'Why Do Results Vary?',
    message: `You might wonder: why don't all studies show the same result?

This is called **heterogeneity**. In the BCG data, it might be due to:
• Different populations (latitude affects TB exposure)
• Different BCG strains used
• Different follow-up periods
• Different outcome definitions

The I² statistic tells us how much variation is due to real differences vs. chance. High I² (>75%) means substantial heterogeneity.`,
    hint: 'Heterogeneity isn\'t bad - it\'s information! It tells us the effect might depend on context.',
    pose: 'teaching',
    type: 'info',
  },
  
  // Step 10: The Pooled Effect
  {
    id: 'pooled-effect',
    title: 'The Diamond: Combined Evidence',
    message: `The diamond at the bottom is the **pooled effect** - the combined result of all studies.

Its position shows the overall effect size, and its width shows the confidence interval.

For BCG, the pooled OR is typically around 0.5, meaning vaccination roughly halves the odds of TB. That's a substantial protective effect!

But remember: with high heterogeneity, this average might not apply equally everywhere.`,
    pose: 'pointing',
    type: 'info',
  },
  
  // Step 11: Final Quiz
  {
    id: 'quiz-final',
    title: 'Final Challenge! 🏆',
    message: 'A study\'s confidence interval crosses the line of no effect (OR = 1). What does this mean?',
    pose: 'thinking',
    type: 'quiz',
    quizOptions: [
      { id: 'a', text: 'The study found a significant effect', isCorrect: false },
      { id: 'b', text: 'The study is poorly designed', isCorrect: false },
      { id: 'c', text: 'The study alone cannot rule out no effect', isCorrect: true },
      { id: 'd', text: 'The study should be excluded from the meta-analysis', isCorrect: false },
    ],
  },
  
  // Step 12: Celebration
  {
    id: 'celebration',
    title: 'Congratulations! 🎉',
    message: `You did it! You've created and interpreted your first forest plot!

**What you learned:**
✅ What forest plots show
✅ How to read individual study results
✅ How to interpret the pooled effect
✅ What heterogeneity means

You're now ready to explore more advanced topics like funnel plots, subgroup analysis, and meta-regression!

Keep learning, and remember: I'm always here to help! 🦊`,
    pose: 'celebrating',
    type: 'celebration',
  },
];

/**
 * Get tutorial metadata
 */
export function getForestPlotTutorialMeta() {
  return {
    id: FOREST_PLOT_TUTORIAL_ID,
    title: FOREST_PLOT_TUTORIAL_TITLE,
    description: 'Learn to create and interpret forest plots with real clinical trial data',
    durationMinutes: 8,
    difficulty: 'beginner' as const,
    stepsCount: forestPlotTutorialSteps.length,
    badge: {
      id: 'forest-ranger',
      name: 'Forest Ranger',
      icon: '🌲',
      description: 'Created your first forest plot',
    },
  };
}
