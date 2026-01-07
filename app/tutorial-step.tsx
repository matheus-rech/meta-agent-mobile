/**
 * Tutorial Step Screen
 * Displays individual tutorial steps with navigation
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { TutorialCard } from '@/components/tutorial';
import { TutorialProgress } from '@/components/tutorial';
import {
  tutorialService,
  TutorialState,
  TutorialStep,
  TutorialModule,
} from '@/lib/tutorial';

export default function TutorialStepScreen() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const [state, setState] = useState<TutorialState | null>(null);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [currentModule, setCurrentModule] = useState<TutorialModule | null>(null);

  useEffect(() => {
    const init = async () => {
      await tutorialService.initialize();
      updateState();
    };
    init();

    const unsubscribe = tutorialService.subscribe(() => {
      updateState();
    });

    return unsubscribe;
  }, [moduleId]);

  const updateState = () => {
    const newState = tutorialService.getState();
    setState(newState);
    setCurrentStep(tutorialService.getCurrentStep());
    setCurrentModule(tutorialService.getCurrentModule());
  };

  const handleNext = useCallback(async () => {
    const success = await tutorialService.nextStep();
    if (!success && state?.activeModuleId) {
      // Module completed
      router.replace('/tutorial');
    }
  }, [state, router]);

  const handlePrevious = useCallback(async () => {
    await tutorialService.previousStep();
  }, []);

  const handleSkip = useCallback(() => {
    Alert.alert(
      'Skip Tutorial?',
      'You can always come back and continue later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            await tutorialService.exitModule();
            router.replace('/tutorial');
          },
        },
      ]
    );
  }, [router]);

  const handleChoiceSelect = useCallback(async (choiceId: string) => {
    return tutorialService.selectChoice(choiceId);
  }, []);

  const handleExit = useCallback(async () => {
    await tutorialService.exitModule();
    router.replace('/tutorial');
  }, [router]);

  if (!state || !currentStep || !currentModule) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const stepNumber = state.activeStepIndex + 1;
  const totalSteps = currentModule.steps.length;
  const isLastStep = state.activeStepIndex >= totalSteps - 1;
  const canGoBack = state.activeStepIndex > 0;

  return (
    <ScreenContainer className="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleExit}
          style={({ pressed }) => [
            styles.exitButton,
            pressed && styles.exitButtonPressed,
          ]}
        >
          <Text style={styles.exitButtonText}>✕</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.moduleTitle} numberOfLines={1}>
            {currentModule.title}
          </Text>
          <TutorialProgress
            currentStep={state.activeStepIndex}
            totalSteps={totalSteps}
            compact
          />
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Step Content */}
      <TutorialCard
        step={currentStep}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        onChoiceSelect={handleChoiceSelect}
        canGoBack={canGoBack}
        isLastStep={isLastStep}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButtonPressed: {
    opacity: 0.7,
  },
  exitButtonText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  headerRight: {
    width: 36,
  },
});
