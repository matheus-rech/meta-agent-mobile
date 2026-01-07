# Glass RAG Architecture

## Overview

Glass uses **Gemini File Search** for Retrieval Augmented Generation (RAG) to provide accurate, evidence-based answers grounded in authoritative meta-analysis literature.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Glass 🦊                                │
│                  (Teaching Agent)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Query: "How do I assess heterogeneity?"               │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Gemini File Search                      │   │
│  │                                                      │   │
│  │  1. Query → Embedding (gemini-embedding-001)        │   │
│  │  2. Semantic search in FileSearchStore              │   │
│  │  3. Retrieve relevant chunks with citations         │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Knowledge Base (FileSearchStore)           │   │
│  │                                                      │   │
│  │  📚 Cochrane Handbook chapters                      │   │
│  │  📄 Seminal articles (Glass 1976, DerSimonian...)   │   │
│  │  📋 PRISMA, GRADE, QUADAS guidelines                │   │
│  │  📖 metafor package documentation                   │   │
│  │  🎓 Tutorial examples and exercises                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Response Generation                     │   │
│  │                                                      │   │
│  │  Context: Retrieved chunks + AgentSkills            │   │
│  │  Model: gemini-2.5-flash                            │   │
│  │  Output: Answer with citations + Socratic questions │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Knowledge Base Content

### 1. Core References (Must Have)

| Source | Content | Priority |
|--------|---------|----------|
| **Cochrane Handbook** | Chapters 6, 9, 10, 11, 12, 13, 23 | Critical |
| **Glass 1976** | Original meta-analysis paper | Critical |
| **DerSimonian & Laird 1986** | Random effects method | Critical |
| **Higgins & Thompson 2002** | I² statistic | Critical |
| **PRISMA 2020** | Reporting guidelines | High |
| **GRADE Handbook** | Evidence quality assessment | High |

### 2. Statistical Methods

| Topic | Key References |
|-------|---------------|
| Effect sizes | Hedges 1981, Cohen 1988 |
| Heterogeneity | Higgins 2003, Rücker 2008 |
| Publication bias | Egger 1997, Duval & Tweedie 2000 |
| Network MA | Salanti 2012, Rücker & Schwarzer 2015 |
| Bayesian MA | Sutton & Abrams 2001, Röver 2020 |
| IPD MA | Riley 2010, Stewart & Tierney |
| TSA | Wetterslev 2008, Thorlund 2011 |
| Diagnostic MA | Reitsma 2005, Macaskill 2010 |

### 3. Software Documentation

| Package | Documentation |
|---------|--------------|
| **metafor** | Full vignette + function reference |
| **meta** | Package documentation |
| **netmeta** | Network MA vignette |
| **mada** | Diagnostic MA vignette |
| **bayesmeta** | Bayesian MA guide |

### 4. Teaching Materials

- Tutorial examples from our AgentSkills
- Practice datasets with solutions
- Common mistakes and how to avoid them
- R code templates

## Implementation

### FileSearchStore Structure

```
glass-knowledge-base/
├── cochrane-handbook/
│   ├── chapter-06-effect-sizes.pdf
│   ├── chapter-09-heterogeneity.pdf
│   ├── chapter-10-publication-bias.pdf
│   ├── chapter-11-network-ma.pdf
│   ├── chapter-12-ipd-ma.pdf
│   └── chapter-13-diagnostic-ma.pdf
├── seminal-articles/
│   ├── glass-1976-meta-analysis.pdf
│   ├── dersimonian-laird-1986.pdf
│   ├── higgins-thompson-2002-i2.pdf
│   └── egger-1997-funnel-asymmetry.pdf
├── guidelines/
│   ├── prisma-2020.pdf
│   ├── grade-handbook.pdf
│   ├── quadas-2.pdf
│   └── prisma-nma.pdf
├── software-docs/
│   ├── metafor-vignette.pdf
│   ├── netmeta-guide.pdf
│   └── mada-diagnostic.pdf
└── teaching/
    ├── agentskills-content.md
    ├── practice-datasets.md
    └── common-mistakes.md
```

### Chunking Configuration

```python
chunking_config = {
    'white_space_config': {
        'max_tokens_per_chunk': 500,  # Optimal for technical content
        'max_overlap_tokens': 50      # Context preservation
    }
}
```

### Query Integration

```python
from google import genai
from google.genai import types

client = genai.Client()

def query_glass_knowledge(question: str, language: str = "en") -> str:
    """Query Glass knowledge base with RAG."""
    
    # System prompt with Glass personality
    system_prompt = f"""You are Glass 🦊, a wise fox teaching assistant specialized in meta-analysis.
    
    Language: Respond in {language}
    Style: Use Socratic method, ask guiding questions
    Citations: Always cite sources from the retrieved context
    Technical terms: Keep standard English terms but explain in user's language
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=question,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=[
                types.Tool(
                    file_search=types.FileSearch(
                        file_search_store_names=["glass-meta-analysis-kb"]
                    )
                )
            ]
        )
    )
    
    return response.text
```

## Cost Optimization

| Operation | Cost | Notes |
|-----------|------|-------|
| File storage | **Free** | No storage fees |
| Embedding at query | **Free** | No query-time embedding fees |
| Initial indexing | Embedding cost | One-time per file |
| Generation | Token cost | Normal Gemini pricing |

**Estimated Monthly Cost:**
- Knowledge base: ~50 documents × $0.001 = $0.05 (one-time)
- Queries: ~1000 queries × $0.01 = $10/month
- **Total: ~$10/month** for full RAG capability

## Next Steps

1. [ ] Collect and prepare knowledge base documents
2. [ ] Create FileSearchStore "glass-meta-analysis-kb"
3. [ ] Upload and index all documents
4. [ ] Integrate with Glass agent service
5. [ ] Test retrieval accuracy
6. [ ] Add citation formatting

## References

- [Gemini File Search Documentation](https://ai.google.dev/gemini-api/docs/file-search)
- [Gemini Embeddings Guide](https://ai.google.dev/gemini-api/docs/embeddings)
