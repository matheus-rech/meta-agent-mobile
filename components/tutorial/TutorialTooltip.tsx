/**
 * TutorialTooltip Component
 * Displays tutorial step content with arrow pointing to target element
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface TutorialTooltipProps {
  visible: boolean;
  title: string;
  content: string;
  position?: Position;
  targetArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  showArrow?: boolean;
  hint?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  canGoBack?: boolean;
  isLastStep?: boolean;
  stepNumber?: number;
  totalSteps?: number;
}

export function TutorialTooltip({
  visible,
  title,
  content,
  position = 'center',
  targetArea,
  showArrow = true,
  hint,
  onNext,
  onPrevious,
  onSkip,
  canGoBack = true,
  isLastStep = false,
  stepNumber,
  totalSteps,
}: TutorialTooltipProps) {
  if (!visible) return null;

  const tooltipStyle = getTooltipPosition(position, targetArea);
  const arrowStyle = getArrowStyle(position, targetArea);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, tooltipStyle]}
    >
      {/* Arrow */}
      {showArrow && position !== 'center' && targetArea && (
        <View style={[styles.arrow, arrowStyle]} />
      )}

      {/* Content Card */}
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {stepNumber && totalSteps && (
            <Text style={styles.stepIndicator}>
              {stepNumber}/{totalSteps}
            </Text>
          )}
        </View>

        {/* Content */}
        <Text style={styles.content}>{content}</Text>

        {/* Hint */}
        {hint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {onSkip && (
            <Pressable
              onPress={onSkip}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.skipText}>Skip Tutorial</Text>
            </Pressable>
          )}

          <View style={styles.navButtons}>
            {canGoBack && onPrevious && (
              <Pressable
                onPress={onPrevious}
                style={({ pressed }) => [
                  styles.navButton,
                  styles.prevButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.prevText}>Back</Text>
              </Pressable>
            )}

            {onNext && (
              <Pressable
                onPress={onNext}
                style={({ pressed }) => [
                  styles.navButton,
                  styles.nextButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.nextText}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function getTooltipPosition(
  position: Position,
  targetArea?: { x: number; y: number; width: number; height: number }
): object {
  const PADDING = 16;
  const TOOLTIP_WIDTH = SCREEN_WIDTH - PADDING * 2;

  if (position === 'center' || !targetArea) {
    return {
      position: 'absolute' as const,
      left: PADDING,
      right: PADDING,
      top: '30%',
      width: TOOLTIP_WIDTH,
    };
  }

  const { x, y, width, height } = targetArea;
  const centerX = x + width / 2;

  switch (position) {
    case 'top':
      return {
        position: 'absolute' as const,
        left: PADDING,
        right: PADDING,
        bottom: Dimensions.get('window').height - y + 12,
      };
    case 'bottom':
      return {
        position: 'absolute' as const,
        left: PADDING,
        right: PADDING,
        top: y + height + 12,
      };
    case 'left':
      return {
        position: 'absolute' as const,
        right: Dimensions.get('window').width - x + 12,
        top: y,
        maxWidth: x - PADDING - 12,
      };
    case 'right':
      return {
        position: 'absolute' as const,
        left: x + width + 12,
        top: y,
        maxWidth: Dimensions.get('window').width - x - width - PADDING - 12,
      };
    default:
      return {};
  }
}

function getArrowStyle(
  position: Position,
  targetArea?: { x: number; y: number; width: number; height: number }
): object {
  if (!targetArea) return {};

  const { x, width } = targetArea;
  const centerX = x + width / 2;

  switch (position) {
    case 'top':
      return {
        bottom: -8,
        left: centerX - 16 - 8, // Adjust for padding
        borderTopColor: '#1e293b',
        borderTopWidth: 8,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
      };
    case 'bottom':
      return {
        top: -8,
        left: centerX - 16 - 8,
        borderBottomColor: '#1e293b',
        borderBottomWidth: 8,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
      };
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1001,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
  },
  stepIndicator: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  hintIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 13,
    color: '#64748b',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  prevButton: {
    backgroundColor: '#334155',
  },
  nextButton: {
    backgroundColor: '#0ea5e9',
  },
  prevText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  nextText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
