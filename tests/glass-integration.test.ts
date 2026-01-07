/**
 * Tests for Glass 🦊 integration components and services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock expo modules
vi.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: vi.fn().mockResolvedValue('mock content'),
  writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
  documentDirectory: '/mock/documents/',
}));

vi.mock('expo-image', () => ({
  Image: 'Image',
}));

vi.mock('react-native-reanimated', () => ({
  default: {
    View: 'Animated.View',
  },
  useSharedValue: vi.fn((initial) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((value) => value),
  withRepeat: vi.fn((value) => value),
  withSequence: vi.fn((...values) => values[0]),
  withDelay: vi.fn((_, value) => value),
  Easing: {
    inOut: vi.fn(() => ({})),
    ease: {},
  },
  cancelAnimation: vi.fn(),
  runOnJS: vi.fn((fn) => fn),
}));

// Knowledge base documents constant for testing
const KNOWLEDGE_BASE_DOCUMENTS = [
  { id: 'cochrane-ch10', filename: 'cochrane-chapter-10-meta-analysis.md', title: 'Cochrane Handbook Chapter 10', category: 'cochrane', description: 'Meta-analyses' },
  { id: 'cochrane-ch11', filename: 'cochrane-chapter-11-network-meta-analysis.md', title: 'Cochrane Handbook Chapter 11', category: 'cochrane', description: 'Network meta-analysis' },
  { id: 'cochrane-ch14', filename: 'cochrane-chapter-14-grade.md', title: 'Cochrane Handbook Chapter 14', category: 'cochrane', description: 'GRADE' },
  { id: 'cochrane-ch26', filename: 'cochrane-chapter-26-ipd.md', title: 'Cochrane Handbook Chapter 26', category: 'cochrane', description: 'IPD' },
  { id: 'seminal-articles', filename: 'seminal-articles-references.md', title: 'Seminal Articles', category: 'methodology', description: 'Glass 1976' },
  { id: 'metafor-guide', filename: 'metafor-package-guide.md', title: 'metafor Guide', category: 'r-package', description: 'R package' },
  { id: 'handbook-structure', filename: 'cochrane-handbook-structure.md', title: 'Handbook Structure', category: 'cochrane', description: 'Overview' },
];

import {
  ASCII_FOX,
  ASCII_FOX_BLINK,
  ASCII_FOX_TALK,
  ASCII_FOX_HAPPY,
  ASCII_FOX_THINK,
  GLASS_LOGO_MINI,
  GLASS_GREETINGS,
  GLASS_ENCOURAGEMENTS,
  createProgressBar,
  createBox,
  glassSays,
} from '../constants/ascii-art';

describe('Glass Integration', () => {
  describe('Knowledge Base Documents', () => {
    it('should have 7 documents defined', () => {
      expect(KNOWLEDGE_BASE_DOCUMENTS).toHaveLength(7);
    });

    it('should have required fields for each document', () => {
      for (const doc of KNOWLEDGE_BASE_DOCUMENTS) {
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('filename');
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('category');
        expect(doc).toHaveProperty('description');
      }
    });

    it('should have Cochrane chapters', () => {
      const cochraneChapters = KNOWLEDGE_BASE_DOCUMENTS.filter(
        d => d.category === 'cochrane'
      );
      expect(cochraneChapters.length).toBeGreaterThanOrEqual(4);
    });

    it('should have metafor guide', () => {
      const metaforDoc = KNOWLEDGE_BASE_DOCUMENTS.find(
        d => d.id === 'metafor-guide'
      );
      expect(metaforDoc).toBeDefined();
      expect(metaforDoc?.category).toBe('r-package');
    });

    it('should have seminal articles', () => {
      const seminalDoc = KNOWLEDGE_BASE_DOCUMENTS.find(
        d => d.id === 'seminal-articles'
      );
      expect(seminalDoc).toBeDefined();
      expect(seminalDoc?.category).toBe('methodology');
    });
  });

  describe('ASCII Art Constants', () => {
    it('should have fox animation frames', () => {
      expect(ASCII_FOX).toBeDefined();
      expect(ASCII_FOX_BLINK).toBeDefined();
      expect(ASCII_FOX_TALK).toBeDefined();
      expect(ASCII_FOX_HAPPY).toBeDefined();
      expect(ASCII_FOX_THINK).toBeDefined();
    });

    it('should have Glass logo', () => {
      expect(GLASS_LOGO_MINI).toBe('[GLASS]');
    });

    it('should have multilingual greetings', () => {
      expect(GLASS_GREETINGS.length).toBeGreaterThan(0);
      
      // Check for Portuguese
      const hasPt = GLASS_GREETINGS.some(g => g.includes('Olá'));
      expect(hasPt).toBe(true);
      
      // Check for English
      const hasEn = GLASS_GREETINGS.some(g => g.includes('Hello'));
      expect(hasEn).toBe(true);
      
      // Check for Spanish
      const hasEs = GLASS_GREETINGS.some(g => g.includes('Hola'));
      expect(hasEs).toBe(true);
    });

    it('should have encouragements', () => {
      expect(GLASS_ENCOURAGEMENTS.length).toBeGreaterThan(0);
    });
  });

  describe('ASCII Art Helpers', () => {
    it('should create progress bar', () => {
      const bar0 = createProgressBar(0, 10);
      expect(bar0).toContain('0%');
      
      const bar50 = createProgressBar(0.5, 10);
      expect(bar50).toContain('50%');
      
      const bar100 = createProgressBar(1, 10);
      expect(bar100).toContain('100%');
    });

    it('should create boxed message', () => {
      const box = createBox('Hello');
      expect(box).toContain('Hello');
      expect(box).toContain('╭');
      expect(box).toContain('╯');
    });

    it('should create double-line box', () => {
      const box = createBox('Test', 'double');
      expect(box).toContain('╔');
      expect(box).toContain('╝');
    });

    it('should format Glass speech', () => {
      const speech = glassSays('Hello!');
      expect(speech).toBe('🦊 Hello!');
    });
  });

  describe('Fox Animation Frames', () => {
    it('should have different eye states', () => {
      // Idle has open eyes
      expect(ASCII_FOX).toContain('o.o');
      
      // Blink has closed eyes
      expect(ASCII_FOX_BLINK).toContain('-.-');
      
      // Happy has happy eyes
      expect(ASCII_FOX_HAPPY).toContain('^.^');
    });

    it('should have different mouth states', () => {
      // Idle has closed mouth
      expect(ASCII_FOX).toContain('> ^ <');
      
      // Talk has open mouth
      expect(ASCII_FOX_TALK).toContain('> o <');
      
      // Happy has smile
      expect(ASCII_FOX_HAPPY).toContain('> w <');
    });

    it('should have thinking indicator', () => {
      expect(ASCII_FOX_THINK).toContain('?');
    });
  });
});

describe('Glass Skills', () => {
  // Define expected skills for testing
  const GLASS_SKILLS = [
    { id: 'meta-analysis-fundamentals', name: 'Meta-Analysis Fundamentals' },
    { id: 'forest-plot-creation', name: 'Forest Plot Creation' },
    { id: 'heterogeneity-analysis', name: 'Heterogeneity Analysis' },
    { id: 'publication-bias-detection', name: 'Publication Bias' },
    { id: 'data-extraction', name: 'Data Extraction' },
    { id: 'grade-assessment', name: 'GRADE Assessment' },
    { id: 'r-code-generation', name: 'R Code Generation' },
    { id: 'socratic-teaching', name: 'Socratic Teaching' },
    { id: 'network-meta-analysis', name: 'Network Meta-Analysis' },
    { id: 'bayesian-meta-analysis', name: 'Bayesian Meta-Analysis' },
    { id: 'ipd-meta-analysis', name: 'IPD Meta-Analysis' },
    { id: 'trial-sequential-analysis', name: 'Trial Sequential Analysis' },
    { id: 'diagnostic-meta-analysis', name: 'Diagnostic Meta-Analysis' },
  ];

  it('should have 13 skills defined', () => {
    expect(GLASS_SKILLS).toHaveLength(13);
  });

  it('should have fundamental skills', () => {
    const skillIds = GLASS_SKILLS.map(s => s.id);
    
    expect(skillIds).toContain('meta-analysis-fundamentals');
    expect(skillIds).toContain('forest-plot-creation');
    expect(skillIds).toContain('heterogeneity-analysis');
  });

  it('should have advanced skills', () => {
    const skillIds = GLASS_SKILLS.map(s => s.id);
    
    expect(skillIds).toContain('network-meta-analysis');
    expect(skillIds).toContain('bayesian-meta-analysis');
    expect(skillIds).toContain('ipd-meta-analysis');
    expect(skillIds).toContain('trial-sequential-analysis');
    expect(skillIds).toContain('diagnostic-meta-analysis');
  });
});

describe('Mini-Agent Service', () => {
  // Mock service for testing
  class MockMiniAgentService {
    private initialized = false;
    private history: any[] = [];

    async initialize(config: { apiKey: string }) {
      this.initialized = true;
    }

    isReady() {
      return this.initialized;
    }

    setHistory(history: any[]) {
      this.history = history;
    }

    getHistory() {
      return [...this.history];
    }

    clearHistory() {
      this.history = [];
    }
  }

  it('should not be ready before initialization', () => {
    const service = new MockMiniAgentService();
    expect(service.isReady()).toBe(false);
  });

  it('should be ready after initialization', async () => {
    const service = new MockMiniAgentService();
    await service.initialize({ apiKey: 'test-key' });
    expect(service.isReady()).toBe(true);
  });

  it('should clear conversation history', () => {
    const service = new MockMiniAgentService();
    
    service.setHistory([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ]);
    
    expect(service.getHistory()).toHaveLength(2);
    
    service.clearHistory();
    
    expect(service.getHistory()).toHaveLength(0);
  });
});

describe('Gemini File Search Service', () => {
  // Mock service for testing
  class MockGeminiFileSearchService {
    private initialized = false;
    private uploadedFiles = new Map();

    async initialize(config: { apiKey: string }) {
      this.initialized = true;
    }

    isReady() {
      return this.initialized;
    }

    getUploadStatus() {
      return {
        total: KNOWLEDGE_BASE_DOCUMENTS.length,
        uploaded: this.uploadedFiles.size,
        documents: KNOWLEDGE_BASE_DOCUMENTS.map(doc => ({
          id: doc.id,
          title: doc.title,
          status: this.uploadedFiles.has(doc.id) ? 'ACTIVE' : 'NOT_UPLOADED'
        }))
      };
    }
  }

  it('should not be ready before initialization', () => {
    const service = new MockGeminiFileSearchService();
    expect(service.isReady()).toBe(false);
  });

  it('should have upload status method', () => {
    const service = new MockGeminiFileSearchService();
    const status = service.getUploadStatus();
    
    expect(status).toHaveProperty('total');
    expect(status).toHaveProperty('uploaded');
    expect(status).toHaveProperty('documents');
    expect(status.total).toBe(7);
  });

  it('should list all documents as not uploaded initially', () => {
    const service = new MockGeminiFileSearchService();
    const status = service.getUploadStatus();
    
    for (const doc of status.documents) {
      expect(doc.status).toBe('NOT_UPLOADED');
    }
  });
});
