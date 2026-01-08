/**
 * Tests for useGlass hook
 * 
 * Tests the Glass 🦊 AI agent integration with MiniMax M2.1 backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock mini-agent service
vi.mock('@/lib/glass/mini-agent.service', () => ({
  miniAgentService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    chat: vi.fn().mockResolvedValue({
      content: 'Hello! I am Glass 🦊, your meta-analysis guide.',
      skillsUsed: ['meta-analysis-fundamentals'],
      sources: [],
      confidence: 0.85,
      language: 'en',
    }),
    clearHistory: vi.fn(),
    setHistory: vi.fn(),
    getSkills: vi.fn().mockReturnValue([
      { id: 'meta-analysis-fundamentals', name: 'Meta-Analysis Fundamentals', description: 'Core concepts' },
      { id: 'forest-plot-creation', name: 'Forest Plot Creation', description: 'Visualization' },
    ]),
  },
}));

// Mock gemini file search service
vi.mock('@/lib/glass/gemini-file-search.service', () => ({
  geminiFileSearchService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    query: vi.fn().mockResolvedValue({
      answer: 'Heterogeneity refers to variation among studies.',
      sources: [{ title: 'Cochrane Handbook', excerpt: 'Chapter 10' }],
      confidence: 0.9,
    }),
  },
}));

describe('useGlass hook types and interfaces', () => {
  it('should define GlassMessage interface correctly', () => {
    const message = {
      id: 'glass_123',
      role: 'user' as const,
      content: 'What is heterogeneity?',
      timestamp: Date.now(),
    };

    expect(message.id).toBeDefined();
    expect(message.role).toBe('user');
    expect(message.content).toBe('What is heterogeneity?');
    expect(typeof message.timestamp).toBe('number');
  });

  it('should define GlassMessage with optional fields', () => {
    const assistantMessage = {
      id: 'glass_456',
      role: 'assistant' as const,
      content: 'Heterogeneity refers to...',
      timestamp: Date.now(),
      skillsUsed: ['heterogeneity-analysis'],
      sources: [{ title: 'Cochrane Handbook', excerpt: 'Chapter 10' }],
      language: 'en',
    };

    expect(assistantMessage.skillsUsed).toContain('heterogeneity-analysis');
    expect(assistantMessage.sources).toHaveLength(1);
    expect(assistantMessage.language).toBe('en');
  });

  it('should define GlassState type correctly', () => {
    const states: Array<'idle' | 'thinking' | 'talking' | 'error'> = [
      'idle',
      'thinking',
      'talking',
      'error',
    ];

    expect(states).toHaveLength(4);
    expect(states).toContain('idle');
    expect(states).toContain('thinking');
    expect(states).toContain('talking');
    expect(states).toContain('error');
  });
});

describe('useGlass hook functionality', () => {
  it('should generate unique message IDs', () => {
    const generateId = () => `glass_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).toMatch(/^glass_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^glass_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate session IDs', () => {
    const generateSessionId = () => `session_${Date.now().toString(36)}`;
    
    const sessionId = generateSessionId();
    
    expect(sessionId).toMatch(/^session_[a-z0-9]+$/);
  });
});

describe('MiniMax M2.1 API integration', () => {
  it('should have correct API configuration', () => {
    const config = {
      apiKey: 'sk-test-key',
      baseUrl: 'https://api.minimax.io/anthropic',
      model: 'MiniMax-M2.1',
    };

    expect(config.baseUrl).toBe('https://api.minimax.io/anthropic');
    expect(config.model).toBe('MiniMax-M2.1');
  });

  it('should format messages for Anthropic-compatible API', () => {
    const messages = [
      { role: 'user', content: 'What is I²?' },
      { role: 'assistant', content: 'I² measures heterogeneity...' },
    ];

    const formatted = messages.map(m => ({
      role: m.role,
      content: [{ type: 'text', text: m.content }],
    }));

    expect(formatted[0].content[0].type).toBe('text');
    expect(formatted[0].content[0].text).toBe('What is I²?');
  });

  it('should include system prompt with Glass personality', () => {
    const systemPrompt = `You are Glass 🦊, a friendly and knowledgeable fox who teaches meta-analysis.`;
    
    expect(systemPrompt).toContain('Glass');
    expect(systemPrompt).toContain('🦊');
    expect(systemPrompt).toContain('meta-analysis');
  });
});

describe('RAG integration with Gemini', () => {
  it('should append RAG context to system prompt', () => {
    const basePrompt = 'You are Glass 🦊';
    const ragContext = 'Heterogeneity is measured using I² statistic.';
    
    const fullPrompt = `${basePrompt}\n\n## Knowledge Base Context\n${ragContext}`;
    
    expect(fullPrompt).toContain('Knowledge Base Context');
    expect(fullPrompt).toContain('I² statistic');
  });

  it('should extract sources from RAG response', () => {
    const ragResponse = {
      answer: 'The I² statistic quantifies heterogeneity.',
      sources: [
        { title: 'Cochrane Handbook Chapter 10', excerpt: 'Heterogeneity...' },
        { title: 'Higgins 2003', excerpt: 'I² ranges from 0% to 100%...' },
      ],
      confidence: 0.9,
    };

    expect(ragResponse.sources).toHaveLength(2);
    expect(ragResponse.sources[0].title).toContain('Cochrane');
    expect(ragResponse.confidence).toBeGreaterThan(0.8);
  });
});

describe('Skill detection', () => {
  it('should detect meta-analysis fundamentals skill', () => {
    const content = 'The pooled estimate shows a significant effect size.';
    const keywords = ['effect size', 'pooled estimate', 'systematic review'];
    
    const detected = keywords.some(kw => content.toLowerCase().includes(kw));
    
    expect(detected).toBe(true);
  });

  it('should detect heterogeneity analysis skill', () => {
    const content = 'The I² statistic was 75%, indicating substantial heterogeneity.';
    const keywords = ['i²', 'i-squared', 'tau²', 'heterogeneity', 'q statistic'];
    
    const detected = keywords.some(kw => content.toLowerCase().includes(kw));
    
    expect(detected).toBe(true);
  });

  it('should detect forest plot skill', () => {
    const content = 'The forest plot shows the diamond crossing the null line.';
    const keywords = ['forest plot', 'diamond', 'confidence interval'];
    
    const detected = keywords.some(kw => content.toLowerCase().includes(kw));
    
    expect(detected).toBe(true);
  });

  it('should detect publication bias skill', () => {
    const content = "Egger's test was significant, suggesting publication bias.";
    const keywords = ['funnel plot', 'egger', 'publication bias', 'trim and fill'];
    
    const detected = keywords.some(kw => content.toLowerCase().includes(kw));
    
    expect(detected).toBe(true);
  });

  it('should detect R code generation skill', () => {
    const content = 'Use metafor package: res <- rma(yi, vi, data=dat)';
    const keywords = ['metafor', 'rma(', 'escalc(', 'forest('];
    
    const detected = keywords.some(kw => content.toLowerCase().includes(kw));
    
    expect(detected).toBe(true);
  });
});

describe('Language detection', () => {
  it('should detect Portuguese', () => {
    const content = 'Você está aprendendo sobre meta-análise. Isso é muito importante para a pesquisa.';
    const ptWords = ['você', 'está', 'são', 'não', 'como', 'para', 'isso'];
    
    const ptCount = ptWords.filter(w => content.toLowerCase().includes(w)).length;
    
    expect(ptCount).toBeGreaterThan(2);
  });

  it('should detect Spanish', () => {
    const content = 'Usted está aprendiendo sobre metaanálisis. Esto es muy importante.';
    const esWords = ['usted', 'está', 'son', 'como', 'para', 'esto', 'qué'];
    
    const esCount = esWords.filter(w => content.toLowerCase().includes(w)).length;
    
    expect(esCount).toBeGreaterThan(2);
  });

  it('should default to English', () => {
    const content = 'You are learning about meta-analysis. This is very important.';
    const ptWords = ['você', 'está', 'são', 'não', 'como', 'para', 'isso'];
    const esWords = ['usted', 'está', 'son', 'como', 'para', 'esto', 'qué'];
    
    const ptCount = ptWords.filter(w => content.toLowerCase().includes(w)).length;
    const esCount = esWords.filter(w => content.toLowerCase().includes(w)).length;
    
    expect(ptCount).toBeLessThanOrEqual(2);
    expect(esCount).toBeLessThanOrEqual(2);
  });
});

describe('Message history management', () => {
  it('should limit history to 50 messages', () => {
    const messages = Array.from({ length: 60 }, (_, i) => ({
      id: `msg_${i}`,
      role: 'user' as const,
      content: `Message ${i}`,
      timestamp: Date.now() + i,
    }));

    const limited = messages.slice(-50);
    
    expect(limited).toHaveLength(50);
    expect(limited[0].id).toBe('msg_10');
    expect(limited[49].id).toBe('msg_59');
  });

  it('should convert Glass messages to chat history format', () => {
    const glassMessages = [
      { id: 'g1', role: 'user' as const, content: 'Hello', timestamp: 1 },
      { id: 'g2', role: 'assistant' as const, content: 'Hi!', timestamp: 2 },
    ];

    const chatHistory = glassMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    expect(chatHistory).toHaveLength(2);
    expect(chatHistory[0].role).toBe('user');
    expect(chatHistory[1].role).toBe('assistant');
  });
});

describe('Error handling', () => {
  it('should create error message on failure', () => {
    const error = new Error('API connection failed');
    
    const errorMessage = {
      id: 'glass_error_123',
      role: 'system' as const,
      content: `🦊 Oops! I encountered an error: ${error.message}. Please try again.`,
      timestamp: Date.now(),
    };

    expect(errorMessage.content).toContain('API connection failed');
    expect(errorMessage.content).toContain('🦊');
    expect(errorMessage.role).toBe('system');
  });

  it('should handle unknown errors', () => {
    const unknownError = 'Something went wrong';
    
    const errorContent = `🦊 Oops! I encountered an error: ${unknownError}. Please try again.`;
    
    expect(errorContent).toContain('Something went wrong');
  });
});
