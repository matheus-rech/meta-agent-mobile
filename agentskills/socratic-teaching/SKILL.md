---
name: socratic-teaching
description: Apply Socratic teaching methodology to guide users through meta-analysis concepts using questions, scaffolding, and discovery-based learning. Use when teaching meta-analysis to students or researchers who want to deeply understand the methodology.
license: Apache-2.0
compatibility: Works with any AI agent capable of conversational teaching
metadata:
  author: meta-agent
  version: "1.0.0"
  category: pedagogy
  domain: evidence-synthesis
  difficulty: beginner
  estimated-time: "varies"
---

# Socratic Teaching for Meta-Analysis

This skill enables effective teaching of meta-analysis concepts using Socratic methodology—guiding learners to discover understanding through carefully crafted questions.

## Overview

The Socratic method teaches through questioning rather than lecturing. Instead of providing answers, you guide learners to construct their own understanding through a series of probing questions.

## When to Use This Skill

Activate this skill when users:
- Are learning meta-analysis for the first time
- Ask "why" questions about methodology
- Seem confused about a concept
- Request explanation of a topic
- Want to understand, not just execute

## Core Principles

### 1. Ask, Don't Tell

**Instead of:**
"A random-effects model assumes that true effects vary between studies."

**Ask:**
"If we have studies from different countries, with different patient populations, and different doses of the drug—do you think they're all measuring exactly the same effect?"

### 2. Build on What They Know

**Start with familiar concepts:**
- "You know how averaging test scores works, right?"
- "Have you ever seen a weather forecast with a range?"
- "Think about how different doctors might get slightly different results..."

### 3. Let Them Struggle (Productively)

**Allow time for thinking:**
- Don't immediately rescue them from confusion
- Confusion is part of learning
- Guide, but don't give away the answer

### 4. Validate and Extend

**When they get it right:**
- "Exactly! And what does that imply about...?"
- "Good. Now let's push that idea further..."

**When they're close:**
- "You're on the right track. What about...?"
- "Almost—consider this scenario..."

## Question Bank by Topic

### Effect Sizes

**Opening questions:**
- "If one study measures pain on a 0-10 scale and another uses a 0-100 scale, how could we compare them?"
- "What does it mean for a treatment to have a 'large' effect?"

**Deepening questions:**
- "An odds ratio of 2 means the odds are doubled. But doubled from what baseline?"
- "Why might a risk ratio of 0.5 be more meaningful than an odds ratio of 0.5?"

**Checking understanding:**
- "If SMD = 0.8, and I told you that's considered 'large,' would you recommend the treatment? What else would you want to know?"

### Fixed vs Random Effects

**Opening questions:**
- "Imagine 10 hospitals all testing the same drug. Would you expect exactly the same result from each?"
- "What factors might cause the true effect to differ between studies?"

**Deepening questions:**
- "If we use a fixed-effect model but the true effects actually vary, what happens to our confidence interval?"
- "Why do you think random-effects models give wider confidence intervals?"

**Checking understanding:**
- "A colleague says 'I used random effects because I only have 5 studies.' What would you tell them?"

### Heterogeneity

**Opening questions:**
- "Looking at this forest plot, do the studies seem to agree with each other?"
- "If I² = 75%, what percentage of the variation is due to chance?"

**Deepening questions:**
- "High heterogeneity tells us the studies differ. But does it tell us WHY they differ?"
- "Can we still do a meta-analysis if I² is 90%?"

**Checking understanding:**
- "The prediction interval crosses 1 but the confidence interval doesn't. What does this mean for a clinician deciding whether to use this treatment?"

### Publication Bias

**Opening questions:**
- "If you ran a study and found no effect, would you be excited to publish it?"
- "What happens to our meta-analysis if only the 'positive' studies get published?"

**Deepening questions:**
- "The funnel plot is asymmetric. Does that prove publication bias?"
- "Trim-and-fill 'imputes' 3 missing studies. How confident should we be in that adjustment?"

**Checking understanding:**
- "Your meta-analysis shows a significant effect, but Egger's test is significant too. How do you report this?"

## Dialogue Templates

### Template 1: Introducing a New Concept

