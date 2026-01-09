/**
 * OnboardingTutorial
 * 
 * A 3-step walkthrough for new users explaining the meta-analysis workflow.
 * Shows on first app launch and can be triggered from settings.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: '📊',
    title: 'Enter Your Data',
    description: 'Start by entering study data in the spreadsheet. Glass automatically detects your data type and suggests the right analysis.',
    features: [
      'Binary outcomes (events/totals)',
      'Continuous outcomes (means/SDs)',
      'Pre-calculated effect sizes',
      'Import from PubMed or digitize figures',
    ],
  },
  {
    icon: '🔬',
    title: 'Run Analysis',
    description: 'Glass generates R code and executes meta-analysis with forest plots, heterogeneity tests, and publication bias assessment.',
    features: [
      'Random or fixed effects models',
      'Forest and funnel plots',
      'Sensitivity analyses',
      'Subgroup comparisons',
    ],
  },
  {
    icon: '📝',
    title: 'Get Results',
    description: 'Receive PRISMA-compliant methods and results sections ready for your manuscript, with proper citations and interpretations.',
    features: [
      'Methods section text',
      'Results with statistics',
      'Publication-ready figures',
      'Export to Word or PDF',
    ],
  },
];

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

export function OnboardingTutorial({ visible, onComplete }: OnboardingTutorialProps) {
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);

  if (!visible) return null;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({ x: nextStep * SCREEN_WIDTH, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding state:', e);
    }
    onComplete();
  };

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(offsetX / SCREEN_WIDTH);
    if (step !== currentStep && step >= 0 && step < ONBOARDING_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={index} style={[styles.stepContainer, { width: SCREEN_WIDTH }]}>
      <View style={styles.stepContent}>
        <Text style={styles.stepIcon}>{step.icon}</Text>
        <Text style={[styles.stepNumber, { color: colors.primary }]}>
          Step {index + 1} of {ONBOARDING_STEPS.length}
        </Text>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          {step.title}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.muted }]}>
          {step.description}
        </Text>
        
        <View style={[styles.featuresContainer, { backgroundColor: colors.surface }]}>
          {step.features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={[styles.featureCheck, { color: colors.success }]}>✓</Text>
              <Text style={[styles.featureText, { color: colors.foreground }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
      </TouchableOpacity>

      {/* Steps carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {ONBOARDING_STEPS.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {ONBOARDING_STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentStep ? colors.primary : colors.border,
                width: index === currentStep ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next/Get Started button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      setShowOnboarding(completed !== 'true');
    } catch (e) {
      console.warn('Failed to check onboarding status:', e);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      setShowOnboarding(true);
    } catch (e) {
      console.warn('Failed to reset onboarding:', e);
    }
  };

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stepContent: {
    alignItems: 'center',
    maxWidth: 340,
  },
  stepIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingTutorial;
