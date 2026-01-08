/**
 * InteractiveTutorialScreen Component
 * 
 * Full-screen tutorial experience with Glass guidance,
 * step-by-step instructions, and interactive elements.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { GlassTutorialGuide } from './GlassTutorialGuide';
import { TutorialOverlay } from './TutorialOverlay';
import { useColors } from '@/hooks/use-colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface TutorialStepConfig {
  id: string;
  title: string;
  message: string;
  hint?: string;
  pose?: 'greeting' | 'thinking' | 'excited' | 'pointing' | 'celebrating' | 'teaching';
  type: 'info' | 'action' | 'quiz' | 'celebration';
  highlightElement?: string;
  quizOptions?: {
    text: string;
    isCorrect: boolean;
  }[];
  actionDescription?: string;
  autoAdvance?: boolean;
}

interface InteractiveTutorialScreenProps {
  visible: boolean;
  tutorialId: string;
  tutorialTitle: string;
  steps: TutorialStepConfig[];
  onComplete: () => void;
  onExit: () => void;
  onActionRequired?: (stepId: string, actionDescription: string) => void;
}

export function InteractiveTutorialScreen({
  visible,
  tutorialId,
  tutorialTitle,
  steps,
  onComplete,
  onExit,
  onActionRequired,
}: InteractiveTutorialScreenProps) {
  const colors = useColors();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;
  
  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      setCompletedSteps([]);
    }
  }, [visible, tutorialId]);
  
  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Mark current step as completed
    if (currentStep && !completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
    
    if (isLastStep) {
      // Tutorial complete!
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep, completedSteps, isLastStep, onComplete]);
  
  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);
  
  const handleSkip = useCallback(() => {
    setShowExitConfirm(true);
  }, []);
  
  const confirmExit = useCallback(() => {
    setShowExitConfirm(false);
    onExit();
  }, [onExit]);
  
  const handleQuizAnswer = useCallback((index: number, correct: boolean) => {
    if (correct && currentStep) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
  }, [currentStep]);
  
  const handleActionComplete = useCallback(() => {
    if (currentStep) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
      handleNext();
    }
  }, [currentStep, handleNext]);
  
  if (!visible || !currentStep) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
        {/* Tutorial Header */}
        <Animated.View 
          entering={SlideInUp.duration(300)}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.tutorialTitle}>{tutorialTitle}</Text>
            <View style={styles.stepDots}>
              {steps.map((step, index) => (
                <View
                  key={step.id}
                  style={[
                    styles.stepDot,
                    index === currentStepIndex && styles.stepDotActive,
                    completedSteps.includes(step.id) && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Main Content Area */}
        <View style={styles.content}>
          {/* Step Title */}
          <Animated.View
            key={`title-${currentStep.id}`}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.stepTitleContainer}
          >
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
          </Animated.View>
          
          {/* Action Required Indicator */}
          {currentStep.type === 'action' && currentStep.actionDescription && (
            <Animated.View
              entering={FadeIn.delay(300).duration(300)}
              style={styles.actionBox}
            >
              <Text style={styles.actionIcon}>👆</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Action Required</Text>
                <Text style={styles.actionDescription}>
                  {currentStep.actionDescription}
                </Text>
              </View>
              <Pressable
                onPress={handleActionComplete}
                style={({ pressed }) => [
                  styles.actionDoneButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.actionDoneText}>Done ✓</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
        
        {/* Glass Tutorial Guide */}
        <GlassTutorialGuide
          visible={true}
          message={currentStep.message}
          hint={currentStep.hint}
          pose={currentStep.pose || 'teaching'}
          position="bottom"
          showNextButton={currentStep.type !== 'quiz' && currentStep.type !== 'action'}
          showBackButton={!isFirstStep}
          showSkipButton={true}
          nextButtonText={isLastStep ? 'Finish! 🎉' : 'Continue'}
          stepNumber={currentStepIndex + 1}
          totalSteps={steps.length}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          isQuiz={currentStep.type === 'quiz'}
          quizOptions={currentStep.quizOptions}
          onQuizAnswer={handleQuizAnswer}
          celebrationMode={currentStep.type === 'celebration'}
        />
        
        {/* Exit Confirmation Modal */}
        <Modal
          visible={showExitConfirm}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.confirmOverlay}>
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.confirmBox}
            >
              <Text style={styles.confirmTitle}>Exit Tutorial?</Text>
              <Text style={styles.confirmMessage}>
                Your progress will be saved. You can resume anytime from the tutorials menu.
              </Text>
              <View style={styles.confirmButtons}>
                <Pressable
                  onPress={() => setShowExitConfirm(false)}
                  style={({ pressed }) => [
                    styles.confirmButton,
                    styles.confirmCancel,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.confirmCancelText}>Keep Learning</Text>
                </Pressable>
                <Pressable
                  onPress={confirmExit}
                  style={({ pressed }) => [
                    styles.confirmButton,
                    styles.confirmExit,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.confirmExitText}>Exit</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  stepDotActive: {
    backgroundColor: '#0ea5e9',
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: '#22c55e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  stepTitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  actionDoneButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  actionDoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#334155',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmCancel: {
    backgroundColor: '#334155',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  confirmExit: {
    backgroundColor: '#ef4444',
  },
  confirmExitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

export default InteractiveTutorialScreen;
