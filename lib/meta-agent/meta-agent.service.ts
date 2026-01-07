/**
 * Meta Agent Service
 * 
 * Meta is the primary AI guide in the app. She:
 * - Conducts personalized onboarding for each student
 * - Uses the same skills as Claude (AgentSkills)
 * - Has shared memory with other agents
 * - Adapts to the on-device model chosen by the user
 * - Teaches meta-analysis through Socratic dialogue
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  META_GREETINGS,
  META_ENCOURAGEMENTS,
  META_LOGO_MINI,
  metaSays,
} from '@/constants/ascii-art';

// Storage keys
const META_MEMORY_KEY = 'meta_agent_memory_v1';
const META_PREFERENCES_KEY = 'meta_agent_preferences_v1';

/**
 * User profile learned by Meta
 */
export interface MetaUserProfile {
  name?: string;
  preferredLanguage: 'en' | 'pt' | 'es';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal?: string;
  completedModules: string[];
  strengths: string[];
  areasToImprove: string[];
  lastInteraction?: string;
  totalInteractions: number;
}

/**
 * Shared memory entry for cross-agent communication
 */
export interface MemoryEntry {
  id: string;
  timestamp: string;
  agentId: string;
  type: 'fact' | 'preference' | 'progress' | 'insight';
  content: string;
  context?: string;
  confidence: number;
}

/**
 * Meta's conversation context
 */
export interface MetaContext {
  currentTopic?: string;
  currentModule?: string;
  pendingQuestions: string[];
  recentTopics: string[];
  sessionStartTime: string;
}

/**
 * Meta Agent Service singleton
 */
class MetaAgentService {
  private static instance: MetaAgentService;
  private userProfile: MetaUserProfile;
  private sharedMemory: MemoryEntry[];
  private context: MetaContext;
  private initialized: boolean = false;

  private constructor() {
    this.userProfile = this.getDefaultProfile();
    this.sharedMemory = [];
    this.context = this.getDefaultContext();
  }

  static getInstance(): MetaAgentService {
    if (!MetaAgentService.instance) {
      MetaAgentService.instance = new MetaAgentService();
    }
    return MetaAgentService.instance;
  }

  private getDefaultProfile(): MetaUserProfile {
    return {
      preferredLanguage: 'en',
      experienceLevel: 'beginner',
      completedModules: [],
      strengths: [],
      areasToImprove: [],
      totalInteractions: 0,
    };
  }

  private getDefaultContext(): MetaContext {
    return {
      pendingQuestions: [],
      recentTopics: [],
      sessionStartTime: new Date().toISOString(),
    };
  }

  /**
   * Initialize Meta with stored data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load user profile
      const profileData = await AsyncStorage.getItem(META_PREFERENCES_KEY);
      if (profileData) {
        this.userProfile = { ...this.getDefaultProfile(), ...JSON.parse(profileData) };
      }

      // Load shared memory
      const memoryData = await AsyncStorage.getItem(META_MEMORY_KEY);
      if (memoryData) {
        this.sharedMemory = JSON.parse(memoryData);
      }

      this.initialized = true;
    } catch (error) {
      console.error('[Meta] Failed to initialize:', error);
    }
  }

  /**
   * Save current state to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(META_PREFERENCES_KEY, JSON.stringify(this.userProfile));
      await AsyncStorage.setItem(META_MEMORY_KEY, JSON.stringify(this.sharedMemory));
    } catch (error) {
      console.error('[Meta] Failed to persist:', error);
    }
  }

  /**
   * Get a personalized greeting from Meta
   */
  getGreeting(): string {
    const { name, preferredLanguage, totalInteractions } = this.userProfile;
    
    if (totalInteractions === 0) {
      // First time user
      return preferredLanguage === 'pt'
        ? `${META_LOGO_MINI} Olá! Sou a Meta, sua guia de meta-análise. Prazer em conhecê-lo!`
        : `${META_LOGO_MINI} Hello! I'm Meta, your meta-analysis guide. Nice to meet you!`;
    }
    
    if (name) {
      return preferredLanguage === 'pt'
        ? `${META_LOGO_MINI} Olá, ${name}! Que bom ter você de volta.`
        : `${META_LOGO_MINI} Hello, ${name}! Great to have you back.`;
    }
    
    // Random greeting
    const greetings = META_GREETINGS.filter(g => 
      preferredLanguage === 'pt' ? !g.includes('Hello') : !g.includes('Olá')
    );
    return greetings[Math.floor(Math.random() * greetings.length)] || META_GREETINGS[0];
  }

  /**
   * Get an encouragement message
   */
  getEncouragement(): string {
    const { preferredLanguage } = this.userProfile;
    const encouragements = META_ENCOURAGEMENTS.filter(e =>
      preferredLanguage === 'pt' ? !e.includes('Great') : !e.includes('Excelente')
    );
    return encouragements[Math.floor(Math.random() * encouragements.length)] || META_ENCOURAGEMENTS[0];
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<MetaUserProfile>): Promise<void> {
    this.userProfile = { ...this.userProfile, ...updates };
    await this.persist();
  }

  /**
   * Get current user profile
   */
  getProfile(): MetaUserProfile {
    return { ...this.userProfile };
  }

  /**
   * Record an interaction
   */
  async recordInteraction(): Promise<void> {
    this.userProfile.totalInteractions++;
    this.userProfile.lastInteraction = new Date().toISOString();
    await this.persist();
  }

  /**
   * Add a memory entry (shared with other agents)
   */
  async addMemory(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<void> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    this.sharedMemory.push(newEntry);
    
    // Keep only last 100 entries
    if (this.sharedMemory.length > 100) {
      this.sharedMemory = this.sharedMemory.slice(-100);
    }
    
    await this.persist();
  }

