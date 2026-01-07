/**
 * Tutorial Content
 * All tutorial modules and their steps for Meta Agent Mobile
 */

import { TutorialModule, TutorialStep } from './types';

// =============================================================================
// MODULE 1: Welcome & App Overview
// =============================================================================

const welcomeSteps: TutorialStep[] = [
  {
    id: 'welcome-1',
    title: 'Welcome to Meta Agent! 🤖',
    content: `You're about to learn how to conduct rigorous meta-analyses using AI assistance.

This tutorial will guide you through:
• Understanding the app interface
• Running your first meta-analysis
• Interpreting results like a pro
• Using AI to learn, not just do

Let's begin your journey into evidence synthesis!`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'welcome-2',
    title: 'The Terminal Interface',
    content: `Meta Agent uses a command-line style interface inspired by professional research tools.

This design choice isn't just aesthetic—it gives you:
• Precise control over analyses
• Reproducible commands you can save
• Direct access to R statistical computing
• A clear history of everything you've done`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'welcome-3',
    title: 'Try Your First Command',
    content: `Type /help in the command input below to see all available commands.

The slash (/) prefix indicates a system command. Regular text is sent to the AI assistant.`,
    type: 'action',
    expectedAction: 'command:/help',
    targetElement: 'command-input',
    position: 'top',
    showArrow: true,
    hint: 'Type /help and press Enter or tap Send',
  },
  {
    id: 'welcome-4',
    title: 'Understanding Commands',
    content: `Great! You've discovered the command system. Here are the key commands:

/help - Show all commands
/clear - Clear the terminal
/history - View command history
/skills - See AI capabilities
/knowledge - Browse the knowledge base
/r - Execute R code directly`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'welcome-5',
    title: 'The AI Assistant',
    content: `When you type without a slash, you're talking to the AI assistant.

The AI is trained to:
• Teach you meta-analysis concepts
• Help you understand your results
• Guide you through best practices
• Answer questions using Cochrane methodology

Try asking: "What is a meta-analysis?"`,
    type: 'action',
    expectedAction: 'message:meta-analysis',
    targetElement: 'command-input',
    position: 'top',
    showArrow: true,
    hint: 'Ask the AI about meta-analysis',
  },
  {
    id: 'welcome-6',
    title: 'Module Complete! 🎉',
    content: `Excellent! You've completed the Welcome module.

You now know:
✓ How to use the terminal interface
✓ The difference between commands and AI chat
✓ Where to find help

Ready to learn about meta-analysis? Continue to the next module!`,
    type: 'info',
    position: 'center',
  },
];

export const welcomeModule: TutorialModule = {
  id: 'welcome',
  title: 'Welcome & App Overview',
  description: 'Learn the basics of navigating Meta Agent and using the terminal interface.',
  category: 'getting-started',
  icon: '👋',
  estimatedMinutes: 5,
  difficulty: 'beginner',
  steps: welcomeSteps,
  completionMessage: 'You\'ve mastered the basics! Ready to dive into meta-analysis?',
  badge: {
    id: 'first-steps',
    name: 'First Steps',
    icon: '🚀',
    description: 'Completed the welcome tutorial',
  },
};

// =============================================================================
// MODULE 2: Understanding Meta-Analysis Basics
// =============================================================================

