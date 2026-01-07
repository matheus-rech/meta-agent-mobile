/**
 * Gemini File Search RAG Service
 * 
 * Uses Google's managed RAG system for semantic search over meta-analysis knowledge base.
 * Free storage, free query embeddings - only pay for initial indexing.
 * 
 * @see https://ai.google.dev/gemini-api/docs/file-search
 */

import { apiKeyManager } from '../api-keys';

// File Search Store IDs (to be created once and reused)
export const FILE_SEARCH_STORES = {
  COCHRANE_HANDBOOK: 'meta-agent-cochrane-handbook',
  SEMINAL_PAPERS: 'meta-agent-seminal-papers',
  R_DOCUMENTATION: 'meta-agent-r-docs',
  R_ERROR_PATTERNS: 'meta-agent-r-errors',
  TEACHING_RESOURCES: 'meta-agent-teaching',
} as const;

export type FileSearchStoreType = keyof typeof FILE_SEARCH_STORES;

export interface FileSearchResult {
  content: string;
  source: string;
  relevanceScore: number;
  citation?: {
    title: string;
    uri?: string;
    startIndex?: number;
    endIndex?: number;
  };
}

export interface FileSearchConfig {
  stores: FileSearchStoreType[];
  metadataFilter?: string;
  maxResults?: number;
}

export interface GroundedResponse {
  text: string;
  citations: FileSearchResult[];
  groundingMetadata?: unknown;
}

/**
 * Gemini File Search Service
 * 
 * Provides RAG capabilities using Google's managed File Search API.
 * Automatically retrieves relevant context from knowledge bases.
 */
export class GeminiFileSearchService {
  private apiKey: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor() {
    this.loadApiKey();
  }
  
  private async loadApiKey(): Promise<void> {
    const geminiKey = await apiKeyManager.getKey('gemini');
    this.apiKey = geminiKey?.key || null;
  }
  
  /**
   * Check if File Search is available (requires Gemini API key)
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      await this.loadApiKey();
    }
    return this.apiKey !== null;
  }
  
  /**
   * Generate content with File Search grounding
   * 
   * @param query - User's question
   * @param config - File Search configuration
   * @returns Response with citations
   */
  async generateWithFileSearch(
    query: string,
    config: FileSearchConfig
  ): Promise<GroundedResponse> {
    if (!this.apiKey) {
      await this.loadApiKey();
    }
    
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Add your key in Settings → API Keys.');
    }
    
    const storeNames = config.stores.map(store => 
      `fileSearchStores/${FILE_SEARCH_STORES[store]}`
    );
    
    const requestBody = {
      contents: [{
        parts: [{ text: query }]
      }],
      tools: [{
        file_search: {
          file_search_store_names: storeNames,
          ...(config.metadataFilter && { metadata_filter: config.metadataFilter }),
        }
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    };
    
    const response = await fetch(
      `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`File Search failed: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const candidate = data.candidates?.[0];
    
    if (!candidate) {
      throw new Error('No response from File Search');
    }
    
    // Extract citations from grounding metadata
    const citations: FileSearchResult[] = [];
    const groundingMetadata = candidate.groundingMetadata;
    
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        citations.push({
          content: chunk.retrievedContext?.text || '',
          source: chunk.retrievedContext?.uri || 'Unknown',
          relevanceScore: chunk.relevanceScore || 0,
          citation: {
            title: chunk.retrievedContext?.title || 'Unknown',
            uri: chunk.retrievedContext?.uri,
          }
        });
      }
    }
    
    return {
      text: candidate.content?.parts?.[0]?.text || '',
      citations,
      groundingMetadata,
    };
  }
  
  /**
   * Search for relevant documents without generating a response
   * 
   * @param query - Search query
   * @param stores - Stores to search
   * @returns Relevant document chunks
   */
  async semanticSearch(
    query: string,
    stores: FileSearchStoreType[]
  ): Promise<FileSearchResult[]> {
    // For pure semantic search, we use a minimal prompt that just retrieves
    const response = await this.generateWithFileSearch(
      `Find information about: ${query}. Return only the most relevant facts.`,
      { stores, maxResults: 5 }
    );
    
    return response.citations;
  }
  
  /**
   * Query with Socratic teaching style
   * 
   * Instead of giving direct answers, guides the user with questions.
   */
  async teachWithSocraticMethod(
    userQuestion: string,
    stores: FileSearchStoreType[] = ['COCHRANE_HANDBOOK', 'TEACHING_RESOURCES']
  ): Promise<GroundedResponse> {
    const socraticPrompt = `You are a Socratic teacher helping someone learn meta-analysis.

The student asked: "${userQuestion}"

Using the knowledge base, guide them to understand the answer through questions rather than giving it directly.

Follow this pattern:
1. Acknowledge their question
2. Ask a clarifying question to understand their current knowledge
3. Guide them toward the answer with leading questions
4. Only provide direct information when they're stuck

Be encouraging and patient. Use examples from the Cochrane Handbook when relevant.`;

    return this.generateWithFileSearch(socraticPrompt, { stores });
  }
  
