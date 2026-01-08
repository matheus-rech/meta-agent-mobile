/**
 * SpacedRepetitionQuiz Component
 * 
 * Quiz interface for spaced repetition review sessions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  spacedRepetitionService,
  ReviewCard,
  QuizQuestion,
  ReviewSession,
} from '@/lib/tutorial/spaced-repetition.service';

// TUI Colors
const GLASS_BLUE = '#00BFFF';
const FOX_ORANGE = '#FF8C00';
const BLACK = '#000000';
const SURFACE = '#0A0A0A';
const SUCCESS = '#00FF7F';
const ERROR = '#FF4444';

interface SpacedRepetitionQuizProps {
  visible: boolean;
  questions: QuizQuestion[];
  onComplete: (session: ReviewSession) => void;
  onExit: () => void;
}

export function SpacedRepetitionQuiz({
  visible,
  questions,
  onComplete,
  onExit,
}: SpacedRepetitionQuizProps) {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const progress = useSharedValue(0);
  
  const currentQuestion = questions[currentIndex];
  
  // Initialize session
  useEffect(() => {
    if (visible && !session) {
      spacedRepetitionService.startSession().then(setSession);
    }
  }, [visible]);
  
  // Update progress bar
  useEffect(() => {
    progress.value = withTiming((currentIndex / questions.length) * 100, { duration: 300 });
  }, [currentIndex, questions.length]);
  
  // Track start time for each question
  useEffect(() => {
    if (visible && currentQuestion) {
      setStartTime(Date.now());
    }
  }, [currentIndex, visible]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));
  
  const handleSelectAnswer = useCallback(async (optionId: string) => {
    if (showResult || !currentQuestion || !session) return;
    
    const responseTimeMs = Date.now() - startTime;
    const option = currentQuestion.options.find(o => o.id === optionId);
    const correct = option?.isCorrect || false;
    
    setSelectedAnswer(optionId);
    setIsCorrect(correct);
    setShowResult(true);
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      if (correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    // Record the review
    await spacedRepetitionService.recordReview(
      session.id,
      currentQuestion.id,
      correct,
      responseTimeMs,
      currentQuestion.difficulty
    );
  }, [currentQuestion, session, showResult, startTime]);
  
  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Complete session
      if (session) {
        const completedSession = await spacedRepetitionService.completeSession(session.id);
        if (completedSession) {
          onComplete(completedSession);
        }
      }
    }
  }, [currentIndex, questions.length, session, onComplete]);
  
  const handleExit = useCallback(async () => {
    if (session) {
      await spacedRepetitionService.completeSession(session.id);
    }
    setSession(null);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    onExit();
  }, [session, onExit]);
  
  if (!currentQuestion) return null;
  
  const correctOption = currentQuestion.options.find(o => o.isCorrect);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleExit}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>📚 Review Quiz</Text>
              <Text style={styles.headerSubtitle}>
                {currentIndex + 1} / {questions.length}
              </Text>
            </View>
            <Pressable
              onPress={handleExit}
              style={({ pressed }) => [
                styles.exitButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.exitText}>✕</Text>
            </Pressable>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
          
          {/* Question */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Animated.View
              key={currentQuestion.id}
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(300)}
            >
              {/* Topic Badge */}
              <View style={styles.topicBadge}>
                <Text style={styles.topicText}>{currentQuestion.topic}</Text>
                <Text style={styles.difficultyText}>
                  {currentQuestion.difficulty === 'easy' ? '🟢' : 
                   currentQuestion.difficulty === 'medium' ? '🟡' : '🔴'}
                </Text>
              </View>
              
              {/* Question Text */}
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
              
              {/* Options */}
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option.id;
                  const isCorrectOption = option.isCorrect;
                  
                  let optionStyle = styles.option;
                  let textStyle = styles.optionText;
                  
                  if (showResult) {
                    if (isCorrectOption) {
                      optionStyle = { ...styles.option, ...styles.optionCorrect };
                      textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = { ...styles.option, ...styles.optionWrong };
                      textStyle = { ...styles.optionText, ...styles.optionTextWrong };
                    }
                  } else if (isSelected) {
                    optionStyle = { ...styles.option, ...styles.optionSelected };
                  }
                  
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleSelectAnswer(option.id)}
                      disabled={showResult}
                      style={({ pressed }) => [
                        optionStyle,
                        { opacity: pressed && !showResult ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={styles.optionLetter}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                      <Text style={textStyle}>{option.text}</Text>
                      {showResult && isCorrectOption && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                      {showResult && isSelected && !isCorrectOption && (
                        <Text style={styles.xmark}>✗</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              
              {/* Result Feedback */}
              {showResult && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={styles.feedbackContainer}
                >
                  <Text style={[
                    styles.feedbackText,
                    { color: isCorrect ? SUCCESS : ERROR }
                  ]}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </Text>
                  {!isCorrect && correctOption && (
                    <Text style={styles.correctAnswerText}>
                      The correct answer is: {correctOption.text}
                    </Text>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          </ScrollView>
          
          {/* Footer */}
          <View style={styles.footer}>
            {showResult ? (
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.nextButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.nextButtonText}>
                  {currentIndex < questions.length - 1 ? 'Next Question →' : 'Complete Review'}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.hintText}>
                Select an answer to continue
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: BLACK,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GLASS_BLUE,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_BLUE,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: GLASS_BLUE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  headerSubtitle: {
    color: GLASS_BLUE,
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
    marginTop: 4,
  },
  exitButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitText: {
    color: GLASS_BLUE,
    fontSize: 20,
    fontFamily: 'monospace',
  },
  progressContainer: {
    height: 4,
    backgroundColor: SURFACE,
  },
  progressBar: {
    height: '100%',
    backgroundColor: GLASS_BLUE,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicText: {
    color: FOX_ORANGE,
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: SURFACE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
  },
  questionText: {
    color: GLASS_BLUE,
    fontSize: 18,
    fontFamily: 'monospace',
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: GLASS_BLUE,
    borderRadius: 8,
    padding: 14,
  },
  optionSelected: {
    borderColor: FOX_ORANGE,
    borderWidth: 2,
  },
  optionCorrect: {
    borderColor: SUCCESS,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
  },
  optionWrong: {
    borderColor: ERROR,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  optionLetter: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    width: 24,
    marginRight: 12,
  },
  optionText: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  optionTextCorrect: {
    color: SUCCESS,
  },
  optionTextWrong: {
    color: ERROR,
  },
  checkmark: {
    color: SUCCESS,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  xmark: {
    color: ERROR,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  feedbackContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: SURFACE,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  correctAnswerText: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: GLASS_BLUE,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: GLASS_BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  hintText: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    opacity: 0.6,
  },
});

export default SpacedRepetitionQuiz;
