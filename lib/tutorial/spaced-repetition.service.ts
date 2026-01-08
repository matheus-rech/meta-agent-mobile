/**
 * Spaced Repetition Quiz Service
 * 
 * Implements spaced repetition algorithm for quiz review scheduling
 * based on the SM-2 algorithm (SuperMemo 2).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@meta_agent_spaced_repetition';

// SM-2 Algorithm parameters
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const INITIAL_INTERVAL = 1; // 1 day

export interface QuizQuestion {
  id: string;
  tutorialId: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ReviewCard {
  questionId: string;
  tutorialId: string;
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReviewDate: number; // timestamp
  lastReviewDate: number;
  lastQuality: number; // 0-5 rating
}

export interface ReviewSession {
  id: string;
  startedAt: number;
  completedAt?: number;
  cardsReviewed: number;
  correctAnswers: number;
  cards: {
    questionId: string;
    quality: number;
    responseTimeMs: number;
  }[];
}

export interface SpacedRepetitionStats {
  totalCards: number;
  cardsDueToday: number;
  cardsReviewedToday: number;
  averageEaseFactor: number;
  longestStreak: number;
  currentStreak: number;
  masteredCards: number; // interval > 21 days
}

class SpacedRepetitionService {
  private cards: Map<string, ReviewCard> = new Map();
  private sessions: ReviewSession[] = [];
  private initialized = false;
  
  /**
   * Initialize the service and load saved data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.cards = new Map(parsed.cards || []);
        this.sessions = parsed.sessions || [];
      }
      this.initialized = true;
    } catch (error) {
      console.error('[SpacedRepetition] Failed to initialize:', error);
      this.initialized = true;
    }
  }
  
  /**
   * Save current state to storage
   */
  private async save(): Promise<void> {
    try {
      const data = {
        cards: Array.from(this.cards.entries()),
        sessions: this.sessions.slice(-100), // Keep last 100 sessions
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[SpacedRepetition] Failed to save:', error);
    }
  }
  
  /**
   * Add a new question to the review system
   */
  async addQuestion(question: QuizQuestion): Promise<void> {
    await this.initialize();
    
    if (this.cards.has(question.id)) return;
    
    const card: ReviewCard = {
      questionId: question.id,
      tutorialId: question.tutorialId,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: INITIAL_INTERVAL,
      repetitions: 0,
      nextReviewDate: Date.now(), // Due immediately
      lastReviewDate: 0,
      lastQuality: 0,
    };
    
    this.cards.set(question.id, card);
    await this.save();
  }
  
  /**
   * Add multiple questions from a tutorial
   */
  async addQuestionsFromTutorial(tutorialId: string, questions: QuizQuestion[]): Promise<void> {
    await this.initialize();
    
    for (const question of questions) {
      if (!this.cards.has(question.id)) {
        const card: ReviewCard = {
          questionId: question.id,
          tutorialId,
          easeFactor: DEFAULT_EASE_FACTOR,
          interval: INITIAL_INTERVAL,
          repetitions: 0,
          nextReviewDate: Date.now() + (24 * 60 * 60 * 1000), // Due tomorrow
          lastReviewDate: 0,
          lastQuality: 0,
        };
        this.cards.set(question.id, card);
      }
    }
    
    await this.save();
  }
  
  /**
   * Get cards due for review
   */
  async getDueCards(limit: number = 20): Promise<ReviewCard[]> {
    await this.initialize();
    
    const now = Date.now();
    const dueCards: ReviewCard[] = [];
    
    for (const card of this.cards.values()) {
      if (card.nextReviewDate <= now) {
        dueCards.push(card);
      }
    }
    
    // Sort by urgency (most overdue first)
    dueCards.sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    
    return dueCards.slice(0, limit);
  }
  
  /**
   * Get count of cards due today
   */
  async getDueCount(): Promise<number> {
    await this.initialize();
    
    const now = Date.now();
    let count = 0;
    
    for (const card of this.cards.values()) {
      if (card.nextReviewDate <= now) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Process a review response using SM-2 algorithm
   * Quality: 0-5 (0=complete blackout, 5=perfect response)
   */
  async processReview(questionId: string, quality: number): Promise<ReviewCard | null> {
    await this.initialize();
    
    const card = this.cards.get(questionId);
    if (!card) return null;
    
    // Clamp quality to 0-5
    quality = Math.max(0, Math.min(5, quality));
    
    // Update ease factor
    card.easeFactor = Math.max(
      MIN_EASE_FACTOR,
      card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    
    if (quality < 3) {
      // Failed review - reset
      card.repetitions = 0;
      card.interval = INITIAL_INTERVAL;
    } else {
      // Successful review
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions++;
    }
    
    // Calculate next review date
    card.nextReviewDate = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
    card.lastReviewDate = Date.now();
    card.lastQuality = quality;
    
    this.cards.set(questionId, card);
    await this.save();
    
    return card;
  }
  
  /**
   * Convert answer correctness to quality rating
   */
  calculateQuality(isCorrect: boolean, responseTimeMs: number, difficulty: 'easy' | 'medium' | 'hard'): number {
    if (!isCorrect) {
      // Wrong answer: 0-2 based on how close they were
      return responseTimeMs < 5000 ? 1 : 0; // Quick wrong = maybe knew something
    }
    
    // Correct answer: 3-5 based on speed and difficulty
    const baseQuality = 4;
    
    // Adjust for response time
    let timeBonus = 0;
    if (responseTimeMs < 3000) timeBonus = 1;
    else if (responseTimeMs > 10000) timeBonus = -1;
    
    // Adjust for difficulty
    let difficultyBonus = 0;
    if (difficulty === 'hard') difficultyBonus = 0.5;
    else if (difficulty === 'easy') difficultyBonus = -0.5;
    
    return Math.max(3, Math.min(5, baseQuality + timeBonus + difficultyBonus));
  }
  
  /**
   * Start a review session
   */
  async startSession(): Promise<ReviewSession> {
    const session: ReviewSession = {
      id: `session_${Date.now()}`,
      startedAt: Date.now(),
      cardsReviewed: 0,
      correctAnswers: 0,
      cards: [],
    };
    
    this.sessions.push(session);
    return session;
  }
  
  /**
   * Record a card review in the current session
   */
  async recordReview(
    sessionId: string,
    questionId: string,
    isCorrect: boolean,
    responseTimeMs: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const quality = this.calculateQuality(isCorrect, responseTimeMs, difficulty);
    
    session.cards.push({
      questionId,
      quality,
      responseTimeMs,
    });
    session.cardsReviewed++;
    if (isCorrect) session.correctAnswers++;
    
    await this.processReview(questionId, quality);
  }
  
  /**
   * Complete a review session
   */
  async completeSession(sessionId: string): Promise<ReviewSession | null> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return null;
    
    session.completedAt = Date.now();
    await this.save();
    
    return session;
  }
  
  /**
   * Get statistics
   */
  async getStats(): Promise<SpacedRepetitionStats> {
    await this.initialize();
    
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    let cardsDueToday = 0;
    let cardsReviewedToday = 0;
    let totalEaseFactor = 0;
    let masteredCards = 0;
    
    for (const card of this.cards.values()) {
      if (card.nextReviewDate <= now) {
        cardsDueToday++;
      }
      if (card.lastReviewDate >= todayStart) {
        cardsReviewedToday++;
      }
      totalEaseFactor += card.easeFactor;
      if (card.interval > 21) {
        masteredCards++;
      }
    }
    
    // Calculate streak
    const { currentStreak, longestStreak } = this.calculateStreak();
    
    return {
      totalCards: this.cards.size,
      cardsDueToday,
      cardsReviewedToday,
      averageEaseFactor: this.cards.size > 0 ? totalEaseFactor / this.cards.size : DEFAULT_EASE_FACTOR,
      longestStreak,
      currentStreak,
      masteredCards,
    };
  }
  
  /**
   * Calculate review streak
   */
  private calculateStreak(): { currentStreak: number; longestStreak: number } {
    const reviewDays = new Set<string>();
    
    for (const session of this.sessions) {
      if (session.completedAt) {
        const date = new Date(session.completedAt).toDateString();
        reviewDays.add(date);
      }
    }
    
    const sortedDays = Array.from(reviewDays).sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i];
      const prevDay = i > 0 ? sortedDays[i - 1] : null;
      
      tempStreak++;
      
      if (prevDay) {
        const dayDate = new Date(day);
        const prevDate = new Date(prevDay);
        const diffDays = Math.round((dayDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (diffDays > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Current streak
    if (reviewDays.has(today)) {
      currentStreak = 1;
      let checkDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      while (reviewDays.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      }
    } else if (reviewDays.has(yesterday)) {
      currentStreak = 1;
      let checkDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      while (reviewDays.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      }
    }
    
    return { currentStreak, longestStreak };
  }
  
  /**
   * Get cards by tutorial
   */
  async getCardsByTutorial(tutorialId: string): Promise<ReviewCard[]> {
    await this.initialize();
    
    const cards: ReviewCard[] = [];
    for (const card of this.cards.values()) {
      if (card.tutorialId === tutorialId) {
        cards.push(card);
      }
    }
    
    return cards;
  }
  
  /**
   * Reset all data
   */
  async reset(): Promise<void> {
    this.cards.clear();
    this.sessions = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const spacedRepetitionService = new SpacedRepetitionService();

// Export convenience functions
export const getDueCards = (limit?: number) => spacedRepetitionService.getDueCards(limit);
export const getDueCount = () => spacedRepetitionService.getDueCount();
export const processReview = (questionId: string, quality: number) =>
  spacedRepetitionService.processReview(questionId, quality);
export const getSpacedRepetitionStats = () => spacedRepetitionService.getStats();
export const addQuestionsFromTutorial = (tutorialId: string, questions: QuizQuestion[]) =>
  spacedRepetitionService.addQuestionsFromTutorial(tutorialId, questions);
