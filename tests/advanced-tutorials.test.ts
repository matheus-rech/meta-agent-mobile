/**
 * Tests for Advanced Tutorial Features
 * 
 * Tests heterogeneity tutorial, subgroup tutorial, progress service,
 * bookmarks, and voice narration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock react-native
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock expo-modules-core
vi.mock('expo-modules-core', () => ({
  NativeModule: class {},
  requireNativeModule: () => ({}),
}));

// Mock minimax-tts.service
vi.mock('@/lib/glass/minimax-tts.service', () => ({
  minimaxTTSService: {
    textToSpeech: vi.fn().mockResolvedValue({ audioUrl: 'mock://audio.mp3' }),
    initialize: vi.fn(),
    isReady: vi.fn().mockReturnValue(true),
  },
}));

// Mock expo-sharing
vi.mock('expo-sharing', () => ({
  shareAsync: vi.fn(),
  isAvailableAsync: vi.fn().mockResolvedValue(true),
}));

// Mock expo-file-system
vi.mock('expo-file-system/legacy', () => ({
  default: {},
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
}));

// Mock expo-av
vi.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: vi.fn().mockResolvedValue({
        sound: {
          setOnPlaybackStatusUpdate: vi.fn(),
          stopAsync: vi.fn(),
          unloadAsync: vi.fn(),
          pauseAsync: vi.fn(),
          playAsync: vi.fn(),
        },
      }),
    },
  },
}));

describe('Heterogeneity Tutorial', () => {
  it('should have correct tutorial metadata', async () => {
    const { getHeterogeneityTutorialMeta } = await import('../lib/tutorial/heterogeneity-tutorial');
    const meta = getHeterogeneityTutorialMeta();
    
    expect(meta.id).toBe('heterogeneity-analysis');
    expect(meta.title).toBe('Understanding Heterogeneity');
    expect(meta.difficulty).toBe('intermediate');
    expect(meta.stepsCount).toBeGreaterThan(0);
  });
  
  it('should have valid tutorial steps', async () => {
    const { heterogeneityTutorialSteps } = await import('../lib/tutorial/heterogeneity-tutorial');
    
    expect(heterogeneityTutorialSteps.length).toBeGreaterThan(0);
    
    // Check first step
    expect(heterogeneityTutorialSteps[0].id).toBe('intro');
    expect(heterogeneityTutorialSteps[0].type).toBe('info');
    
    // Check last step is celebration
    const lastStep = heterogeneityTutorialSteps[heterogeneityTutorialSteps.length - 1];
    expect(lastStep.type).toBe('celebration');
  });
  
  it('should have quiz steps with valid options', async () => {
    const { heterogeneityTutorialSteps } = await import('../lib/tutorial/heterogeneity-tutorial');
    
    const quizSteps = heterogeneityTutorialSteps.filter(s => s.type === 'quiz');
    expect(quizSteps.length).toBeGreaterThan(0);
    
    quizSteps.forEach(step => {
      expect(step.quizOptions).toBeDefined();
      expect(step.quizOptions!.length).toBeGreaterThanOrEqual(2);
      
      // Each quiz should have exactly one correct answer
      const correctAnswers = step.quizOptions!.filter(o => o.isCorrect);
      expect(correctAnswers.length).toBe(1);
      
      // Each option should have an id
      step.quizOptions!.forEach(opt => {
        expect(opt.id).toBeDefined();
        expect(opt.text).toBeDefined();
      });
    });
  });
  
  it('should cover key heterogeneity concepts', async () => {
    const { heterogeneityTutorialSteps } = await import('../lib/tutorial/heterogeneity-tutorial');
    
    const allContent = heterogeneityTutorialSteps.map(s => s.message.toLowerCase()).join(' ');
    
    // Key concepts should be mentioned
    expect(allContent).toContain('i²');
    expect(allContent).toContain('q statistic');
    expect(allContent).toContain('tau');
    expect(allContent).toContain('prediction interval');
  });
});

describe('Subgroup Tutorial', () => {
  it('should have correct tutorial metadata', async () => {
    const { getSubgroupTutorialMeta } = await import('../lib/tutorial/subgroup-tutorial');
    const meta = getSubgroupTutorialMeta();
    
    expect(meta.id).toBe('subgroup-analysis');
    expect(meta.title).toBe('Subgroup Analysis');
    expect(meta.difficulty).toBe('intermediate');
    expect(meta.prerequisites).toContain('heterogeneity-analysis');
  });
  
  it('should have valid tutorial steps', async () => {
    const { subgroupTutorialSteps } = await import('../lib/tutorial/subgroup-tutorial');
    
    expect(subgroupTutorialSteps.length).toBeGreaterThan(0);
    
    // Check first step
    expect(subgroupTutorialSteps[0].id).toBe('intro');
    expect(subgroupTutorialSteps[0].type).toBe('info');
    
    // Check last step is celebration
    const lastStep = subgroupTutorialSteps[subgroupTutorialSteps.length - 1];
    expect(lastStep.type).toBe('celebration');
  });
  
  it('should cover BCG latitude example', async () => {
    const { subgroupTutorialSteps } = await import('../lib/tutorial/subgroup-tutorial');
    
    const allContent = subgroupTutorialSteps.map(s => s.message.toLowerCase()).join(' ');
    
    expect(allContent).toContain('bcg');
    expect(allContent).toContain('latitude');
  });
  
  it('should have R code example', async () => {
    const { subgroupTutorialSteps } = await import('../lib/tutorial/subgroup-tutorial');
    
    const actionSteps = subgroupTutorialSteps.filter(s => s.type === 'action');
    const hasRCode = actionSteps.some(s => s.codeExample && s.codeExample.includes('metafor'));
    
    expect(hasRCode).toBe(true);
  });
});

describe('Tutorial Progress Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should start a new tutorial', async () => {
    const { tutorialProgressService } = await import('../lib/tutorial/progress.service');
    
    // Clear any existing state
    await tutorialProgressService.clearAll();
    
    const progress = await tutorialProgressService.startTutorial('test-tutorial');
    
    expect(progress.tutorialId).toBe('test-tutorial');
    expect(progress.currentStepIndex).toBe(0);
    expect(progress.completedStepIds).toEqual([]);
    expect(progress.completedAt).toBeNull();
  });
  
  it('should update step progress', async () => {
    const { tutorialProgressService } = await import('../lib/tutorial/progress.service');
    
    await tutorialProgressService.clearAll();
    await tutorialProgressService.startTutorial('test-tutorial');
    
    await tutorialProgressService.updateStep('test-tutorial', 1, 'step-1', 5000);
    
    const progress = await tutorialProgressService.getProgress('test-tutorial');
    
    expect(progress?.currentStepIndex).toBe(1);
    expect(progress?.completedStepIds).toContain('step-1');
    expect(progress?.totalTimeSpentMs).toBeGreaterThanOrEqual(5000);
  });
  
  it('should record quiz answers', async () => {
    const { tutorialProgressService } = await import('../lib/tutorial/progress.service');
    
    await tutorialProgressService.clearAll();
    await tutorialProgressService.startTutorial('test-tutorial');
    
    await tutorialProgressService.recordQuizAnswer('test-tutorial', 'quiz-1', true);
    await tutorialProgressService.recordQuizAnswer('test-tutorial', 'quiz-2', false);
    
    const progress = await tutorialProgressService.getProgress('test-tutorial');
    
    expect(progress?.quizScores.length).toBe(2);
    expect(progress?.quizScores.find(q => q.stepId === 'quiz-1')?.correct).toBe(true);
    expect(progress?.quizScores.find(q => q.stepId === 'quiz-2')?.correct).toBe(false);
  });
  
  it('should complete tutorial and award badge', async () => {
    const { tutorialProgressService } = await import('../lib/tutorial/progress.service');
    
    await tutorialProgressService.clearAll();
    await tutorialProgressService.startTutorial('test-tutorial');
    
    const badge = await tutorialProgressService.completeTutorial('test-tutorial', {
      id: 'test-badge',
      name: 'Test Badge',
      icon: '🏆',
      description: 'Test badge description',
    });
    
    expect(badge.id).toBe('test-badge');
    expect(badge.tutorialId).toBe('test-tutorial');
    expect(badge.earnedAt).toBeGreaterThan(0);
    
    const progress = await tutorialProgressService.getProgress('test-tutorial');
    expect(progress?.completedAt).not.toBeNull();
  });
  
  it('should create and retrieve bookmarks', async () => {
    const { tutorialProgressService } = await import('../lib/tutorial/progress.service');
    
    await tutorialProgressService.clearAll();
    
    const bookmark = await tutorialProgressService.createBookmark(
      'test-tutorial',
      'step-5',
      5,
      'Important Step',
      'Remember this!'
    );
    
    expect(bookmark.tutorialId).toBe('test-tutorial');
    expect(bookmark.stepId).toBe('step-5');
    expect(bookmark.note).toBe('Remember this!');
    
    const bookmarks = await tutorialProgressService.getBookmarks('test-tutorial');
    expect(bookmarks.length).toBe(1);
    expect(bookmarks[0].stepTitle).toBe('Important Step');
  });
  
  it('should remove bookmarks', async () => {
    const { tutorialProgressService } = await import('../lib/tutorial/progress.service');
    
    await tutorialProgressService.clearAll();
    
    const bookmark = await tutorialProgressService.createBookmark(
      'test-tutorial',
      'step-5',
      5,
      'Important Step'
    );
    
    await tutorialProgressService.removeBookmark(bookmark.id);
    
    const bookmarks = await tutorialProgressService.getBookmarks('test-tutorial');
    expect(bookmarks.length).toBe(0);
  });
  
  it('should calculate statistics', async () => {
    const { tutorialProgressService } = await import('../lib/tutorial/progress.service');
    
    await tutorialProgressService.clearAll();
    
    // Start and complete a tutorial
    await tutorialProgressService.startTutorial('test-tutorial-1');
    await tutorialProgressService.recordQuizAnswer('test-tutorial-1', 'q1', true);
    await tutorialProgressService.recordQuizAnswer('test-tutorial-1', 'q2', true);
    await tutorialProgressService.completeTutorial('test-tutorial-1', {
      id: 'badge-1',
      name: 'Badge 1',
      icon: '🏆',
      description: 'First badge',
    });
    
    // Start another tutorial
    await tutorialProgressService.startTutorial('test-tutorial-2');
    
    const stats = await tutorialProgressService.getStats();
    
    expect(stats.totalTutorialsStarted).toBe(2);
    expect(stats.totalTutorialsCompleted).toBe(1);
    expect(stats.totalQuizzesTaken).toBe(2);
    expect(stats.totalQuizzesCorrect).toBe(2);
    expect(stats.badgesEarned).toBe(1);
  });
});

describe('Voice Narration Service', () => {
  it('should be enabled by default', async () => {
    const { voiceNarrationService } = await import('../lib/tutorial/voice-narration.service');
    
    expect(voiceNarrationService.isEnabled()).toBe(true);
  });
  
  it('should toggle enabled state', async () => {
    const { voiceNarrationService } = await import('../lib/tutorial/voice-narration.service');
    
    voiceNarrationService.setEnabled(false);
    expect(voiceNarrationService.isEnabled()).toBe(false);
    
    voiceNarrationService.setEnabled(true);
    expect(voiceNarrationService.isEnabled()).toBe(true);
  });
  
  it('should not be playing initially', async () => {
    const { voiceNarrationService } = await import('../lib/tutorial/voice-narration.service');
    
    expect(voiceNarrationService.isPlaying()).toBe(false);
    expect(voiceNarrationService.getCurrentStepId()).toBeNull();
  });
});

describe('Tutorial Integration', () => {
  it('should export all tutorials from index', async () => {
    const tutorialModule = await import('../lib/tutorial');
    
    // Check heterogeneity tutorial exports
    expect(tutorialModule.heterogeneityTutorialSteps).toBeDefined();
    expect(tutorialModule.getHeterogeneityTutorialMeta).toBeDefined();
    
    // Check subgroup tutorial exports
    expect(tutorialModule.subgroupTutorialSteps).toBeDefined();
    expect(tutorialModule.getSubgroupTutorialMeta).toBeDefined();
    
    // Check progress service exports
    expect(tutorialModule.tutorialProgressService).toBeDefined();
    expect(tutorialModule.createBookmark).toBeDefined();
    expect(tutorialModule.getBadges).toBeDefined();
    
    // Check voice narration exports
    expect(tutorialModule.voiceNarrationService).toBeDefined();
    expect(tutorialModule.narrateTutorialStep).toBeDefined();
  });
  
  it('should have consistent badge structure across tutorials', async () => {
    const { getHeterogeneityTutorialMeta } = await import('../lib/tutorial/heterogeneity-tutorial');
    const { getSubgroupTutorialMeta } = await import('../lib/tutorial/subgroup-tutorial');
    
    const hetMeta = getHeterogeneityTutorialMeta();
    const subMeta = getSubgroupTutorialMeta();
    
    // Both should have badges
    expect(hetMeta.badge).toBeDefined();
    expect(subMeta.badge).toBeDefined();
    
    // Badges should have required fields
    [hetMeta.badge, subMeta.badge].forEach(badge => {
      expect(badge!.id).toBeDefined();
      expect(badge!.name).toBeDefined();
      expect(badge!.icon).toBeDefined();
      expect(badge!.description).toBeDefined();
    });
    
    // Badge IDs should be unique
    expect(hetMeta.badge!.id).not.toBe(subMeta.badge!.id);
  });
});
