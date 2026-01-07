/**
 * RAG (Retrieval Augmented Generation) Module
 * 
 * Provides knowledge base retrieval for grounding LLM responses
 * with Cochrane Handbook, seminal papers, and R documentation.
 */

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
