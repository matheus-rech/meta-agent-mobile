/**
 * Onboarding Wizard Screen
 * 
 * A multi-step wizard that:
 * 1. Welcomes the user and explains on-device AI
 * 2. Detects device capabilities
 * 3. Asks about primary use case
 * 4. Recommends the best open source model
 * 5. Offers to download the recommended model
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  getDeviceInfo, 
  DeviceInfo, 
  getTierDescription,
  getTierEmoji,
} from '@/lib/device/device-info';
import {
  getMLCLLMService,
  MLC_MODELS,
  MLCModelId,
  MLCModelInfo,
} from '@/lib/llm/mlc-llm-service';
import {
  GLASS_LOGO_LARGE,
  GLASS_AGENT_AVATAR,
  GLASS_FOX_SMALL,
  GLASS_GREETINGS,
  createBox,
} from '@/constants/ascii-art';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Use case options
 */
type UseCase = 'research' | 'quick' | 'code' | 'general';

interface UseCaseOption {
  id: UseCase;
  title: string;
  description: string;
  icon: string;
}

const USE_CASES: UseCaseOption[] = [
  {
    id: 'research',
    title: 'Research & Analysis',
    description: 'Meta-analysis guidance, methodology questions, interpreting results',
    icon: '📊',
  },
  {
    id: 'quick',
    title: 'Quick Lookups',
    description: 'Fast answers, simple explanations, basic questions',
    icon: '⚡',
  },
  {
    id: 'code',
    title: 'R Code Help',
    description: 'Writing R code, debugging, metafor package assistance',
    icon: '💻',
  },
  {
    id: 'general',
    title: 'General Assistant',
    description: 'Varied tasks, conversation, creative writing',
    icon: '🤖',
  },
];

/**
 * Storage key for onboarding completion
 */
const ONBOARDING_COMPLETE_KEY = 'onboarding_complete_v1';

/**
 * Check if onboarding has been completed
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  } catch (error) {
    console.error('Failed to mark onboarding complete:', error);
  }
}

/**
 * Get recommended model based on device and use case
 */
function getRecommendedModel(
  deviceInfo: DeviceInfo,
  useCase: UseCase
): { model: MLCModelInfo; reason: string } {
  const maxSize = deviceInfo.maxRecommendedModelGB;
  
  // Filter models that fit in device RAM
  const compatibleModels = Object.values(MLC_MODELS).filter(
    m => m.sizeBytes / 1_000_000_000 <= maxSize
  );
  
  if (compatibleModels.length === 0) {
    // Fallback to smallest model
    return {
      model: MLC_MODELS['Qwen2.5-1.5B-Instruct'],
      reason: 'This is the most lightweight model, optimized for devices with limited RAM.',
    };
  }
  
  // Recommend based on use case
  switch (useCase) {
    case 'research':
      // Prefer Phi-3 for reasoning, or Llama for general research
      if (compatibleModels.find(m => m.id === 'Phi-3-mini-4k-instruct')) {
        return {
          model: MLC_MODELS['Phi-3-mini-4k-instruct'],
          reason: 'Phi-3 excels at logical reasoning and structured analysis, perfect for research methodology and statistical interpretation.',
        };
      }
      if (compatibleModels.find(m => m.id === 'Llama-3.2-3B-Instruct')) {
        return {
          model: MLC_MODELS['Llama-3.2-3B-Instruct'],
          reason: 'Llama 3.2 offers excellent general capabilities for research guidance and methodology questions.',
        };
      }
      break;
      
    case 'quick':
      // Prefer Qwen for speed
      if (compatibleModels.find(m => m.id === 'Qwen2.5-1.5B-Instruct')) {
        return {
          model: MLC_MODELS['Qwen2.5-1.5B-Instruct'],
          reason: 'Qwen 2.5 provides the fastest responses, ideal for quick lookups and simple questions.',
        };
      }
      break;
      
    case 'code':
      // Prefer Phi-3 for code, then Llama
      if (compatibleModels.find(m => m.id === 'Phi-3-mini-4k-instruct')) {
        return {
          model: MLC_MODELS['Phi-3-mini-4k-instruct'],
          reason: 'Phi-3 has strong code generation capabilities and understands R syntax well.',
        };
      }
      if (compatibleModels.find(m => m.id === 'Llama-3.2-3B-Instruct')) {
        return {
          model: MLC_MODELS['Llama-3.2-3B-Instruct'],
          reason: 'Llama 3.2 provides solid code assistance and can help with R and metafor package code.',
        };
      }
      break;
      
    case 'general':
      // Prefer Llama for general tasks, or largest compatible
      if (compatibleModels.find(m => m.id === 'Mistral-7B-Instruct')) {
        return {
          model: MLC_MODELS['Mistral-7B-Instruct'],
          reason: 'Mistral 7B provides the highest quality responses for varied tasks and conversations.',
        };
      }
      if (compatibleModels.find(m => m.id === 'Llama-3.2-3B-Instruct')) {
        return {
          model: MLC_MODELS['Llama-3.2-3B-Instruct'],
          reason: 'Llama 3.2 is versatile and handles a wide range of tasks effectively.',
        };
      }
      break;
  }
  
  // Default to largest compatible model
  const sortedBySize = [...compatibleModels].sort((a, b) => b.sizeBytes - a.sizeBytes);
  return {
    model: sortedBySize[0],
    reason: `This is the most capable model that runs smoothly on your device.`,
  };
}

