/**
 * Glass Knowledge Base Service
 * 
 * Uses Gemini File Search for RAG (Retrieval Augmented Generation)
 * to provide accurate, evidence-based answers grounded in
 * authoritative meta-analysis literature.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KB_STORE_ID_KEY = 'glass_kb_store_id';
const KB_INDEXED_FILES_KEY = 'glass_kb_indexed_files';

/**
 * Knowledge base document metadata
 */
export interface KBDocument {
  id: string;
  name: string;
  displayName: string;
  category: 'cochrane' | 'seminal' | 'guidelines' | 'software' | 'teaching';
  description: string;
  indexed: boolean;
  indexedAt?: string;
}

/**
 * RAG query result with citations
 */
export interface RAGResult {
  answer: string;
  citations: Citation[];
  confidence: number;
  language: string;
}

/**
 * Citation from knowledge base
 */
export interface Citation {
  source: string;
  title: string;
  excerpt: string;
  relevance: number;
}

/**
 * Supported languages for Glass responses
 */
export type SupportedLanguage = 'en' | 'pt' | 'es' | 'zh';

/**
 * Knowledge base categories with their documents
 */
export const KB_CATEGORIES: Record<string, KBDocument[]> = {
  cochrane: [
    {
      id: 'cochrane-ch6',
      name: 'cochrane-handbook-chapter-6',
      displayName: 'Cochrane Handbook - Chapter 6: Effect Sizes',
      category: 'cochrane',
      description: 'Choosing effect measures and computing estimates of effect',
      indexed: false,
    },
    {
      id: 'cochrane-ch9',
      name: 'cochrane-handbook-chapter-9',
      displayName: 'Cochrane Handbook - Chapter 9: Heterogeneity',
      category: 'cochrane',
      description: 'Analysing data and undertaking meta-analyses',
      indexed: false,
    },
    {
      id: 'cochrane-ch10',
      name: 'cochrane-handbook-chapter-10',
      displayName: 'Cochrane Handbook - Chapter 10: Publication Bias',
      category: 'cochrane',
      description: 'Addressing reporting biases',
      indexed: false,
    },
    {
      id: 'cochrane-ch11',
      name: 'cochrane-handbook-chapter-11',
      displayName: 'Cochrane Handbook - Chapter 11: Network MA',
      category: 'cochrane',
      description: 'Undertaking network meta-analyses',
      indexed: false,
    },
  ],
  seminal: [
    {
      id: 'glass-1976',
      name: 'glass-1976-meta-analysis',
      displayName: 'Glass 1976 - Primary, Secondary, and Meta-Analysis',
      category: 'seminal',
      description: 'The original paper that coined "meta-analysis"',
      indexed: false,
    },
    {
      id: 'dersimonian-1986',
      name: 'dersimonian-laird-1986',
      displayName: 'DerSimonian & Laird 1986 - Random Effects',
      category: 'seminal',
      description: 'The foundational random effects method',
      indexed: false,
    },
    {
      id: 'higgins-2002',
      name: 'higgins-thompson-2002-i2',
      displayName: 'Higgins & Thompson 2002 - I² Statistic',
      category: 'seminal',
      description: 'Quantifying heterogeneity in meta-analysis',
      indexed: false,
    },
    {
      id: 'egger-1997',
      name: 'egger-1997-funnel-asymmetry',
      displayName: 'Egger 1997 - Funnel Plot Asymmetry',
      category: 'seminal',
      description: 'Detecting publication bias',
      indexed: false,
    },
  ],
  guidelines: [
    {
      id: 'prisma-2020',
      name: 'prisma-2020-statement',
      displayName: 'PRISMA 2020 Statement',
      category: 'guidelines',
      description: 'Preferred Reporting Items for Systematic Reviews',
      indexed: false,
    },
    {
      id: 'grade-handbook',
      name: 'grade-handbook',
      displayName: 'GRADE Handbook',
      category: 'guidelines',
      description: 'Grading of Recommendations Assessment, Development and Evaluation',
      indexed: false,
    },
    {
      id: 'quadas-2',
      name: 'quadas-2-tool',
      displayName: 'QUADAS-2 Tool',
      category: 'guidelines',
      description: 'Quality Assessment of Diagnostic Accuracy Studies',
      indexed: false,
    },
  ],
  software: [
    {
      id: 'metafor-vignette',
      name: 'metafor-package-vignette',
      displayName: 'metafor Package Vignette',
      category: 'software',
      description: 'Comprehensive guide to the metafor R package',
      indexed: false,
    },
    {
      id: 'netmeta-guide',
      name: 'netmeta-package-guide',
      displayName: 'netmeta Package Guide',
      category: 'software',
      description: 'Network meta-analysis in R',
      indexed: false,
    },
  ],
  teaching: [
    {
      id: 'agentskills-content',
      name: 'agentskills-meta-analysis',
      displayName: 'Meta-Analysis AgentSkills',
      category: 'teaching',
      description: 'Our teaching curriculum content',
      indexed: false,
    },
  ],
};