const metaAnalysisBasicsSteps: TutorialStep[] = [
  {
    id: 'basics-1',
    title: 'What is Meta-Analysis?',
    content: `Meta-analysis is a statistical technique that combines results from multiple studies to arrive at a more precise estimate of an effect.

Think of it as a "study of studies"—instead of relying on a single trial, we pool evidence from many trials to get a clearer picture.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'basics-2',
    title: 'Why Combine Studies?',
    content: `Individual studies often have:
• Small sample sizes (low power)
• Different populations
• Varying methodologies

By combining them, we can:
• Increase statistical power
• Detect smaller effects
• Explore heterogeneity
• Improve generalizability`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'basics-quiz-1',
    title: 'Quick Check',
    content: 'What is the main advantage of meta-analysis over a single study?',
    type: 'choice',
    choices: [
      {
        id: 'a',
        label: 'It\'s faster to conduct',
        isCorrect: false,
        feedback: 'Actually, meta-analyses require careful systematic review and can take months!',
      },
      {
        id: 'b',
        label: 'Increased statistical power',
        isCorrect: true,
        feedback: 'Correct! By pooling data, we can detect effects that individual studies might miss.',
      },
      {
        id: 'c',
        label: 'It eliminates all bias',
        isCorrect: false,
        feedback: 'Meta-analyses can actually amplify biases if not done carefully. That\'s why methodology matters!',
      },
    ],
    position: 'center',
  },
  {
    id: 'basics-3',
    title: 'Effect Sizes',
    content: `Effect sizes quantify the magnitude of a treatment effect in a standardized way.

Common effect sizes:
• Odds Ratio (OR) - for binary outcomes
• Risk Ratio (RR) - for binary outcomes  
• Standardized Mean Difference (SMD) - for continuous outcomes
• Mean Difference (MD) - for continuous outcomes

The choice depends on your outcome type and research question.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'basics-4',
    title: 'Let\'s Explore Effect Sizes',
    content: `Ask the AI to explain odds ratios in simple terms.

The AI uses Socratic teaching—it will guide you to understand concepts rather than just giving answers.`,
    type: 'socratic',
    socraticTopic: 'effect-sizes',
    targetElement: 'command-input',
    position: 'top',
    hint: 'Try: "Explain odds ratios like I\'m a beginner"',
  },
  {
    id: 'basics-5',
    title: 'Fixed vs Random Effects',
    content: `Two main models for meta-analysis:

**Fixed-Effect Model**
Assumes all studies estimate the same true effect. Differences are due to sampling error only.

**Random-Effects Model**
Assumes true effects vary between studies. Accounts for both within-study and between-study variance.

Most medical meta-analyses use random-effects (DerSimonian-Laird method).`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'basics-quiz-2',
    title: 'Quick Check',
    content: 'When should you use a random-effects model?',
    type: 'choice',
    choices: [
      {
        id: 'a',
        label: 'When studies are identical in design and population',
        isCorrect: false,
        feedback: 'If studies were truly identical, fixed-effect might be appropriate. But this is rare in practice.',
      },
      {
        id: 'b',
        label: 'When you expect true effects to vary between studies',
        isCorrect: true,
        feedback: 'Exactly! Random-effects accounts for heterogeneity in true effects across studies.',
      },
      {
        id: 'c',
        label: 'Only when you have fewer than 5 studies',
        isCorrect: false,
        feedback: 'The number of studies doesn\'t determine the model choice—expected heterogeneity does.',
      },
    ],
    position: 'center',
  },
  {
    id: 'basics-6',
    title: 'Module Complete! 📚',
    content: `You now understand the foundations of meta-analysis!

Key takeaways:
✓ Meta-analysis combines multiple studies
✓ Effect sizes standardize treatment effects
✓ Random-effects models account for heterogeneity

Next: Let's create your first forest plot!`,
    type: 'info',
    position: 'center',
  },
];

export const metaAnalysisBasicsModule: TutorialModule = {
  id: 'meta-analysis-basics',
  title: 'Meta-Analysis Fundamentals',
  description: 'Understand what meta-analysis is, why it matters, and the key concepts you need to know.',
  category: 'meta-analysis-basics',
  icon: '📊',
  estimatedMinutes: 10,
  difficulty: 'beginner',
  steps: metaAnalysisBasicsSteps,
  completionMessage: 'You\'ve grasped the fundamentals! Time to put theory into practice.',
  badge: {
    id: 'theory-master',
    name: 'Theory Master',
    icon: '🎓',
    description: 'Learned meta-analysis fundamentals',
  },
};

// =============================================================================
// MODULE 3: Your First Forest Plot
// =============================================================================

