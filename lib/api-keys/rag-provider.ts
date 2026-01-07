/**
 * RAG-Enhanced Provider
 * 
 * Automatically injects relevant knowledge base content into LLM prompts.
 * Uses semantic search to find relevant context for user queries.
 */

import { 
  ChatMessage, 
  GenerateOptions, 
  GenerateResult,
  StreamChunk
} from './providers';
import { generateWithSkills, generateStreamWithSkills } from './skill-provider';
import { LLMProvider } from './api-key-manager';
import { HybridRAGService, SearchResult, loadBundledKnowledgeBase } from '../rag';

// Singleton RAG service
let ragService: HybridRAGService | null = null;

/**
 * Initialize the RAG service (call once at app startup)
 */
export async function initializeRAG(): Promise<void> {
  if (!ragService) {
    ragService = new HybridRAGService();
    // Load bundled knowledge base
    await loadBundledKnowledgeBase();
  }
}

/**
 * Initialize RAG with custom store data
 */
export async function initializeRAGWithStore(storeData: import('../rag').VectorStore): Promise<void> {
  if (!ragService) {
    ragService = new HybridRAGService();
  }
  await ragService.initializeLocal(storeData);
}

/**
 * Get the RAG service instance
 */
export function getRAGService(): HybridRAGService | null {
  return ragService;
}
/**
 * Format search results as context for the LLM
 */
function formatKnowledgeContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return '';
  }
  
  const contextParts = results.map((result, i) => {
    const source = result.chunk.metadata.source || 'Unknown';
    const title = result.chunk.metadata.title || '';
    const score = (result.score * 100).toFixed(0);
    
    return `[Source ${i + 1}: ${source}${title ? ` - ${title}` : ''} (relevance: ${score}%)]\n${result.chunk.text}`;
  });
  
  return `
<knowledge_context>
The following information from authoritative sources is relevant to the user's question:

${contextParts.join('\n\n---\n\n')}
</knowledge_context>

Use this knowledge to inform your response. Cite sources when appropriate (e.g., "According to the Cochrane Handbook...").
`;
}

/**
 * Build RAG-enhanced system prompt
 */
async function buildRAGEnhancedPrompt(
  basePrompt: string,
  userQuery: string,
  maxResults: number = 3
): Promise<string> {
  if (!ragService) {
    return basePrompt;
  }
  
  try {
    // Search for relevant knowledge
    const results = await ragService.search(userQuery, { topK: maxResults });
    
    if (results.length === 0) {
      return basePrompt;
    }
    
    // Add knowledge context to prompt
    const knowledgeContext = formatKnowledgeContext(results);
    
    return `${basePrompt}

${knowledgeContext}`;
  } catch (error) {
    console.warn('RAG search failed, using base prompt:', error);
    return basePrompt;
  }
}

/**
 * Generate with RAG-enhanced context and skills
 */
export async function generateWithRAG(
  messages: ChatMessage[],
  options: GenerateOptions = {},
  preferredProvider?: LLMProvider
): Promise<GenerateResult> {
  // Get user's query from the last user message
  const userQuery = messages
    .filter(m => m.role === 'user')
    .slice(-1)[0]?.content || '';
  
  // Build RAG-enhanced system prompt
  const ragEnhancedPrompt = await buildRAGEnhancedPrompt(
    options.systemPrompt || '',
    userQuery
  );
  
  // Call skill-aware provider with RAG context
  return generateWithSkills(
    messages,
    { ...options, systemPrompt: ragEnhancedPrompt },
    preferredProvider
  );
}

/**
 * Generate with streaming, RAG context, and skills
 */
export async function generateStreamWithRAG(
  messages: ChatMessage[],
  options: GenerateOptions,
  onChunk: (chunk: StreamChunk) => void,
  preferredProvider?: LLMProvider
): Promise<GenerateResult> {
  // Get user's query from the last user message
  const userQuery = messages
    .filter(m => m.role === 'user')
    .slice(-1)[0]?.content || '';
  
  // Build RAG-enhanced system prompt
  const ragEnhancedPrompt = await buildRAGEnhancedPrompt(
    options.systemPrompt || '',
    userQuery
  );
  
  // Call skill-aware streaming provider with RAG context
  return generateStreamWithSkills(
    messages,
    { ...options, systemPrompt: ragEnhancedPrompt },
    onChunk,
    preferredProvider
  );
}

/**
 * Search knowledge base and return formatted results
 */
export async function searchKnowledge(
  query: string,
  maxResults: number = 5
): Promise<SearchResult[]> {
  if (!ragService) {
    await initializeRAG();
  }
  
  if (!ragService) {
    return [];
  }
  
  return ragService.search(query, { topK: maxResults });
}

/**
 * Get knowledge context for a query (for debugging/display)
 */
export async function getKnowledgeContext(
  query: string,
  maxResults: number = 3
): Promise<string> {
  if (!ragService) {
    await initializeRAG();
  }
  
  if (!ragService) {
    return '';
  }
  
  return ragService.getContext(query, { topK: maxResults });
}

/**
 * Check if RAG is initialized and ready
 */
export function isRAGReady(): boolean {
  if (!ragService) {
    return false;
  }
  return ragService.hasLocalCapability || ragService.hasOnlineCapability;
}

/**
 * Get RAG statistics
 */
export function getRAGStats(): {
  initialized: boolean;
  hasOnline: boolean;
  hasLocal: boolean;
  stats: ReturnType<HybridRAGService['getStats']> | null;
} {
  if (!ragService) {
    return {
      initialized: false,
      hasOnline: false,
      hasLocal: false,
      stats: null,
    };
  }
  
  const stats = ragService.getStats();
  return {
    initialized: true,
    hasOnline: stats.hasOnline,
    hasLocal: stats.hasLocal,
    stats,
  };
}
