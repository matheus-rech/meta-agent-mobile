/**
 * Socratic Teaching Skill
 * 
 * Implements Socratic method for teaching meta-analysis concepts.
 * Instead of giving direct answers, guides users through questions.
 */

/**
 * Socratic question templates organized by topic
 */
export const SOCRATIC_QUESTIONS = {
  // Understanding the research question
  researchQuestion: [
    "What specific question are you trying to answer with this meta-analysis?",
    "Is your question about treatment effects, diagnostic accuracy, or something else?",
    "What would a meaningful answer to your question look like?",
    "Who would benefit from knowing the answer to this question?",
  ],
  
  // Effect measure selection
  effectMeasure: [
    "What type of outcome are you measuring - continuous or binary?",
    "Are you comparing two groups, or looking at a single proportion?",
    "Why might odds ratios behave differently than risk ratios for common outcomes?",
    "What does a standardized mean difference tell us that a raw mean difference doesn't?",
  ],
  
  // Model selection
  modelChoice: [
    "Do you expect the true effect to be the same across all studies?",
    "What sources of variation might exist between your studies?",
    "What does a random-effects model assume about the studies?",
    "When might a fixed-effect model be appropriate?",
  ],
  
  // Heterogeneity
  heterogeneity: [
    "What does I² actually measure?",
    "If I² is 75%, what does that tell you about your studies?",
    "What are some reasons studies might show different effects?",
    "How would you investigate the sources of heterogeneity?",
  ],
  
  // Publication bias
  publicationBias: [
    "Why might studies with non-significant results be missing?",
    "What pattern would you expect in a funnel plot if there's no bias?",
    "What does asymmetry in a funnel plot suggest?",
    "Besides publication bias, what else could cause funnel plot asymmetry?",
  ],
  
  // Risk of bias
  riskOfBias: [
    "What aspects of study design affect how much we can trust the results?",
    "Why is allocation concealment important in RCTs?",
    "How might unblinded outcome assessment affect results?",
    "What's the difference between risk of bias and study quality?",
  ],
  
  // Interpretation
  interpretation: [
    "What does this effect size mean in practical terms?",
    "Is this effect clinically meaningful, not just statistically significant?",
    "What would change your confidence in this finding?",
    "How would you explain this result to a clinician or patient?",
  ],
  
  // R code debugging
  debugging: [
    "What were you expecting this code to do?",
    "What does the error message tell us about what went wrong?",
    "Have you checked that your data is in the expected format?",
    "What would happen if we ran this code step by step?",
  ],
};

/**
 * Teaching response templates
 */
export const TEACHING_RESPONSES = {
  acknowledgment: [
    "That's a great question to explore.",
    "Let's think through this together.",
    "This is an important concept to understand.",
    "Good - this shows you're thinking critically.",
  ],
  
  encouragement: [
    "You're on the right track.",
    "That's exactly the right way to think about it.",
    "Good reasoning - let's build on that.",
    "You're asking the right questions.",
  ],
  
  clarification: [
    "Let me make sure I understand what you're asking...",
    "Before we dive in, can you tell me more about...",
    "To give you the best guidance, I need to know...",
    "Help me understand your specific situation...",
  ],
  
  guidance: [
    "Consider this: ",
    "Here's something to think about: ",
    "A key insight is: ",
    "The Cochrane Handbook suggests: ",
  ],
};

/**
 * Socratic Teaching Skill Configuration
 */
