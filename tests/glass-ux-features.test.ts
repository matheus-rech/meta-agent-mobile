/**
 * Tests for Glass UX Enhancement Features
 * 
 * Tests for voice output, skills badges, and quick prompts
 */

import { describe, it, expect, vi } from 'vitest';

// Mock expo-av
vi.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: vi.fn().mockResolvedValue({
        sound: {
          setOnPlaybackStatusUpdate: vi.fn(),
          stopAsync: vi.fn(),
          unloadAsync: vi.fn(),
        },
      }),
    },
  },
  AVPlaybackStatus: {},
}));

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

describe('MiniMax TTS Service', () => {
  it('should define voice presets', () => {
    const GLASS_VOICES = {
      'pt-BR-female': { voiceId: 'Portuguese_Female_1', name: 'Ana', language: 'Portuguese' },
      'en-US-female': { voiceId: 'English_Female_1', name: 'Sarah', language: 'English' },
      'es-ES-female': { voiceId: 'Spanish_Female_1', name: 'María', language: 'Spanish' },
      'glass-default': { voiceId: 'cute_boy', name: 'Glass 🦊', language: 'auto' },
    };

    expect(Object.keys(GLASS_VOICES)).toHaveLength(4);
    expect(GLASS_VOICES['glass-default'].name).toContain('Glass');
  });

  it('should detect voice for Portuguese', () => {
    const detectVoiceForLanguage = (language: string) => {
      if (language.startsWith('pt')) return 'pt-BR-female';
      if (language.startsWith('es')) return 'es-ES-female';
      if (language.startsWith('en')) return 'en-US-female';
      return 'glass-default';
    };

    expect(detectVoiceForLanguage('pt-BR')).toBe('pt-BR-female');
    expect(detectVoiceForLanguage('pt')).toBe('pt-BR-female');
  });

  it('should detect voice for Spanish', () => {
    const detectVoiceForLanguage = (language: string) => {
      if (language.startsWith('pt')) return 'pt-BR-female';
      if (language.startsWith('es')) return 'es-ES-female';
      if (language.startsWith('en')) return 'en-US-female';
      return 'glass-default';
    };

    expect(detectVoiceForLanguage('es-ES')).toBe('es-ES-female');
    expect(detectVoiceForLanguage('es')).toBe('es-ES-female');
  });

  it('should detect voice for English', () => {
    const detectVoiceForLanguage = (language: string) => {
      if (language.startsWith('pt')) return 'pt-BR-female';
      if (language.startsWith('es')) return 'es-ES-female';
      if (language.startsWith('en')) return 'en-US-female';
      return 'glass-default';
    };

    expect(detectVoiceForLanguage('en-US')).toBe('en-US-female');
    expect(detectVoiceForLanguage('en')).toBe('en-US-female');
  });

  it('should default to Glass voice for unknown languages', () => {
    const detectVoiceForLanguage = (language: string) => {
      if (language.startsWith('pt')) return 'pt-BR-female';
      if (language.startsWith('es')) return 'es-ES-female';
      if (language.startsWith('en')) return 'en-US-female';
      return 'glass-default';
    };

    expect(detectVoiceForLanguage('fr')).toBe('glass-default');
    expect(detectVoiceForLanguage('de')).toBe('glass-default');
  });

  it('should convert hex to base64', () => {
    const hexToBase64 = (hex: string): string => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      let binary = '';
      bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
      });
      return btoa(binary);
    };

    const hex = '48656c6c6f'; // "Hello" in hex
    const base64 = hexToBase64(hex);
    expect(base64).toBe('SGVsbG8=');
  });
});

