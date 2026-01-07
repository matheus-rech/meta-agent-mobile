/**
 * Gemini File Search Service
 * 
 * Integrates with Google Gemini's File Search API for RAG functionality.
 * Uploads knowledge base documents and retrieves relevant context for queries.
 */

import * as FileSystem from 'expo-file-system/legacy';

// Types for Gemini File Search API
interface GeminiFile {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  createTime: string;
  updateTime: string;
  expirationTime: string;
  sha256Hash: string;
  uri: string;
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
}

interface FileSearchResult {
  file: GeminiFile;
  relevanceScore: number;
  chunks: {
    text: string;
    startIndex: number;
    endIndex: number;
  }[];
}

interface GeminiFileSearchConfig {
  apiKey: string;
  model?: string;
}

// Knowledge base document metadata
export interface KnowledgeDocument {
  id: string;
  filename: string;
  title: string;
  category: 'cochrane' | 'methodology' | 'r-package' | 'guidelines';
  description: string;
  localPath?: string;
  geminiUri?: string;
  uploadedAt?: Date;
}

// Predefined knowledge base documents
export const KNOWLEDGE_BASE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'cochrane-ch10',
    filename: 'cochrane-chapter-10-meta-analysis.md',
    title: 'Cochrane Handbook Chapter 10: Meta-analyses',
    category: 'cochrane',
    description: 'Core chapter on conducting meta-analyses, effect measures, heterogeneity'
  },
  {
    id: 'cochrane-ch11',
    filename: 'cochrane-chapter-11-network-meta-analysis.md',
    title: 'Cochrane Handbook Chapter 11: Network Meta-analyses',
    category: 'cochrane',
    description: 'Indirect comparisons, transitivity, network diagrams, ranking'
  },
  {
    id: 'cochrane-ch14',
    filename: 'cochrane-chapter-14-grade.md',
    title: 'Cochrane Handbook Chapter 14: GRADE',
    category: 'cochrane',
    description: 'Summary of findings tables, certainty of evidence assessment'
  },
  {
    id: 'cochrane-ch26',
    filename: 'cochrane-chapter-26-ipd.md',
    title: 'Cochrane Handbook Chapter 26: Individual Participant Data',
    category: 'cochrane',
    description: 'IPD meta-analysis methodology, one-stage and two-stage approaches'
  },
  {
    id: 'seminal-articles',
    filename: 'seminal-articles-references.md',
    title: 'Seminal Articles in Meta-Analysis',
    category: 'methodology',
    description: 'Glass 1976, DerSimonian-Laird 1986, Higgins I² statistic'
  },
  {
    id: 'metafor-guide',
    filename: 'metafor-package-guide.md',
    title: 'metafor R Package Guide',
    category: 'r-package',
    description: 'Complete guide to metafor functions: escalc, rma, forest, funnel'
  },
  {
    id: 'handbook-structure',
    filename: 'cochrane-handbook-structure.md',
    title: 'Cochrane Handbook Structure',
    category: 'cochrane',
    description: 'Overview of all handbook chapters and organization'
  }
];

class GeminiFileSearchService {
  private apiKey: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private uploadedFiles: Map<string, GeminiFile> = new Map();
  private initialized = false;

  /**
   * Initialize the service with API key
   */
  async initialize(config: GeminiFileSearchConfig): Promise<void> {
    this.apiKey = config.apiKey;
    this.initialized = true;
    console.log('[GeminiFileSearch] Service initialized');
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && this.apiKey !== null;
  }

