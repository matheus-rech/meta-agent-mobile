/**
 * Tutorial Progress Service
 * 
 * Manages tutorial progress, bookmarks, and completion state
 * with AsyncStorage persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_STORAGE_KEY = 'glass-tutorial-progress-v2';
const BADGES_STORAGE_KEY = 'glass-tutorial-badges';
const BOOKMARKS_STORAGE_KEY = 'glass-tutorial-bookmarks';

export interface TutorialProgress {
  tutorialId: string;
  currentStepIndex: number;
  completedStepIds: string[];
  quizScores: { stepId: string; correct: boolean; answeredAt: number }[];
  startedAt: number;
  lastAccessedAt: number;
  completedAt: number | null;
  totalTimeSpentMs: number;
}

export interface TutorialBookmark {
  id: string;
  tutorialId: string;
  stepId: string;
  stepIndex: number;
  stepTitle: string;
  note?: string;
  createdAt: number;
}

export interface EarnedBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  tutorialId: string;
  earnedAt: number;
  quizScore?: { correct: number; total: number };
}

export interface ProgressStats {
  totalTutorialsStarted: number;
  totalTutorialsCompleted: number;
  totalQuizzesTaken: number;
  totalQuizzesCorrect: number;
  totalTimeSpentMs: number;
  badgesEarned: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: number | null;
}

class TutorialProgressService {
  private progressCache: Map<string, TutorialProgress> = new Map();
  private badgesCache: EarnedBadge[] = [];
  private bookmarksCache: TutorialBookmark[] = [];
  private initialized = false;
  
  /**
   * Initialize the service by loading data from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const [progressData, badgesData, bookmarksData] = await Promise.all([
        AsyncStorage.getItem(PROGRESS_STORAGE_KEY),
        AsyncStorage.getItem(BADGES_STORAGE_KEY),
        AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
      ]);
      
      if (progressData) {
        const parsed = JSON.parse(progressData) as Record<string, TutorialProgress>;
        Object.entries(parsed).forEach(([key, value]) => {
          this.progressCache.set(key, value);
        });
      }
      
      if (badgesData) {
        this.badgesCache = JSON.parse(badgesData);
      }
      
      if (bookmarksData) {
        this.bookmarksCache = JSON.parse(bookmarksData);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[TutorialProgress] Failed to initialize:', error);
      this.initialized = true;
    }
  }
  
  /**
   * Save all data to storage
   */
  private async persist(): Promise<void> {
    try {
      const progressObj: Record<string, TutorialProgress> = {};
      this.progressCache.forEach((value, key) => {
        progressObj[key] = value;
      });
      
      await Promise.all([
        AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressObj)),
        AsyncStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(this.badgesCache)),
        AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(this.bookmarksCache)),
      ]);
    } catch (error) {
      console.error('[TutorialProgress] Failed to persist:', error);
    }
  }
  
  /**
   * Get progress for a specific tutorial
   */
  async getProgress(tutorialId: string): Promise<TutorialProgress | null> {
    await this.initialize();
    return this.progressCache.get(tutorialId) || null;
  }
  
  /**
   * Start or resume a tutorial
   */
  async startTutorial(tutorialId: string): Promise<TutorialProgress> {
    await this.initialize();
    
    const existing = this.progressCache.get(tutorialId);
    if (existing && !existing.completedAt) {
      // Resume existing progress
      existing.lastAccessedAt = Date.now();
      this.progressCache.set(tutorialId, existing);
      await this.persist();
      return existing;
    }
    
    // Start fresh
    const newProgress: TutorialProgress = {
      tutorialId,
      currentStepIndex: 0,
      completedStepIds: [],
      quizScores: [],
      startedAt: Date.now(),
      lastAccessedAt: Date.now(),
      completedAt: null,
      totalTimeSpentMs: 0,
    };
    
    this.progressCache.set(tutorialId, newProgress);
    await this.persist();
    return newProgress;
  }
  
  /**
   * Update progress for a tutorial step
   */
  async updateStep(
    tutorialId: string,
    stepIndex: number,
    stepId: string,
    timeSpentMs: number = 0
  ): Promise<void> {
    await this.initialize();
    
    const progress = this.progressCache.get(tutorialId);
    if (!progress) return;
    
    progress.currentStepIndex = stepIndex;
    if (!progress.completedStepIds.includes(stepId)) {
      progress.completedStepIds.push(stepId);
    }
    progress.lastAccessedAt = Date.now();
    progress.totalTimeSpentMs += timeSpentMs;
    
    this.progressCache.set(tutorialId, progress);
    await this.persist();
  }
  
  /**
   * Record a quiz answer
   */
  async recordQuizAnswer(
    tutorialId: string,
    stepId: string,
    correct: boolean
  ): Promise<void> {
    await this.initialize();
    
    const progress = this.progressCache.get(tutorialId);
    if (!progress) return;
    
    // Remove any existing answer for this step
    progress.quizScores = progress.quizScores.filter(q => q.stepId !== stepId);
    
    progress.quizScores.push({
      stepId,
      correct,
      answeredAt: Date.now(),
    });
    
    this.progressCache.set(tutorialId, progress);
    await this.persist();
  }
  
  /**
   * Complete a tutorial and award badge
   */
  async completeTutorial(
    tutorialId: string,
    badge: { id: string; name: string; icon: string; description: string }
  ): Promise<EarnedBadge> {
    await this.initialize();
    
    const progress = this.progressCache.get(tutorialId);
    if (progress) {
      progress.completedAt = Date.now();
      this.progressCache.set(tutorialId, progress);
    }
    
    // Calculate quiz score
    const quizScores = progress?.quizScores || [];
    const quizScore = quizScores.length > 0
      ? {
          correct: quizScores.filter(q => q.correct).length,
          total: quizScores.length,
        }
      : undefined;
    
    // Check if badge already earned
    const existingBadge = this.badgesCache.find(b => b.id === badge.id);
    if (existingBadge) {
      return existingBadge;
    }
    
    // Award new badge
    const earnedBadge: EarnedBadge = {
      ...badge,
      tutorialId,
      earnedAt: Date.now(),
      quizScore,
    };
    
    this.badgesCache.push(earnedBadge);
    await this.persist();
    
    return earnedBadge;
  }
  
  /**
   * Create a bookmark at a specific step
   */
  async createBookmark(
    tutorialId: string,
    stepId: string,
    stepIndex: number,
    stepTitle: string,
    note?: string
  ): Promise<TutorialBookmark> {
    await this.initialize();
    
    // Remove existing bookmark for same step
    this.bookmarksCache = this.bookmarksCache.filter(
      b => !(b.tutorialId === tutorialId && b.stepId === stepId)
    );
    
    const bookmark: TutorialBookmark = {
      id: `${tutorialId}-${stepId}-${Date.now()}`,
      tutorialId,
      stepId,
      stepIndex,
      stepTitle,
      note,
      createdAt: Date.now(),
    };
    
    this.bookmarksCache.push(bookmark);
    await this.persist();
    
    return bookmark;
  }
  
  /**
   * Remove a bookmark
   */
  async removeBookmark(bookmarkId: string): Promise<void> {
    await this.initialize();
    this.bookmarksCache = this.bookmarksCache.filter(b => b.id !== bookmarkId);
    await this.persist();
  }
  
  /**
   * Get all bookmarks for a tutorial
   */
  async getBookmarks(tutorialId?: string): Promise<TutorialBookmark[]> {
    await this.initialize();
    
    if (tutorialId) {
      return this.bookmarksCache.filter(b => b.tutorialId === tutorialId);
    }
    
    return [...this.bookmarksCache].sort((a, b) => b.createdAt - a.createdAt);
  }
  
  /**
   * Get all earned badges
   */
  async getBadges(): Promise<EarnedBadge[]> {
    await this.initialize();
    return [...this.badgesCache].sort((a, b) => b.earnedAt - a.earnedAt);
  }
  
  /**
   * Get all tutorial progress
   */
  async getAllProgress(): Promise<TutorialProgress[]> {
    await this.initialize();
    return Array.from(this.progressCache.values());
  }
  
  /**
   * Get overall statistics
   */
  async getStats(): Promise<ProgressStats> {
    await this.initialize();
    
    const allProgress = Array.from(this.progressCache.values());
    const completedTutorials = allProgress.filter(p => p.completedAt !== null);
    
    let totalQuizzes = 0;
    let correctQuizzes = 0;
    let totalTime = 0;
    let lastActivity: number | null = null;
    
    allProgress.forEach(p => {
      totalQuizzes += p.quizScores.length;
      correctQuizzes += p.quizScores.filter(q => q.correct).length;
      totalTime += p.totalTimeSpentMs;
      
      if (!lastActivity || p.lastAccessedAt > lastActivity) {
        lastActivity = p.lastAccessedAt;
      }
    });
    
    // Calculate streak (consecutive days with activity)
    const { currentStreak, longestStreak } = this.calculateStreak(allProgress);
    
    return {
      totalTutorialsStarted: allProgress.length,
      totalTutorialsCompleted: completedTutorials.length,
      totalQuizzesTaken: totalQuizzes,
      totalQuizzesCorrect: correctQuizzes,
      totalTimeSpentMs: totalTime,
      badgesEarned: this.badgesCache.length,
      currentStreak,
      longestStreak,
      lastActivityAt: lastActivity,
    };
  }
  
  /**
   * Calculate learning streak
   */
  private calculateStreak(progress: TutorialProgress[]): { currentStreak: number; longestStreak: number } {
    if (progress.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    
    // Get all activity dates
    const activityDates = new Set<string>();
    progress.forEach(p => {
      activityDates.add(new Date(p.startedAt).toDateString());
      activityDates.add(new Date(p.lastAccessedAt).toDateString());
      if (p.completedAt) {
        activityDates.add(new Date(p.completedAt).toDateString());
      }
    });
    
    // Sort dates
    const sortedDates = Array.from(activityDates)
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    
    let currentStreak = 0;
    let longestStreak = 1;
    let tempStreak = 1;
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Check if active today or yesterday for current streak
    const lastDate = sortedDates[sortedDates.length - 1].toDateString();
    if (lastDate === today || lastDate === yesterday) {
      currentStreak = 1;
      
      // Count backwards for current streak
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const diff = sortedDates[i + 1].getTime() - sortedDates[i].getTime();
        if (diff <= 86400000 * 1.5) { // Within ~1.5 days
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
      if (diff <= 86400000 * 1.5) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    return { currentStreak, longestStreak };
  }
  
  /**
   * Check if a tutorial is completed
   */
  async isTutorialCompleted(tutorialId: string): Promise<boolean> {
    await this.initialize();
    const progress = this.progressCache.get(tutorialId);
    return progress?.completedAt !== null && progress?.completedAt !== undefined;
  }
  
  /**
   * Reset progress for a tutorial (for retaking)
   */
  async resetTutorial(tutorialId: string): Promise<void> {
    await this.initialize();
    this.progressCache.delete(tutorialId);
    // Keep badges - they're permanent achievements
    // Remove bookmarks for this tutorial
    this.bookmarksCache = this.bookmarksCache.filter(b => b.tutorialId !== tutorialId);
    await this.persist();
  }
  
  /**
   * Clear all data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    this.progressCache.clear();
    this.badgesCache = [];
    this.bookmarksCache = [];
    await Promise.all([
      AsyncStorage.removeItem(PROGRESS_STORAGE_KEY),
      AsyncStorage.removeItem(BADGES_STORAGE_KEY),
      AsyncStorage.removeItem(BOOKMARKS_STORAGE_KEY),
    ]);
    this.initialized = false;
  }
}

// Export singleton instance
export const tutorialProgressService = new TutorialProgressService();

// Export convenience functions
export const getTutorialProgress = (id: string) => tutorialProgressService.getProgress(id);
export const startTutorial = (id: string) => tutorialProgressService.startTutorial(id);
export const updateTutorialStep = (
  id: string,
  stepIndex: number,
  stepId: string,
  timeMs?: number
) => tutorialProgressService.updateStep(id, stepIndex, stepId, timeMs);
export const recordQuizAnswer = (id: string, stepId: string, correct: boolean) =>
  tutorialProgressService.recordQuizAnswer(id, stepId, correct);
export const completeTutorial = (
  id: string,
  badge: { id: string; name: string; icon: string; description: string }
) => tutorialProgressService.completeTutorial(id, badge);
export const createBookmark = (
  tutorialId: string,
  stepId: string,
  stepIndex: number,
  stepTitle: string,
  note?: string
) => tutorialProgressService.createBookmark(tutorialId, stepId, stepIndex, stepTitle, note);
export const removeBookmark = (id: string) => tutorialProgressService.removeBookmark(id);
export const getBookmarks = (tutorialId?: string) => tutorialProgressService.getBookmarks(tutorialId);
export const getBadges = () => tutorialProgressService.getBadges();
export const getAllProgress = () => tutorialProgressService.getAllProgress();
export const getProgressStats = () => tutorialProgressService.getStats();
export const isTutorialCompleted = (id: string) => tutorialProgressService.isTutorialCompleted(id);
export const resetTutorial = (id: string) => tutorialProgressService.resetTutorial(id);