const forestPlotSteps: TutorialStep[] = [
  {
    id: 'forest-1',
    title: 'The Forest Plot',
    content: `A forest plot is the signature visualization of meta-analysis. It shows:

• Individual study effects (squares)
• Confidence intervals (horizontal lines)
• Study weights (square size)
• Pooled effect (diamond)

Let's create one together!`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'forest-2',
    title: 'Sample Data: BCG Vaccine Trials',
    content: `We'll use a classic dataset: BCG vaccine trials for tuberculosis prevention.

This dataset includes 13 trials from 1948-1980, studying whether BCG vaccination prevents TB.

It's a perfect learning example because it shows significant heterogeneity—the effects vary considerably between studies.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'forest-3',
    title: 'Running R Code',
    content: `Meta Agent uses WebR to run R code directly in your browser—no server needed!

Type this command to load the BCG data and create a forest plot:

/r library(metafor); data(dat.bcg); res <- rma(ai=tpos, bi=tneg, ci=cpos, di=cneg, data=dat.bcg, measure="OR"); forest(res)`,
    type: 'action',
    expectedAction: 'command:/r',
    targetElement: 'command-input',
    position: 'top',
    showArrow: true,
    hint: 'Copy and paste the /r command, or type it manually',
  },
  {
    id: 'forest-4',
    title: 'Reading the Forest Plot',
    content: `Let's interpret what you see:

**Each row** = One study
**Square position** = Point estimate (odds ratio)
**Square size** = Study weight (larger = more precise)
**Horizontal line** = 95% confidence interval
**Diamond** = Pooled effect estimate
**Vertical line** = Line of no effect (OR = 1)

Studies crossing the vertical line are not statistically significant individually.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'forest-5',
    title: 'Understanding the Results',
    content: `For the BCG data, you should see:

• Most studies favor vaccination (OR < 1)
• Wide confidence intervals in some studies
• Significant heterogeneity (I² is high)
• Overall effect is protective

Ask the AI: "What does an odds ratio of 0.5 mean for BCG vaccination?"`,
    type: 'socratic',
    socraticTopic: 'interpreting-results',
    targetElement: 'command-input',
    position: 'top',
    hint: 'Ask about interpreting the odds ratio',
  },
  {
    id: 'forest-6',
    title: 'Module Complete! 🌲',
    content: `Congratulations! You've created and interpreted your first forest plot!

You learned:
✓ What forest plots show
✓ How to run R code in Meta Agent
✓ How to read individual study results
✓ How to interpret the pooled effect

Next: Learn how to enter your own study data!`,
    type: 'info',
    position: 'center',
  },
];

export const forestPlotModule: TutorialModule = {
  id: 'forest-plot',
  title: 'Your First Forest Plot',
  description: 'Create and interpret a forest plot using real clinical trial data.',
  category: 'forest-plots',
  icon: '🌲',
  estimatedMinutes: 8,
  difficulty: 'beginner',
  prerequisites: ['meta-analysis-basics'],
  steps: forestPlotSteps,
  completionMessage: 'You\'ve created your first forest plot! You\'re becoming a meta-analyst.',
  badge: {
    id: 'forest-ranger',
    name: 'Forest Ranger',
    icon: '🌲',
    description: 'Created your first forest plot',
  },
};

// =============================================================================
// MODULE 4: Working with Study Data
// =============================================================================

