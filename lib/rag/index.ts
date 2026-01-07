/**
 * RAG (Retrieval Augmented Generation) Module
 * 
 * Provides knowledge base retrieval for grounding LLM responses
 * with Cochrane Handbook, seminal papers, and R documentation.
 * 
 * Supports two approaches:
 * 1. Gemini File Search (cloud) - managed RAG with automatic chunking
 * 2. Local Vector Store (offline) - pre-generated embeddings for offline use
 */

// Cloud-based RAG using Gemini File Search
export {
  GeminiFileSearchService,
  getFileSearchService,
  FILE_SEARCH_STORES,
  KNOWLEDGE_BASE_CONTENT,
  type FileSearchStoreType,
  type FileSearchResult,
  type FileSearchConfig,
  type GroundedResponse,
} from './gemini-file-search';

// Local vector store for offline RAG
export {
  LocalVectorStore,
  HybridRAGService,
  hybridRAG,
  loadBundledKnowledgeBase,
  type EmbeddingChunk,
  type VectorStore,
  type SearchResult,
  type SearchOptions,
  type HybridRAGConfig,
} from './local-vector-store';
