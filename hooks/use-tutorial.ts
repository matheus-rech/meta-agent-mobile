/**
 * useTutorial Hook
 * React hook for accessing tutorial state and actions
 */

import { useEffect, useState, useCallback } from 'react';
import {
  tutorialService,
  TutorialState,
  TutorialStep,
  TutorialModule,
  initialTutorialState,
} from '@/lib/tutorial';

export interface UseTutorialReturn {
  // State
  state: TutorialState;
  isLoading: boolean;
  currentStep: TutorialStep | null;
  currentModule: TutorialModule | null;
  
  // Module management
  startModule: (moduleId: string) => Promise<boolean>;
  pauseModule: () => Promise<void>;
  resumeModule: () => Promise<void>;
  exitModule: () => Promise<void>;
  resetModule: (moduleId: string) => Promise<void>;
  
  // Step navigation
  nextStep: () => Promise<boolean>;
  previousStep: () => Promise<boolean>;
  goToStep: (stepIndex: number) => Promise<boolean>;
  skipStep: () => Promise<boolean>;
  
  // Interaction
  completeAction: (actionId: string) => Promise<boolean>;
  submitInput: (input: string) => Promise<boolean>;
  selectChoice: (choiceId: string) => Promise<{ correct: boolean; feedback?: string }>;
  completeSocraticStep: () => Promise<boolean>;
  
  // Progress queries
  isModuleCompleted: (moduleId: string) => boolean;
  getModuleProgress: (moduleId: string) => number;
  arePrerequisitesMet: (moduleId: string) => boolean;
  
  // Data
  modules: TutorialModule[];
  statistics: ReturnType<typeof tutorialService.getStatistics>;
  earnedBadges: ReturnType<typeof tutorialService.getEarnedBadges>;
  recommendedModule: TutorialModule | null;
}

export function useTutorial(): UseTutorialReturn {
  const [state, setState] = useState<TutorialState>(initialTutorialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await tutorialService.initialize();
      setState(tutorialService.getState());
      setIsLoading(false);
    };
    init();

    const unsubscribe = tutorialService.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Module management
  const startModule = useCallback(async (moduleId: string) => {
    return tutorialService.startModule(moduleId);
  }, []);

  const pauseModule = useCallback(async () => {
    return tutorialService.pauseModule();
  }, []);

  const resumeModule = useCallback(async () => {
    return tutorialService.resumeModule();
  }, []);

  const exitModule = useCallback(async () => {
    return tutorialService.exitModule();
  }, []);

  const resetModule = useCallback(async (moduleId: string) => {
    return tutorialService.resetModule(moduleId);
  }, []);

  // Step navigation
  const nextStep = useCallback(async () => {
    return tutorialService.nextStep();
  }, []);

  const previousStep = useCallback(async () => {
    return tutorialService.previousStep();
  }, []);

  const goToStep = useCallback(async (stepIndex: number) => {
    return tutorialService.goToStep(stepIndex);
  }, []);

  const skipStep = useCallback(async () => {
    return tutorialService.skipStep();
  }, []);

  // Interaction
  const completeAction = useCallback(async (actionId: string) => {
    return tutorialService.completeAction(actionId);
  }, []);

  const submitInput = useCallback(async (input: string) => {
    return tutorialService.submitInput(input);
  }, []);

  const selectChoice = useCallback(async (choiceId: string) => {
    return tutorialService.selectChoice(choiceId);
  }, []);

  const completeSocraticStep = useCallback(async () => {
    return tutorialService.completeSocraticStep();
  }, []);

  // Progress queries
  const isModuleCompleted = useCallback((moduleId: string) => {
    return tutorialService.isModuleCompleted(moduleId);
  }, []);

  const getModuleProgress = useCallback((moduleId: string) => {
    return tutorialService.getModuleProgress(moduleId);
  }, []);

  const arePrerequisitesMet = useCallback((moduleId: string) => {
    return tutorialService.arePrerequisitesMet(moduleId);
  }, []);

  return {
    state,
    isLoading,
    currentStep: tutorialService.getCurrentStep(),
    currentModule: tutorialService.getCurrentModule(),
    
    startModule,
    pauseModule,
    resumeModule,
    exitModule,
    resetModule,
    
    nextStep,
    previousStep,
    goToStep,
    skipStep,
    
    completeAction,
    submitInput,
    selectChoice,
    completeSocraticStep,
    
    isModuleCompleted,
    getModuleProgress,
    arePrerequisitesMet,
    
    modules: tutorialService.getModules(),
    statistics: tutorialService.getStatistics(),
    earnedBadges: tutorialService.getEarnedBadges(),
    recommendedModule: tutorialService.getRecommendedNextModule(),
  };
}

/**
 * Hook to track tutorial action completion
 * Use this in components that need to notify the tutorial system of user actions
 */
export function useTutorialAction() {
  const completeAction = useCallback(async (actionId: string) => {
    const currentStep = tutorialService.getCurrentStep();
    if (currentStep?.type === 'action') {
      return tutorialService.completeAction(actionId);
    }
    return false;
  }, []);

  const completeSocratic = useCallback(async () => {
    const currentStep = tutorialService.getCurrentStep();
    if (currentStep?.type === 'socratic') {
      return tutorialService.completeSocraticStep();
    }
    return false;
  }, []);

  return {
    completeAction,
    completeSocratic,
    isInTutorial: tutorialService.getState().isActive,
  };
}
