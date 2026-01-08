/**
 * Achievement Notification Service
 * 
 * Manages achievement tracking, notifications, and Glass celebrations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = '@meta_agent_achievements';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'tutorial' | 'quiz' | 'streak' | 'community' | 'special';
  requirement: {
    type: 'count' | 'streak' | 'score' | 'time' | 'custom';
    value: number;
    metric?: string;
  };
  reward?: {
    type: 'badge' | 'title' | 'unlock';
    value: string;
  };
}

export interface EarnedAchievement {
  achievementId: string;
  earnedAt: number;
  notified: boolean;
}

export interface AchievementNotification {
  achievement: Achievement;
  earnedAt: number;
  glassMessage: string;
  glassEmotion: 'celebrating' | 'proud' | 'excited';
}

// Predefined achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Tutorial achievements
  {
    id: 'first-tutorial',
    name: 'First Steps',
    description: 'Complete your first tutorial',
    icon: '🎓',
    category: 'tutorial',
    requirement: { type: 'count', value: 1, metric: 'tutorials_completed' },
  },
  {
    id: 'tutorial-trio',
    name: 'Tutorial Trio',
    description: 'Complete 3 tutorials',
    icon: '📚',
    category: 'tutorial',
    requirement: { type: 'count', value: 3, metric: 'tutorials_completed' },
  },
  {
    id: 'tutorial-master',
    name: 'Tutorial Master',
    description: 'Complete all available tutorials',
    icon: '🏆',
    category: 'tutorial',
    requirement: { type: 'count', value: 5, metric: 'tutorials_completed' },
  },
  
  // Quiz achievements
  {
    id: 'quiz-starter',
    name: 'Quiz Starter',
    description: 'Complete your first quiz',
    icon: '❓',
    category: 'quiz',
    requirement: { type: 'count', value: 1, metric: 'quizzes_completed' },
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: '💯',
    category: 'quiz',
    requirement: { type: 'score', value: 100, metric: 'quiz_score' },
  },
  {
    id: 'quiz-champion',
    name: 'Quiz Champion',
    description: 'Complete 50 quiz questions',
    icon: '🧠',
    category: 'quiz',
    requirement: { type: 'count', value: 50, metric: 'questions_answered' },
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Answer 10 questions correctly in under 30 seconds each',
    icon: '⚡',
    category: 'quiz',
    requirement: { type: 'count', value: 10, metric: 'fast_correct_answers' },
  },
  
  // Streak achievements
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day learning streak',
    icon: '🌟',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
  },
  {
    id: 'streak-100',
    name: 'Century Club',
    description: 'Maintain a 100-day learning streak',
    icon: '👑',
    category: 'streak',
    requirement: { type: 'streak', value: 100 },
  },
  
  // Community achievements
  {
    id: 'first-share',
    name: 'Sharing is Caring',
    description: 'Share your first badge on social media',
    icon: '📤',
    category: 'community',
    requirement: { type: 'count', value: 1, metric: 'badges_shared' },
  },
  {
    id: 'community-member',
    name: 'Community Member',
    description: 'Join the meta-analysis community',
    icon: '🤝',
    category: 'community',
    requirement: { type: 'count', value: 1, metric: 'community_joined' },
  },
  
  // Special achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a tutorial before 7 AM',
    icon: '🌅',
    category: 'special',
    requirement: { type: 'custom', value: 1, metric: 'early_completion' },
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a tutorial after 11 PM',
    icon: '🦉',
    category: 'special',
    requirement: { type: 'custom', value: 1, metric: 'late_completion' },
  },
];

// Glass celebration messages
const CELEBRATION_MESSAGES: Record<string, string[]> = {
  tutorial: [
    '🎉 Parabéns! You completed a tutorial! I knew you could do it!',
    '🦊 Amazing work! Another tutorial mastered! Keep going!',
    '✨ Wonderful! Your meta-analysis skills are growing!',
  ],
  quiz: [
    '🧠 Brilliant! Your knowledge is impressive!',
    '🦊 Great job on the quiz! You\'re really learning!',
    '💪 Fantastic quiz performance! I\'m proud of you!',
  ],
  streak: [
    '🔥 Incredible streak! Your dedication inspires me!',
    '🦊 Wow! You\'re on fire! Keep that streak going!',
    '⭐ Amazing consistency! You\'re a true learner!',
  ],
  community: [
    '🤝 Welcome to the community! Together we learn better!',
    '🦊 Thanks for sharing! You\'re helping others learn too!',
    '💝 Community spirit! That\'s what I love to see!',
  ],
  special: [
    '🌟 A special achievement! You\'re truly dedicated!',
    '🦊 Wow, a rare achievement! You\'re exceptional!',
    '✨ Special recognition for special effort!',
  ],
};

class AchievementService {
  private earnedAchievements: Map<string, EarnedAchievement> = new Map();
  private pendingNotifications: AchievementNotification[] = [];
  private listeners: Set<(notification: AchievementNotification) => void> = new Set();
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
        this.earnedAchievements = new Map(parsed.earned || []);
      }
      this.initialized = true;
    } catch (error) {
      console.error('[AchievementService] Failed to initialize:', error);
      this.initialized = true;
    }
  }
  
  /**
   * Save current state to storage
   */
  private async save(): Promise<void> {
    try {
      const data = {
        earned: Array.from(this.earnedAchievements.entries()),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[AchievementService] Failed to save:', error);
    }
  }
  
  /**
   * Check and award an achievement
   */
  async checkAndAward(achievementId: string): Promise<AchievementNotification | null> {
    await this.initialize();
    
    // Already earned
    if (this.earnedAchievements.has(achievementId)) {
      return null;
    }
    
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;
    
    // Award the achievement
    const earned: EarnedAchievement = {
      achievementId,
      earnedAt: Date.now(),
      notified: false,
    };
    
    this.earnedAchievements.set(achievementId, earned);
    await this.save();
    
    // Create notification
    const messages = CELEBRATION_MESSAGES[achievement.category] || CELEBRATION_MESSAGES.special;
    const glassMessage = messages[Math.floor(Math.random() * messages.length)];
    
    const notification: AchievementNotification = {
      achievement,
      earnedAt: earned.earnedAt,
      glassMessage,
      glassEmotion: 'celebrating',
    };
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Notify listeners
    this.notifyListeners(notification);
    
    return notification;
  }
  
  /**
   * Check progress against achievement requirements
   */
  async checkProgress(metric: string, value: number): Promise<AchievementNotification[]> {
    await this.initialize();
    
    const notifications: AchievementNotification[] = [];
    
    for (const achievement of ACHIEVEMENTS) {
      if (this.earnedAchievements.has(achievement.id)) continue;
      
      const req = achievement.requirement;
      if (req.metric !== metric) continue;
      
      if (req.type === 'count' && value >= req.value) {
        const notification = await this.checkAndAward(achievement.id);
        if (notification) notifications.push(notification);
      } else if (req.type === 'streak' && value >= req.value) {
        const notification = await this.checkAndAward(achievement.id);
        if (notification) notifications.push(notification);
      } else if (req.type === 'score' && value >= req.value) {
        const notification = await this.checkAndAward(achievement.id);
        if (notification) notifications.push(notification);
      }
    }
    
    return notifications;
  }
  
  /**
   * Get all earned achievements
   */
  async getEarnedAchievements(): Promise<(Achievement & { earnedAt: number })[]> {
    await this.initialize();
    
    const earned: (Achievement & { earnedAt: number })[] = [];
    
    for (const [id, data] of this.earnedAchievements) {
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        earned.push({ ...achievement, earnedAt: data.earnedAt });
      }
    }
    
    return earned.sort((a, b) => b.earnedAt - a.earnedAt);
  }
  
  /**
   * Get achievement progress
   */
  getProgress(): { earned: number; total: number; percentage: number } {
    const earned = this.earnedAchievements.size;
    const total = ACHIEVEMENTS.length;
    return {
      earned,
      total,
      percentage: Math.round((earned / total) * 100),
    };
  }
  
  /**
   * Subscribe to achievement notifications
   */
  subscribe(listener: (notification: AchievementNotification) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners(notification: AchievementNotification): void {
    for (const listener of this.listeners) {
      try {
        listener(notification);
      } catch (error) {
        console.error('[AchievementService] Listener error:', error);
      }
    }
  }
  
  /**
   * Reset all achievements (for testing)
   */
  async reset(): Promise<void> {
    this.earnedAchievements.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const achievementService = new AchievementService();

// Export convenience functions
export const checkAchievement = (id: string) => achievementService.checkAndAward(id);
export const checkProgress = (metric: string, value: number) => achievementService.checkProgress(metric, value);
export const getEarnedAchievements = () => achievementService.getEarnedAchievements();
export const subscribeToAchievements = (listener: (n: AchievementNotification) => void) => 
  achievementService.subscribe(listener);