const dataEntrySteps: TutorialStep[] = [
  {
    id: 'data-1',
    title: 'Data for Meta-Analysis',
    content: `To run a meta-analysis, you need data from multiple studies. Typically:

**For binary outcomes:**
• Events in treatment group
• Total in treatment group
• Events in control group
• Total in control group

**For continuous outcomes:**
• Mean, SD, N for each group`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'data-2',
    title: 'Data Sources',
    content: `Where does this data come from?

1. **Published papers** - Extract from tables/text
2. **Supplementary materials** - Often more detailed
3. **Author contact** - Request unpublished data
4. **PROSPERO protocols** - Pre-registered reviews

Meta Agent can help you import from PROSPERO and organize your extractions.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'data-3',
    title: 'Data Extraction Best Practices',
    content: `Quality data extraction is crucial:

✓ Use standardized forms
✓ Have two reviewers extract independently
✓ Resolve discrepancies by consensus
✓ Document all decisions
✓ Contact authors for missing data

The AI can help you create extraction templates!`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'data-4',
    title: 'Try CSV Import',
    content: `Meta Agent supports CSV file import for study data.

Your CSV should have columns like:
study, year, events_treat, n_treat, events_ctrl, n_ctrl

You can also ask the AI to help format your data correctly.`,
    type: 'info',
    position: 'center',
    hint: 'Navigate to the data import screen to try uploading a CSV',
  },
  {
    id: 'data-5',
    title: 'Creating Data in R',
    content: `You can also create data directly in R:

/r dat <- data.frame(
  study = c("Smith 2020", "Jones 2021", "Lee 2022"),
  ai = c(15, 23, 18),  # events treatment
  n1i = c(100, 150, 120),  # n treatment
  ci = c(25, 30, 28),  # events control
  n2i = c(100, 150, 120)  # n control
)`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'data-6',
    title: 'Module Complete! 📋',
    content: `You now understand data requirements for meta-analysis!

Key points:
✓ Know what data you need for different outcome types
✓ Follow best practices for data extraction
✓ Use CSV import or R for data entry
✓ Document everything

Next: Learn to interpret your results like an expert!`,
    type: 'info',
    position: 'center',
  },
];

export const dataEntryModule: TutorialModule = {
  id: 'data-entry',
  title: 'Working with Study Data',
  description: 'Learn how to prepare, enter, and import data for your meta-analysis.',
  category: 'data-entry',
  icon: '📋',
  estimatedMinutes: 7,
  difficulty: 'intermediate',
  prerequisites: ['forest-plot'],
  steps: dataEntrySteps,
  completionMessage: 'You\'re ready to work with real study data!',
  badge: {
    id: 'data-wrangler',
    name: 'Data Wrangler',
    icon: '📋',
    description: 'Learned data entry and import',
  },
};

// =============================================================================
// MODULE 5: Interpreting Results
// =============================================================================

const interpretingResultsSteps: TutorialStep[] = [
  {
    id: 'interpret-1',
    title: 'Beyond the Point Estimate',
    content: `A meta-analysis gives you more than just a pooled effect. You need to assess:

1. **Statistical significance** - Is the effect real?
2. **Clinical significance** - Is it meaningful?
3. **Heterogeneity** - Do studies agree?
4. **Publication bias** - Are we missing studies?
5. **Quality of evidence** - Can we trust it?`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'interpret-2',
    title: 'Understanding Heterogeneity',
    content: `Heterogeneity measures how much studies disagree.

**I² statistic:**
• 0-25%: Low heterogeneity
• 25-50%: Moderate
• 50-75%: Substantial
• >75%: Considerable

High heterogeneity suggests the studies may be measuring different things—investigate why!`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'interpret-3',
    title: 'Check Heterogeneity',
    content: `Let's examine heterogeneity in the BCG data:

/r library(metafor); data(dat.bcg); res <- rma(ai=tpos, bi=tneg, ci=cpos, di=cneg, data=dat.bcg, measure="OR"); print(res)

Look for I² and Q statistic in the output.`,
    type: 'action',
    expectedAction: 'command:/r',
    targetElement: 'command-input',
    position: 'top',
    showArrow: true,
    hint: 'Run the R command to see heterogeneity statistics',
  },
  {
    id: 'interpret-4',
    title: 'Publication Bias',
    content: `Publication bias occurs when studies with positive results are more likely to be published.

Detection methods:
• **Funnel plot** - Visual asymmetry check
• **Egger's test** - Statistical test
• **Trim and fill** - Adjustment method

A funnel plot should look like an inverted funnel if no bias exists.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'interpret-5',
    title: 'Create a Funnel Plot',
    content: `Let's check for publication bias:

/r library(metafor); data(dat.bcg); res <- rma(ai=tpos, bi=tneg, ci=cpos, di=cneg, data=dat.bcg, measure="OR"); funnel(res)

Look for asymmetry—are small studies clustered on one side?`,
    type: 'action',
    expectedAction: 'command:/r',
    targetElement: 'command-input',
    position: 'top',
    showArrow: true,
    hint: 'Run the funnel plot command',
  },
  {
    id: 'interpret-quiz',
    title: 'Quick Check',
    content: 'What does an asymmetric funnel plot suggest?',
    type: 'choice',
    choices: [
      {
        id: 'a',
        label: 'The meta-analysis is invalid',
        isCorrect: false,
        feedback: 'Asymmetry is a warning sign, but doesn\'t automatically invalidate results.',
      },
      {
        id: 'b',
        label: 'Possible publication bias or heterogeneity',
        isCorrect: true,
        feedback: 'Correct! Asymmetry can indicate missing studies or systematic differences between small and large studies.',
      },
      {
        id: 'c',
        label: 'More studies are needed',
        isCorrect: false,
        feedback: 'While more studies help, asymmetry specifically suggests bias or heterogeneity.',
      },
    ],
    position: 'center',
  },
  {
    id: 'interpret-6',
    title: 'GRADE Assessment',
    content: `GRADE (Grading of Recommendations Assessment) evaluates evidence quality:

**Factors that lower quality:**
• Risk of bias
• Inconsistency (heterogeneity)
• Indirectness
• Imprecision
• Publication bias

**Factors that raise quality:**
• Large effect
• Dose-response
• Confounders would reduce effect

The AI can help you conduct GRADE assessments!`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'interpret-7',
    title: 'Module Complete! 🔍',
    content: `Excellent! You can now critically interpret meta-analysis results.

You learned:
✓ Look beyond the point estimate
✓ Assess heterogeneity with I²
✓ Check publication bias with funnel plots
✓ Understand GRADE quality assessment

Final module: Master the AI assistant!`,
    type: 'info',
    position: 'center',
  },
];

