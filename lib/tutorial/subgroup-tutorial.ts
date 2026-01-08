/**
 * Subgroup Analysis Tutorial
 * 
 * A step-by-step guide to conducting and interpreting
 * subgroup analyses in meta-analysis
 */

import type { TutorialStepConfig } from '@/components/tutorial/InteractiveTutorialScreen';

export const SUBGROUP_TUTORIAL_ID = 'subgroup-analysis';
export const SUBGROUP_TUTORIAL_TITLE = 'Subgroup Analysis';

export const subgroupTutorialSteps: TutorialStepConfig[] = [
  // Step 1: Introduction
  {
    id: 'intro',
    type: 'info',
    title: 'Exploring Heterogeneity',
    message: "Welcome back! 🦊 In this tutorial, we'll learn **subgroup analysis** - a powerful technique to explore WHY study results differ.\n\nWhen you find heterogeneity, the next question is: what's causing it? Subgroup analysis helps you find out!",
    pose: 'greeting',
    hint: 'Subgroup analysis is also called moderator analysis or stratified analysis.',
  },
  
  // Step 2: What is Subgroup Analysis?
  {
    id: 'what-is-subgroup',
    type: 'info',
    title: 'What is Subgroup Analysis?',
    message: "**Subgroup analysis** divides studies into groups based on a characteristic and compares the effects.\n\n**Examples:**\n• By study design (RCT vs. observational)\n• By population (adults vs. children)\n• By intervention dose (high vs. low)\n• By geographic region\n• By risk of bias (low vs. high)\n\nThe goal: see if the effect differs between subgroups!",
    pose: 'teaching',
    hint: 'Choose subgroups based on pre-specified hypotheses, not data dredging.',
  },
  
  // Step 3: When to Use
  {
    id: 'when-to-use',
    type: 'info',
    title: 'When to Use Subgroup Analysis',
    message: "Subgroup analysis is appropriate when:\n\n✅ You have a priori hypotheses about effect modifiers\n✅ There's substantial heterogeneity (I² > 50%)\n✅ You have enough studies per subgroup (≥3-5)\n✅ The moderator is a study-level characteristic\n\n⚠️ **Caution:** Post-hoc subgroup analyses are exploratory only!",
    pose: 'thinking',
    hint: 'Pre-specify your subgroup analyses in your protocol to avoid bias.',
  },
  
  // Step 4: Quiz - When appropriate
  {
    id: 'quiz-when',
    type: 'quiz',
    title: 'Quick Check',
    message: "You have 15 studies with I² = 85%. You hypothesized before the review that effects might differ by study design. Is subgroup analysis appropriate?",
    pose: 'thinking',
    quizOptions: [
      { id: 'a', text: 'No - heterogeneity is too high', isCorrect: false },
      { id: 'b', text: 'Yes - you have enough studies, high heterogeneity, and a pre-specified hypothesis', isCorrect: true },
      { id: 'c', text: 'No - you need at least 30 studies', isCorrect: false },
      { id: 'd', text: 'Only if all studies are RCTs', isCorrect: false },
    ],
    hint: 'Pre-specified hypotheses + substantial heterogeneity + adequate studies = good candidate.',
  },
  
  // Step 5: The BCG Example
  {
    id: 'bcg-example',
    type: 'info',
    title: 'Example: BCG by Latitude',
    message: "Remember the BCG vaccine data? It showed high heterogeneity (I² ≈ 92%).\n\n**Hypothesis:** BCG effectiveness might vary by latitude because:\n• TB exposure differs by climate\n• Other mycobacteria (that provide natural immunity) are more common near the equator\n\nLet's test this by dividing studies into:\n• **Low latitude** (<23.5°)\n• **High latitude** (≥23.5°)",
    pose: 'teaching',
    hint: 'This is a classic example of a biologically plausible moderator.',
  },
  
  // Step 6: Interpreting Results
  {
    id: 'interpret-subgroup',
    type: 'info',
    title: 'Reading Subgroup Results',
    message: "When you run a subgroup analysis, look for:\n\n**1. Within-subgroup effects:**\n• Is the effect significant in each subgroup?\n• What's the direction and magnitude?\n\n**2. Between-subgroup difference:**\n• Test for subgroup differences (Q-test)\n• p < 0.10 suggests the effect differs between subgroups\n\n**3. Residual heterogeneity:**\n• Does heterogeneity decrease within subgroups?\n• If yes, the moderator explains some variation!",
    pose: 'pointing',
    hint: 'A significant between-subgroup difference is the key finding.',
  },
  
  // Step 7: Action - R Code
  {
    id: 'action-r-code',
    type: 'action',
    title: 'See It in Action',
    message: "Let's look at how to run a subgroup analysis in R! 📊\n\nTap 'Show R Code' to see the commands for the BCG latitude analysis.",
    pose: 'pointing',
    actionDescription: 'View R code for subgroup analysis',
    hint: 'The metafor package makes subgroup analysis straightforward.',
    codeExample: `# Load packages
library(metafor)

# Fit model with subgroup moderator
res <- rma(yi = lnRR, vi = vi, 
           data = bcg,
           mods = ~ latitude_group,
           method = "REML")

# View results
print(res)
# Look for: QM (test for moderators)

# Forest plot by subgroup
forest(res, 
       order = latitude_group,
       header = TRUE,
       rows = c(3:7, 12:18),
       ylim = c(-1, 21))

# Add subgroup labels
text(-10, c(8, 19), 
     c("High Latitude", "Low Latitude"),
     font = 2, pos = 4)

# Add subgroup summaries
addpoly(res, row = c(2, 11), 
        mlab = c("Subgroup RE", "Subgroup RE"))`,
  },
  
  // Step 8: Quiz - Interpretation
  {
    id: 'quiz-interpret',
    type: 'quiz',
    title: 'Interpretation Check',
    message: "A subgroup analysis shows:\n• High latitude: OR = 0.35 (95% CI: 0.25-0.49)\n• Low latitude: OR = 0.82 (95% CI: 0.60-1.12)\n• Test for subgroup differences: p = 0.003\n\nWhat's the correct interpretation?",
    pose: 'thinking',
    quizOptions: [
      { id: 'a', text: 'BCG is equally effective at all latitudes', isCorrect: false },
      { id: 'b', text: 'BCG appears more effective at high latitudes, with a statistically significant difference between subgroups', isCorrect: true },
      { id: 'c', text: 'BCG is ineffective at low latitudes', isCorrect: false },
      { id: 'd', text: 'The analysis is invalid due to high p-value', isCorrect: false },
    ],
    hint: 'Look at both the effect sizes AND the test for subgroup differences.',
  },
  
  // Step 9: Common Pitfalls
  {
    id: 'pitfalls',
    type: 'info',
    title: 'Common Pitfalls ⚠️',
    message: "Avoid these mistakes in subgroup analysis:\n\n**1. Too many subgroups**\n• Multiple testing increases false positives\n• Limit to pre-specified hypotheses\n\n**2. Too few studies per subgroup**\n• Need ≥3-5 studies for reliable estimates\n• Report with caution if fewer\n\n**3. Ecological fallacy**\n• Study-level moderators ≠ individual-level effects\n• Can't conclude about individuals from study averages\n\n**4. Confounding**\n• Subgroups may differ in other ways too\n• Consider meta-regression for multiple moderators",
    pose: 'teaching',
    hint: 'Pre-registration helps avoid the temptation to test many subgroups.',
  },
  
  // Step 10: Reporting Guidelines
  {
    id: 'reporting',
    type: 'info',
    title: 'Reporting Your Analysis',
    message: "When reporting subgroup analyses, include:\n\n**1. Justification**\n• Why you chose these subgroups\n• Whether pre-specified or exploratory\n\n**2. Results for each subgroup**\n• Effect size and 95% CI\n• Number of studies\n• Heterogeneity within subgroup\n\n**3. Between-subgroup comparison**\n• Test statistic and p-value\n• Interpretation of the difference\n\n**4. Limitations**\n• Number of studies per subgroup\n• Potential confounders",
    pose: 'pointing',
    hint: 'PRISMA guidelines recommend reporting all pre-specified subgroup analyses.',
  },
  
  // Step 11: Quiz - Best Practices
  {
    id: 'quiz-practices',
    type: 'quiz',
    title: 'Best Practices Check',
    message: "Which of these is the BEST approach to subgroup analysis?",
    pose: 'thinking',
    quizOptions: [
      { id: 'a', text: 'Test as many subgroups as possible to find significant differences', isCorrect: false },
      { id: 'b', text: 'Only report subgroup analyses that show significant differences', isCorrect: false },
      { id: 'c', text: 'Pre-specify a limited number of subgroups based on scientific rationale', isCorrect: true },
      { id: 'd', text: 'Avoid subgroup analysis entirely because it\'s too complex', isCorrect: false },
    ],
    hint: 'Pre-specification and scientific rationale are key to credible subgroup analyses.',
  },
  
  // Step 12: Celebration
  {
    id: 'celebration',
    type: 'celebration',
    title: 'Subgroup Expert! 🎉',
    message: "Excellent work! 🦊✨ You now understand:\n\n✅ When to use subgroup analysis\n✅ How to interpret subgroup results\n✅ The test for subgroup differences\n✅ Common pitfalls to avoid\n✅ How to report findings properly\n\nYou've earned the **Subgroup Specialist** badge! 📊\n\nYou're now ready for more advanced techniques like meta-regression!",
    pose: 'celebrating',
  },
];

/**
 * Get tutorial metadata for display
 */
export function getSubgroupTutorialMeta() {
  return {
    id: SUBGROUP_TUTORIAL_ID,
    title: SUBGROUP_TUTORIAL_TITLE,
    description: 'Learn to explore sources of heterogeneity by comparing effects across study subgroups.',
    icon: '📊',
    durationMinutes: 10,
    difficulty: 'intermediate' as const,
    stepsCount: subgroupTutorialSteps.length,
    prerequisites: ['heterogeneity-analysis'],
    badge: {
      id: 'subgroup-specialist',
      name: 'Subgroup Specialist',
      icon: '📊',
      description: 'Mastered the art of exploring heterogeneity through subgroup analysis.',
    },
  };
}