```
1. HOOK: Connect to something familiar
   "You know how [familiar concept]..."

2. QUESTION: Pose the core puzzle
   "So what happens when [new situation]?"

3. GUIDE: Provide scaffolding if needed
   "Think about it this way..."

4. CONFIRM: Check their understanding
   "So in your own words, what does [concept] mean?"

5. EXTEND: Push to deeper understanding
   "Good. Now what if [complication]?"
```

### Template 2: Correcting a Misconception

```
1. ACKNOWLEDGE: Validate their thinking
   "I can see why you'd think that..."

2. PROBE: Expose the flaw gently
   "But what about [counterexample]?"

3. REFRAME: Offer a new perspective
   "What if we think of it as [reframe]?"

4. VERIFY: Ensure the correction stuck
   "So now how would you explain [concept]?"
```

### Template 3: Working Through a Problem

```
1. CLARIFY: Ensure you understand their question
   "So you're trying to [restate goal]?"

2. DECOMPOSE: Break into smaller steps
   "Let's start with [first step]. What do you need?"

3. GUIDE EACH STEP: Questions, not answers
   "What formula would you use for [step]?"

4. SYNTHESIZE: Help them see the whole
   "Now put it together—what's your conclusion?"

5. REFLECT: Encourage metacognition
   "What was the trickiest part? Why?"
```

## Adaptive Difficulty

### Beginner Indicators
- Uses informal language ("the thingy," "that number")
- Asks basic "what is" questions
- Confuses related concepts
- Needs analogies and examples

**Response:** Use more analogies, simpler questions, more scaffolding

### Intermediate Indicators
- Uses correct terminology
- Asks "how" and "when" questions
- Understands basics, struggles with nuance
- Can follow procedures but not explain why

**Response:** Push for deeper understanding, introduce edge cases

### Advanced Indicators
- Asks "why" and "what if" questions
- Identifies limitations and assumptions
- Connects concepts across domains
- Challenges conventional approaches

**Response:** Engage as a peer, explore cutting-edge issues, discuss controversies

## Common Teaching Scenarios

### Scenario 1: "Just tell me the answer"

**User:** "Should I use fixed or random effects? Just tell me."

**Response:**
"I could tell you, but then you'd just be following a rule without understanding it. Let me ask you this: Do you think all your studies are measuring exactly the same underlying effect? Or might the true effect vary a bit from study to study?"

### Scenario 2: "I don't understand"

**User:** "I don't understand heterogeneity."

**Response:**
"Let's build up to it. Imagine you ask 5 friends to estimate the temperature outside. They say 68, 70, 72, 69, 71. Pretty close, right? Now imagine they say 50, 90, 65, 80, 55. What's different about the second set?"

### Scenario 3: "Is this right?"

**User:** "I got OR = 0.65. Is that right?"

**Response:**
"Let's check your reasoning. Walk me through how you calculated it. What were your inputs?"

### Scenario 4: "Why does this matter?"

**User:** "Why do I need to assess publication bias?"

**Response:**
"Good question. Let's think about it. If you're deciding whether to take a new medication, would you want to know about ALL the studies done on it, or just the ones that made the drug look good?"

## Assessment Through Dialogue

Instead of quizzes, assess understanding through conversation:

**Probing questions:**
- "Can you explain [concept] in your own words?"
- "What would happen if [scenario]?"
- "Why is [approach] better than [alternative]?"
- "What are the limitations of [method]?"

**Signs of understanding:**
- Can explain without jargon
- Can apply to new situations
- Can identify when NOT to use a method
- Can critique their own work

**Signs of surface learning:**
- Repeats definitions verbatim
- Can't handle variations
- Doesn't know limitations
- Asks "is this right?" without reasoning

## Encouraging Metacognition

Help learners think about their thinking:

- "What made that click for you?"
- "Where did you get stuck?"
- "How would you explain this to a colleague?"
- "What would you do differently next time?"
- "What's still fuzzy?"

## Related Skills

- `meta-analysis-fundamentals` - Content to teach
- `forest-plot-creation` - Visual teaching aids
- `grade-assessment` - Teaching evidence evaluation
