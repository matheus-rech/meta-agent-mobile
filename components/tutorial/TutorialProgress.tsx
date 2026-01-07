/**
 * TutorialProgress Component
 * Shows progress through tutorial steps with visual indicators
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
  moduleTitle?: string;
  onStepPress?: (stepIndex: number) => void;
  compact?: boolean;
}

export function TutorialProgress({
  currentStep,
  totalSteps,
  moduleTitle,
  onStepPress,
  compact = false,
}: TutorialProgressProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactProgressBar}>
          <Animated.View
            style={[
              styles.compactProgressFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
        <Text style={styles.compactText}>
          {currentStep}/{totalSteps}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Module Title */}
      {moduleTitle && (
        <Text style={styles.moduleTitle}>{moduleTitle}</Text>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercent}%</Text>
      </View>

      {/* Step Dots */}
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <Pressable
              key={index}
              onPress={() => onStepPress?.(index)}
              disabled={!onStepPress || index > currentStep}
              style={({ pressed }) => [
                styles.stepDot,
                isCompleted && styles.stepDotCompleted,
                isCurrent && styles.stepDotCurrent,
                pressed && styles.stepDotPressed,
              ]}
            >
              {isCompleted && (
                <Text style={styles.checkmark}>✓</Text>
              )}
              {isCurrent && (
                <View style={styles.currentDot} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Step Counter */}
      <Text style={styles.stepCounter}>
        Step {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
}

/**
 * TutorialProgressBar Component
 * Simple horizontal progress bar for inline use
 */
export function TutorialProgressBar({
  progress,
  height = 4,
  backgroundColor = '#1e293b',
  fillColor = '#0ea5e9',
}: {
  progress: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={[styles.simpleBar, { height, backgroundColor }]}>
      <Animated.View
        style={[
          styles.simpleFill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0ea5e9',
    minWidth: 40,
    textAlign: 'right',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  stepDotCurrent: {
    borderColor: '#0ea5e9',
    borderWidth: 2,
  },
  stepDotPressed: {
    opacity: 0.7,
  },
  checkmark: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0ea5e9',
  },
  stepCounter: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
  },
  compactText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // Simple bar styles
  simpleBar: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  simpleFill: {
    height: '100%',
    borderRadius: 2,
  },
});