export const SOCRATIC_TEACHING_SKILL = {
  id: 'socratic-teaching',
  name: 'Socratic Teaching Method',
  version: '1.0.0',
  description: 'Guides users to understand meta-analysis concepts through questions rather than direct answers',
  category: 'teaching',
  tags: ['education', 'socratic', 'learning', 'methodology'],
  
  triggers: [
    'teach me',
    'explain',
    'help me understand',
    'why',
    'how does',
    'what is',
    'learn',
    'tutorial',
    'guide me',
  ],
  
  systemPrompt: `You are a Socratic teacher helping someone learn meta-analysis methodology.

TEACHING PRINCIPLES:
1. Never give direct answers immediately - guide through questions
2. Build on what the learner already knows
3. Use the Cochrane Handbook as your authoritative source
4. Make connections to practical applications
5. Celebrate correct reasoning and gently redirect misconceptions

SOCRATIC DIALOGUE PATTERN:
1. ACKNOWLEDGE: Validate their question ("That's an important concept...")
2. CLARIFY: Ensure you understand what they're asking
3. PROBE: Ask what they already know about the topic
4. GUIDE: Use leading questions to help them discover the answer
5. CONFIRM: Check their understanding with follow-up questions
6. EXTEND: Connect to related concepts they should explore

QUESTION TYPES TO USE:
- Clarifying: "What do you mean by...?"
- Probing assumptions: "Why do you think that is?"
- Exploring implications: "What would happen if...?"
- Checking evidence: "What makes you say that?"
- Alternative viewpoints: "What would someone who disagrees say?"

WHEN TO GIVE DIRECT INFORMATION:
- After 2-3 rounds of questions if they're stuck
- For factual definitions that can't be discovered
- When safety or correctness is critical
- When explicitly asked "just tell me"

Always cite the Cochrane Handbook chapter when relevant.`,

  examples: [
    {
      input: "What is heterogeneity?",
      output: `That's a fundamental concept in meta-analysis! Before I explain, let me ask you:

When you combine results from multiple studies, would you expect them all to show exactly the same effect size? 

Think about what might cause studies to differ - different populations, interventions, or outcome measurements.

What do you think "heterogeneity" might refer to in this context?`
    },
    {
      input: "Should I use fixed or random effects?",
      output: `Great question - this is one of the most important decisions in meta-analysis.

Let me ask you a few things first:
1. Are your studies measuring the exact same thing in the exact same way?
2. Do you expect the "true" effect to be identical across all studies?
3. What sources of variation might exist between your studies?

The answer to these questions will guide your model choice. What are your thoughts?`
    },
    {
      input: "My I² is 85%, is that bad?",
      output: `I can see why you're concerned about that number. Let's think through what it means.

First, what do you understand I² to represent? 

Here's a hint: It's not about whether the heterogeneity is "bad" - it's about what proportion of the variability is due to true differences between studies versus random chance.

With 85%, what does that tell you about your studies? And more importantly, what should you do next?`
    }
  ],
  
  responseGuidelines: [
    'Start with acknowledgment of the question',
    'Ask 1-2 guiding questions before providing information',
    'Reference Cochrane Handbook chapters when relevant',
    'Use analogies to make concepts concrete',
    'End with a question to check understanding',
    'Be patient and encouraging',
  ],
};

/**
 * Get a random question from a topic category
 */
export function getRandomQuestion(topic: keyof typeof SOCRATIC_QUESTIONS): string {
  const questions = SOCRATIC_QUESTIONS[topic];
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Get a random teaching response
 */
export function getRandomResponse(type: keyof typeof TEACHING_RESPONSES): string {
  const responses = TEACHING_RESPONSES[type];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Detect the topic from user input
 */
export function detectTopic(input: string): keyof typeof SOCRATIC_QUESTIONS | null {
  const lowered = input.toLowerCase();
  
  if (lowered.includes('effect') && (lowered.includes('measure') || lowered.includes('size'))) {
    return 'effectMeasure';
  }
  if (lowered.includes('fixed') || lowered.includes('random') || lowered.includes('model')) {
    return 'modelChoice';
  }
  if (lowered.includes('heterogen') || lowered.includes('i²') || lowered.includes('i-squared') || lowered.includes('i2')) {
    return 'heterogeneity';
  }
  if (lowered.includes('publication') || lowered.includes('bias') || lowered.includes('funnel')) {
    return 'publicationBias';
  }
  if (lowered.includes('risk of bias') || lowered.includes('quality') || lowered.includes('rob')) {
    return 'riskOfBias';
  }
  if (lowered.includes('interpret') || lowered.includes('meaning') || lowered.includes('clinical')) {
    return 'interpretation';
  }
  if (lowered.includes('error') || lowered.includes('debug') || lowered.includes('fix') || lowered.includes('not working')) {
    return 'debugging';
  }
  if (lowered.includes('research question') || lowered.includes('pico') || lowered.includes('objective')) {
    return 'researchQuestion';
  }
  
  return null;
}

/**
 * Build a Socratic response for a given topic
 */
export function buildSocraticResponse(topic: keyof typeof SOCRATIC_QUESTIONS, userInput: string): string {
  const acknowledgment = getRandomResponse('acknowledgment');
  const question = getRandomQuestion(topic);
  
  return `${acknowledgment}

${question}

Take a moment to think about this. What's your initial thought?`;
}

/**
 * Check if the input suggests a teaching/learning intent
 */
export function isSocraticTrigger(input: string): boolean {
  const lowered = input.toLowerCase();
  return SOCRATIC_TEACHING_SKILL.triggers.some(trigger => lowered.includes(trigger));
}
