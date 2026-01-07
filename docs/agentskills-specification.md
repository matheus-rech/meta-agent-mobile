# AgentSkills Specification

> Source: https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx

## Directory Structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
└── SKILL.md          # Required
```

Optional directories:
- `scripts/` - Executable code agents can run
- `references/` - Additional documentation
- `assets/` - Static resources (templates, images, data files)

## SKILL.md Format

The `SKILL.md` file must contain YAML frontmatter followed by Markdown content.

### Frontmatter (Required)

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

With optional fields:

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
license: Apache-2.0
compatibility: Requires Python 3.11+
metadata:
  author: example-org
  version: "1.0"
  category: data-processing
allowed-tools: Bash(git:*) Read
---
```

### Field Specifications

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | Max 64 chars. Lowercase letters, numbers, hyphens only. Must not start/end with hyphen. |
| `description` | Yes | Max 1024 chars. Describes what skill does and when to use it. |
| `license` | No | License name or reference to bundled license file. |
| `compatibility` | No | Max 500 chars. Environment requirements. |
| `metadata` | No | Arbitrary key-value mapping for additional metadata. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools. (Experimental) |

### Name Field Rules

- Must be 1-64 characters
- Only lowercase alphanumeric and hyphens (`a-z`, `0-9`, `-`)
- Must not start or end with `-`
- Must not contain consecutive hyphens (`--`)
- Must match parent directory name

**Valid:**
```yaml
name: pdf-processing
name: data-analysis
name: code-review
```

**Invalid:**
```yaml
name: PDF-Processing  # uppercase not allowed
name: -pdf            # cannot start with hyphen
name: pdf--processing # consecutive hyphens not allowed
```

### Description Field Guidelines

- Must be 1-1024 characters
- Should describe both what the skill does AND when to use it
- Include specific keywords that help agents identify relevant tasks

**Good:**
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Poor:**
```yaml
description: Helps with PDFs.
```

## Body Content

The Markdown body after frontmatter contains skill instructions. No format restrictions.

**Recommended sections:**
- Step-by-step instructions
- Examples of inputs and outputs
- Common edge cases

## Progressive Disclosure

Skills should be structured for efficient context use:

1. **Metadata** (~100 tokens): `name` and `description` loaded at startup for all skills
2. **Instructions** (< 5000 tokens recommended): Full `SKILL.md` body loaded when skill activated
3. **Resources** (as needed): Files in `scripts/`, `references/`, `assets/` loaded only when required

**Best practice:** Keep main `SKILL.md` under 500 lines. Move detailed reference material to separate files.

## File References

Use relative paths from skill root:

```md
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py
```

Keep file references one level deep from `SKILL.md`.

## Validation

```shell
skills-ref validate ./my-skill
```
