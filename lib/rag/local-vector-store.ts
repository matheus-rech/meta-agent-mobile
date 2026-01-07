/**
 * Local Vector Store for Offline Semantic Search
 * 
 * Provides offline RAG capabilities using pre-generated embeddings.
 * Uses cosine similarity for semantic search without network access.
 * 
 * @see scripts/generate-embeddings.ts for embedding generation
 */

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    category: string;
    title: string;
    section?: string;
    keywords?: string[];
  };
}

export interface VectorStore {
  version: string;
  model: string;
  dimensions: number;
  created: string;
  chunks: EmbeddingChunk[];
  stats: {
    totalChunks: number;
    totalTokens: number;
    categories: Record<string, number>;
  };
}

export interface SearchResult {
  chunk: EmbeddingChunk;
  score: number;
  rank: number;
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
  categories?: string[];
  keywords?: string[];
}

// ============================================================================
// Vector Math Utilities
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Normalize a vector to unit length
 */
function normalizeVector(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  if (norm === 0) return v;
  return v.map(x => x / norm);
}

// ============================================================================
// Local Vector Store Service
// ============================================================================

export class LocalVectorStore {
  private store: VectorStore | null = null;
  private isLoaded = false;

  /**
   * Load vector store from bundled JSON
   */
  async load(storeData: VectorStore): Promise<void> {
    this.store = storeData;
    this.isLoaded = true;
  }

  /**
   * Check if store is loaded
   */
  get loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get store statistics
   */
  getStats(): VectorStore['stats'] | null {
    return this.store?.stats ?? null;
  }

  /**
   * Search for similar chunks using a query embedding
   */
  searchByEmbedding(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): SearchResult[] {
    if (!this.store) {
      throw new Error('Vector store not loaded');
    }

    const {
      topK = 5,
      minScore = 0.5,
      categories,
      keywords,
    } = options;

    // Normalize query embedding
    const normalizedQuery = normalizeVector(queryEmbedding);

    // Calculate similarities
    let results: SearchResult[] = this.store.chunks
      .filter(chunk => {
        // Filter by category if specified
        if (categories && categories.length > 0) {
          if (!categories.includes(chunk.metadata.category)) {
            return false;
          }
        }
        
        // Filter by keywords if specified
        if (keywords && keywords.length > 0) {
          const chunkKeywords = chunk.metadata.keywords || [];
          const hasKeyword = keywords.some(kw => 
            chunkKeywords.some(ck => ck.toLowerCase().includes(kw.toLowerCase()))
          );
          if (!hasKeyword) {
            return false;
          }
        }
        
        return true;
      })
      .map(chunk => ({
        chunk,
        score: cosineSimilarity(normalizedQuery, chunk.embedding),
        rank: 0,
      }))
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // Assign ranks
    results = results.map((r, i) => ({ ...r, rank: i + 1 }));

    return results;
  }

  /**
   * Search using text (requires external embedding generation)
   * This is a fallback that uses keyword matching when embeddings unavailable
   */
  searchByKeywords(
    query: string,
    options: SearchOptions = {}
  ): SearchResult[] {
    if (!this.store) {
      throw new Error('Vector store not loaded');
    }

    const {
      topK = 5,
      minScore = 0.3,
      categories,
    } = options;

    // Extract query terms
    const queryTerms = query.toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);

    // Score chunks by keyword overlap
    let results: SearchResult[] = this.store.chunks
      .filter(chunk => {
        if (categories && categories.length > 0) {
          if (!categories.includes(chunk.metadata.category)) {
            return false;
          }
        }
        return true;
      })
      .map(chunk => {
        const text = chunk.text.toLowerCase();
        const keywords = chunk.metadata.keywords || [];
        
        // Calculate keyword match score
        let matchCount = 0;
        for (const term of queryTerms) {
          if (text.includes(term)) {
            matchCount++;
          }
          if (keywords.some(kw => kw.toLowerCase().includes(term))) {
            matchCount += 0.5; // Bonus for keyword match
          }
        }
        
        const score = queryTerms.length > 0 
          ? matchCount / queryTerms.length 
          : 0;

        return {
          chunk,
          score,
          rank: 0,
        };
      })
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // Assign ranks
    results = results.map((r, i) => ({ ...r, rank: i + 1 }));

