/**
 * Leaderboard Service
 * 
 * Manages local and public quiz leaderboards.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_STORAGE_KEY = '@meta_agent_leaderboard_local';
const PUBLIC_STORAGE_KEY = '@meta_agent_leaderboard_public';

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  quizzesCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  streak: number;
  lastActive: number;
  rank?: number;
}

export interface LeaderboardStats {
  totalUsers: number;
  averageScore: number;
  topScore: number;
  yourRank: number | null;
}

// Anonymous username generator
const ADJECTIVES = [
  'Swift', 'Clever', 'Wise', 'Bright', 'Sharp',
  'Quick', 'Smart', 'Keen', 'Bold', 'Brave',
  'Noble', 'Calm', 'Cool', 'Eager', 'Fair',
];

const ANIMALS = [
  'Fox', 'Owl', 'Eagle', 'Wolf', 'Bear',
  'Hawk', 'Lion', 'Tiger', 'Panda', 'Koala',
  'Dolphin', 'Falcon', 'Phoenix', 'Dragon', 'Unicorn',
];

class LeaderboardService {
  private localEntries: LeaderboardEntry[] = [];
  private publicEntries: LeaderboardEntry[] = [];
  private userId: string | null = null;
  private username: string | null = null;
  private initialized = false;
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load local entries
      const localData = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        this.localEntries = parsed.entries || [];
        this.userId = parsed.userId || null;
        this.username = parsed.username || null;
      }
      
      // Generate user ID and username if not exists
      if (!this.userId) {
        this.userId = this.generateUserId();
        this.username = this.generateUsername();
        await this.save();
      }
      
      // Load public entries (simulated - in production would be from API)
      const publicData = await AsyncStorage.getItem(PUBLIC_STORAGE_KEY);
      if (publicData) {
        this.publicEntries = JSON.parse(publicData);
      } else {
        // Initialize with sample data
        this.publicEntries = this.generateSampleLeaderboard();
        await this.savePublic();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[Leaderboard] Failed to initialize:', error);
      this.initialized = true;
    }
  }
  
  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Generate an anonymous username
   */
  private generateUsername(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${animal}${num}`;
  }
  
  /**
   * Generate sample leaderboard data
   */
  private generateSampleLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    
    for (let i = 0; i < 20; i++) {
      const username = this.generateUsername();
      const quizzesCompleted = Math.floor(Math.random() * 50) + 10;
      const accuracy = 0.6 + Math.random() * 0.35;
      const totalAnswers = quizzesCompleted * 5;
      const correctAnswers = Math.floor(totalAnswers * accuracy);
      
      entries.push({
        id: `sample_${i}`,
        username,
        score: Math.floor(correctAnswers * 10 + quizzesCompleted * 5),
        quizzesCompleted,
        correctAnswers,
        totalAnswers,
        accuracy: Math.round(accuracy * 100),
        streak: Math.floor(Math.random() * 30),
        lastActive: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    return entries.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Save local data
   */
  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        entries: this.localEntries,
        userId: this.userId,
        username: this.username,
      }));
    } catch (error) {
      console.error('[Leaderboard] Failed to save:', error);
    }
  }
  
  /**
   * Save public data
   */
  private async savePublic(): Promise<void> {
    try {
      await AsyncStorage.setItem(PUBLIC_STORAGE_KEY, JSON.stringify(this.publicEntries));
    } catch (error) {
      console.error('[Leaderboard] Failed to save public:', error);
    }
  }
  
  /**
   * Get current user info
   */
  async getUserInfo(): Promise<{ userId: string; username: string }> {
    await this.initialize();
    return {
      userId: this.userId!,
      username: this.username!,
    };
  }
  
  /**
   * Update username
   */
  async setUsername(newUsername: string): Promise<void> {
    await this.initialize();
    this.username = newUsername;
    await this.save();
    
    // Update in public leaderboard
    const publicEntry = this.publicEntries.find(e => e.id === this.userId);
    if (publicEntry) {
      publicEntry.username = newUsername;
      await this.savePublic();
    }
  }
  
  /**
   * Update user score
   */
  async updateScore(
    correctAnswers: number,
    totalAnswers: number,
    quizCompleted: boolean = false
  ): Promise<void> {
    await this.initialize();
    
    // Find or create user entry
    let entry = this.localEntries.find(e => e.id === this.userId);
    
    if (!entry) {
      entry = {
        id: this.userId!,
        username: this.username!,
        score: 0,
        quizzesCompleted: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        accuracy: 0,
        streak: 0,
        lastActive: Date.now(),
      };
      this.localEntries.push(entry);
    }
    
    // Update stats
    entry.correctAnswers += correctAnswers;
    entry.totalAnswers += totalAnswers;
    entry.accuracy = Math.round((entry.correctAnswers / entry.totalAnswers) * 100);
    entry.score = entry.correctAnswers * 10 + entry.quizzesCompleted * 5;
    entry.lastActive = Date.now();
    
    if (quizCompleted) {
      entry.quizzesCompleted += 1;
    }
    
    await this.save();
    
    // Update public leaderboard
    await this.syncToPublic(entry);
  }
  
  /**
   * Update streak
   */
  async updateStreak(streak: number): Promise<void> {
    await this.initialize();
    
    const entry = this.localEntries.find(e => e.id === this.userId);
    if (entry) {
      entry.streak = streak;
      await this.save();
      await this.syncToPublic(entry);
    }
  }
  
  /**
   * Sync local entry to public leaderboard
   */
  private async syncToPublic(entry: LeaderboardEntry): Promise<void> {
    const existingIndex = this.publicEntries.findIndex(e => e.id === this.userId);
    
    if (existingIndex >= 0) {
      this.publicEntries[existingIndex] = { ...entry };
    } else {
      this.publicEntries.push({ ...entry });
    }
    
    // Sort by score
    this.publicEntries.sort((a, b) => b.score - a.score);
    
    // Assign ranks
    this.publicEntries.forEach((e, i) => {
      e.rank = i + 1;
    });
    
    await this.savePublic();
  }
  
  /**
   * Get local leaderboard (personal history)
   */
  async getLocalLeaderboard(): Promise<LeaderboardEntry[]> {
    await this.initialize();
    return this.localEntries.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get public leaderboard
   */
  async getPublicLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    await this.initialize();
    return this.publicEntries.slice(0, limit);
  }
  
  /**
   * Get user's rank
   */
  async getUserRank(): Promise<number | null> {
    await this.initialize();
    
    const entry = this.publicEntries.find(e => e.id === this.userId);
    return entry?.rank || null;
  }
  
  /**
   * Get user's entry
   */
  async getUserEntry(): Promise<LeaderboardEntry | null> {
    await this.initialize();
    return this.publicEntries.find(e => e.id === this.userId) || null;
  }
  
  /**
   * Get leaderboard stats
   */
  async getStats(): Promise<LeaderboardStats> {
    await this.initialize();
    
    const totalUsers = this.publicEntries.length;
    const totalScore = this.publicEntries.reduce((sum, e) => sum + e.score, 0);
    const topScore = this.publicEntries[0]?.score || 0;
    const yourRank = await this.getUserRank();
    
    return {
      totalUsers,
      averageScore: totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0,
      topScore,
      yourRank,
    };
  }
  
  /**
   * Get weekly leaderboard
   */
  async getWeeklyLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    await this.initialize();
    
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    return this.publicEntries
      .filter(e => e.lastActive >= oneWeekAgo)
      .slice(0, limit);
  }
  
  /**
   * Reset leaderboard (for testing)
   */
  async reset(): Promise<void> {
    this.localEntries = [];
    this.publicEntries = this.generateSampleLeaderboard();
    await this.save();
    await this.savePublic();
  }
}

// Export singleton
export const leaderboardService = new LeaderboardService();

// Export convenience functions
export const getUserInfo = () => leaderboardService.getUserInfo();
export const setUsername = (name: string) => leaderboardService.setUsername(name);
export const updateScore = (correct: number, total: number, completed?: boolean) => 
  leaderboardService.updateScore(correct, total, completed);
export const updateStreak = (streak: number) => leaderboardService.updateStreak(streak);
export const getLocalLeaderboard = () => leaderboardService.getLocalLeaderboard();
export const getPublicLeaderboard = (limit?: number) => leaderboardService.getPublicLeaderboard(limit);
export const getUserRank = () => leaderboardService.getUserRank();
export const getUserEntry = () => leaderboardService.getUserEntry();
export const getLeaderboardStats = () => leaderboardService.getStats();
export const getWeeklyLeaderboard = (limit?: number) => leaderboardService.getWeeklyLeaderboard(limit);