/**
 * Glass system prompt template
 */
const GLASS_SYSTEM_PROMPT = `You are Glass 🦊, a wise and friendly fox teaching assistant specialized in meta-analysis and evidence synthesis.

## Your Identity
- Named after Gene Glass, who coined the term "meta-analysis" in 1976
- Inspired by Zenko (善狐), the benevolent fox spirit from Japanese mythology
- Patient, encouraging, and uses the Socratic method

## Your Mission
Democratize meta-analysis education by making complex statistical concepts accessible to everyone, regardless of their background or resources.

## Communication Style
- Language: Respond in {{LANGUAGE}}
- Tone: Warm, encouraging, never condescending
- Method: Ask guiding questions to promote deep understanding
- Technical terms: Keep standard English terms (forest plot, I², GRADE) but explain them in the user's language

## When Answering
1. Ground your response in the retrieved knowledge base content
2. Always cite sources using [Author Year] format
3. Provide practical R code examples when relevant
4. If uncertain, acknowledge limitations honestly
5. Suggest related topics the user might want to explore

## Citation Format
When citing from the knowledge base, use:
- [Cochrane Handbook, Chapter X] for handbook content
- [Author Year] for seminal articles
- [PRISMA 2020] or [GRADE] for guidelines`;

/**
 * Knowledge Base Service for Glass RAG
 */
