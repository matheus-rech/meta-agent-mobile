/**
 * TutorialCard Component
 * Displays tutorial step content in a card format with various step types
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { TutorialStep, TutorialChoice } from '@/lib/tutorial/types';

interface TutorialCardProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onChoiceSelect: (choiceId: string) => Promise<{ correct: boolean; feedback?: string }>;
  canGoBack: boolean;
  isLastStep: boolean;
}

export function TutorialCard({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onChoiceSelect,
  canGoBack,
  isLastStep,
}: TutorialCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [choiceFeedback, setChoiceFeedback] = useState<{ correct: boolean; feedback?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChoiceSelect = async (choiceId: string) => {
    if (isProcessing || selectedChoice) return;
    
    setIsProcessing(true);
    setSelectedChoice(choiceId);
    
    const result = await onChoiceSelect(choiceId);
    setChoiceFeedback(result);
    setIsProcessing(false);
  };

  const handleContinueAfterChoice = () => {
    setSelectedChoice(null);
    setChoiceFeedback(null);
    onNext();
  };

  const renderStepContent = () => {
    switch (step.type) {
      case 'choice':
        return renderChoiceStep();
      case 'action':
        return renderActionStep();
      case 'socratic':
        return renderSocraticStep();
      default:
        return renderInfoStep();
    }
  };

  const renderInfoStep = () => (
    <View style={styles.contentSection}>
      <Text style={styles.content}>{step.content}</Text>
    </View>
  );

  const renderActionStep = () => (
    <View style={styles.contentSection}>
      <Text style={styles.content}>{step.content}</Text>
      {step.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>{step.hint}</Text>
        </View>
      )}
      <View style={styles.actionIndicator}>
        <View style={styles.pulsingDot} />
        <Text style={styles.actionText}>Waiting for your action...</Text>
      </View>
    </View>
  );

  const renderSocraticStep = () => (
    <View style={styles.contentSection}>
      <Text style={styles.content}>{step.content}</Text>
      {step.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintIcon}>🎓</Text>
          <Text style={styles.hintText}>{step.hint}</Text>
        </View>
      )}
      <View style={styles.socraticIndicator}>
        <Text style={styles.socraticIcon}>🤔</Text>
        <Text style={styles.socraticText}>
          Engage with the AI to explore this topic
        </Text>
      </View>
    </View>
  );

  const renderChoiceStep = () => (
    <View style={styles.contentSection}>
      <Text style={styles.content}>{step.content}</Text>
      
      <View style={styles.choicesContainer}>
        {step.choices?.map((choice) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            isSelected={selectedChoice === choice.id}
            isDisabled={!!selectedChoice && selectedChoice !== choice.id}
            showResult={!!choiceFeedback && selectedChoice === choice.id}
            isCorrect={choiceFeedback?.correct}
            onPress={() => handleChoiceSelect(choice.id)}
          />
        ))}
      </View>

      {choiceFeedback && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={[
            styles.feedbackBox,
            choiceFeedback.correct ? styles.feedbackCorrect : styles.feedbackIncorrect,
          ]}
        >
          <Text style={styles.feedbackIcon}>
            {choiceFeedback.correct ? '✓' : '✗'}
          </Text>
          <Text style={styles.feedbackText}>
            {choiceFeedback.feedback || (choiceFeedback.correct ? 'Correct!' : 'Not quite right.')}
          </Text>
        </Animated.View>
      )}
    </View>
  );

  const showNextButton = step.type === 'info' || (step.type === 'choice' && choiceFeedback);

  return (
    <Animated.View
      entering={SlideInRight.duration(250)}
      exiting={SlideOutLeft.duration(200)}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>
            Step {stepNumber} of {totalSteps}
          </Text>
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.title}>{step.title}</Text>

        {/* Content */}
        {renderStepContent()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {canGoBack ? (
          <Pressable
            onPress={onPrevious}
            style={({ pressed }) => [
              styles.navButton,
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        {showNextButton && (
          <Pressable
            onPress={choiceFeedback ? handleContinueAfterChoice : onNext}
            style={({ pressed }) => [
              styles.navButton,
              styles.nextButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Complete →' : 'Continue →'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * ChoiceButton Component
 */
function ChoiceButton({
  choice,
  isSelected,
  isDisabled,
  showResult,
  isCorrect,
  onPress,
}: {
  choice: TutorialChoice;
  isSelected: boolean;
  isDisabled: boolean;
  showResult: boolean;
  isCorrect?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled || showResult}
      style={({ pressed }) => [
        styles.choiceButton,
        isSelected && styles.choiceSelected,
        isDisabled && !isSelected && styles.choiceDisabled,
        showResult && isCorrect && styles.choiceCorrect,
        showResult && !isCorrect && styles.choiceIncorrect,
        pressed && !isDisabled && styles.choicePressed,
      ]}
    >
      <View style={styles.choiceContent}>
        <View style={[
          styles.choiceIndicator,
          isSelected && styles.choiceIndicatorSelected,
          showResult && isCorrect && styles.choiceIndicatorCorrect,
          showResult && !isCorrect && styles.choiceIndicatorIncorrect,
        ]}>
          {showResult && (
            <Text style={styles.choiceIndicatorText}>
              {isCorrect ? '✓' : '✗'}
            </Text>
          )}
        </View>
        <Text style={[
          styles.choiceLabel,
          isDisabled && !isSelected && styles.choiceLabelDisabled,
        ]}>
          {choice.label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 13,
    color: '#64748b',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    lineHeight: 32,
  },
  contentSection: {
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  hintIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  hintText: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 22,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0ea5e9',
    marginRight: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  socraticIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  socraticIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  socraticText: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '500',
    flex: 1,
  },
  // Choice styles
  choicesContainer: {
    gap: 10,
    marginTop: 8,
  },
  choiceButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#334155',
  },
  choiceSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: '#0c4a6e',
  },
  choiceDisabled: {
    opacity: 0.5,
  },
  choiceCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#14532d',
  },
  choiceIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#7f1d1d',
  },
  choicePressed: {
    opacity: 0.8,
  },
  choiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIndicatorSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: '#0ea5e9',
  },
  choiceIndicatorCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  choiceIndicatorIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  choiceIndicatorText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  choiceLabel: {
    fontSize: 15,
    color: '#e2e8f0',
    flex: 1,
    lineHeight: 22,
  },
  choiceLabelDisabled: {
    color: '#64748b',
  },
  // Feedback styles
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  feedbackCorrect: {
    backgroundColor: '#14532d',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  feedbackIncorrect: {
    backgroundColor: '#7f1d1d',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  feedbackIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  feedbackText: {
    fontSize: 14,
    color: '#e2e8f0',
    flex: 1,
    lineHeight: 22,
  },
  // Navigation styles
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  navButtonPlaceholder: {
    width: 100,
  },
  backButton: {
    backgroundColor: '#1e293b',
  },
  nextButton: {
    backgroundColor: '#0ea5e9',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
