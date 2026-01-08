/**
 * Interactive Tutorial System Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock react-native
vi.mock('react-native', () => ({
  StyleSheet: { create: (styles: any) => styles },
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  Modal: 'Modal',
  ScrollView: 'ScrollView',
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  Platform: { OS: 'ios' },
}));

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    View: 'Animated.View',
    Text: 'Animated.Text',
  },
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  withTiming: (v: any) => v,
  withSpring: (v: any) => v,
  withSequence: (...args: any[]) => args[0],
  withRepeat: (v: any) => v,
  withDelay: (_: number, v: any) => v,
  Easing: { inOut: () => {}, out: () => {}, linear: {} },
  FadeIn: { duration: () => ({ delay: () => ({}) }) },
  FadeOut: { duration: () => ({}) },
  SlideInUp: { duration: () => ({}) },
  SlideOutDown: { duration: () => ({}) },
  ZoomIn: {},
  FadeInDown: { delay: () => ({ duration: () => ({}) }) },
}));

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Forest Plot Tutorial Steps', () => {
  it('should have correct number of steps', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    expect(forestPlotTutorialSteps.length).toBe(12);
  });

  it('should have unique step IDs', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const ids = forestPlotTutorialSteps.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should start with intro step', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    expect(forestPlotTutorialSteps[0].id).toBe('intro');
    expect(forestPlotTutorialSteps[0].type).toBe('info');
  });

  it('should end with celebration step', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const lastStep = forestPlotTutorialSteps[forestPlotTutorialSteps.length - 1];
    expect(lastStep.id).toBe('celebration');
    expect(lastStep.type).toBe('celebration');
  });

  it('should have quiz steps with options', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const quizSteps = forestPlotTutorialSteps.filter(s => s.type === 'quiz');
    expect(quizSteps.length).toBeGreaterThan(0);
    
    quizSteps.forEach(quiz => {
      expect(quiz.quizOptions).toBeDefined();
      expect(quiz.quizOptions!.length).toBeGreaterThan(1);
      // Each quiz should have exactly one correct answer
      const correctAnswers = quiz.quizOptions!.filter(o => o.isCorrect);
      expect(correctAnswers.length).toBe(1);
    });
  });

  it('should have action step with description', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const actionSteps = forestPlotTutorialSteps.filter(s => s.type === 'action');
    expect(actionSteps.length).toBeGreaterThan(0);
    
    actionSteps.forEach(action => {
      expect(action.actionDescription).toBeDefined();
      expect(action.actionDescription!.length).toBeGreaterThan(0);
    });
  });
});

describe('Tutorial Metadata', () => {
  it('should return correct metadata', async () => {
    const { getForestPlotTutorialMeta, FOREST_PLOT_TUTORIAL_ID } = await import('../lib/tutorial/forest-plot-tutorial');
    const meta = getForestPlotTutorialMeta();
    
    expect(meta.id).toBe(FOREST_PLOT_TUTORIAL_ID);
    expect(meta.title).toContain('Forest Plot');
    expect(meta.durationMinutes).toBeGreaterThan(0);
    expect(meta.difficulty).toBe('beginner');
    expect(meta.badge).toBeDefined();
    expect(meta.badge.id).toBe('forest-ranger');
  });
});

describe('Tutorial Step Types', () => {
  it('should have valid step types', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const validTypes = ['info', 'action', 'quiz', 'celebration'];
    
    forestPlotTutorialSteps.forEach(step => {
      expect(validTypes).toContain(step.type);
    });
  });

  it('should have valid poses', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const validPoses = ['greeting', 'thinking', 'excited', 'pointing', 'celebrating', 'teaching', undefined];
    
    forestPlotTutorialSteps.forEach(step => {
      expect(validPoses).toContain(step.pose);
    });
  });
});

describe('Tutorial Content Quality', () => {
  it('should have non-empty messages', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    
    forestPlotTutorialSteps.forEach(step => {
      expect(step.message.length).toBeGreaterThan(10);
    });
  });

  it('should have non-empty titles', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    
    forestPlotTutorialSteps.forEach(step => {
      expect(step.title.length).toBeGreaterThan(0);
    });
  });

  it('should include educational hints where appropriate', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const stepsWithHints = forestPlotTutorialSteps.filter(s => s.hint);
    
    // At least some steps should have hints
    expect(stepsWithHints.length).toBeGreaterThan(2);
  });
});

describe('Quiz Validation', () => {
  it('should have meaningful quiz options', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const quizSteps = forestPlotTutorialSteps.filter(s => s.type === 'quiz');
    
    quizSteps.forEach(quiz => {
      quiz.quizOptions!.forEach(option => {
        expect(option.text.length).toBeGreaterThan(5);
      });
    });
  });

  it('should have 4 options per quiz', async () => {
    const { forestPlotTutorialSteps } = await import('../lib/tutorial/forest-plot-tutorial');
    const quizSteps = forestPlotTutorialSteps.filter(s => s.type === 'quiz');
    
    quizSteps.forEach(quiz => {
      expect(quiz.quizOptions!.length).toBe(4);
    });
  });
});
