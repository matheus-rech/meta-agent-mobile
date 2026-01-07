/**
 * Mini-Agent Integration Service
 * 
 * Connects Glass 🦊 to MiniMax Mini-Agent for intelligent responses.
 * Mini-Agent supports AgentSkills and has built-in multilingual capabilities.
 * 
 * @see https://github.com/MiniMax-AI/Mini-Agent
 */

import { geminiFileSearchService } from './gemini-file-search.service';

// Mini-Agent API configuration
interface MiniAgentConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// Message types for chat
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Skill reference for Mini-Agent
interface SkillReference {
  id: string;
  name: string;
  description: string;
}

// Response from Mini-Agent
interface MiniAgentResponse {
  content: string;
  skillsUsed?: string[];
  sources?: { title: string; excerpt: string }[];
  confidence?: number;
  language?: string;
}

// Glass personality configuration
const GLASS_SYSTEM_PROMPT = `You are Glass 🦊, a friendly and knowledgeable fox who teaches meta-analysis.

## Personality
- Named after Gene Glass, who coined "meta-analysis" in 1976
- Inspired by Zenko (善狐), the benevolent fox from Japanese mythology
- Patient, encouraging, and uses the Socratic method
- Adapts language automatically to match the user

## Teaching Style
- Ask guiding questions rather than giving direct answers
- Celebrate progress with encouragement
- Break complex concepts into digestible steps
- Use practical examples from real meta-analyses
- Reference the Cochrane Handbook when appropriate

## Available Skills
You have access to these AgentSkills for teaching:
1. meta-analysis-fundamentals - Core concepts and terminology
2. forest-plot-creation - Creating and interpreting forest plots
3. heterogeneity-analysis - Understanding I² and tau²
4. publication-bias-detection - Funnel plots and Egger's test
5. data-extraction - Extracting effect sizes from studies
6. grade-assessment - GRADE evidence certainty
7. r-code-generation - metafor package code
8. socratic-teaching - Guided learning methodology
9. network-meta-analysis - Indirect comparisons
10. bayesian-meta-analysis - Bayesian approaches
11. ipd-meta-analysis - Individual participant data
12. trial-sequential-analysis - TSA methodology
13. diagnostic-meta-analysis - Sensitivity/specificity

## Response Format
- Keep responses concise but informative
- Use markdown formatting when helpful
- Include R code examples when relevant
- Always cite sources from the knowledge base
- End with a guiding question when teaching`;

// Available skills for Glass
const GLASS_SKILLS: SkillReference[] = [
  { id: 'meta-analysis-fundamentals', name: 'Meta-Analysis Fundamentals', description: 'Core concepts' },
  { id: 'forest-plot-creation', name: 'Forest Plot Creation', description: 'Visualization' },
  { id: 'heterogeneity-analysis', name: 'Heterogeneity Analysis', description: 'I² and tau²' },
  { id: 'publication-bias-detection', name: 'Publication Bias', description: 'Funnel plots' },
  { id: 'data-extraction', name: 'Data Extraction', description: 'Effect sizes' },
  { id: 'grade-assessment', name: 'GRADE Assessment', description: 'Evidence certainty' },
  { id: 'r-code-generation', name: 'R Code Generation', description: 'metafor package' },
  { id: 'socratic-teaching', name: 'Socratic Teaching', description: 'Guided learning' },
  { id: 'network-meta-analysis', name: 'Network Meta-Analysis', description: 'Indirect comparisons' },
  { id: 'bayesian-meta-analysis', name: 'Bayesian Meta-Analysis', description: 'Bayesian approaches' },
  { id: 'ipd-meta-analysis', name: 'IPD Meta-Analysis', description: 'Individual data' },
  { id: 'trial-sequential-analysis', name: 'Trial Sequential Analysis', description: 'TSA' },
  { id: 'diagnostic-meta-analysis', name: 'Diagnostic Meta-Analysis', description: 'Sensitivity/specificity' },
];

class MiniAgentService {
  private config: MiniAgentConfig | null = null;
  private conversationHistory: ChatMessage[] = [];
  private initialized = false;