  /**
   * Get memories by type
   */
  getMemories(type?: MemoryEntry['type']): MemoryEntry[] {
    if (!type) return [...this.sharedMemory];
    return this.sharedMemory.filter(m => m.type === type);
  }

  /**
   * Get memories from a specific agent
   */
  getMemoriesFromAgent(agentId: string): MemoryEntry[] {
    return this.sharedMemory.filter(m => m.agentId === agentId);
  }

  /**
   * Mark a module as completed
   */
  async completeModule(moduleId: string): Promise<void> {
    if (!this.userProfile.completedModules.includes(moduleId)) {
      this.userProfile.completedModules.push(moduleId);
      
      // Add to shared memory
      await this.addMemory({
        agentId: 'meta',
        type: 'progress',
        content: `Completed module: ${moduleId}`,
        confidence: 1.0,
      });
      
      await this.persist();
    }
  }

  /**
   * Record a strength identified during learning
   */
  async addStrength(strength: string): Promise<void> {
    if (!this.userProfile.strengths.includes(strength)) {
      this.userProfile.strengths.push(strength);
      
      await this.addMemory({
        agentId: 'meta',
        type: 'insight',
        content: `Identified strength: ${strength}`,
        confidence: 0.8,
      });
      
      await this.persist();
    }
  }

  /**
   * Record an area that needs improvement
   */
  async addAreaToImprove(area: string): Promise<void> {
    if (!this.userProfile.areasToImprove.includes(area)) {
      this.userProfile.areasToImprove.push(area);
      
      await this.addMemory({
        agentId: 'meta',
        type: 'insight',
        content: `Area to improve: ${area}`,
        confidence: 0.8,
      });
      
      await this.persist();
    }
  }

  /**
   * Get personalized next step recommendation
   */
  getNextStepRecommendation(): string {
    const { completedModules, experienceLevel, preferredLanguage } = this.userProfile;
    
    const moduleOrder = [
      'meta-analysis-fundamentals',
      'forest-plot-creation',
      'data-extraction',
      'heterogeneity-analysis',
      'publication-bias-detection',
      'grade-assessment',
      'r-code-generation',
    ];
    
    // Find first incomplete module
    const nextModule = moduleOrder.find(m => !completedModules.includes(m));
    
    if (!nextModule) {
      return preferredLanguage === 'pt'
        ? 'Parabéns! Você completou todos os módulos básicos. Que tal explorar os tópicos avançados?'
        : 'Congratulations! You\'ve completed all basic modules. How about exploring advanced topics?';
    }
    
    const moduleNames: Record<string, { en: string; pt: string }> = {
      'meta-analysis-fundamentals': { en: 'Meta-Analysis Fundamentals', pt: 'Fundamentos de Meta-Análise' },
      'forest-plot-creation': { en: 'Forest Plot Creation', pt: 'Criação de Forest Plot' },
      'data-extraction': { en: 'Data Extraction', pt: 'Extração de Dados' },
      'heterogeneity-analysis': { en: 'Heterogeneity Analysis', pt: 'Análise de Heterogeneidade' },
      'publication-bias-detection': { en: 'Publication Bias Detection', pt: 'Detecção de Viés de Publicação' },
      'grade-assessment': { en: 'GRADE Assessment', pt: 'Avaliação GRADE' },
      'r-code-generation': { en: 'R Code Generation', pt: 'Geração de Código R' },
    };
    
    const lang = preferredLanguage === 'es' ? 'en' : preferredLanguage;
    const moduleName = moduleNames[nextModule]?.[lang] || nextModule;
    
    return preferredLanguage === 'pt'
      ? `Recomendo que você continue com "${moduleName}". Posso te ajudar a começar?`
      : `I recommend continuing with "${moduleName}". Would you like me to help you get started?`;
  }

  /**
   * Generate system prompt for LLM with Meta's personality
   */
  getSystemPrompt(): string {
    const { name, preferredLanguage, experienceLevel, completedModules, strengths, areasToImprove } = this.userProfile;
    
    const basePrompt = `You are Meta, an AI teaching assistant specialized in meta-analysis and evidence synthesis. You are warm, encouraging, and use the Socratic method to help students learn.

Your personality:
- Patient and supportive
- Uses questions to guide understanding
- Celebrates progress and learning
- Adapts explanations to the student's level
- Bilingual (English and Portuguese)

Current student profile:
- Name: ${name || 'Not provided'}
- Preferred language: ${preferredLanguage === 'pt' ? 'Portuguese' : 'English'}
- Experience level: ${experienceLevel}
- Completed modules: ${completedModules.length > 0 ? completedModules.join(', ') : 'None yet'}
- Strengths: ${strengths.length > 0 ? strengths.join(', ') : 'Still discovering'}
- Areas to improve: ${areasToImprove.length > 0 ? areasToImprove.join(', ') : 'Still discovering'}

Guidelines:
1. Respond in ${preferredLanguage === 'pt' ? 'Portuguese' : 'English'} unless asked otherwise
2. Use the Socratic method - ask guiding questions
3. Provide practical R code examples when relevant
4. Reference the metafor package for meta-analysis
5. Be encouraging but honest about areas for improvement
6. Connect concepts to real-world research applications`;

    return basePrompt;
  }

  /**
   * Reset Meta's memory (for testing or user request)
   */
  async reset(): Promise<void> {
    this.userProfile = this.getDefaultProfile();
    this.sharedMemory = [];
    this.context = this.getDefaultContext();
    await AsyncStorage.removeItem(META_PREFERENCES_KEY);
    await AsyncStorage.removeItem(META_MEMORY_KEY);
  }
}

// Export singleton getter
export function getMetaAgent(): MetaAgentService {
  return MetaAgentService.getInstance();
}

// Export for testing
export { MetaAgentService };
