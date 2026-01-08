/**
 * TutorialCompletionBadge Component
 * 
 * Displays a celebration modal when a tutorial is completed,
 * showing the earned badge with animations.
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialCompletionBadgeProps {
  visible: boolean;
  badgeIcon: string;
  badgeName: string;
  badgeDescription: string;
  tutorialTitle: string;
  quizScore?: {
    correct: number;
    total: number;
  };
  onClose: () => void;
  onViewBadges?: () => void;
}

export function TutorialCompletionBadge({
  visible,
  badgeIcon,
  badgeName,
  badgeDescription,
  tutorialTitle,
  quizScore,
  onClose,
  onViewBadges,
}: TutorialCompletionBadgeProps) {
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const confettiY = useSharedValue(-100);
  
  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Badge entrance animation
      badgeScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(300, withSpring(1.2, { damping: 8 })),
        withSpring(1, { damping: 12 })
      );
      
      // Badge rotation
      badgeRotate.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(300, withTiming(360, { duration: 800, easing: Easing.out(Easing.ease) }))
      );
      
      // Glow pulse
      glowOpacity.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0.3, { duration: 1000 })
          ),
          -1,
          true
        )
      );
      
      // Confetti fall
      confettiY.value = withRepeat(
        withSequence(
          withTiming(-100, { duration: 0 }),
          withTiming(600, { duration: 3000, easing: Easing.linear })
        ),
        -1,
        false
      );
    }
  }, [visible]);
  
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotate.value}deg` },
    ],
  }));
  
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: confettiY.value }],
  }));
  
  if (!visible) return null;
  
  const scorePercentage = quizScore 
    ? Math.round((quizScore.correct / quizScore.total) * 100)
    : null;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <Text
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${Math.random() * 100}%`,
                  fontSize: 16 + Math.random() * 12,
                  opacity: 0.8 + Math.random() * 0.2,
                },
              ]}
            >
              {['🎉', '✨', '⭐', '🎊', '💫'][Math.floor(Math.random() * 5)]}
            </Text>
          ))}
        </Animated.View>
        
        {/* Main Card */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={styles.card}
        >
          {/* Glow Effect */}
          <Animated.View style={[styles.glow, glowAnimatedStyle]} />
          
          {/* Badge */}
          <Animated.View style={[styles.badgeContainer, badgeAnimatedStyle]}>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeIcon}>{badgeIcon}</Text>
            </View>
          </Animated.View>
          
          {/* Content */}
          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            style={styles.content}
          >
            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={styles.badgeName}>{badgeName}</Text>
            <Text style={styles.badgeDescription}>{badgeDescription}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.completedText}>
              You completed: {tutorialTitle}
            </Text>
            
            {scorePercentage !== null && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Quiz Score</Text>
                <View style={styles.scoreBar}>
                  <View 
                    style={[
                      styles.scoreFill,
                      { 
                        width: `${scorePercentage}%`,
                        backgroundColor: scorePercentage >= 80 
                          ? '#22c55e' 
                          : scorePercentage >= 60 
                          ? '#eab308' 
                          : '#ef4444',
                      },
                    ]} 
                  />
                </View>
                <Text style={styles.scoreText}>
                  {quizScore?.correct}/{quizScore?.total} correct ({scorePercentage}%)
                </Text>
              </View>
            )}
          </Animated.View>
          
          {/* Actions */}
          <Animated.View
            entering={FadeIn.delay(800).duration(400)}
            style={styles.actions}
          >
            {onViewBadges && (
              <Pressable
                onPress={onViewBadges}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>View All Badges</Text>
              </Pressable>
            )}
            
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Continue Learning</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  confetti: {
    position: 'absolute',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fbbf24',
    opacity: 0.3,
  },
  badgeContainer: {
    marginBottom: 24,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeIcon: {
    fontSize: 56,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  congratsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#334155',
    marginVertical: 20,
  },
  completedText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  scoreContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#334155',
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

export default TutorialCompletionBadge;