  /**
   * Initialize the Mini-Agent service
   */
  async initialize(config: MiniAgentConfig): Promise<void> {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.minimax.chat/v1',
      model: config.model || 'abab6.5s-chat',
    };
    this.initialized = true;
    console.log('[MiniAgent] Service initialized');
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && this.config !== null;
  }

  /**
   * Send a message to Glass and get a response
   */
  async chat(
    userMessage: string,
    options?: {
      useRAG?: boolean;
      skills?: string[];
      language?: string;
    }
  ): Promise<MiniAgentResponse> {
    if (!this.config) {
      return {
        content: "I'm not fully configured yet. Please set up the API key in settings.",
        confidence: 0,
      };
    }

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Get RAG context if enabled
      let ragContext = '';
      let sources: { title: string; excerpt: string }[] = [];
      
      if (options?.useRAG && geminiFileSearchService.isReady()) {
        const ragResult = await geminiFileSearchService.query(userMessage, {
          language: options.language,
        });
        ragContext = ragResult.answer;
        sources = ragResult.sources;
      }

      // Build the messages array
      const messages: ChatMessage[] = [
        { role: 'system', content: GLASS_SYSTEM_PROMPT },
        ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
      ];

      // Add RAG context if available
      if (ragContext) {
        messages.push({
          role: 'system',
          content: `Knowledge Base Context:\n${ragContext}`,
        });
      }

      // Call Mini-Agent API
      const response = await fetch(`${this.config.baseUrl}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(m => ({
            sender_type: m.role === 'user' ? 'USER' : m.role === 'assistant' ? 'BOT' : 'SYSTEM',
            sender_name: m.role === 'user' ? 'User' : 'Glass',
            text: m.content,
          })),
          tokens_to_generate: 1024,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      const result = await response.json();

      if (result.reply) {
        const assistantMessage = result.reply;
        
        // Add to history
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage,
        });

        // Detect which skills were used based on content
        const skillsUsed = this.detectSkillsUsed(assistantMessage);

        return {
          content: assistantMessage,
          skillsUsed,
          sources,
          confidence: 0.85,
          language: this.detectLanguage(assistantMessage),
        };
      }

      return {
        content: "I couldn't generate a response. Let me try again.",
        confidence: 0,
      };
    } catch (error) {
      console.error('[MiniAgent] Chat error:', error);
      return {
        content: "I encountered an error. Please check your connection and try again.",
        confidence: 0,
      };
    }
  }

  /**
   * Detect which skills were used in a response
   */
  private detectSkillsUsed(content: string): string[] {
    const usedSkills: string[] = [];
    const contentLower = content.toLowerCase();

    const skillKeywords: Record<string, string[]> = {
      'meta-analysis-fundamentals': ['effect size', 'pooled estimate', 'systematic review'],
      'forest-plot-creation': ['forest plot', 'diamond', 'confidence interval'],
      'heterogeneity-analysis': ['i²', 'i-squared', 'tau²', 'heterogeneity', 'q statistic'],
      'publication-bias-detection': ['funnel plot', 'egger', 'publication bias', 'trim and fill'],
      'data-extraction': ['extract', 'mean difference', 'odds ratio', 'risk ratio'],
      'grade-assessment': ['grade', 'certainty', 'quality of evidence'],
      'r-code-generation': ['metafor', 'rma(', 'escalc(', 'forest('],
      'network-meta-analysis': ['network', 'indirect comparison', 'netmeta'],
      'bayesian-meta-analysis': ['bayesian', 'prior', 'posterior', 'brms'],
      'ipd-meta-analysis': ['individual participant', 'ipd', 'one-stage', 'two-stage'],
      'trial-sequential-analysis': ['tsa', 'sequential', 'information size'],
      'diagnostic-meta-analysis': ['sensitivity', 'specificity', 'sroc', 'diagnostic'],
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => contentLower.includes(kw))) {
        usedSkills.push(skill);
      }
    }

    return usedSkills;
  }

  /**
   * Detect the language of a response
   */
  private detectLanguage(content: string): string {
    // Simple heuristic based on common words
    const ptWords = ['você', 'está', 'são', 'não', 'como', 'para', 'isso'];
    const esWords = ['usted', 'está', 'son', 'como', 'para', 'esto', 'qué'];
    
    const contentLower = content.toLowerCase();
    
    const ptCount = ptWords.filter(w => contentLower.includes(w)).length;
    const esCount = esWords.filter(w => contentLower.includes(w)).length;

    if (ptCount > 2) return 'pt-BR';
    if (esCount > 2) return 'es';
    return 'en';
  }

  /**
   * Get available skills
   */
  getSkills(): SkillReference[] {
    return GLASS_SKILLS;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Set conversation history (for restoring sessions)
   */
  setHistory(history: ChatMessage[]): void {
    this.conversationHistory = history;
  }
}

// Export singleton instance
export const miniAgentService = new MiniAgentService();
export default miniAgentService;
export type { MiniAgentConfig, ChatMessage, MiniAgentResponse, SkillReference };
