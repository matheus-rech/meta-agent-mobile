/**
 * My Progress Screen
 * 
 * Dashboard showing tutorial progress, earned badges,
 * bookmarks, and learning statistics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  tutorialProgressService,
  type TutorialProgress,
  type EarnedBadge,
  type TutorialBookmark,
  type ProgressStats,
} from '@/lib/tutorial/progress.service';

// Tutorial metadata for display
const TUTORIAL_META: Record<string, { title: string; icon: string; stepsCount: number }> = {
  'forest-plot-basics': { title: 'Forest Plot Basics', icon: '🌲', stepsCount: 12 },
  'heterogeneity-analysis': { title: 'Understanding Heterogeneity', icon: '🔍', stepsCount: 12 },
  'subgroup-analysis': { title: 'Subgroup Analysis', icon: '📊', stepsCount: 12 },
};

export default function MyProgressScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [progress, setProgress] = useState<TutorialProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<TutorialBookmark[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'bookmarks'>('overview');
  
  // Streak animation
  const streakGlow = useSharedValue(0.5);
  
  useEffect(() => {
    loadData();
    
    streakGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);
  
  const loadData = async () => {
    try {
      const [statsData, badgesData, progressData, bookmarksData] = await Promise.all([
        tutorialProgressService.getStats(),
        tutorialProgressService.getBadges(),
        tutorialProgressService.getAllProgress(),
        tutorialProgressService.getBookmarks(),
      ]);
      
      setStats(statsData);
      setBadges(badgesData);
      setProgress(progressData);
      setBookmarks(bookmarksData);
    } catch (error) {
      console.error('[MyProgress] Failed to load data:', error);
    }
  };
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);
  
  const handleTutorialPress = (tutorialId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to tutorial - would need to implement this route
    router.push(`/tutorial?id=${tutorialId}` as any);
  };
  
  const handleBookmarkPress = (bookmark: TutorialBookmark) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to tutorial at specific step
    router.push(`/tutorial?id=${bookmark.tutorialId}&step=${bookmark.stepIndex}` as any);
  };
  
  const handleRemoveBookmark = async (bookmarkId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await tutorialProgressService.removeBookmark(bookmarkId);
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  };
  
  const streakGlowStyle = useAnimatedStyle(() => ({
    opacity: streakGlow.value,
  }));
  
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };
  
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };
  
  const getProgressPercentage = (p: TutorialProgress): number => {
    const meta = TUTORIAL_META[p.tutorialId];
    if (!meta) return 0;
    return Math.round((p.completedStepIds.length / meta.stepsCount) * 100);
  };
  
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={[styles.statCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats?.totalTutorialsCompleted || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Completed
          </Text>
        </Animated.View>
        
        <Animated.View
          entering={FadeInDown.delay(200).duration(300)}
          style={[styles.statCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.statValue, { color: '#22c55e' }]}>
            {stats?.badgesEarned || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Badges
          </Text>
        </Animated.View>
        
        <Animated.View
          entering={FadeInDown.delay(300).duration(300)}
          style={[styles.statCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {stats?.currentStreak || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Day Streak
          </Text>
          {(stats?.currentStreak || 0) > 0 && (
            <Animated.View style={[styles.streakGlow, streakGlowStyle]} />
          )}
        </Animated.View>
        
        <Animated.View
          entering={FadeInDown.delay(400).duration(300)}
          style={[styles.statCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {formatTime(stats?.totalTimeSpentMs || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Time Spent
          </Text>
        </Animated.View>
      </View>
      
      {/* Quiz Performance */}
      {(stats?.totalQuizzesTaken || 0) > 0 && (
        <Animated.View
          entering={FadeInDown.delay(500).duration(300)}
          style={[styles.quizCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quiz Performance
          </Text>
          <View style={styles.quizStats}>
            <View style={styles.quizBar}>
              <View
                style={[
                  styles.quizBarFill,
                  {
                    width: `${Math.round(((stats?.totalQuizzesCorrect || 0) / (stats?.totalQuizzesTaken || 1)) * 100)}%`,
                    backgroundColor: '#22c55e',
                  },
                ]}
              />
            </View>
            <Text style={[styles.quizText, { color: colors.muted }]}>
              {stats?.totalQuizzesCorrect}/{stats?.totalQuizzesTaken} correct (
              {Math.round(((stats?.totalQuizzesCorrect || 0) / (stats?.totalQuizzesTaken || 1)) * 100)}%)
            </Text>
          </View>
        </Animated.View>
      )}
      
      {/* Tutorial Progress */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(300)}
        style={styles.section}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Tutorial Progress
        </Text>
        
        {progress.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No tutorials started yet
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyButtonText}>Start Learning</Text>
            </Pressable>
          </View>
        ) : (
          progress.map((p, index) => {
            const meta = TUTORIAL_META[p.tutorialId];
            const percentage = getProgressPercentage(p);
            
            return (
              <Pressable
                key={p.tutorialId}
                onPress={() => handleTutorialPress(p.tutorialId)}
                style={({ pressed }) => [
                  styles.progressCard,
                  { backgroundColor: colors.surface },
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.progressIcon}>
                  <Text style={styles.progressIconText}>{meta?.icon || '📖'}</Text>
                  {p.completedAt && (
                    <View style={styles.completedCheck}>
                      <Text style={styles.completedCheckText}>✓</Text>
                    </View>
                  )}
                </View>
                <View style={styles.progressContent}>
                  <Text style={[styles.progressTitle, { color: colors.foreground }]}>
                    {meta?.title || p.tutorialId}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: p.completedAt ? '#22c55e' : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressMeta, { color: colors.muted }]}>
                    {p.completedAt
                      ? `Completed ${formatDate(p.completedAt)}`
                      : `${percentage}% • Last: ${formatDate(p.lastAccessedAt)}`}
                  </Text>
                </View>
                <Text style={[styles.progressArrow, { color: colors.muted }]}>→</Text>
              </Pressable>
            );
          })
        )}
      </Animated.View>
    </View>
  );
  
  const renderBadgesTab = () => (
    <View style={styles.tabContent}>
      {badges.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Complete tutorials to earn badges!
          </Text>
        </View>
      ) : (
        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <Animated.View
              key={badge.id}
              entering={FadeInDown.delay(index * 100).duration(300)}
              style={[styles.badgeCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.badgeIconContainer}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
              </View>
              <Text style={[styles.badgeName, { color: colors.foreground }]}>
                {badge.name}
              </Text>
              <Text style={[styles.badgeDescription, { color: colors.muted }]} numberOfLines={2}>
                {badge.description}
              </Text>
              <Text style={[styles.badgeDate, { color: colors.muted }]}>
                Earned {formatDate(badge.earnedAt)}
              </Text>
              {badge.quizScore && (
                <View style={styles.badgeScore}>
                  <Text style={[styles.badgeScoreText, { color: '#22c55e' }]}>
                    Quiz: {badge.quizScore.correct}/{badge.quizScore.total}
                  </Text>
                </View>
              )}
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
  
  const renderBookmarksTab = () => (
    <View style={styles.tabContent}>
      {bookmarks.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Bookmark tutorial steps to revisit later
          </Text>
        </View>
      ) : (
        bookmarks.map((bookmark, index) => {
          const meta = TUTORIAL_META[bookmark.tutorialId];
          
          return (
            <Animated.View
              key={bookmark.id}
              entering={FadeInDown.delay(index * 100).duration(300)}
            >
              <Pressable
                onPress={() => handleBookmarkPress(bookmark)}
                style={({ pressed }) => [
                  styles.bookmarkCard,
                  { backgroundColor: colors.surface },
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.bookmarkIcon}>
                  <Text style={styles.bookmarkIconText}>🔖</Text>
                </View>
                <View style={styles.bookmarkContent}>
                  <Text style={[styles.bookmarkTitle, { color: colors.foreground }]}>
                    {bookmark.stepTitle}
                  </Text>
                  <Text style={[styles.bookmarkMeta, { color: colors.muted }]}>
                    {meta?.title || bookmark.tutorialId} • Step {bookmark.stepIndex + 1}
                  </Text>
                  {bookmark.note && (
                    <Text style={[styles.bookmarkNote, { color: colors.muted }]} numberOfLines={1}>
                      "{bookmark.note}"
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => handleRemoveBookmark(bookmark.id)}
                  style={styles.bookmarkRemove}
                  hitSlop={8}
                >
                  <Text style={[styles.bookmarkRemoveText, { color: colors.error }]}>×</Text>
                </Pressable>
              </Pressable>
            </Animated.View>
          );
        })
      )}
    </View>
  );
  
  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      containerClassName="bg-background"
      className="flex-1"
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          My Progress
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['overview', 'badges', 'bookmarks'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.muted },
              ]}
            >
              {tab === 'overview' ? '📊 Overview' : tab === 'badges' ? '🏆 Badges' : '🔖 Bookmarks'}
            </Text>
          </Pressable>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'badges' && renderBadgesTab()}
        {activeTab === 'bookmarks' && renderBookmarksTab()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 60,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tabContent: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  streakGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    zIndex: -1,
  },
  quizCard: {
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  quizStats: {
    gap: 8,
  },
  quizBar: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quizBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quizText: {
    fontSize: 13,
  },
  section: {
    gap: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.7,
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressIconText: {
    fontSize: 24,
  },
  completedCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  progressContent: {
    flex: 1,
    gap: 4,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressMeta: {
    fontSize: 12,
  },
  progressArrow: {
    fontSize: 18,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeDate: {
    fontSize: 10,
  },
  badgeScore: {
    backgroundColor: '#22c55e20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeScoreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  bookmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkIconText: {
    fontSize: 20,
  },
  bookmarkContent: {
    flex: 1,
    gap: 2,
  },
  bookmarkTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookmarkMeta: {
    fontSize: 12,
  },
  bookmarkNote: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  bookmarkRemove: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkRemoveText: {
    fontSize: 24,
    fontWeight: '300',
  },
});