export default function OnboardingScreen() {
  const colors = useColors();
  const [step, setStep] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [recommendation, setRecommendation] = useState<{ model: MLCModelInfo; reason: string } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  
  const mlcService = getMLCLLMService();
  
  // Detect device on mount
  useEffect(() => {
    getDeviceInfo().then(setDeviceInfo);
  }, []);
  
  // Animate step transitions
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: step,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [step]);
  
  const handleNext = useCallback(() => {
    if (step === 2 && selectedUseCase && deviceInfo) {
      // Calculate recommendation before showing step 3
      const rec = getRecommendedModel(deviceInfo, selectedUseCase);
      setRecommendation(rec);
    }
    setStep(s => s + 1);
  }, [step, selectedUseCase, deviceInfo]);
  
  const handleBack = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
  }, []);
  
  const handleSkip = useCallback(async () => {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  }, []);
  
  const handleDownload = useCallback(async () => {
    if (!recommendation) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      await mlcService.downloadModel(recommendation.model.id, (progress) => {
        setDownloadProgress(progress);
      });
      
      // Prepare the model after download
      await mlcService.prepareModel(recommendation.model.id);
      
      // Mark onboarding complete and navigate
      await markOnboardingComplete();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(false);
    }
  }, [recommendation, mlcService]);
  
  const handleSkipDownload = useCallback(async () => {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  }, []);
  
  const renderStep0 = () => (
    <View style={styles.stepContent}>
      {/* ASCII Glass Logo */}
      <View style={[styles.asciiContainer, { backgroundColor: colors.terminal }]}>
        <Text style={[styles.asciiLogo, { color: colors.primary }]}>
          {GLASS_LOGO_LARGE}
        </Text>
      </View>
      
      {/* Glass Fox Introduction */}
      <View style={styles.metaIntro}>
        <Text style={[styles.asciiAvatar, { color: colors.success }]}>
          {GLASS_FOX_SMALL}
        </Text>
        <Text style={[styles.metaGreeting, { color: colors.foreground }]}>
          {GLASS_GREETINGS[0]}
        </Text>
      </View>
      
      <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
        Your AI-powered meta-analysis assistant
      </Text>
      
      <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.featureTitle, { color: colors.success }]}>
          100% Open Source AI
        </Text>
        <Text style={[styles.featureText, { color: colors.foreground }]}>
          Run powerful AI models directly on your device. Your data never leaves your phone - complete privacy guaranteed.
        </Text>
      </View>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🔒</Text>
          <Text style={[styles.featureItemText, { color: colors.muted }]}>
            Private - No data sent to servers
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📴</Text>
          <Text style={[styles.featureItemText, { color: colors.muted }]}>
            Offline - Works without internet
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💰</Text>
          <Text style={[styles.featureItemText, { color: colors.muted }]}>
            Free - No subscriptions or API costs
          </Text>
        </View>
      </View>
      
      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </Pressable>
      
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipButtonText, { color: colors.muted }]}>
          Skip for now
        </Text>
      </Pressable>
    </View>
  );
  
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.welcomeEmoji}>
        {deviceInfo ? getTierEmoji(deviceInfo.tier) : '📱'}
      </Text>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        Analyzing Your Device
      </Text>
      
      {deviceInfo ? (
        <>
          <View style={[styles.deviceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.deviceName, { color: colors.foreground }]}>
              {deviceInfo.modelName || 'Your Device'}
            </Text>
            <View style={styles.deviceStats}>
              <View style={styles.deviceStat}>
                <Text style={[styles.deviceStatValue, { color: colors.primary }]}>
                  {deviceInfo.estimatedRamGB}GB
                </Text>
                <Text style={[styles.deviceStatLabel, { color: colors.muted }]}>
                  RAM
                </Text>
              </View>
              <View style={styles.deviceStat}>
                <Text style={[styles.deviceStatValue, { color: colors.primary }]}>
                  {deviceInfo.tier.charAt(0).toUpperCase() + deviceInfo.tier.slice(1)}
                </Text>
                <Text style={[styles.deviceStatLabel, { color: colors.muted }]}>
                  Tier
                </Text>
              </View>
              <View style={styles.deviceStat}>
                <Text style={[styles.deviceStatValue, { color: colors.primary }]}>
                  {deviceInfo.maxRecommendedModelGB}GB
                </Text>
                <Text style={[styles.deviceStatLabel, { color: colors.muted }]}>
                  Max Model
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={[styles.tierDescription, { color: colors.muted }]}>
            {getTierDescription(deviceInfo.tier)}
          </Text>
          
          {!deviceInfo.supportsOnDeviceAI && (
            <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Text style={[styles.warningText, { color: colors.warning }]}>
                {deviceInfo.platform === 'ios' && !deviceInfo.isPhysicalDevice
                  ? 'On-device AI requires a physical iPhone. You can still use cloud AI.'
                  : 'On-device AI is currently only available on iOS. You can still use cloud AI.'}
              </Text>
            </View>
          )}
          
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </>
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={[styles.backButtonText, { color: colors.muted }]}>Back</Text>
      </Pressable>
    </View>
  );
  
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.welcomeEmoji}>🎯</Text>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        What will you use AI for?
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
        This helps us recommend the best model for you
      </Text>
      
      <View style={styles.useCaseList}>
        {USE_CASES.map((useCase) => (
          <Pressable
            key={useCase.id}
            style={({ pressed }) => [
              styles.useCaseCard,
              { 
                backgroundColor: colors.surface, 
                borderColor: selectedUseCase === useCase.id ? colors.primary : colors.border,
                borderWidth: selectedUseCase === useCase.id ? 2 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => setSelectedUseCase(useCase.id)}
          >
            <Text style={styles.useCaseIcon}>{useCase.icon}</Text>
            <View style={styles.useCaseText}>
              <Text style={[styles.useCaseTitle, { color: colors.foreground }]}>
                {useCase.title}
              </Text>
              <Text style={[styles.useCaseDescription, { color: colors.muted }]}>
                {useCase.description}
              </Text>
            </View>
            {selectedUseCase === useCase.id && (
              <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
      
      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          { 
            backgroundColor: selectedUseCase ? colors.primary : colors.muted, 
            opacity: pressed && selectedUseCase ? 0.8 : 1,
          },
        ]}
        onPress={handleNext}
        disabled={!selectedUseCase}
      >
        <Text style={styles.primaryButtonText}>See Recommendation</Text>
      </Pressable>
      
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={[styles.backButtonText, { color: colors.muted }]}>Back</Text>
      </Pressable>
    </View>
  );
  
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.welcomeEmoji}>✨</Text>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        Our Recommendation
      </Text>
      
      {recommendation && (
        <>
          <View style={[styles.recommendationCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <View style={styles.recommendationHeader}>
              <View>
                <Text style={[styles.recommendationName, { color: colors.foreground }]}>
                  {recommendation.model.name}
                </Text>
                <Text style={[styles.recommendationCreator, { color: colors.muted }]}>
                  by {recommendation.model.creator}
                </Text>
              </View>
              <View style={[styles.recommendationBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.recommendationBadgeText}>Best Match</Text>
              </View>
            </View>
            
            <View style={[styles.licenseBadge, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
              <Text style={[styles.licenseText, { color: colors.success }]}>
                {recommendation.model.license} • Open Source
              </Text>
            </View>
            
            <Text style={[styles.recommendationReason, { color: colors.foreground }]}>
              {recommendation.reason}
            </Text>
            
            <View style={styles.recommendationStats}>
              <View style={styles.recommendationStat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {recommendation.model.size}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Size</Text>
              </View>
              <View style={styles.recommendationStat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {recommendation.model.minMemoryGB}GB+
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>RAM</Text>
              </View>
            </View>
          </View>
          
          {isDownloading ? (
            <View style={styles.downloadProgress}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${downloadProgress}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>
                Downloading... {downloadProgress}%
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleDownload}
              >
                <Text style={styles.primaryButtonText}>
                  Download {recommendation.model.name}
                </Text>
              </Pressable>
              
              <Pressable style={styles.skipButton} onPress={handleSkipDownload}>
                <Text style={[styles.skipButtonText, { color: colors.muted }]}>
                  Skip - I'll download later
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}
      
      {!isDownloading && (
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={[styles.backButtonText, { color: colors.muted }]}>Back</Text>
        </Pressable>
      )}
    </View>
  );
  
  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep0();
    }
  };
  
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={styles.progressIndicator}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                { 
                  backgroundColor: i <= step ? colors.primary : colors.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        
        {renderCurrentStep()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureList: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureItemText: {
    fontSize: 14,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
  },
  backButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14,
  },
  deviceCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  deviceStat: {
    alignItems: 'center',
  },
  deviceStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  deviceStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tierDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  warningCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  useCaseList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  useCaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  useCaseIcon: {
    fontSize: 32,
  },
  useCaseText: {
    flex: 1,
  },
  useCaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  useCaseDescription: {
    fontSize: 13,
    lineHeight: 17,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendationCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  recommendationCreator: {
    fontSize: 13,
    marginTop: 2,
  },
  recommendationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recommendationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  licenseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  licenseText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationReason: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  recommendationStats: {
    flexDirection: 'row',
    gap: 24,
  },
  recommendationStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  downloadProgress: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 14,
  },
  // ASCII Art styles for Meta branding
  asciiContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  asciiLogo: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  metaIntro: {
    alignItems: 'center',
    marginBottom: 16,
  },
  asciiAvatar: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  metaGreeting: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
