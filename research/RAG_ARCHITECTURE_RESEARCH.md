# RAG Architecture Research for Meta Agent Mobile

## Recommended Solution: react-native-rag

**Library:** `react-native-rag` by Software Mansion Labs
**Version:** 0.2.0 (Latest)
**License:** MIT
**GitHub:** https://github.com/software-mansion-labs/react-native-rag

### Key Features
- **Modular Architecture:** LLM, Embeddings, VectorStore, TextSplitter components
- **On-device Inference:** Uses ExecuTorch for private model execution
- **Vector Store Persistence:** SQLite via @react-native-rag/op-sqlite
- **Semantic Search Ready:** Direct VectorStore and Embeddings access

### Recommended Stack
1. **Embeddings Model:** ALL_MINILM_L6_V2 (384 dimensions, ~22MB)
2. **Vector Store:** SQLiteVectorStore via @react-native-rag/op-sqlite
3. **LLM:** ExecuTorchLLM with Llama 3.2 1B QLoRA

### Installation
```bash
npm install react-native-rag
npm install @react-native-rag/executorch react-native-executorch
npm install @react-native-rag/op-sqlite
```

### Integration Pattern for Meta Agent

```typescript
// 1. Create embeddings model
const embeddings = new ExecuTorchEmbeddings({
  modelSource: ALL_MINILM_L6_V2,
  tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
});

// 2. Create persistent vector store
const vectorStore = new SQLiteVectorStore({ embeddings });

// 3. Add knowledge base documents
await vectorStore.addDocuments([
  { content: "Cochrane Handbook Chapter 10...", metadata: { source: "cochrane" } },
  { content: "DerSimonian & Laird 1986...", metadata: { source: "seminal" } },
]);

// 4. Query with semantic search
const results = await vectorStore.similaritySearch(query, 5);
```

## Knowledge Base Content Plan

### 1. Cochrane Handbook (Key Chapters)
- Chapter 6: Choosing effect measures
- Chapter 9: Summarizing study characteristics
- Chapter 10: Analysing data and undertaking meta-analyses
- Chapter 11: Undertaking network meta-analyses
- Chapter 12: Addressing reporting biases

### 2. Seminal Papers
- DerSimonian & Laird (1986) - Random effects model
- Higgins & Thompson (2002) - I² statistic
- Egger et al. (1997) - Publication bias detection
- Cochrane (1972) - Evidence-based medicine origins
- Bradford Hill (1965) - Causation criteria
- PRISMA 2020 Statement

### 3. R Package Documentation
- metafor: Core meta-analysis functions
- meta: Alternative meta-analysis package
- dmetar: Companion to "Doing Meta-Analysis in R"
- robvis: Risk of bias visualization
- netmeta: Network meta-analysis

### 4. Common R Errors Database
- Package not installed errors
- Data format issues (missing columns, wrong types)
- NA handling problems
- Effect size calculation errors
- Plot generation failures

## Socratic Teaching Patterns

### Question Types
1. **Clarifying Questions:** "What type of outcome are you measuring?"
2. **Probing Assumptions:** "Why did you choose a random-effects model?"
3. **Exploring Implications:** "What would high heterogeneity mean for your conclusions?"
4. **Checking Understanding:** "Can you explain what I² represents?"

### Teaching Flow
1. Ask about the research question
2. Guide effect measure selection
3. Discuss model choice (fixed vs random)
4. Interpret results together
5. Explore sensitivity analyses
6. Address limitations

## R Debugging Patterns

### Common Error Categories
1. **Package Errors:** "Error in library(metafor): there is no package called 'metafor'"
2. **Data Errors:** "Error: argument 'yi' must be a numeric vector"
3. **Model Errors:** "Error in rma(): Number of parameters to be estimated is larger than the number of observations"
4. **Plot Errors:** "Error in forest(): object 'res' not found"

### Debugging Strategy
1. Identify error type from message
2. Explain what went wrong (teaching moment)
3. Show corrected code with explanation
4. Suggest preventive practices


## Gemini File Search - Cloud RAG Solution (Recommended)

**Source:** https://ai.google.dev/gemini-api/docs/file-search

### Key Advantages Over On-Device RAG
1. **No local storage needed** - Embeddings stored in Google's cloud
2. **Free storage** - Only pay for initial embedding creation ($0.15/1M tokens)
3. **Free query-time embeddings** - No cost for semantic search
4. **Built-in citations** - Automatic source attribution
5. **Supports all file types** - PDF, DOCX, TXT, JSON, code files
6. **Works across all devices** - Same knowledge base for all users

### Pricing Model
- **Indexing:** $0.15 per 1M tokens (one-time)
- **Storage:** FREE
- **Query embeddings:** FREE
- **Retrieved tokens:** Standard Gemini input pricing

### Implementation for Meta Agent

```python
from google import genai
from google.genai import types

client = genai.Client()

# Create knowledge base store (one-time setup)
meta_analysis_store = client.file_search_stores.create(
    config={'display_name': 'meta-analysis-knowledge-base'}
)

# Upload Cochrane Handbook chapters
client.file_search_stores.upload_to_file_search_store(
    file='cochrane_chapter_10.pdf',
    file_search_store_name=meta_analysis_store.name,
    config={
        'display_name': 'Cochrane Handbook Ch10 - Meta-Analysis',
    }
)

# Query with File Search
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="How do I calculate I² heterogeneity?",
    config=types.GenerateContentConfig(
        tools=[
            types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[meta_analysis_store.name]
                )
            )
        ]
    )
)

# Access citations
print(response.candidates[0].grounding_metadata)
```

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Meta Agent Mobile                        │
├─────────────────────────────────────────────────────────────┤
│  User Query                                                 │
│      ↓                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Skill Matching (AgentSkills)                       │   │
│  │  - Identify relevant skills                         │   │
│  │  - Build context-aware prompt                       │   │
│  └─────────────────────────────────────────────────────┘   │
│      ↓                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Gemini File Search (Cloud RAG)                     │   │
│  │  - Cochrane Handbook store                          │   │
│  │  - Seminal Papers store                             │   │
│  │  - R Documentation store                            │   │
│  │  - R Error Patterns store                           │   │
│  └─────────────────────────────────────────────────────┘   │
│      ↓                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LLM Generation (with retrieved context)            │   │
│  │  - BYOK providers (OpenAI, Anthropic, etc.)         │   │
│  │  - Or Gemini with File Search built-in              │   │
│  └─────────────────────────────────────────────────────┘   │
│      ↓                                                      │
│  Response with Citations                                    │
└─────────────────────────────────────────────────────────────┘
```

### File Search Stores to Create

1. **cochrane-handbook** - Key chapters on meta-analysis methodology
2. **seminal-papers** - DerSimonian & Laird, Higgins I², Egger bias, etc.
3. **r-metafor-docs** - metafor package documentation and examples
4. **r-error-patterns** - Common R errors and solutions
5. **teaching-resources** - Socratic questions and explanations

### Metadata Filtering

Can filter by source type for targeted retrieval:
```python
metadata_filter="source=cochrane AND chapter=10"
```

### Supported Models
- gemini-2.5-flash (recommended for speed/cost)
- gemini-2.5-pro (for complex queries)
- gemini-3-flash-preview (supports structured output)

### Hybrid Approach: Cloud + Local

For offline capability:
1. **Online:** Use Gemini File Search for full knowledge base
2. **Offline:** Fall back to bundled skill definitions + on-device SLM
3. **Sync:** Cache frequently accessed knowledge locally
