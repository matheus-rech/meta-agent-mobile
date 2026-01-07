/**
 * Tutorial Service
 * Manages tutorial state, progress tracking, and persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TutorialState,
  TutorialProgress,
  TutorialStep,
  TutorialModule,
  initialTutorialState,
} from './types';
import { tutorialModules, getModuleById } from './content';

const STORAGE_KEY = 'meta-agent-tutorial-state';

type TutorialListener = (state: TutorialState) => void;

class TutorialService {
  private state: TutorialState = initialTutorialState;
  private listeners: Set<TutorialListener> = new Set();
  private initialized = false;
  private sessionStartTime: number | null = null;

  /**
   * Initialize the service and load persisted state
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = { ...initialTutorialState, ...parsed };
      }
      this.initialized = true;
    } catch (error) {
      console.error('[TutorialService] Failed to load state:', error);
      this.initialized = true;
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: TutorialListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): TutorialState {
    return { ...this.state };
  }

  /**
   * Get all available modules
   */
  getModules(): TutorialModule[] {
    return tutorialModules;
  }

  /**
   * Get a specific module by ID
   */
  getModule(moduleId: string): TutorialModule | undefined {
    return getModuleById(moduleId);
  }

  /**
   * Check if a module is completed
   */
  isModuleCompleted(moduleId: string): boolean {
    return this.state.completedModules.includes(moduleId);
  }

  /**
   * Get progress percentage for a module (0-100)
   */
  getModuleProgress(moduleId: string): number {
    const module = getModuleById(moduleId);
    if (!module) return 0;

    const progress = this.state.moduleProgress[moduleId];
    if (!progress) return 0;

    return Math.round((progress.completedStepIds.length / module.steps.length) * 100);
  }

  /**
   * Check if prerequisites are met for a module
   */
  arePrerequisitesMet(moduleId: string): boolean {
    const module = getModuleById(moduleId);
    if (!module || !module.prerequisites) return true;

    return module.prerequisites.every(prereq => 
      this.state.completedModules.includes(prereq)
    );
  }

  /**
   * Get the current step
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.state.activeModuleId) return null;

    const module = getModuleById(this.state.activeModuleId);
    if (!module) return null;

    return module.steps[this.state.activeStepIndex] || null;
  }

  /**
   * Get the current module
   */
  getCurrentModule(): TutorialModule | null {
    if (!this.state.activeModuleId) return null;
    return getModuleById(this.state.activeModuleId) || null;
  }

  /**
   * Start a tutorial module
   */
  async startModule(moduleId: string): Promise<boolean> {
    const module = getModuleById(moduleId);
    if (!module) {
      console.error('[TutorialService] Module not found:', moduleId);
      return false;
    }

    // Check prerequisites
    if (!this.arePrerequisitesMet(moduleId)) {
      console.warn('[TutorialService] Prerequisites not met for:', moduleId);
      return false;
    }

    // Initialize progress if not exists
    if (!this.state.moduleProgress[moduleId]) {
      this.state.moduleProgress[moduleId] = {
        moduleId,
        currentStepIndex: 0,
        completedStepIds: [],
        startedAt: new Date().toISOString(),
        choices: {},
      };
    }

    // Set active module
    this.state.activeModuleId = moduleId;
    this.state.activeStepIndex = this.state.moduleProgress[moduleId].currentStepIndex;
    this.state.isActive = true;
    this.state.isPaused = false;
    this.sessionStartTime = Date.now();

    await this.persist();
    this.notify();
    return true;
  }

  /**
   * Pause the current module
   */
  async pauseModule(): Promise<void> {
    if (!this.state.isActive) return;

    this.state.isPaused = true;
    this.updateTimeSpent();

    await this.persist();
    this.notify();
  }

  /**
   * Resume the paused module
   */
  async resumeModule(): Promise<void> {
    if (!this.state.activeModuleId || !this.state.isPaused) return;

    this.state.isPaused = false;
    this.sessionStartTime = Date.now();

    this.notify();
  }

  /**
   * Exit the current module without completing
   */
  async exitModule(): Promise<void> {
    if (!this.state.activeModuleId) return;

    // Save current progress
    const progress = this.state.moduleProgress[this.state.activeModuleId];
    if (progress) {
      progress.currentStepIndex = this.state.activeStepIndex;
    }

    this.updateTimeSpent();
    this.state.isActive = false;
    this.state.isPaused = false;

    await this.persist();
    this.notify();
  }

  /**
   * Reset a module's progress
   */
  async resetModule(moduleId: string): Promise<void> {
    delete this.state.moduleProgress[moduleId];
    
    // Remove from completed if it was completed
    this.state.completedModules = this.state.completedModules.filter(
      id => id !== moduleId
    );

    // If this is the active module, reset position
    if (this.state.activeModuleId === moduleId) {
      this.state.activeStepIndex = 0;
    }

    await this.persist();
    this.notify();
  }

  /**
   * Move to the next step
   */
  async nextStep(): Promise<boolean> {
    if (!this.state.activeModuleId || !this.state.isActive) return false;

    const module = getModuleById(this.state.activeModuleId);
    if (!module) return false;

    const currentStep = module.steps[this.state.activeStepIndex];
    if (!currentStep) return false;

    // Mark current step as completed
    const progress = this.state.moduleProgress[this.state.activeModuleId];
    if (progress && !progress.completedStepIds.includes(currentStep.id)) {
      progress.completedStepIds.push(currentStep.id);
    }

    // Check if this was the last step
    if (this.state.activeStepIndex >= module.steps.length - 1) {
      await this.completeModule();
      return true;
    }

    // Move to next step
    this.state.activeStepIndex++;
    if (progress) {
      progress.currentStepIndex = this.state.activeStepIndex;
    }

    await this.persist();
    this.notify();
    return true;
  }

  /**
   * Move to the previous step
   */
  async previousStep(): Promise<boolean> {
    if (!this.state.activeModuleId || !this.state.isActive) return false;
    if (this.state.activeStepIndex <= 0) return false;

    this.state.activeStepIndex--;

    const progress = this.state.moduleProgress[this.state.activeModuleId];
    if (progress) {
      progress.currentStepIndex = this.state.activeStepIndex;
    }

    await this.persist();
    this.notify();
    return true;
  }

  /**
   * Go to a specific step
   */
  async goToStep(stepIndex: number): Promise<boolean> {
    if (!this.state.activeModuleId || !this.state.isActive) return false;

    const module = getModuleById(this.state.activeModuleId);
    if (!module || stepIndex < 0 || stepIndex >= module.steps.length) return false;

    this.state.activeStepIndex = stepIndex;

    const progress = this.state.moduleProgress[this.state.activeModuleId];
    if (progress) {
      progress.currentStepIndex = stepIndex;
    }

    await this.persist();
    this.notify();
    return true;
  }

  /**
   * Skip the current step
   */
  async skipStep(): Promise<boolean> {
    return this.nextStep();
  }

  /**
   * Complete an action step
   */
  async completeAction(actionId: string): Promise<boolean> {
    const currentStep = this.getCurrentStep();
    if (!currentStep || currentStep.type !== 'action') return false;

    // Check if action matches expected
    if (currentStep.expectedAction) {
      const [type, pattern] = currentStep.expectedAction.split(':');
      if (type === 'command' && !actionId.startsWith(pattern)) {
        return false;
      }
      if (type === 'message' && !actionId.toLowerCase().includes(pattern.toLowerCase())) {
        return false;
      }
    }

    return this.nextStep();
  }

  /**
   * Submit input for an input step
   */
  async submitInput(input: string): Promise<boolean> {
    const currentStep = this.getCurrentStep();
    if (!currentStep || currentStep.type !== 'input') return false;

    // Validate input if pattern exists
    if (currentStep.expectedInput) {
      const regex = new RegExp(currentStep.expectedInput, 'i');
      if (!regex.test(input)) {
        return false;
      }
    }

    return this.nextStep();
  }

  /**
   * Select a choice for a choice step
   */
  async selectChoice(choiceId: string): Promise<{ correct: boolean; feedback?: string }> {
    const currentStep = this.getCurrentStep();
    if (!currentStep || currentStep.type !== 'choice' || !currentStep.choices) {
      return { correct: false };
    }

    const choice = currentStep.choices.find(c => c.id === choiceId);
    if (!choice) return { correct: false };

    // Record the choice
    const progress = this.state.moduleProgress[this.state.activeModuleId!];
    if (progress) {
      progress.choices[currentStep.id] = choiceId;
    }

    // Update statistics
    this.state.questionsAnswered++;
    if (choice.isCorrect) {
      this.state.correctAnswers++;
    }

    await this.persist();
    this.notify();

    return {
      correct: choice.isCorrect || false,
      feedback: choice.feedback,
    };
  }

  /**
   * Complete a Socratic step (triggered by AI interaction)
   */
  async completeSocraticStep(): Promise<boolean> {
    const currentStep = this.getCurrentStep();
    if (!currentStep || currentStep.type !== 'socratic') return false;

    return this.nextStep();
  }

  /**
   * Get earned badges
   */
  getEarnedBadges(): Array<{ id: string; name: string; icon: string; description: string }> {
    const badges: Array<{ id: string; name: string; icon: string; description: string }> = [];
    
    for (const moduleId of this.state.completedModules) {
      const module = getModuleById(moduleId);
      if (module?.badge) {
        badges.push(module.badge);
      }
    }
    
    return badges;
  }

  /**
   * Get overall statistics
   */
  getStatistics(): {
    modulesCompleted: number;
    totalModules: number;
    timeSpent: number;
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
  } {
    return {
      modulesCompleted: this.state.completedModules.length,
      totalModules: tutorialModules.length,
      timeSpent: this.state.totalTimeSpent,
      questionsAnswered: this.state.questionsAnswered,
      correctAnswers: this.state.correctAnswers,
      accuracy: this.state.questionsAnswered > 0
        ? Math.round((this.state.correctAnswers / this.state.questionsAnswered) * 100)
        : 0,
    };
  }

  /**
   * Check if user has completed all tutorials
   */
  hasCompletedAllTutorials(): boolean {
    return this.state.completedModules.length >= tutorialModules.length;
  }

  /**
   * Get recommended next module
   */
  getRecommendedNextModule(): TutorialModule | null {
    // Find first incomplete module with met prerequisites
    for (const module of tutorialModules) {
      if (!this.isModuleCompleted(module.id) && this.arePrerequisitesMet(module.id)) {
        return module;
      }
    }
    return null;
  }

  /**
   * Reset all tutorial progress
   */
  async resetAllProgress(): Promise<void> {
    this.state = { ...initialTutorialState };
    await this.persist();
    this.notify();
  }

  // Private methods

  private async completeModule(): Promise<void> {
    if (!this.state.activeModuleId) return;

    const moduleId = this.state.activeModuleId;
    const module = getModuleById(moduleId);

    // Mark as completed
    if (!this.state.completedModules.includes(moduleId)) {
      this.state.completedModules.push(moduleId);
    }

    // Update progress
    const progress = this.state.moduleProgress[moduleId];
    if (progress) {
      progress.completedAt = new Date().toISOString();
    }

    // Add badge if exists
    if (module?.badge && !this.state.earnedBadges.includes(module.badge.id)) {
      this.state.earnedBadges.push(module.badge.id);
    }

    // Update time spent
    this.updateTimeSpent();

    // Clear active state
    this.state.isActive = false;
    this.state.isPaused = false;

    await this.persist();
    this.notify();
  }

  private updateTimeSpent(): void {
    if (this.sessionStartTime) {
      const elapsed = Math.round((Date.now() - this.sessionStartTime) / 1000);
      this.state.totalTimeSpent += elapsed;
      this.sessionStartTime = null;
    }
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('[TutorialService] Failed to persist state:', error);
    }
  }

  private notify(): void {
    const stateCopy = this.getState();
    this.listeners.forEach(listener => listener(stateCopy));
  }
}

// Export singleton instance
export const tutorialService = new TutorialService();
