# Contributing to Meta-Analysis Agent Skills

Thank you for your interest in contributing! This project aims to democratize meta-analysis education by creating open-source skills that any AI agent can use.

## Ways to Contribute

### 1. Add New Skills

We welcome new skills covering advanced topics:

- **Network Meta-Analysis** - Comparing multiple interventions
- **Bayesian Meta-Analysis** - Prior specification, posterior interpretation
- **Individual Patient Data (IPD)** - Working with raw patient data
- **Diagnostic Test Accuracy** - Sensitivity, specificity, ROC curves
- **Dose-Response Meta-Analysis** - Modeling dose-effect relationships

### 2. Improve Existing Skills

- Add more examples and edge cases
- Improve Socratic questions
- Fix errors or unclear explanations
- Add references to current literature

### 3. Translate Skills

Help make meta-analysis education accessible worldwide:

- Spanish, Portuguese, French, German
- Chinese, Japanese, Korean
- Arabic, Hindi, Swahili
- Any language!

### 4. Report Issues

Found an error? Have a suggestion? Open an issue!

## Skill Format

All skills must follow the [AgentSkills specification](https://agentskills.org/specification).

### Required Structure

```
skill-name/
├── SKILL.md          # Required: Main skill file
├── references/       # Optional: Supporting documentation
├── scripts/          # Optional: Executable code
└── assets/           # Optional: Images, data files
```

### SKILL.md Template

```markdown
---
name: skill-name-in-kebab-case
description: Clear description of what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
license: Apache-2.0
compatibility: Any specific requirements (R version, packages, etc.)
metadata:
  author: your-name-or-org
  version: "1.0.0"
  category: statistics|visualization|pedagogy|etc
  domain: evidence-synthesis
  difficulty: beginner|intermediate|advanced
  estimated-time: "X minutes"
  prerequisites: comma-separated-skill-names
---

# Skill Title

## Overview
Brief description of the skill.

## When to Use This Skill
List of triggers that should activate this skill.

## Core Content
Main teaching material with:
- Clear explanations
- Socratic questions
- Code examples (if applicable)
- Common misconceptions

## Assessment Questions
Questions to verify understanding.

## Related Skills
Links to related skills.
```

## Code Style

### R Code

- Use `metafor` package for meta-analysis
- Include comments explaining each step
- Provide both basic and advanced examples
- Test all code before submitting

### Markdown

- Use ATX-style headers (`#`, `##`, `###`)
- Use fenced code blocks with language specification
- Keep lines under 100 characters when possible
- Use tables for structured information

## Submission Process

1. **Fork** the repository
2. **Create a branch** for your changes
3. **Make your changes** following the guidelines above
4. **Validate** your skill:
   ```bash
   skills-ref validate ./your-skill
   ```
5. **Submit a pull request** with:
   - Clear description of changes
   - Any relevant issue numbers
   - Screenshots if adding visualizations

## Review Criteria

Pull requests are reviewed for:

- [ ] Follows AgentSkills specification
- [ ] Accurate statistical/methodological content
- [ ] Clear, accessible explanations
- [ ] Includes Socratic teaching elements
- [ ] Code is tested and works
- [ ] No broken links or references

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Assume good intentions
- Help newcomers learn

## Questions?

Open an issue or reach out to the maintainers. We're happy to help!

---

**Thank you for helping democratize meta-analysis education!**