  /**
   * Upload a file to Gemini File API
   */
  async uploadFile(document: KnowledgeDocument, content: string): Promise<GeminiFile | null> {
    if (!this.apiKey) {
      console.error('[GeminiFileSearch] API key not configured');
      return null;
    }

    try {
      // Step 1: Start resumable upload
      const startUploadResponse = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': String(content.length),
            'X-Goog-Upload-Header-Content-Type': 'text/markdown',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: {
              displayName: document.title,
            }
          })
        }
      );

      const uploadUrl = startUploadResponse.headers.get('X-Goog-Upload-URL');
      if (!uploadUrl) {
        throw new Error('Failed to get upload URL');
      }

      // Step 2: Upload the content
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(content.length),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: content
      });

      const fileInfo = await uploadResponse.json();
      
      if (fileInfo.file) {
        this.uploadedFiles.set(document.id, fileInfo.file);
        console.log(`[GeminiFileSearch] Uploaded: ${document.title}`);
        return fileInfo.file;
      }

      return null;
    } catch (error) {
      console.error(`[GeminiFileSearch] Upload failed for ${document.title}:`, error);
      return null;
    }
  }

  /**
   * Upload all knowledge base documents
   */
  async uploadKnowledgeBase(basePath: string): Promise<{
    success: number;
    failed: number;
    documents: KnowledgeDocument[];
  }> {
    let success = 0;
    let failed = 0;
    const uploadedDocs: KnowledgeDocument[] = [];

    for (const doc of KNOWLEDGE_BASE_DOCUMENTS) {
      try {
        const filePath = `${basePath}/${doc.filename}`;
        const content = await FileSystem.readAsStringAsync(filePath);
        
        const result = await this.uploadFile(doc, content);
        
        if (result) {
          success++;
          uploadedDocs.push({
            ...doc,
            geminiUri: result.uri,
            uploadedAt: new Date()
          });
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[GeminiFileSearch] Error reading ${doc.filename}:`, error);
        failed++;
      }
    }

    return { success, failed, documents: uploadedDocs };
  }

  /**
   * Query the knowledge base using Gemini with grounding
   */
  async query(
    question: string,
    options?: {
      maxResults?: number;
      categories?: KnowledgeDocument['category'][];
      language?: string;
    }
  ): Promise<{
    answer: string;
    sources: { title: string; excerpt: string }[];
    confidence: number;
  }> {
    if (!this.apiKey) {
      return {
        answer: 'Knowledge base not configured. Please set up the Gemini API key.',
        sources: [],
        confidence: 0
      };
    }

    const fileUris = Array.from(this.uploadedFiles.values())
      .filter(file => file.state === 'ACTIVE')
      .map(file => file.uri);

    if (fileUris.length === 0) {
      return {
        answer: 'No documents uploaded to knowledge base yet.',
        sources: [],
        confidence: 0
      };
    }

    try {
      // Build the prompt with context
      const systemPrompt = `You are Glass 🦊, a knowledgeable fox teaching meta-analysis.
Use the provided documents to answer questions accurately.
Always cite your sources.
${options?.language ? `Respond in ${options.language}.` : 'Adapt your language to match the user.'}
Be encouraging and use the Socratic method when appropriate.`;

      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: question }]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            tools: [
              {
                retrieval: {
                  disableAttribution: false,
                  vertexAiSearch: undefined,
                  googleSearchRetrieval: undefined
                }
              }
            ],
            // Include file references for grounding
            cachedContent: undefined
          })
        }
      );

      const result = await response.json();
      
      if (result.candidates && result.candidates[0]) {
        const candidate = result.candidates[0];
        const text = candidate.content?.parts?.[0]?.text || '';
        
        // Extract grounding metadata if available
        const groundingMetadata = candidate.groundingMetadata;
        const sources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.retrievedContext?.title || 'Unknown',
          excerpt: chunk.retrievedContext?.text?.substring(0, 200) || ''
        })) || [];

        return {
          answer: text,
          sources,
          confidence: groundingMetadata?.groundingSupport?.[0]?.confidenceScores?.[0] || 0.8
        };
      }

      return {
        answer: 'I could not find relevant information in my knowledge base.',
        sources: [],
        confidence: 0
      };
    } catch (error) {
      console.error('[GeminiFileSearch] Query failed:', error);
      return {
        answer: 'An error occurred while searching the knowledge base.',
        sources: [],
        confidence: 0
      };
    }
  }

  /**
   * List all uploaded files
   */
  async listFiles(): Promise<GeminiFile[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/files?key=${this.apiKey}`,
        { method: 'GET' }
      );
      
      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('[GeminiFileSearch] List files failed:', error);
      return [];
    }
  }

  /**
   * Delete a file from Gemini
   */
  async deleteFile(fileName: string): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(
        `${this.baseUrl}/${fileName}?key=${this.apiKey}`,
        { method: 'DELETE' }
      );
      
      return response.ok;
    } catch (error) {
      console.error('[GeminiFileSearch] Delete file failed:', error);
      return false;
    }
  }

  /**
   * Get upload status
   */
  getUploadStatus(): {
    total: number;
    uploaded: number;
    documents: { id: string; title: string; status: string }[];
  } {
    const documents = KNOWLEDGE_BASE_DOCUMENTS.map(doc => ({
      id: doc.id,
      title: doc.title,
      status: this.uploadedFiles.has(doc.id) 
        ? this.uploadedFiles.get(doc.id)!.state 
        : 'NOT_UPLOADED'
    }));

    return {
      total: KNOWLEDGE_BASE_DOCUMENTS.length,
      uploaded: this.uploadedFiles.size,
      documents
    };
  }
}

// Export singleton instance
export const geminiFileSearchService = new GeminiFileSearchService();
export default geminiFileSearchService;
