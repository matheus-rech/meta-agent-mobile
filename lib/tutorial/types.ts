/**
 * Tutorial System Types
 * Defines the structure for interactive tutorials in Meta Agent Mobile
 */

export type TutorialStepType = 
  | 'info'           // Information display
  | 'action'         // User must perform an action
  | 'input'          // User must enter text
  | 'choice'         // User must make a choice
  | 'highlight'      // Highlight a UI element
  | 'socratic';      // Trigger Socratic teaching mode

export type TutorialCategory =
  | 'getting-started'
  | 'meta-analysis-basics'
  | 'data-entry'
  | 'forest-plots'
  | 'interpreting-results'
  | 'ai-assistant';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type: TutorialStepType;
  
  // Optional properties based on step type
  targetElement?: string;           // CSS selector or element ID for highlighting
  expectedAction?: string;          // Action user should perform
  expectedInput?: string;           // Expected input pattern (regex)
  choices?: TutorialChoice[];       // Choices for 'choice' type
  socraticTopic?: string;           // Topic for Socratic mode
  
  // Visual customization
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
  showArrow?: boolean;
  
  // Navigation
  nextStepId?: string;              // Override default sequential flow
  skipCondition?: string;           // Condition to auto-skip this step
  
  // Hints and help
  hint?: string;
  learnMoreLink?: string;
}

export interface TutorialChoice {
  id: string;
  label: string;
  nextStepId?: string;              // Jump to specific step based on choice
  isCorrect?: boolean;              // For quiz-style steps
  feedback?: string;                // Feedback shown after selection
}

export interface TutorialModule {
  id: string;
  title: string;
  description: string;
  category: TutorialCategory;
  icon: string;                     // Emoji or icon name
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];         // Module IDs that should be completed first
  steps: TutorialStep[];
  
  // Completion rewards
  completionMessage: string;
  badge?: TutorialBadge;
}

export interface TutorialBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface TutorialProgress {
  moduleId: string;
  currentStepIndex: number;
  completedStepIds: string[];
  startedAt: string;                // ISO date string
  completedAt?: string;             // ISO date string
  choices: Record<string, string>;  // stepId -> choiceId
}

export interface TutorialState {
  // Current tutorial session
  activeModuleId: string | null;
  activeStepIndex: number;
  isActive: boolean;
  isPaused: boolean;
  
  // Progress tracking
  completedModules: string[];
  moduleProgress: Record<string, TutorialProgress>;
  earnedBadges: string[];
  
  // User preferences
  showHints: boolean;
  autoAdvance: boolean;
  
  // Statistics
  totalTimeSpent: number;           // In seconds
  questionsAnswered: number;
  correctAnswers: number;
}

export interface TutorialContextValue {
  state: TutorialState;
  
  // Module management
  startModule: (moduleId: string) => void;
  pauseModule: () => void;
  resumeModule: () => void;
  exitModule: () => void;
  resetModule: (moduleId: string) => void;
  
  // Step navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  skipStep: () => void;
  
  // Interaction
  completeAction: (actionId: string) => void;
  submitInput: (input: string) => boolean;
  selectChoice: (choiceId: string) => void;
  
  // Progress queries
  isModuleCompleted: (moduleId: string) => boolean;
  getModuleProgress: (moduleId: string) => number;
  getCurrentStep: () => TutorialStep | null;
  getCurrentModule: () => TutorialModule | null;
}

// Default initial state
export const initialTutorialState: TutorialState = {
  activeModuleId: null,
  activeStepIndex: 0,
  isActive: false,
  isPaused: false,
  completedModules: [],
  moduleProgress: {},
  earnedBadges: [],
  showHints: true,
  autoAdvance: false,
  totalTimeSpent: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
};
