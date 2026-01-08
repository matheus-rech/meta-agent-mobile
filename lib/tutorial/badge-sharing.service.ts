/**
 * Badge Sharing Service
 * 
 * Enables sharing earned badges and progress to social media platforms.
 */

import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { EarnedBadge, ProgressStats } from './progress.service';

// Social media share URLs
const SHARE_URLS = {
  twitter: 'https://twitter.com/intent/tweet',
  linkedin: 'https://www.linkedin.com/sharing/share-offsite/',
  whatsapp: 'https://wa.me/',
};

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
  hashtags?: string[];
}

export interface BadgeShareData {
  badge: EarnedBadge;
  tutorialTitle: string;
  completionDate: Date;
}

export interface ProgressShareData {
  stats: ProgressStats;
  userName?: string;
}

class BadgeSharingService {
  private appUrl = 'https://meta-agent.app';
  private appName = 'Meta Agent';
  
  /**
   * Generate share content for a badge
   */
  generateBadgeShareContent(data: BadgeShareData): ShareContent {
    const { badge, tutorialTitle, completionDate } = data;
    const dateStr = completionDate.toLocaleDateString();
    
    const message = `🎓 I just earned the "${badge.name}" badge ${badge.icon} in ${this.appName}!\n\n` +
      `Completed: ${tutorialTitle}\n` +
      `Date: ${dateStr}\n\n` +
      `Learning meta-analysis with Glass 🦊\n\n` +
      `#MetaAnalysis #Research #DataScience #Learning`;
    
    return {
      title: `${badge.icon} ${badge.name} Badge Earned!`,
      message,
      url: this.appUrl,
      hashtags: ['MetaAnalysis', 'Research', 'DataScience', 'Learning'],
    };
  }
  
  /**
   * Generate share content for progress summary
   */
  generateProgressShareContent(data: ProgressShareData): ShareContent {
    const { stats, userName } = data;
    const name = userName || 'I';
    
    const accuracy = stats.totalQuizzesTaken > 0
      ? Math.round((stats.totalQuizzesCorrect / stats.totalQuizzesTaken) * 100)
      : 0;
    
    const message = `📊 ${name}'ve been learning meta-analysis with ${this.appName}!\n\n` +
      `📚 Tutorials completed: ${stats.totalTutorialsCompleted}\n` +
      `🏆 Badges earned: ${stats.badgesEarned}\n` +
      `✅ Quiz accuracy: ${accuracy}%\n` +
      `⏱️ Time invested: ${this.formatTime(stats.totalTimeSpentMs)}\n\n` +
      `Learning with Glass 🦊\n\n` +
      `#MetaAnalysis #Research #ContinuousLearning`;
    
    return {
      title: 'My Meta-Analysis Learning Progress',
      message,
      url: this.appUrl,
      hashtags: ['MetaAnalysis', 'Research', 'ContinuousLearning'],
    };
  }
  
  /**
   * Share using native share dialog
   */
  async shareNative(content: ShareContent): Promise<boolean> {
    try {
      const result = await Share.share({
        title: content.title,
        message: content.message,
        url: content.url,
      });
      
      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('[BadgeSharing] Native share failed:', error);
      return false;
    }
  }
  
  /**
   * Share to Twitter/X
   */
  async shareToTwitter(content: ShareContent): Promise<boolean> {
    const hashtags = content.hashtags?.join(',') || '';
    const text = encodeURIComponent(content.message);
    const url = encodeURIComponent(content.url || '');
    
    const twitterUrl = `${SHARE_URLS.twitter}?text=${text}&url=${url}&hashtags=${hashtags}`;
    
    return this.openUrl(twitterUrl);
  }
  
  /**
   * Share to LinkedIn
   */
  async shareToLinkedIn(content: ShareContent): Promise<boolean> {
    const url = encodeURIComponent(content.url || this.appUrl);
    const linkedInUrl = `${SHARE_URLS.linkedin}?url=${url}`;
    
    return this.openUrl(linkedInUrl);
  }
  
  /**
   * Share to WhatsApp
   */
  async shareToWhatsApp(content: ShareContent): Promise<boolean> {
    const text = encodeURIComponent(content.message);
    const whatsAppUrl = `${SHARE_URLS.whatsapp}?text=${text}`;
    
    return this.openUrl(whatsAppUrl);
  }
  