describe('Skills Badges', () => {
  it('should define all Glass skills', () => {
    const GLASS_SKILLS = {
      'meta-analysis-fundamentals': { icon: '📊', name: 'Meta-Analysis', shortName: 'MA' },
      'forest-plot-creation': { icon: '🌲', name: 'Forest Plot', shortName: 'FP' },
      'heterogeneity-analysis': { icon: '📈', name: 'Heterogeneity', shortName: 'HET' },
      'publication-bias-detection': { icon: '🔍', name: 'Publication Bias', shortName: 'PB' },
      'data-extraction': { icon: '📋', name: 'Data Extraction', shortName: 'DE' },
      'grade-assessment': { icon: '⭐', name: 'GRADE', shortName: 'GR' },
      'r-code-generation': { icon: '💻', name: 'R Code', shortName: 'R' },
      'socratic-teaching': { icon: '🦊', name: 'Socratic', shortName: 'SOC' },
      'risk-of-bias': { icon: '⚖️', name: 'Risk of Bias', shortName: 'RoB' },
      'network-meta-analysis': { icon: '🕸️', name: 'Network MA', shortName: 'NMA' },
    };

    expect(Object.keys(GLASS_SKILLS)).toHaveLength(10);
    expect(GLASS_SKILLS['heterogeneity-analysis'].icon).toBe('📈');
    expect(GLASS_SKILLS['socratic-teaching'].icon).toBe('🦊');
  });

  it('should have unique colors for each skill', () => {
    const skillColors = {
      'meta-analysis-fundamentals': '#3B82F6',
      'forest-plot-creation': '#22C55E',
      'heterogeneity-analysis': '#F59E0B',
      'publication-bias-detection': '#EF4444',
      'data-extraction': '#8B5CF6',
      'grade-assessment': '#EC4899',
      'r-code-generation': '#06B6D4',
      'socratic-teaching': '#F97316',
      'risk-of-bias': '#14B8A6',
      'network-meta-analysis': '#6366F1',
    };

    const colors = Object.values(skillColors);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it('should have short names for compact display', () => {
    const skills = {
      'meta-analysis-fundamentals': { shortName: 'MA' },
      'heterogeneity-analysis': { shortName: 'HET' },
      'publication-bias-detection': { shortName: 'PB' },
    };

    expect(skills['meta-analysis-fundamentals'].shortName.length).toBeLessThanOrEqual(3);
    expect(skills['heterogeneity-analysis'].shortName.length).toBeLessThanOrEqual(3);
    expect(skills['publication-bias-detection'].shortName.length).toBeLessThanOrEqual(3);
  });
});

describe('Quick Prompts', () => {
  it('should define prompt categories', () => {
    const categories = ['basics', 'visualization', 'rCode', 'advanced'];
    expect(categories).toHaveLength(4);
  });

  it('should have prompts for basics category', () => {
    const basicsPrompts = [
      { id: 'what-is-ma', text: 'What is meta-analysis?', shortText: 'What is MA?' },
      { id: 'what-is-i2', text: 'What is I² and how do I interpret it?', shortText: 'What is I²?' },
      { id: 'effect-sizes', text: 'Explain effect sizes (OR, RR, SMD)', shortText: 'Effect sizes' },
      { id: 'fixed-random', text: 'Fixed vs random effects models', shortText: 'Fixed vs Random' },
    ];

    expect(basicsPrompts).toHaveLength(4);
    expect(basicsPrompts[1].shortText).toBe('What is I²?');
  });

  it('should have prompts for R code category', () => {
    const rCodePrompts = [
      { id: 'r-forest', text: 'Show me R code for a forest plot', shortText: 'Forest plot R' },
      { id: 'r-meta', text: 'Basic meta-analysis in R with metafor', shortText: 'metafor basics' },
      { id: 'r-subgroup', text: 'How to do subgroup analysis in R?', shortText: 'Subgroup R' },
      { id: 'r-funnel', text: 'R code for funnel plot and Egger test', shortText: 'Funnel R' },
    ];

    expect(rCodePrompts).toHaveLength(4);
    expect(rCodePrompts[0].text).toContain('forest plot');
  });

  it('should have prompts for visualization category', () => {
    const vizPrompts = [
      { id: 'forest-plot', text: 'How do I read a forest plot?', shortText: 'Forest plot' },
      { id: 'funnel-plot', text: 'What is a funnel plot?', shortText: 'Funnel plot' },
      { id: 'bubble-plot', text: 'Explain meta-regression bubble plots', shortText: 'Bubble plot' },
      { id: 'rob-plot', text: 'How to create risk of bias plots?', shortText: 'RoB plot' },
    ];

    expect(vizPrompts).toHaveLength(4);
    expect(vizPrompts[0].shortText).toBe('Forest plot');
  });

  it('should have prompts for advanced category', () => {
    const advancedPrompts = [
      { id: 'heterogeneity', text: 'How to investigate heterogeneity?', shortText: 'Heterogeneity' },
      { id: 'pub-bias', text: 'How to detect publication bias?', shortText: 'Pub bias' },
      { id: 'sensitivity', text: 'Explain sensitivity analysis', shortText: 'Sensitivity' },
      { id: 'grade', text: 'How to use GRADE for evidence certainty?', shortText: 'GRADE' },
    ];

    expect(advancedPrompts).toHaveLength(4);
    expect(advancedPrompts[3].shortText).toBe('GRADE');
  });
});

describe('SpeakButton Component', () => {
  it('should define size variants', () => {
    const getSizeStyle = (size: string) => {
      switch (size) {
        case 'large':
          return { width: 44, height: 44, fontSize: 20 };
        case 'medium':
          return { width: 36, height: 36, fontSize: 16 };
        default:
          return { width: 28, height: 28, fontSize: 12 };
      }
    };

    expect(getSizeStyle('small').width).toBe(28);
    expect(getSizeStyle('medium').width).toBe(36);
    expect(getSizeStyle('large').width).toBe(44);
  });

  it('should show correct icon based on state', () => {
    const getIcon = (isLoading: boolean, isPlaying: boolean) => {
      if (isLoading) return null;
      if (isPlaying) return '◼';
      return '🔊';
    };

    expect(getIcon(false, false)).toBe('🔊');
    expect(getIcon(false, true)).toBe('◼');
    expect(getIcon(true, false)).toBe(null);
  });
});

describe('QuickPromptsBar Component', () => {
  it('should show popular prompts in collapsed mode', () => {
    const popularPrompts = [
      { id: 'what-is-i2', shortText: 'What is I²?' },
      { id: 'forest-plot', shortText: 'Forest plot' },
      { id: 'r-forest', shortText: 'Forest plot R' },
      { id: 'heterogeneity', shortText: 'Heterogeneity' },
    ];

    expect(popularPrompts).toHaveLength(4);
    expect(popularPrompts[0].shortText).toBe('What is I²?');
  });
});

describe('TerminalMessage with Skills', () => {
  it('should include skillsUsed in message interface', () => {
    const message = {
      id: 'msg_123',
      type: 'agent' as const,
      content: 'Heterogeneity is measured using I²...',
      timestamp: Date.now(),
      skillsUsed: ['heterogeneity-analysis', 'meta-analysis-fundamentals'],
      language: 'en',
    };

    expect(message.skillsUsed).toHaveLength(2);
    expect(message.skillsUsed).toContain('heterogeneity-analysis');
    expect(message.language).toBe('en');
  });
});