  /**
   * Debug R code errors using the error patterns knowledge base
   */
  async debugRError(
    errorMessage: string,
    rCode: string,
    stores: FileSearchStoreType[] = ['R_ERROR_PATTERNS', 'R_DOCUMENTATION']
  ): Promise<GroundedResponse> {
    const debugPrompt = `You are an R debugging expert specializing in meta-analysis packages (metafor, meta, dmetar).

The user encountered this error:
\`\`\`
${errorMessage}
\`\`\`

Their R code:
\`\`\`r
${rCode}
\`\`\`

Using the knowledge base:
1. Identify the root cause of the error
2. Explain WHY this error occurred (teaching moment)
3. Provide the corrected code
4. Suggest preventive practices

Be specific and educational. Reference metafor documentation when relevant.`;

    return this.generateWithFileSearch(debugPrompt, { stores });
  }
}

// Singleton instance
let fileSearchService: GeminiFileSearchService | null = null;

export function getFileSearchService(): GeminiFileSearchService {
  if (!fileSearchService) {
    fileSearchService = new GeminiFileSearchService();
  }
  return fileSearchService;
}

/**
 * Knowledge Base Content Definitions
 * 
 * These define what should be uploaded to each File Search store.
 * The actual upload is done via a setup script or admin interface.
 */
export const KNOWLEDGE_BASE_CONTENT = {
  COCHRANE_HANDBOOK: {
    displayName: 'Cochrane Handbook for Systematic Reviews',
    description: 'Key chapters on meta-analysis methodology',
    documents: [
      { name: 'Chapter 6 - Choosing effect measures', source: 'cochrane' },
      { name: 'Chapter 9 - Summarizing study characteristics', source: 'cochrane' },
      { name: 'Chapter 10 - Analysing data and undertaking meta-analyses', source: 'cochrane' },
      { name: 'Chapter 11 - Network meta-analyses', source: 'cochrane' },
      { name: 'Chapter 12 - Addressing reporting biases', source: 'cochrane' },
    ]
  },
  SEMINAL_PAPERS: {
    displayName: 'Seminal Meta-Analysis Papers',
    description: 'Foundational papers in meta-analysis methodology',
    documents: [
      { name: 'DerSimonian & Laird (1986) - Random effects model', source: 'academic' },
      { name: 'Higgins & Thompson (2002) - I² statistic', source: 'academic' },
      { name: 'Egger et al. (1997) - Publication bias detection', source: 'academic' },
      { name: 'Cochrane (1972) - Evidence-based medicine', source: 'academic' },
      { name: 'Bradford Hill (1965) - Causation criteria', source: 'academic' },
      { name: 'PRISMA 2020 Statement', source: 'guideline' },
    ]
  },
  R_DOCUMENTATION: {
    displayName: 'R Meta-Analysis Package Documentation',
    description: 'Documentation for metafor, meta, and related packages',
    documents: [
      { name: 'metafor package documentation', source: 'r-docs' },
      { name: 'meta package documentation', source: 'r-docs' },
      { name: 'dmetar package documentation', source: 'r-docs' },
      { name: 'robvis package documentation', source: 'r-docs' },
      { name: 'netmeta package documentation', source: 'r-docs' },
    ]
  },
  R_ERROR_PATTERNS: {
    displayName: 'Common R Errors and Solutions',
    description: 'Database of common R errors in meta-analysis with solutions',
    documents: [
      { name: 'Package installation errors', source: 'errors' },
      { name: 'Data format and type errors', source: 'errors' },
      { name: 'NA handling errors', source: 'errors' },
      { name: 'Effect size calculation errors', source: 'errors' },
      { name: 'Forest plot generation errors', source: 'errors' },
      { name: 'Model convergence errors', source: 'errors' },
    ]
  },
  TEACHING_RESOURCES: {
    displayName: 'Meta-Analysis Teaching Resources',
    description: 'Socratic questions, explanations, and learning materials',
    documents: [
      { name: 'Socratic question templates', source: 'teaching' },
      { name: 'Common misconceptions', source: 'teaching' },
      { name: 'Step-by-step tutorials', source: 'teaching' },
      { name: 'Practice exercises', source: 'teaching' },
    ]
  },
} as const;
