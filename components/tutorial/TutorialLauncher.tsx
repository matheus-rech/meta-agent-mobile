/**
 * TutorialLauncher Component
 * 
 * A card component that displays available tutorials and allows
 * users to start or resume them from the home screen.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_PROGRESS_KEY = 'glass-tutorial-progress';

interface TutorialMeta {
  id: string;
  title: string;
  description: string;
  icon: string;
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  stepsCount: number;
}

interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: number;
  completedAt: number | null;
  quizScores: { stepId: string; correct: boolean }[];
}

interface TutorialLauncherProps {
  tutorials: TutorialMeta[];
  onStartTutorial: (tutorialId: string) => void;
  onResumeTutorial?: (tutorialId: string, step: number) => void;
  compact?: boolean;
}

export function TutorialLauncher({
  tutorials,
  onStartTutorial,
  onResumeTutorial,
  compact = false,
}: TutorialLauncherProps) {
  const [progress, setProgress] = useState<Record<string, TutorialProgress>>({});
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  
  // Animation for the "Start" button
  const pulseAnim = useSharedValue(1);
  
  useEffect(() => {
    loadProgress();
    
    // Pulse animation for uncompleted tutorials
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);
  
  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setProgress(data.progress || {});
        setCompletedTutorials(data.completed || []);
      }
    } catch (error) {
      console.error('[TutorialLauncher] Failed to load progress:', error);
    }
  };
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  const handleStartTutorial = (tutorialId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const tutorialProgress = progress[tutorialId];
    if (tutorialProgress && !completedTutorials.includes(tutorialId)) {
      // Resume from where they left off
      onResumeTutorial?.(tutorialId, tutorialProgress.currentStep);
    } else {
      // Start fresh
      onStartTutorial(tutorialId);
    }
  };
  
  const getTutorialStatus = (tutorialId: string) => {
    if (completedTutorials.includes(tutorialId)) {
      return 'completed';
    }
    if (progress[tutorialId]) {
      return 'in-progress';
    }
    return 'not-started';
  };
  
  const getProgressPercentage = (tutorialId: string, stepsCount: number) => {
    const tutorialProgress = progress[tutorialId];
    if (!tutorialProgress) return 0;
    return Math.round((tutorialProgress.completedSteps.length / stepsCount) * 100);
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#eab308';
      case 'advanced': return '#ef4444';
      default: return '#64748b';
    }
  };
  
  if (compact) {
    // Compact view for home screen quick access
    const firstIncomplete = tutorials.find(t => !completedTutorials.includes(t.id));
    
    if (!firstIncomplete) {
      return (
        <View style={styles.compactComplete}>
          <Text style={styles.compactCompleteIcon}>🎓</Text>
          <Text style={styles.compactCompleteText}>All tutorials completed!</Text>
        </View>
      );
    }
    
    const status = getTutorialStatus(firstIncomplete.id);
    
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Pressable
          onPress={() => handleStartTutorial(firstIncomplete.id)}
          style={({ pressed }) => [
            styles.compactCard,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.compactIcon}>
            <Text style={styles.compactIconText}>{firstIncomplete.icon}</Text>
          </View>
          <View style={styles.compactContent}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {status === 'in-progress' ? 'Continue: ' : ''}{firstIncomplete.title}
            </Text>
            <Text style={styles.compactMeta}>
              {firstIncomplete.durationMinutes} min • {firstIncomplete.difficulty}
            </Text>
          </View>
          <Animated.View style={[styles.compactButton, status === 'not-started' && pulseStyle]}>
            <Text style={styles.compactButtonText}>
              {status === 'in-progress' ? 'Resume' : 'Start'}
            </Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  }
  
  // Full tutorial list view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📚</Text>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Interactive Tutorials</Text>
          <Text style={styles.headerSubtitle}>
            Learn meta-analysis step by step with Glass
          </Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {tutorials.map((tutorial, index) => {
          const status = getTutorialStatus(tutorial.id);
          const progressPct = getProgressPercentage(tutorial.id, tutorial.stepsCount);
          
          return (
            <Animated.View
              key={tutorial.id}
              entering={FadeInDown.delay(index * 100).duration(300)}
            >
              <Pressable
                onPress={() => handleStartTutorial(tutorial.id)}
                style={({ pressed }) => [
                  styles.tutorialCard,
                  status === 'completed' && styles.tutorialCardCompleted,
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Icon */}
                <View style={[
                  styles.tutorialIcon,
                  status === 'completed' && styles.tutorialIconCompleted,
                ]}>
                  <Text style={styles.tutorialIconText}>{tutorial.icon}</Text>
                  {status === 'completed' && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
                
                {/* Content */}
                <View style={styles.tutorialContent}>
                  <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                  <Text style={styles.tutorialDescription} numberOfLines={2}>
                    {tutorial.description}
                  </Text>
                  
                  {/* Meta */}
                  <View style={styles.tutorialMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>⏱</Text>
                      <Text style={styles.metaText}>{tutorial.durationMinutes} min</Text>
                    </View>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(tutorial.difficulty) + '20' },
                    ]}>
                      <Text style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(tutorial.difficulty) },
                      ]}>
                        {tutorial.difficulty}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  {status === 'in-progress' && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressFill, { width: `${progressPct}%` }]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{progressPct}%</Text>
                    </View>
                  )}
                </View>
                
                {/* Action */}
                <View style={styles.tutorialAction}>
                  {status === 'completed' ? (
                    <Text style={styles.actionCompleted}>Completed</Text>
                  ) : status === 'in-progress' ? (
                    <Text style={styles.actionResume}>Resume →</Text>
                  ) : (
                    <Animated.View style={pulseStyle}>
                      <Text style={styles.actionStart}>Start →</Text>
                    </Animated.View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  tutorialCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tutorialCardCompleted: {
    opacity: 0.7,
  },
  cardPressed: {
    opacity: 0.8,
  },
  tutorialIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tutorialIconCompleted: {
    backgroundColor: '#22c55e20',
  },
  tutorialIconText: {
    fontSize: 28,
  },
  completedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  tutorialContent: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  tutorialDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 8,
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#0f172a',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  tutorialAction: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionStart: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  actionResume: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  actionCompleted: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactIconText: {
    fontSize: 20,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  compactMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  compactButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compactButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  compactComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  compactCompleteIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  compactCompleteText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
});

export default TutorialLauncher;