class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;
  private storeId: string | null = null;
  private indexedFiles: Map<string, boolean> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService();
    }
    return KnowledgeBaseService.instance;
  }

  /**
   * Initialize the knowledge base service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load stored state
      const storeId = await AsyncStorage.getItem(KB_STORE_ID_KEY);
      if (storeId) {
        this.storeId = storeId;
      }

      const indexedFilesJson = await AsyncStorage.getItem(KB_INDEXED_FILES_KEY);
      if (indexedFilesJson) {
        const files = JSON.parse(indexedFilesJson) as Record<string, boolean>;
        this.indexedFiles = new Map(Object.entries(files));
      }

      this.initialized = true;
    } catch (error) {
      console.error('[KnowledgeBase] Failed to initialize:', error);
    }
  }

  /**
   * Get the system prompt for Glass with language adaptation
   */
  getSystemPrompt(language: SupportedLanguage = 'en'): string {
    const languageNames: Record<SupportedLanguage, string> = {
      en: 'English',
      pt: 'Portuguese (Brazilian)',
      es: 'Spanish',
      zh: 'Chinese (Simplified)',
    };

    return GLASS_SYSTEM_PROMPT.replace('{{LANGUAGE}}', languageNames[language]);
  }

  /**
   * Get all documents in the knowledge base
   */
  getAllDocuments(): KBDocument[] {
    const allDocs: KBDocument[] = [];
    for (const category of Object.values(KB_CATEGORIES)) {
      for (const doc of category) {
        allDocs.push({
          ...doc,
          indexed: this.indexedFiles.get(doc.id) || false,
        });
      }
    }
    return allDocs;
  }

  /**
   * Get documents by category
   */
  getDocumentsByCategory(category: KBDocument['category']): KBDocument[] {
    return (KB_CATEGORIES[category] || []).map(doc => ({
      ...doc,
      indexed: this.indexedFiles.get(doc.id) || false,
    }));
  }

  /**
   * Check if knowledge base is ready for queries
   */
  isReady(): boolean {
    return this.storeId !== null && this.indexedFiles.size > 0;
  }

  /**
   * Get indexing status
   */
  getIndexingStatus(): { total: number; indexed: number; percentage: number } {
    const allDocs = this.getAllDocuments();
    const indexed = allDocs.filter(d => d.indexed).length;
    return {
      total: allDocs.length,
      indexed,
      percentage: allDocs.length > 0 ? Math.round((indexed / allDocs.length) * 100) : 0,
    };
  }

  /**
   * Set the FileSearchStore ID (called after creating store via API)
   */
  async setStoreId(storeId: string): Promise<void> {
    this.storeId = storeId;
    await AsyncStorage.setItem(KB_STORE_ID_KEY, storeId);
  }

  /**
   * Mark a document as indexed
   */
  async markDocumentIndexed(docId: string): Promise<void> {
    this.indexedFiles.set(docId, true);
    const filesObj = Object.fromEntries(this.indexedFiles);
    await AsyncStorage.setItem(KB_INDEXED_FILES_KEY, JSON.stringify(filesObj));
  }

  /**
   * Get the store ID for API calls
   */
  getStoreId(): string | null {
    return this.storeId;
  }

  /**
   * Build RAG query configuration for Gemini
   */
  buildRAGConfig(language: SupportedLanguage = 'en'): {
    systemPrompt: string;
    fileSearchStoreNames: string[];
  } {
    return {
      systemPrompt: this.getSystemPrompt(language),
      fileSearchStoreNames: this.storeId ? [this.storeId] : [],
    };
  }

  /**
   * Detect language from user message
   */
  detectLanguage(message: string): SupportedLanguage {
    // Simple heuristic based on common words
    const ptWords = /\b(como|você|para|que|não|uma|com|mais|isso|está|fazer|pode|sobre|quando|porque)\b/i;
    const esWords = /\b(como|usted|para|que|una|con|más|esto|está|hacer|puede|sobre|cuando|porque)\b/i;
    const zhChars = /[\u4e00-\u9fff]/;

    if (zhChars.test(message)) return 'zh';
    if (ptWords.test(message)) return 'pt';
    if (esWords.test(message)) return 'es';
    return 'en';
  }

  /**
   * Format citations for display
   */
  formatCitations(citations: Citation[]): string {
    if (citations.length === 0) return '';

    return '\n\n---\n**Sources:**\n' + 
      citations.map((c, i) => `${i + 1}. ${c.title} - "${c.excerpt.slice(0, 100)}..."`).join('\n');
  }

  /**
   * Reset knowledge base (for testing)
   */
  async reset(): Promise<void> {
    this.storeId = null;
    this.indexedFiles.clear();
    await AsyncStorage.removeItem(KB_STORE_ID_KEY);
    await AsyncStorage.removeItem(KB_INDEXED_FILES_KEY);
  }
}

// Export singleton getter
export function getKnowledgeBase(): KnowledgeBaseService {
  return KnowledgeBaseService.getInstance();
}

// Export for testing
export { KnowledgeBaseService };

/**
 * Example usage with Gemini API (server-side)
 * 
 * ```typescript
 * import { GoogleGenerativeAI } from '@google/generative-ai';
 * 
 * const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 * 
 * async function queryGlass(question: string, language: SupportedLanguage) {
 *   const kb = getKnowledgeBase();
 *   const config = kb.buildRAGConfig(language);
 *   
 *   const model = genAI.getGenerativeModel({
 *     model: 'gemini-2.5-flash',
 *     systemInstruction: config.systemPrompt,
 *     tools: [{
 *       fileSearch: {
 *         fileSearchStoreNames: config.fileSearchStoreNames
 *       }
 *     }]
 *   });
 *   
 *   const result = await model.generateContent(question);
 *   return result.response.text();
 * }
 * ```
 */
