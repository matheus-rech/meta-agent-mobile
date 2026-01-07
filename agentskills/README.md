# Meta-Analysis Agent Skills

> Open-source skills for teaching meta-analysis to AI agents and humans alike.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![AgentSkills](https://img.shields.io/badge/AgentSkills-Compatible-green.svg)](https://agentskills.org)

## Mission

**Democratizing meta-analysis education.** These skills enable any AI agent to teach evidence synthesis methodology, making advanced statistical training accessible to researchers, students, and clinicians worldwide—regardless of their resources or location.

## Available Skills

| Skill | Difficulty | Description |
|-------|------------|-------------|
| [meta-analysis-fundamentals](./meta-analysis-fundamentals/) | Beginner | Core concepts: effect sizes, pooling, fixed vs random effects |
| [forest-plot-creation](./forest-plot-creation/) | Intermediate | Generate and interpret forest plots with R/metafor |
| [heterogeneity-analysis](./heterogeneity-analysis/) | Intermediate | Assess I², tau², Q statistic, prediction intervals |
| [publication-bias-detection](./publication-bias-detection/) | Intermediate | Funnel plots, Egger's test, trim-and-fill |
| [data-extraction](./data-extraction/) | Intermediate | Calculate effect sizes from various data formats |
| [grade-assessment](./grade-assessment/) | Advanced | Apply GRADE framework for certainty of evidence |
| [r-code-generation](./r-code-generation/) | Intermediate | Generate production-ready R code for meta-analysis |
| [socratic-teaching](./socratic-teaching/) | Beginner | Pedagogical approach for teaching meta-analysis |

## Quick Start

### For AI Agent Developers

1. Clone this repository:
```bash
git clone https://github.com/meta-agent/agentskills.git
cd agentskills
```

2. Validate skills:
```bash
pip install skills-ref
skills-ref validate ./meta-analysis-fundamentals
```

3. Generate prompt XML:
```bash
skills-ref to-prompt ./meta-analysis-fundamentals ./forest-plot-creation
```

4. Add to your agent's system prompt:
```xml
<available_skills>
<skill>
<name>meta-analysis-fundamentals</name>
<description>Teach foundational concepts of meta-analysis...</description>
<location>/path/to/meta-analysis-fundamentals/SKILL.md</location>
</skill>
</available_skills>
```

### For Learners

These skills are designed to be used with AI assistants like Claude, ChatGPT, or any AgentSkills-compatible agent. Simply:

1. Tell your AI assistant about these skills
2. Ask it to teach you meta-analysis
3. Learn through Socratic dialogue and hands-on R code

## Skill Dependencies

```
meta-analysis-fundamentals (no prerequisites)
    │
    ├── forest-plot-creation
    │       └── r-code-generation
    │
    ├── heterogeneity-analysis
    │
    ├── publication-bias-detection
    │
    ├── data-extraction
    │       └── r-code-generation
    │
    └── grade-assessment
            └── heterogeneity-analysis

socratic-teaching (standalone, enhances all skills)
```

## Learning Path

### Path 1: Quick Start (2 hours)
1. meta-analysis-fundamentals (15 min)
2. forest-plot-creation (10 min)
3. r-code-generation (15 min)
4. Practice with sample data

### Path 2: Comprehensive (6 hours)
1. meta-analysis-fundamentals (15 min)
2. data-extraction (15 min)
3. forest-plot-creation (10 min)
4. heterogeneity-analysis (12 min)
5. publication-bias-detection (12 min)
6. grade-assessment (20 min)
7. r-code-generation (15 min)
8. Complete a practice meta-analysis

### Path 3: Teaching Focus
1. socratic-teaching (varies)
2. All content skills as needed

## Requirements

- **For R code execution:** R 4.0+ with `metafor` package
- **For WebR (browser):** No installation needed
- **For validation:** Python 3.8+ with `skills-ref` package

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- **Add new skills:** Network meta-analysis, Bayesian methods, etc.
- **Improve existing skills:** Better examples, clearer explanations
- **Translate skills:** Make meta-analysis education accessible in more languages
- **Report issues:** Found an error? Let us know!

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## Citation

If you use these skills in your research or teaching, please cite:

```bibtex
@software{meta_agent_skills,
  title = {Meta-Analysis Agent Skills},
  author = {Meta Agent Team},
  year = {2025},
  url = {https://github.com/meta-agent/agentskills}
}
```

## Acknowledgments

- [Cochrane Handbook](https://training.cochrane.org/handbook) for methodology standards
- [metafor package](https://www.metafor-project.org/) for R implementation
- [AgentSkills](https://agentskills.org) for the skill format specification
- All contributors and learners who help improve these materials

---

**Made with ❤️ for open science education**
