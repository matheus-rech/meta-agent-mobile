/**
 * Tutorial Hub Screen
 * Main screen for browsing and starting tutorial modules
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { TutorialProgressBar } from '@/components/tutorial';
import { tutorialService, TutorialModule, TutorialState } from '@/lib/tutorial';

export default function TutorialHubScreen() {
  const router = useRouter();
  const [state, setState] = useState<TutorialState | null>(null);
  const [modules, setModules] = useState<TutorialModule[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      await tutorialService.initialize();
      setState(tutorialService.getState());
      setModules(tutorialService.getModules());
    };
    init();

    const unsubscribe = tutorialService.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await tutorialService.initialize();
    setState(tutorialService.getState());
    setRefreshing(false);
  }, []);

  const handleStartModule = async (moduleId: string) => {
    const success = await tutorialService.startModule(moduleId);
    if (success) {
      router.push({ pathname: '/tutorial-step', params: { moduleId } });
    }
  };

  const handleContinueModule = async (moduleId: string) => {
    const success = await tutorialService.startModule(moduleId);
    if (success) {
      router.push({ pathname: '/tutorial-step', params: { moduleId } });
    }
  };

  const handleResetModule = async (moduleId: string) => {
    await tutorialService.resetModule(moduleId);
  };

  if (!state) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tutorials...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const stats = tutorialService.getStatistics();
  const recommendedModule = tutorialService.getRecommendedNextModule();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Learn Meta-Analysis</Text>
          <Text style={styles.subtitle}>
            Interactive tutorials to master evidence synthesis
          </Text>
        </View>

        {/* Overall Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressPercent}>
              {Math.round((stats.modulesCompleted / stats.totalModules) * 100)}%
            </Text>
          </View>
          <TutorialProgressBar
            progress={(stats.modulesCompleted / stats.totalModules) * 100}
            height={8}
          />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.modulesCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(stats.timeSpent / 60)}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Recommended Module */}
        {recommendedModule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Next</Text>
            <ModuleCard
              module={recommendedModule}
              progress={tutorialService.getModuleProgress(recommendedModule.id)}
              isCompleted={tutorialService.isModuleCompleted(recommendedModule.id)}
              isLocked={!tutorialService.arePrerequisitesMet(recommendedModule.id)}
              onStart={() => handleStartModule(recommendedModule.id)}
              onContinue={() => handleContinueModule(recommendedModule.id)}
              onReset={() => handleResetModule(recommendedModule.id)}
              isRecommended
            />
          </View>
        )}

        {/* All Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Tutorials</Text>
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              progress={tutorialService.getModuleProgress(module.id)}
              isCompleted={tutorialService.isModuleCompleted(module.id)}
              isLocked={!tutorialService.arePrerequisitesMet(module.id)}
              onStart={() => handleStartModule(module.id)}
              onContinue={() => handleContinueModule(module.id)}
              onReset={() => handleResetModule(module.id)}
            />
          ))}
        </View>

        {/* Badges Section */}
        {state.earnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earned Badges</Text>
            <View style={styles.badgesGrid}>
              {tutorialService.getEarnedBadges().map((badge) => (
                <View key={badge.id} style={styles.badgeItem}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reset All */}
        <Pressable
          onPress={() => tutorialService.resetAllProgress()}
          style={({ pressed }) => [
            styles.resetButton,
            pressed && styles.resetButtonPressed,
          ]}
        >
          <Text style={styles.resetButtonText}>Reset All Progress</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * ModuleCard Component
 */
function ModuleCard({
  module,
  progress,
  isCompleted,
  isLocked,
  onStart,
  onContinue,
  onReset,
  isRecommended = false,
}: {
  module: TutorialModule;
  progress: number;
  isCompleted: boolean;
  isLocked: boolean;
  onStart: () => void;
  onContinue: () => void;
  onReset: () => void;
  isRecommended?: boolean;
}) {
  const hasStarted = progress > 0 && !isCompleted;

  return (
    <View style={[
      styles.moduleCard,
      isRecommended && styles.moduleCardRecommended,
      isLocked && styles.moduleCardLocked,
    ]}>
      {/* Header */}
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleIcon}>{module.icon}</Text>
        <View style={styles.moduleInfo}>
          <Text style={[styles.moduleTitle, isLocked && styles.moduleTitleLocked]}>
            {module.title}
          </Text>
          <View style={styles.moduleMeta}>
            <Text style={styles.moduleMetaText}>
              {module.estimatedMinutes} min
            </Text>
            <Text style={styles.moduleMetaDot}>•</Text>
            <Text style={styles.moduleMetaText}>
              {module.difficulty}
            </Text>
            <Text style={styles.moduleMetaDot}>•</Text>
            <Text style={styles.moduleMetaText}>
              {module.steps.length} steps
            </Text>
          </View>
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedIcon}>✓</Text>
          </View>
        )}
        {isLocked && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedIcon}>🔒</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={[styles.moduleDescription, isLocked && styles.moduleDescriptionLocked]}>
        {module.description}
      </Text>

      {/* Progress Bar */}
      {hasStarted && (
        <View style={styles.moduleProgress}>
          <TutorialProgressBar progress={progress} height={4} />
          <Text style={styles.moduleProgressText}>{progress}% complete</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.moduleActions}>
        {isLocked ? (
          <Text style={styles.lockedText}>
            Complete prerequisites first
          </Text>
        ) : isCompleted ? (
          <View style={styles.completedActions}>
            <Pressable
              onPress={onStart}
              style={({ pressed }) => [
                styles.actionButton,
                styles.reviewButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={styles.reviewButtonText}>Review</Text>
            </Pressable>
            <Pressable
              onPress={onReset}
              style={({ pressed }) => [
                styles.actionButton,
                styles.resetModuleButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={styles.resetModuleButtonText}>Reset</Text>
            </Pressable>
          </View>
        ) : hasStarted ? (
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.actionButton,
              styles.continueButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [
              styles.actionButton,
              styles.startButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={styles.startButtonText}>Start Tutorial</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
  },
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  moduleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  moduleCardRecommended: {
    borderColor: '#0ea5e9',
    borderWidth: 2,
  },
  moduleCardLocked: {
    opacity: 0.6,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 2,
  },
  moduleTitleLocked: {
    color: '#64748b',
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleMetaText: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  moduleMetaDot: {
    fontSize: 12,
    color: '#475569',
    marginHorizontal: 6,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  lockedBadge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    fontSize: 18,
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    marginBottom: 12,
  },
  moduleDescriptionLocked: {
    color: '#64748b',
  },
  moduleProgress: {
    marginBottom: 12,
  },
  moduleProgressText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  moduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  completedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  lockedText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  startButton: {
    backgroundColor: '#0ea5e9',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButton: {
    backgroundColor: '#0ea5e9',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  reviewButton: {
    backgroundColor: '#334155',
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  resetModuleButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  resetModuleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  resetButtonPressed: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 13,
    color: '#ef4444',
  },
});