    return results;
  }

  /**
   * Get chunks by category
   */
  getByCategory(category: string): EmbeddingChunk[] {
    if (!this.store) {
      return [];
    }
    return this.store.chunks.filter(c => c.metadata.category === category);
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    if (!this.store) {
      return [];
    }
    return Object.keys(this.store.stats.categories);
  }

  /**
   * Format search results as context for LLM
   */
  formatAsContext(results: SearchResult[], maxTokens: number = 2000): string {
    if (results.length === 0) {
      return '';
    }

    const sections: string[] = [];
    let tokenCount = 0;
    const tokensPerChar = 0.25; // Rough estimate

    for (const result of results) {
      const section = `
## ${result.chunk.metadata.title}
**Source:** ${result.chunk.metadata.source}
**Relevance:** ${(result.score * 100).toFixed(0)}%

${result.chunk.text}
`.trim();

      const sectionTokens = Math.ceil(section.length * tokensPerChar);
      
      if (tokenCount + sectionTokens > maxTokens) {
        break;
      }
      
      sections.push(section);
      tokenCount += sectionTokens;
    }

    return sections.join('\n\n---\n\n');
  }
}

// ============================================================================
// Hybrid RAG Service
// ============================================================================

export interface HybridRAGConfig {
  preferOnline: boolean;
  fallbackToKeywords: boolean;
  maxResults: number;
}

export class HybridRAGService {
  private localStore: LocalVectorStore;
  private config: HybridRAGConfig;
  private geminiApiKey: string | null = null;

  constructor(config: Partial<HybridRAGConfig> = {}) {
    this.localStore = new LocalVectorStore();
    this.config = {
      preferOnline: true,
      fallbackToKeywords: true,
      maxResults: 5,
      ...config,
    };
  }

  /**
   * Initialize with local vector store data
   */
  async initializeLocal(storeData: VectorStore): Promise<void> {
    await this.localStore.load(storeData);
  }

  /**
   * Set Gemini API key for online embeddings
   */
  setGeminiApiKey(key: string): void {
    this.geminiApiKey = key;
  }

  /**
   * Check if online embeddings are available
   */
  get hasOnlineCapability(): boolean {
    return !!this.geminiApiKey;
  }

  /**
   * Check if local store is available
   */
  get hasLocalCapability(): boolean {
    return this.localStore.loaded;
  }

  /**
   * Generate embedding using Gemini API
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.geminiApiKey) {
      return null;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/gemini-embedding-001',
            content: { parts: [{ text }] },
            taskType: 'RETRIEVAL_QUERY',
            outputDimensionality: 768,
          }),
        }
      );

      if (!response.ok) {
        console.warn('Gemini embedding failed:', response.status);
        return null;
      }

      const result = await response.json();
      const values = result.embeddings?.[0]?.values;
      
      if (!values) {
        return null;
      }

      // Normalize
      const norm = Math.sqrt(values.reduce((sum: number, v: number) => sum + v * v, 0));
      return values.map((v: number) => v / norm);
    } catch (error) {
      console.warn('Embedding generation error:', error);
      return null;
    }
  }

  /**
   * Search knowledge base with hybrid approach
   * 1. Try online embedding if available
   * 2. Fall back to local embedding search
   * 3. Fall back to keyword search
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const searchOptions = {
      topK: this.config.maxResults,
      ...options,
    };

    // Try online embedding first if preferred and available
    if (this.config.preferOnline && this.hasOnlineCapability && this.hasLocalCapability) {
      const embedding = await this.generateEmbedding(query);
      if (embedding) {
        return this.localStore.searchByEmbedding(embedding, searchOptions);
      }
    }

    // Fall back to keyword search if configured
    if (this.config.fallbackToKeywords && this.hasLocalCapability) {
      return this.localStore.searchByKeywords(query, searchOptions);
    }

    return [];
  }

  /**
   * Get relevant context for a query
   */
  async getContext(
    query: string,
    options: SearchOptions & { maxTokens?: number } = {}
  ): Promise<string> {
    const { maxTokens = 2000, ...searchOptions } = options;
    const results = await this.search(query, searchOptions);
    return this.localStore.formatAsContext(results, maxTokens);
  }

  /**
   * Get statistics about the knowledge base
   */
  getStats(): {
    local: VectorStore['stats'] | null;
    hasOnline: boolean;
    hasLocal: boolean;
  } {
    return {
      local: this.localStore.getStats(),
      hasOnline: this.hasOnlineCapability,
      hasLocal: this.hasLocalCapability,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const hybridRAG = new HybridRAGService();

// ============================================================================
// Bundled Knowledge Base Loader
// ============================================================================

/**
 * Load the bundled knowledge base
 * This should be called at app startup
 */
export async function loadBundledKnowledgeBase(): Promise<void> {
  try {
    // In React Native, we'll load from a bundled JSON asset
    // For now, this is a placeholder that will be populated by the build process
    const bundledStore: VectorStore = {
      version: '1.0.0',
      model: 'gemini-embedding-001',
      dimensions: 768,
      created: new Date().toISOString(),
      chunks: [],
      stats: {
        totalChunks: 0,
        totalTokens: 0,
        categories: {},
      },
    };

    await hybridRAG.initializeLocal(bundledStore);
    console.log('[RAG] Bundled knowledge base loaded');
  } catch (error) {
    console.warn('[RAG] Failed to load bundled knowledge base:', error);
  }
}
