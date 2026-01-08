/**
 * Tests for TUI Redesign and New Features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-native
vi.mock('react-native', () => ({
  TurboModuleRegistry: { getEnforcing: vi.fn(), get: vi.fn() },
  Platform: { OS: 'ios' },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  StyleSheet: { create: (styles: any) => styles },
  Share: { share: vi.fn().mockResolvedValue({ action: 'sharedAction' }), sharedAction: 'sharedAction' },
  Linking: { openURL: vi.fn(), canOpenURL: vi.fn().mockResolvedValue(true) },
}));

// Mock expo modules
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
}));

vi.mock('react-native-reanimated', () => ({
  default: {
    createAnimatedComponent: vi.fn((comp: any) => comp),
  },
  useSharedValue: vi.fn((val: any) => ({ value: val })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((val: any) => val),
  withSpring: vi.fn((val: any) => val),
  withRepeat: vi.fn((val: any) => val),
  withSequence: vi.fn((...vals: any[]) => vals[0]),
  Easing: { linear: vi.fn(), inOut: vi.fn() },
  FadeIn: { duration: vi.fn().mockReturnThis() },
  FadeOut: { duration: vi.fn().mockReturnThis() },
  SlideInRight: { duration: vi.fn().mockReturnThis() },
  SlideOutLeft: { duration: vi.fn().mockReturnThis() },
  SlideInUp: { duration: vi.fn().mockReturnThis() },
  runOnJS: vi.fn((fn: any) => fn),
}));

vi.mock('react-native-worklets', () => ({
  WorkletsModule: {},
  createWorkletContextWeb: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Theme Colors', () => {
  it('should have black background colors', () => {
    const { themeColors } = require('../theme.config.js');
    
    expect(themeColors.background.light).toBe('#000000');
    expect(themeColors.background.dark).toBe('#000000');
  });
  
  it('should have glass blue as primary color', () => {
    const { themeColors } = require('../theme.config.js');
    
    expect(themeColors.primary.light).toBe('#00BFFF');
    expect(themeColors.primary.dark).toBe('#00BFFF');
  });
  
  it('should have fox orange colors', () => {
    const { themeColors } = require('../theme.config.js');
    
    expect(themeColors.foxOrange).toBeDefined();
    expect(themeColors.foxOrange.light).toBe('#FF8C00');
  });
  
  it('should have ASCII-specific colors', () => {
    const { themeColors } = require('../theme.config.js');
    
    expect(themeColors.asciiBlue).toBeDefined();
    expect(themeColors.asciiGlow).toBeDefined();
    expect(themeColors.asciiDim).toBeDefined();
  });
});

describe('Meta-Regression Tutorial', () => {
  it('should have all required steps', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    expect(metaRegressionTutorialSteps.length).toBeGreaterThanOrEqual(15);
  });
  
  it('should have intro step', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const introStep = metaRegressionTutorialSteps.find(s => s.id === 'intro');
    expect(introStep).toBeDefined();
    expect(introStep?.type).toBe('info');
  });
  
  it('should have quiz steps', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const quizSteps = metaRegressionTutorialSteps.filter(s => s.type === 'quiz');
    expect(quizSteps.length).toBeGreaterThanOrEqual(3);
  });
  
  it('should have R code examples', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const codeSteps = metaRegressionTutorialSteps.filter(s => s.codeExample);
    expect(codeSteps.length).toBeGreaterThanOrEqual(2);
  });
  
  it('should have celebration step with badge', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const celebrationStep = metaRegressionTutorialSteps.find(s => s.type === 'celebration');
    expect(celebrationStep).toBeDefined();
    expect(celebrationStep?.badge).toBeDefined();
    expect(celebrationStep?.badge?.id).toBe('meta-regression-master');
  });
  
  it('should have tutorial metadata', async () => {
    const { getMetaRegressionTutorialMeta } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const meta = getMetaRegressionTutorialMeta();
    expect(meta.id).toBe('meta-regression');
    expect(meta.difficulty).toBe('advanced');
    expect(meta.prerequisites).toContain('heterogeneity-analysis');
    expect(meta.prerequisites).toContain('subgroup-analysis');
  });
});

describe('Badge Sharing Service', () => {
  it('should generate badge share content', async () => {
    const { badgeSharingService } = await import('../lib/tutorial/badge-sharing.service');
    
    const content = badgeSharingService.generateBadgeShareContent({
      badge: {
        id: 'test-badge',
        name: 'Test Badge',
        icon: '🏆',
        description: 'Test badge description',
        earnedAt: Date.now(),
        tutorialId: 'test-tutorial',
      },
      tutorialTitle: 'Test Tutorial',
      completionDate: new Date(),
    });
    
    expect(content.title).toContain('Test Badge');
    expect(content.message).toContain('Test Badge');
    expect(content.message).toContain('🏆');
    expect(content.hashtags).toContain('MetaAnalysis');
  });
  
  it('should generate progress share content', async () => {
    const { badgeSharingService } = await import('../lib/tutorial/badge-sharing.service');
    
    const content = badgeSharingService.generateProgressShareContent({
      stats: {
        totalTutorialsStarted: 6,
        totalTutorialsCompleted: 5,
        badgesEarned: 3,
        totalQuizzesTaken: 20,
        totalQuizzesCorrect: 18,
        totalTimeSpentMs: 3600000, // 1 hour
        currentStreak: 7,
        longestStreak: 14,
        lastActivityAt: Date.now(),
      },
    });
    
    expect(content.message).toContain('5');
    expect(content.message).toContain('3');
    expect(content.message).toContain('90%'); // 18/20 = 90%
  });
  
  it('should generate ASCII badge card', async () => {
    const { generateBadgeCard } = await import('../lib/tutorial/badge-sharing.service');
    
    const card = generateBadgeCard(
      {
        id: 'test-badge',
        name: 'Test Badge',
        icon: '🏆',
        description: 'Test badge description',
        earnedAt: Date.now(),
        tutorialId: 'test-tutorial',
      },
      'Test Tutorial'
    );
    
    expect(card).toContain('╔');
    expect(card).toContain('╚');
    expect(card).toContain('BADGE EARNED');
    expect(card).toContain('Test Badge');
  });
});

describe('Spaced Repetition Service', () => {
  beforeEach(async () => {
    const { spacedRepetitionService } = await import('../lib/tutorial/spaced-repetition.service');
    await spacedRepetitionService.reset();
  });
  
  it('should add questions', async () => {
    const { spacedRepetitionService } = await import('../lib/tutorial/spaced-repetition.service');
    
    await spacedRepetitionService.addQuestion({
      id: 'q1',
      tutorialId: 'test',
      question: 'What is I²?',
      options: [
        { id: 'a', text: 'Heterogeneity measure', isCorrect: true },
        { id: 'b', text: 'Effect size', isCorrect: false },
      ],
      topic: 'Heterogeneity',
      difficulty: 'medium',
    });
    
    const dueCards = await spacedRepetitionService.getDueCards();
    expect(dueCards.length).toBe(1);
  });
  
  it('should process reviews with SM-2 algorithm', async () => {
    const { spacedRepetitionService } = await import('../lib/tutorial/spaced-repetition.service');
    
    await spacedRepetitionService.addQuestion({
      id: 'q2',
      tutorialId: 'test',
      question: 'Test question',
      options: [{ id: 'a', text: 'Answer', isCorrect: true }],
      topic: 'Test',
      difficulty: 'easy',
    });
    
    // Process a successful review
    const card = await spacedRepetitionService.processReview('q2', 5);
    
    expect(card).toBeDefined();
    expect(card?.repetitions).toBe(1);
    expect(card?.interval).toBe(1); // First successful review = 1 day
  });
  
  it('should reset interval on failed review', async () => {
    const { spacedRepetitionService } = await import('../lib/tutorial/spaced-repetition.service');
    
    await spacedRepetitionService.addQuestion({
      id: 'q3',
      tutorialId: 'test',
      question: 'Test question',
      options: [{ id: 'a', text: 'Answer', isCorrect: true }],
      topic: 'Test',
      difficulty: 'easy',
    });
    
    // Successful review
    await spacedRepetitionService.processReview('q3', 5);
    await spacedRepetitionService.processReview('q3', 5);
    
    // Failed review (quality < 3)
    const card = await spacedRepetitionService.processReview('q3', 1);
    
    expect(card?.repetitions).toBe(0);
    expect(card?.interval).toBe(1);
  });
  
  it('should calculate quality from answer', async () => {
    const { spacedRepetitionService } = await import('../lib/tutorial/spaced-repetition.service');
    
    // Correct answer, fast response
    const quality1 = spacedRepetitionService.calculateQuality(true, 2000, 'medium');
    expect(quality1).toBe(5); // Fast correct = 5
    
    // Correct answer, slow response
    const quality2 = spacedRepetitionService.calculateQuality(true, 15000, 'medium');
    expect(quality2).toBe(3); // Slow correct = 3
    
    // Wrong answer
    const quality3 = spacedRepetitionService.calculateQuality(false, 5000, 'medium');
    expect(quality3).toBeLessThan(3);
  });
  
  it('should get statistics', async () => {
    const { spacedRepetitionService } = await import('../lib/tutorial/spaced-repetition.service');
    
    await spacedRepetitionService.addQuestion({
      id: 'q4',
      tutorialId: 'test',
      question: 'Test question',
      options: [{ id: 'a', text: 'Answer', isCorrect: true }],
      topic: 'Test',
      difficulty: 'easy',
    });
    
    const stats = await spacedRepetitionService.getStats();
    
    expect(stats.totalCards).toBe(1);
    expect(stats.averageEaseFactor).toBeDefined();
  });
});

describe('TUI Button Component', () => {
  it('should export TUIButton', async () => {
    const { TUIButton } = await import('../components/tui/TUIButton');
    expect(TUIButton).toBeDefined();
  });
  
  it('should export TUIIconButton', async () => {
    const { TUIIconButton } = await import('../components/tui/TUIButton');
    expect(TUIIconButton).toBeDefined();
  });
  
  it('should export TUIActionBar', async () => {
    const { TUIActionBar } = await import('../components/tui/TUIButton');
    expect(TUIActionBar).toBeDefined();
  });
});

describe('Glass Fox Large Component', () => {
  it('should export GlassFoxLarge', async () => {
    const { GlassFoxLarge } = await import('../components/glass/GlassFoxLarge');
    expect(GlassFoxLarge).toBeDefined();
  });
  
  it('should export GlassFoxInline', async () => {
    const { GlassFoxInline } = await import('../components/glass/GlassFoxLarge');
    expect(GlassFoxInline).toBeDefined();
  });
  
  it('should export GlassFoxWalking', async () => {
    const { GlassFoxWalking } = await import('../components/glass/GlassFoxLarge');
    expect(GlassFoxWalking).toBeDefined();
  });
});

describe('Tutorial Step Config', () => {
  it('should support glassMessage field', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const stepWithGlassMessage = metaRegressionTutorialSteps.find(s => s.glassMessage);
    expect(stepWithGlassMessage).toBeDefined();
    expect(stepWithGlassMessage?.glassMessage).toBeTruthy();
  });
  
  it('should support glassEmotion field', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const stepWithEmotion = metaRegressionTutorialSteps.find(s => s.glassEmotion);
    expect(stepWithEmotion).toBeDefined();
    expect(['excited', 'teaching', 'curious', 'celebrating', 'thinking']).toContain(stepWithEmotion?.glassEmotion);
  });
  
  it('should support badge field in celebration steps', async () => {
    const { metaRegressionTutorialSteps } = await import('../lib/tutorial/meta-regression-tutorial');
    
    const celebrationStep = metaRegressionTutorialSteps.find(s => s.type === 'celebration');
    expect(celebrationStep?.badge).toBeDefined();
    expect(celebrationStep?.badge?.id).toBeTruthy();
    expect(celebrationStep?.badge?.name).toBeTruthy();
    expect(celebrationStep?.badge?.icon).toBeTruthy();
  });
});