export const interpretingResultsModule: TutorialModule = {
  id: 'interpreting-results',
  title: 'Interpreting Results',
  description: 'Learn to critically evaluate meta-analysis output including heterogeneity and bias.',
  category: 'interpreting-results',
  icon: '🔍',
  estimatedMinutes: 12,
  difficulty: 'intermediate',
  prerequisites: ['forest-plot'],
  steps: interpretingResultsSteps,
  completionMessage: 'You can now critically evaluate meta-analysis results!',
  badge: {
    id: 'critical-thinker',
    name: 'Critical Thinker',
    icon: '🔍',
    description: 'Mastered result interpretation',
  },
};

// =============================================================================
// MODULE 6: Using AI Assistant & Socratic Mode
// =============================================================================

const aiAssistantSteps: TutorialStep[] = [
  {
    id: 'ai-1',
    title: 'Your AI Teaching Assistant',
    content: `Meta Agent's AI is designed to teach, not just answer.

It uses the **Socratic method**:
• Asks guiding questions
• Helps you discover answers
• Builds understanding step by step
• Connects concepts together

This approach helps you truly learn meta-analysis, not just get results.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'ai-2',
    title: 'Knowledge Base',
    content: `The AI is grounded in authoritative sources:

• **Cochrane Handbook** - Gold standard methodology
• **Seminal papers** - DerSimonian-Laird, Higgins I²
• **GRADE guidelines** - Evidence quality assessment
• **PRISMA 2020** - Reporting standards

Access the knowledge base with /knowledge to explore these resources directly.`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'ai-3',
    title: 'Explore the Knowledge Base',
    content: `Try the knowledge command:

/knowledge

This opens the knowledge browser where you can search topics and trigger Socratic teaching sessions.`,
    type: 'action',
    expectedAction: 'command:/knowledge',
    targetElement: 'command-input',
    position: 'top',
    showArrow: true,
    hint: 'Type /knowledge to explore',
  },
  {
    id: 'ai-4',
    title: 'AgentSkills',
    content: `The AI has specialized skills for meta-analysis:

• **meta-analysis-core** - Pooling, models, methods
• **data-extraction** - Systematic data collection
• **risk-of-bias** - RoB2, ROBINS-I, NOS tools
• **heterogeneity-analysis** - I², Q, subgroups
• **publication-bias** - Funnel plots, Egger's test
• **forest-plot** - Visualization creation
• **r-code-generation** - metafor/meta code
• **teaching-meta-analysis** - Socratic guidance

View all skills with /skills`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'ai-5',
    title: 'Effective AI Interaction',
    content: `Tips for getting the most from the AI:

✓ **Be specific** - "Help me interpret I² of 75%" vs "explain heterogeneity"
✓ **Share context** - Describe your research question
✓ **Ask why** - The AI will explain reasoning
✓ **Request examples** - Concrete illustrations help
✓ **Challenge answers** - Socratic dialogue goes both ways!`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'ai-6',
    title: 'Try Socratic Mode',
    content: `Ask the AI a conceptual question and engage in dialogue:

"I'm confused about when to use fixed vs random effects. Can you help me understand?"

Notice how the AI asks questions to guide your thinking rather than just giving the answer.`,
    type: 'socratic',
    socraticTopic: 'statistical-models',
    targetElement: 'command-input',
    position: 'top',
    hint: 'Ask about fixed vs random effects',
  },
  {
    id: 'ai-7',
    title: 'R Code Assistance',
    content: `The AI can help you write and debug R code:

• Generate metafor/meta code for your analysis
• Explain what code does line by line
• Debug errors in your scripts
• Suggest improvements

Try: "Write R code to do a subgroup analysis by study location"`,
    type: 'info',
    position: 'center',
  },
  {
    id: 'ai-8',
    title: 'Tutorial Complete! 🎓',
    content: `Congratulations! You've completed all tutorial modules!

You are now equipped to:
✓ Navigate Meta Agent confidently
✓ Understand meta-analysis concepts
✓ Create and interpret forest plots
✓ Work with study data
✓ Critically evaluate results
✓ Use the AI assistant effectively

Go forth and synthesize evidence! 🚀`,
    type: 'info',
    position: 'center',
  },
];

export const aiAssistantModule: TutorialModule = {
  id: 'ai-assistant',
  title: 'Using AI Assistant & Socratic Mode',
  description: 'Master the AI teaching assistant and knowledge base for effective learning.',
  category: 'ai-assistant',
  icon: '🤖',
  estimatedMinutes: 10,
  difficulty: 'beginner',
  prerequisites: ['welcome'],
  steps: aiAssistantSteps,
  completionMessage: 'You\'ve mastered the AI assistant! You\'re ready for independent research.',
  badge: {
    id: 'ai-whisperer',
    name: 'AI Whisperer',
    icon: '🤖',
    description: 'Mastered AI-assisted learning',
  },
};

// =============================================================================
// ALL MODULES EXPORT
// =============================================================================

export const tutorialModules: TutorialModule[] = [
  welcomeModule,
  metaAnalysisBasicsModule,
  forestPlotModule,
  dataEntryModule,
  interpretingResultsModule,
  aiAssistantModule,
];

export const getModuleById = (id: string): TutorialModule | undefined => {
  return tutorialModules.find(m => m.id === id);
};

export const getModulesByCategory = (category: string): TutorialModule[] => {
  return tutorialModules.filter(m => m.category === category);
};

export const getRecommendedOrder = (): TutorialModule[] => {
  return [
    welcomeModule,
    metaAnalysisBasicsModule,
    forestPlotModule,
    dataEntryModule,
    interpretingResultsModule,
    aiAssistantModule,
  ];
};
