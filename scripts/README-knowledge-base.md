# Meta Agent Knowledge Base Setup

This script uploads meta-analysis knowledge content to Gemini File Search stores for RAG-grounded responses.

## Prerequisites

1. **Gemini API Key** with File Search access
2. Node.js 18+ with tsx installed

## Usage

### Setup All Stores

```bash
GEMINI_API_KEY=your-key npx tsx scripts/setup-knowledge-base.ts
```

### Setup Specific Store

```bash
# Cochrane Handbook content
npx tsx scripts/setup-knowledge-base.ts --store cochrane

# Seminal papers (DerSimonian-Laird, Higgins I², Egger, PRISMA)
npx tsx scripts/setup-knowledge-base.ts --store seminal-papers

# R package documentation (metafor, meta)
npx tsx scripts/setup-knowledge-base.ts --store r-docs
```

### List Existing Stores

```bash
npx tsx scripts/setup-knowledge-base.ts --list
```

### Delete a Store

```bash
npx tsx scripts/setup-knowledge-base.ts --delete cochrane
```

## Knowledge Base Content

### Cochrane Handbook (`meta-agent-cochrane-handbook`)

- **Chapter 6:** Choosing Effect Measures (OR, RR, RD, MD, SMD)
- **Chapter 8:** Risk of Bias Assessment (RoB 2, ROBINS-I)
- **Chapter 10:** Meta-analysis Methods (Fixed/Random effects, I², subgroups)
- **Chapter 13:** Publication Bias (Funnel plots, Egger's test, Trim-and-fill)

### Seminal Papers (`meta-agent-seminal-papers`)

- **DerSimonian & Laird 1986:** Random-effects meta-analysis method
- **Higgins & Thompson 2002:** I² statistic for heterogeneity
- **Egger et al 1997:** Publication bias detection test
- **PRISMA 2020:** Reporting guidelines for systematic reviews

### R Documentation (`meta-agent-r-documentation`)

- **metafor package:** Complete reference for escalc(), rma(), forest(), funnel()
- **meta package:** Quick reference for metabin(), metacont(), metagen()

## How It Works

1. Creates Gemini File Search stores (globally scoped)
2. Uploads markdown documents with educational content
3. Adds metadata for filtering (source, topic, year, authors)
4. Indexes content for semantic search

## Pricing

- **Indexing:** $0.15 per 1M tokens (embedding generation)
- **Storage:** Free
- **Query embeddings:** Free
- **Retrieved tokens:** Normal Gemini input token pricing

## Adding Your Own Content

To add custom documents to the knowledge base:

1. Place PDF or markdown files in a folder
2. Modify the script to include your files
3. Add appropriate metadata for filtering

Example for adding a custom paper:

```typescript
{
  title: 'My Custom Paper',
  filename: 'custom-paper.md',
  content: fs.readFileSync('path/to/paper.md', 'utf-8'),
  metadata: [
    { key: 'source', string_value: 'Custom' },
    { key: 'topic', string_value: 'my-topic' },
  ],
}
```

## Querying the Knowledge Base

Once set up, use the `GeminiFileSearchService` in the app:

```typescript
import { geminiFileSearch } from '@/lib/rag';

// Search for relevant content
const results = await geminiFileSearch.semanticSearch(
  'How do I interpret I-squared?',
  ['meta-agent-cochrane-handbook', 'meta-agent-seminal-papers']
);

// Teach with Socratic method using RAG
const response = await geminiFileSearch.teachWithSocraticMethod(
  'What is heterogeneity?',
  'intermediate'
);
```

## Troubleshooting

### "API Error 403: Permission denied"
- Ensure your API key has File Search access enabled
- Check your Gemini API tier (Free tier has 1GB limit)

### "Operation failed: File too large"
- Maximum file size is 100MB per document
- Split large documents into smaller chunks

### "Store not found"
- Store names are globally scoped
- Use `--list` to see existing stores
- Stores may take a few seconds to become available after creation
