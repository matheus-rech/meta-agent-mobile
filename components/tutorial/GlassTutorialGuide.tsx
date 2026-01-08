/**
 * GlassTutorialGuide Component
 * 
 * Shows Glass mascot guiding users through tutorials with
 * speech bubbles, animations, and interactive prompts.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Glass ASCII art in different poses
const GLASS_POSES = {
  greeting: `
    /\\   /\\
   (  o.o  )
    > ^ <
   /|     |\\
  (_|     |_)
`,
  thinking: `
    /\\   /\\
   (  -.-  )
    > ~ <
     |   |
    _|   |_
`,
  excited: `
    /\\   /\\
   (  ^.^  )
    > w <
   \\|     |/
    |     |
`,
  pointing: `
    /\\   /\\
   (  o.o  )>
    > ^ <
   /|     |
  (_|     |_)
`,
  celebrating: `
   \\o/  /\\   /\\  \\o/
       (  ^o^  )
        > w <
       /|     |\\
      (_|     |_)
`,
  teaching: `
    /\\   /\\
   (  °.°  )
    > ^ <  📚
   /|     |\\
  (_|     |_)
`,
};

type GlassPose = keyof typeof GLASS_POSES;

interface GlassTutorialGuideProps {
  visible: boolean;
  message: string;
  hint?: string;
  pose?: GlassPose;
  position?: 'top' | 'bottom' | 'center';
  showNextButton?: boolean;
  showBackButton?: boolean;
  showSkipButton?: boolean;
  nextButtonText?: string;
  stepNumber?: number;
  totalSteps?: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isQuiz?: boolean;
  quizOptions?: {
    text: string;
    isCorrect: boolean;
  }[];
  onQuizAnswer?: (index: number, correct: boolean) => void;
  celebrationMode?: boolean;
}

export function GlassTutorialGuide({
  visible,
  message,
  hint,
  pose = 'greeting',
  position = 'bottom',
  showNextButton = true,
  showBackButton = false,
  showSkipButton = true,
  nextButtonText = 'Continue',
  stepNumber,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  isQuiz = false,
  quizOptions,
  onQuizAnswer,
  celebrationMode = false,
}: GlassTutorialGuideProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Animation values
  const bounceAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const sparkleAnim = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      // Bounce animation for Glass
      bounceAnim.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      // Glow animation for speech bubble
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.5, { duration: 1500 })
        ),
        -1,
        true
      );
      
      if (celebrationMode) {
        sparkleAnim.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          true
        );
      }
    }
  }, [visible, celebrationMode]);
  
  const glassAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceAnim.value }],
  }));
  
  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.2 + glowAnim.value * 0.3,
  }));
  
  const handleQuizAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    setShowFeedback(true);
    
    const isCorrect = quizOptions?.[index]?.isCorrect ?? false;
    
    if (Platform.OS !== 'web') {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    onQuizAnswer?.(index, isCorrect);
    
    // Auto-advance after feedback
    setTimeout(() => {
      setSelectedAnswer(null);
      setShowFeedback(false);
      if (isCorrect) {
        onNext?.();
      }
    }, 2000);
  };
  
  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNext?.();
  };
  
  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBack?.();
  };
  
  if (!visible) return null;
  
  const containerStyle = position === 'top' 
    ? styles.containerTop 
    : position === 'center'
    ? styles.containerCenter
    : styles.containerBottom;
  
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, containerStyle]}
    >
      {/* Glass Mascot */}
      <Animated.View style={[styles.glassContainer, glassAnimatedStyle]}>
        <View style={styles.glassBackground}>
          <Text style={styles.glassArt}>
            {GLASS_POSES[celebrationMode ? 'celebrating' : pose]}
          </Text>
        </View>
        {celebrationMode && (
          <Animated.View style={styles.sparkles}>
            <Text style={styles.sparkleText}>✨ 🎉 ✨</Text>
          </Animated.View>
        )}
      </Animated.View>
      
      {/* Speech Bubble */}
      <Animated.View style={[styles.speechBubble, bubbleAnimatedStyle]}>
        {/* Bubble Arrow */}
        <View style={styles.bubbleArrow} />
        
        {/* Progress Indicator */}
        {stepNumber && totalSteps && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(stepNumber / totalSteps) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Step {stepNumber} of {totalSteps}
            </Text>
          </View>
        )}
        
        {/* Message */}
        <ScrollView 
          style={styles.messageScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.message}>{message}</Text>
          
          {/* Hint */}
          {hint && (
            <View style={styles.hintBox}>
              <Text style={styles.hintIcon}>💡</Text>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          )}
          
          {/* Quiz Options */}
          {isQuiz && quizOptions && (
            <View style={styles.quizContainer}>
              {quizOptions.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const showResult = showFeedback && isSelected;
                const isCorrect = option.isCorrect;
                
                return (
                  <Pressable
                    key={index}
                    onPress={() => handleQuizAnswer(index)}
                    disabled={selectedAnswer !== null}
                    style={({ pressed }) => [
                      styles.quizOption,
                      pressed && styles.quizOptionPressed,
                      showResult && (isCorrect ? styles.quizCorrect : styles.quizIncorrect),
                    ]}
                  >
                    <Text style={styles.quizOptionLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text style={styles.quizOptionText}>{option.text}</Text>
                    {showResult && (
                      <Text style={styles.quizResultIcon}>
                        {isCorrect ? '✓' : '✗'}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
              
              {showFeedback && selectedAnswer !== null && !quizOptions[selectedAnswer].isCorrect && (
                <Animated.View 
                  entering={FadeIn.duration(200)}
                  style={styles.feedbackBox}
                >
                  <Text style={styles.feedbackText}>
                    Not quite! The correct answer helps you understand the concept better. Try again!
                  </Text>
                </Animated.View>
              )}
            </View>
          )}
        </ScrollView>
        
        {/* Action Buttons */}
        {!isQuiz && (
          <View style={styles.actions}>
            {showSkipButton && onSkip && (
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
              {showBackButton && onBack && (
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.backText}>← Back</Text>
                </Pressable>
              )}
              
              {showNextButton && onNext && (
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => [
                    styles.nextButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.nextText}>{nextButtonText} →</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1001,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  containerTop: {
    top: 100,
    flexDirection: 'row-reverse',
  },
  containerCenter: {
    top: '25%',
  },
  containerBottom: {
    bottom: 120,
  },
  glassContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  glassBackground: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  glassArt: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    lineHeight: 12,
    color: '#fbbf24',
    textAlign: 'center',
  },
  sparkles: {
    position: 'absolute',
    top: -10,
    left: -20,
    right: -20,
  },
  sparkleText: {
    fontSize: 16,
    textAlign: 'center',
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 8,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  bubbleArrow: {
    position: 'absolute',
    left: -8,
    bottom: 20,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#1e293b',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  messageScroll: {
    maxHeight: SCREEN_HEIGHT * 0.25,
  },
  message: {
    fontSize: 15,
    lineHeight: 24,
    color: '#e2e8f0',
    marginBottom: 12,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  hintIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quizContainer: {
    marginTop: 8,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quizOptionPressed: {
    backgroundColor: '#1e293b',
    borderColor: '#0ea5e9',
  },
  quizCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  quizIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  quizOptionLetter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  quizOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  quizResultIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  feedbackBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  feedbackText: {
    fontSize: 13,
    color: '#fca5a5',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
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
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
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

export default GlassTutorialGuide;