  /**
   * Generate ASCII badge card for sharing
   */
  generateBadgeCard(badge: EarnedBadge, tutorialTitle: string): string {
    const width = 40;
    const topBorder = '╔' + '═'.repeat(width - 2) + '╗';
    const bottomBorder = '╚' + '═'.repeat(width - 2) + '╝';
    const emptyLine = '║' + ' '.repeat(width - 2) + '║';
    
    const centerText = (text: string, w: number): string => {
      const padding = Math.max(0, w - text.length);
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    };
    
    const lines = [
      topBorder,
      emptyLine,
      '║' + centerText('🎓 BADGE EARNED 🎓', width - 2) + '║',
      emptyLine,
      '║' + centerText(`${badge.icon} ${badge.name}`, width - 2) + '║',
      emptyLine,
      '║' + centerText(tutorialTitle, width - 2) + '║',
      emptyLine,
      '║' + centerText('Meta Agent 🦊', width - 2) + '║',
      emptyLine,
      bottomBorder,
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Generate progress card for sharing
   */
  generateProgressCard(stats: ProgressStats): string {
    const width = 44;
    const topBorder = '╔' + '═'.repeat(width - 2) + '╗';
    const bottomBorder = '╚' + '═'.repeat(width - 2) + '╝';
    const divider = '╠' + '═'.repeat(width - 2) + '╣';
    
    const padLine = (text: string): string => {
      const padding = width - 2 - text.length;
      return '║ ' + text + ' '.repeat(Math.max(0, padding - 1)) + '║';
    };
    
    const accuracy = stats.totalQuizzesTaken > 0
      ? Math.round((stats.totalQuizzesCorrect / stats.totalQuizzesTaken) * 100)
      : 0;
    
    const lines = [
      topBorder,
      padLine('📊 MY LEARNING PROGRESS'),
      divider,
      padLine(`📚 Tutorials: ${stats.totalTutorialsCompleted} completed`),
      padLine(`🏆 Badges: ${stats.badgesEarned} earned`),
      padLine(`✅ Quiz Accuracy: ${accuracy}%`),
      padLine(`⏱️ Time: ${this.formatTime(stats.totalTimeSpentMs)}`),
      divider,
      padLine('🦊 Meta Agent - Learn Meta-Analysis'),
      bottomBorder,
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Check if sharing is available
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return typeof navigator !== 'undefined' && !!navigator.share;
    }
    return Sharing.isAvailableAsync();
  }
  
  /**
   * Format time in human-readable format
   */
  private formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }
  
  /**
   * Open URL (platform-specific)
   */
  private async openUrl(url: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        return true;
      }
      
      const { Linking } = await import('react-native');
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[BadgeSharing] Failed to open URL:', error);
      return false;
    }
  }
}

// Export singleton instance
export const badgeSharingService = new BadgeSharingService();

// Export convenience functions
export const shareBadge = (data: BadgeShareData) => {
  const content = badgeSharingService.generateBadgeShareContent(data);
  return badgeSharingService.shareNative(content);
};

export const shareProgress = (data: ProgressShareData) => {
  const content = badgeSharingService.generateProgressShareContent(data);
  return badgeSharingService.shareNative(content);
};

export const shareBadgeToTwitter = (data: BadgeShareData) => {
  const content = badgeSharingService.generateBadgeShareContent(data);
  return badgeSharingService.shareToTwitter(content);
};

export const shareBadgeToLinkedIn = (data: BadgeShareData) => {
  const content = badgeSharingService.generateBadgeShareContent(data);
  return badgeSharingService.shareToLinkedIn(content);
};

export const shareBadgeToWhatsApp = (data: BadgeShareData) => {
  const content = badgeSharingService.generateBadgeShareContent(data);
  return badgeSharingService.shareToWhatsApp(content);
};

export const generateBadgeCard = (badge: EarnedBadge, tutorialTitle: string) =>
  badgeSharingService.generateBadgeCard(badge, tutorialTitle);

export const generateProgressCard = (stats: ProgressStats) =>
  badgeSharingService.generateProgressCard(stats);
