/**
 * Tutorial System Tests
 * Tests for tutorial service, content, and state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Import after mocking
import { tutorialService } from '../lib/tutorial/tutorial.service';
import {
  tutorialModules,
  getModuleById,
  getModulesByCategory,
  getRecommendedOrder,
  welcomeModule,
  metaAnalysisBasicsModule,
  forestPlotModule,
} from '../lib/tutorial/content';
import {
  TutorialState,
  TutorialStep,
  TutorialModule,
  initialTutorialState,
} from '../lib/tutorial/types';

describe('Tutorial Content', () => {
  describe('Module Definitions', () => {
    it('should have 6 tutorial modules', () => {
      expect(tutorialModules).toHaveLength(6);
    });

    it('should have all required module properties', () => {
      tutorialModules.forEach((module) => {
        expect(module.id).toBeDefined();
        expect(module.title).toBeDefined();
        expect(module.description).toBeDefined();
        expect(module.category).toBeDefined();
        expect(module.icon).toBeDefined();
        expect(module.estimatedMinutes).toBeGreaterThan(0);
        expect(module.difficulty).toBeDefined();
        expect(module.steps).toBeDefined();
        expect(module.steps.length).toBeGreaterThan(0);
        expect(module.completionMessage).toBeDefined();
      });
    });

    it('should have valid step types in all modules', () => {
      const validTypes = ['info', 'action', 'input', 'choice', 'highlight', 'socratic'];
      
      tutorialModules.forEach((module) => {
        module.steps.forEach((step) => {
          expect(validTypes).toContain(step.type);
        });
      });
    });

    it('should have unique step IDs within each module', () => {
      tutorialModules.forEach((module) => {
        const stepIds = module.steps.map((s) => s.id);
        const uniqueIds = new Set(stepIds);
        expect(uniqueIds.size).toBe(stepIds.length);
      });
    });

    it('should have badges for all modules', () => {
      tutorialModules.forEach((module) => {
        expect(module.badge).toBeDefined();
        expect(module.badge?.id).toBeDefined();
        expect(module.badge?.name).toBeDefined();
        expect(module.badge?.icon).toBeDefined();
      });
    });
  });

  describe('Module Retrieval', () => {
    it('should get module by ID', () => {
      const module = getModuleById('welcome');
      expect(module).toBeDefined();
      expect(module?.id).toBe('welcome');
    });

    it('should return undefined for invalid module ID', () => {
      const module = getModuleById('invalid-module');
      expect(module).toBeUndefined();
    });

    it('should get modules by category', () => {
      const gettingStarted = getModulesByCategory('getting-started');
      expect(gettingStarted.length).toBeGreaterThan(0);
      gettingStarted.forEach((m) => {
        expect(m.category).toBe('getting-started');
      });
    });

    it('should get recommended order', () => {
      const order = getRecommendedOrder();
      expect(order).toHaveLength(6);
      expect(order[0].id).toBe('welcome');
    });
  });

  describe('Welcome Module', () => {
    it('should have correct structure', () => {
      expect(welcomeModule.id).toBe('welcome');
      expect(welcomeModule.category).toBe('getting-started');
      expect(welcomeModule.difficulty).toBe('beginner');
    });

    it('should have action steps with expected actions', () => {
      const actionSteps = welcomeModule.steps.filter((s) => s.type === 'action');
      expect(actionSteps.length).toBeGreaterThan(0);
      
      actionSteps.forEach((step) => {
        expect(step.expectedAction).toBeDefined();
      });
    });
  });

  describe('Meta-Analysis Basics Module', () => {
    it('should have quiz questions', () => {
      const choiceSteps = metaAnalysisBasicsModule.steps.filter((s) => s.type === 'choice');
      expect(choiceSteps.length).toBeGreaterThan(0);
      
      choiceSteps.forEach((step) => {
        expect(step.choices).toBeDefined();
        expect(step.choices?.length).toBeGreaterThan(0);
        
        // At least one choice should be correct
        const hasCorrect = step.choices?.some((c) => c.isCorrect);
        expect(hasCorrect).toBe(true);
      });
    });

    it('should have Socratic teaching step', () => {
      const socraticSteps = metaAnalysisBasicsModule.steps.filter((s) => s.type === 'socratic');
      expect(socraticSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Forest Plot Module', () => {
    it('should have prerequisites', () => {
      expect(forestPlotModule.prerequisites).toBeDefined();
      expect(forestPlotModule.prerequisites).toContain('meta-analysis-basics');
    });

    it('should have R code action steps', () => {
      const actionSteps = forestPlotModule.steps.filter((s) => s.type === 'action');
      const rCodeSteps = actionSteps.filter((s) => s.expectedAction?.includes('/r'));
      expect(rCodeSteps.length).toBeGreaterThan(0);
    });
  });
});

// Create a fresh service instance for testing
let testService: typeof tutorialService;

describe('Tutorial Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (AsyncStorage.getItem as any).mockResolvedValue(null);
    (AsyncStorage.setItem as any).mockResolvedValue(undefined);
    
    // Reset service state by reinitializing
    await tutorialService.resetAllProgress();
    await tutorialService.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', async () => {
      await tutorialService.initialize();
      const state = tutorialService.getState();
      
      expect(state.activeModuleId).toBeNull();
      expect(state.isActive).toBe(false);
      expect(state.completedModules).toEqual([]);
    });

    it('should persist state to storage', async () => {
      // Test that state changes are persisted
      await tutorialService.startModule('welcome');
      
      // Verify setItem was called to persist the state
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Module Management', () => {
    beforeEach(async () => {
      await tutorialService.initialize();
    });

    it('should start a module', async () => {
      const success = await tutorialService.startModule('welcome');
      
      expect(success).toBe(true);
      const state = tutorialService.getState();
      expect(state.activeModuleId).toBe('welcome');
      expect(state.isActive).toBe(true);
      expect(state.activeStepIndex).toBe(0);
    });

    it('should not start invalid module', async () => {
      const success = await tutorialService.startModule('invalid');
      
      expect(success).toBe(false);
      const state = tutorialService.getState();
      expect(state.activeModuleId).toBeNull();
    });

    it('should check prerequisites', async () => {
      // Forest plot requires meta-analysis-basics
      const metPrereqs = tutorialService.arePrerequisitesMet('forest-plot');
      expect(metPrereqs).toBe(false);
      
      // Welcome has no prerequisites
      const welcomePrereqs = tutorialService.arePrerequisitesMet('welcome');
      expect(welcomePrereqs).toBe(true);
    });

    it('should exit module', async () => {
      await tutorialService.startModule('welcome');
      await tutorialService.exitModule();
      
      const state = tutorialService.getState();
      expect(state.isActive).toBe(false);
    });

    it('should pause and resume module', async () => {
      await tutorialService.startModule('welcome');
      
      await tutorialService.pauseModule();
      let state = tutorialService.getState();
      expect(state.isPaused).toBe(true);
      
      await tutorialService.resumeModule();
      state = tutorialService.getState();
      expect(state.isPaused).toBe(false);
    });

    it('should reset module progress', async () => {
      await tutorialService.startModule('welcome');
      await tutorialService.nextStep();
      await tutorialService.exitModule();
      
      await tutorialService.resetModule('welcome');
      
      const progress = tutorialService.getModuleProgress('welcome');
      expect(progress).toBe(0);
    });
  });

  describe('Step Navigation', () => {
    beforeEach(async () => {
      await tutorialService.resetAllProgress();
      await tutorialService.initialize();
      await tutorialService.startModule('welcome');
    });

    it('should navigate to next step', async () => {
      const initialStep = tutorialService.getState().activeStepIndex;
      
      await tutorialService.nextStep();
      
      const newStep = tutorialService.getState().activeStepIndex;
      expect(newStep).toBe(initialStep + 1);
    });

    it('should navigate to previous step', async () => {
      await tutorialService.nextStep();
      await tutorialService.nextStep();
      
      const beforePrev = tutorialService.getState().activeStepIndex;
      await tutorialService.previousStep();
      
      const afterPrev = tutorialService.getState().activeStepIndex;
      expect(afterPrev).toBe(beforePrev - 1);
    });

    it('should not go before first step', async () => {
      // First ensure we're at step 0
      await tutorialService.goToStep(0);
      const result = await tutorialService.previousStep();
      
      // previousStep returns false when at step 0
      expect(tutorialService.getState().activeStepIndex).toBe(0);
    });

    it('should go to specific step', async () => {
      await tutorialService.goToStep(3);
      
      expect(tutorialService.getState().activeStepIndex).toBe(3);
    });

    it('should get current step', async () => {
      // Ensure we're at step 0
      await tutorialService.goToStep(0);
      const step = tutorialService.getCurrentStep();
      
      expect(step).toBeDefined();
      expect(step?.id).toBe(welcomeModule.steps[0].id);
    });

    it('should get current module', () => {
      const module = tutorialService.getCurrentModule();
      
      expect(module).toBeDefined();
      expect(module?.id).toBe('welcome');
    });
  });

  describe('Choice Selection', () => {
    beforeEach(async () => {
      await tutorialService.initialize();
      await tutorialService.startModule('meta-analysis-basics');
      
      // Navigate to first choice step
      const module = getModuleById('meta-analysis-basics');
      const choiceIndex = module?.steps.findIndex((s) => s.type === 'choice') || 0;
      await tutorialService.goToStep(choiceIndex);
    });

    it('should record choice selection', async () => {
      const currentStep = tutorialService.getCurrentStep();
      const correctChoice = currentStep?.choices?.find((c) => c.isCorrect);
      
      if (correctChoice) {
        const result = await tutorialService.selectChoice(correctChoice.id);
        
        expect(result.correct).toBe(true);
        expect(result.feedback).toBeDefined();
      }
    });

    it('should track statistics for choices', async () => {
      const currentStep = tutorialService.getCurrentStep();
      const correctChoice = currentStep?.choices?.find((c) => c.isCorrect);
      
      if (correctChoice) {
        await tutorialService.selectChoice(correctChoice.id);
        
        const stats = tutorialService.getStatistics();
        expect(stats.questionsAnswered).toBeGreaterThan(0);
        expect(stats.correctAnswers).toBeGreaterThan(0);
      }
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(async () => {
      await tutorialService.resetAllProgress();
      await tutorialService.initialize();
    });

    it('should track module progress percentage', async () => {
      await tutorialService.startModule('welcome');
      
      // After starting, we're at step 0, so no steps completed yet
      const initialProgress = tutorialService.getModuleProgress('welcome');
      // Progress is based on completedStepIds, which starts empty
      expect(initialProgress).toBeGreaterThanOrEqual(0);
      
      await tutorialService.nextStep();
      
      const afterOneStep = tutorialService.getModuleProgress('welcome');
      expect(afterOneStep).toBeGreaterThan(0);
    });

    it('should mark module as completed', async () => {
      await tutorialService.startModule('welcome');
      
      // Complete all steps
      const module = getModuleById('welcome');
      for (let i = 0; i < (module?.steps.length || 0); i++) {
        await tutorialService.nextStep();
      }
      
      expect(tutorialService.isModuleCompleted('welcome')).toBe(true);
    });

    it('should award badge on completion', async () => {
      await tutorialService.startModule('welcome');
      
      // Complete all steps
      const module = getModuleById('welcome');
      for (let i = 0; i < (module?.steps.length || 0); i++) {
        await tutorialService.nextStep();
      }
      
      const badges = tutorialService.getEarnedBadges();
      expect(badges.some((b) => b.id === 'first-steps')).toBe(true);
    });

    it('should get overall statistics', async () => {
      const stats = tutorialService.getStatistics();
      
      expect(stats.modulesCompleted).toBeDefined();
      expect(stats.totalModules).toBe(6);
      expect(stats.timeSpent).toBeDefined();
      expect(stats.questionsAnswered).toBeDefined();
      expect(stats.accuracy).toBeDefined();
    });
  });

  describe('Subscription', () => {
    it('should notify subscribers on state change', async () => {
      await tutorialService.initialize();
      
      const listener = vi.fn();
      const unsubscribe = tutorialService.subscribe(listener);
      
      await tutorialService.startModule('welcome');
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should unsubscribe correctly', async () => {
      await tutorialService.initialize();
      
      const listener = vi.fn();
      const unsubscribe = tutorialService.subscribe(listener);
      
      unsubscribe();
      await tutorialService.startModule('welcome');
      
      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Recommendations', () => {
    beforeEach(async () => {
      await tutorialService.resetAllProgress();
      await tutorialService.initialize();
    });

    it('should recommend first uncompleted module', () => {
      const recommended = tutorialService.getRecommendedNextModule();
      
      expect(recommended).toBeDefined();
      // Should recommend first module with met prerequisites
      expect(recommended).not.toBeNull();
    });

    it('should recommend next uncompleted module', async () => {
      // Complete welcome module
      await tutorialService.startModule('welcome');
      const module = getModuleById('welcome');
      for (let i = 0; i < (module?.steps.length || 0); i++) {
        await tutorialService.nextStep();
      }
      
      const recommended = tutorialService.getRecommendedNextModule();
      
      // Should recommend next module with met prerequisites
      expect(recommended).toBeDefined();
      expect(recommended?.id).not.toBe('welcome');
    });
  });
});

describe('Tutorial Types', () => {
  it('should have correct initial state structure', () => {
    expect(initialTutorialState.activeModuleId).toBeNull();
    expect(initialTutorialState.activeStepIndex).toBe(0);
    expect(initialTutorialState.isActive).toBe(false);
    expect(initialTutorialState.isPaused).toBe(false);
    expect(Array.isArray(initialTutorialState.completedModules)).toBe(true);
    expect(typeof initialTutorialState.moduleProgress).toBe('object');
    expect(Array.isArray(initialTutorialState.earnedBadges)).toBe(true);
    expect(initialTutorialState.showHints).toBe(true);
    expect(initialTutorialState.autoAdvance).toBe(false);
    expect(initialTutorialState.totalTimeSpent).toBe(0);
    expect(initialTutorialState.questionsAnswered).toBe(0);
    expect(initialTutorialState.correctAnswers).toBe(0);
  });
});
