/**
 * Tutorial Module Exports
 */

export * from './types';
export * from './content';
export { tutorialService } from './tutorial.service';
export * from './practice-datasets';
export { certificateService, type CertificateData } from './certificate.service';

// New tutorials
export * from './forest-plot-tutorial';
export * from './heterogeneity-tutorial';
export * from './subgroup-tutorial';
export * from './meta-regression-tutorial';

// Progress and bookmarks
export {
  tutorialProgressService,
  getTutorialProgress,
  startTutorial,
  updateTutorialStep,
  recordQuizAnswer,
  completeTutorial,
  createBookmark,
  removeBookmark,
  getBookmarks,
  getBadges,
  getAllProgress,
  getProgressStats,
  isTutorialCompleted,
  resetTutorial,
  type TutorialBookmark,
  type EarnedBadge,
  type ProgressStats,
} from './progress.service';
export type { TutorialProgress as TutorialProgressV2 } from './progress.service';

// Voice narration
export * from './voice-narration.service';

// Badge sharing
export * from './badge-sharing.service';

// Spaced repetition
export * from './spaced-repetition.service';

// AI feedback
export * from './ai-feedback.service';
