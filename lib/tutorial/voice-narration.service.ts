/**
 * Tutorial Voice Narration Service
 * 
 * Uses MiniMax TTS to narrate tutorial steps for accessibility.
 * Supports multiple languages and voice styles.
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { minimaxTTSService, type VoicePreset, type TTSOptions } from '@/lib/glass/minimax-tts.service';

export interface NarrationOptions {
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  speed?: number; // 0.5 to 2.0
  voiceStyle?: 'friendly' | 'professional' | 'enthusiastic';
  skipCodeBlocks?: boolean;
}

interface NarrationState {
  isPlaying: boolean;
  currentStepId: string | null;
  sound: Audio.Sound | null;
  queue: string[];
}

class TutorialVoiceNarrationService {
  private state: NarrationState = {
    isPlaying: false,
    currentStepId: null,
    sound: null,
    queue: [],
  };
  
  private enabled = true;
  private defaultOptions: NarrationOptions = {
    language: 'pt-BR',
    speed: 1.0,
    voiceStyle: 'friendly',
    skipCodeBlocks: true,
  };
  
  // Voice mapping by language and style
  private voiceMap: Record<string, Record<string, VoicePreset>> = {
    'pt-BR': {
      friendly: 'pt-BR-female',
      professional: 'pt-BR-male',
      enthusiastic: 'pt-BR-female',
    },
    'en-US': {
      friendly: 'en-US-female',
      professional: 'en-US-male',
      enthusiastic: 'en-US-female',
    },
    'es-ES': {
      friendly: 'es-ES-female',
      professional: 'es-ES-female',
      enthusiastic: 'es-ES-female',
    },
  };
  
  /**
   * Enable or disable voice narration
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }
  
  /**
   * Check if narration is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Set default options
   */
  setDefaultOptions(options: Partial<NarrationOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
  
  /**
   * Narrate a tutorial step
   */
  async narrateStep(
    stepId: string,
    title: string,
    message: string,
    options?: Partial<NarrationOptions>
  ): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') {
      return;
    }
    
    // Stop any current narration
    await this.stop();
    
    const opts = { ...this.defaultOptions, ...options };
    
    // Prepare text for narration
    const text = this.prepareText(title, message, opts);
    
    // Get voice for language and style
    const voice = this.getVoice(opts.language || 'pt-BR', opts.voiceStyle || 'friendly');
    
    try {
      this.state.currentStepId = stepId;
      this.state.isPlaying = true;
      
      // Generate and play audio
      const ttsResult = await minimaxTTSService.textToSpeech(text, {
        voicePreset: voice,
        speed: opts.speed,
      });
      
      if (ttsResult.audioUrl) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: ttsResult.audioUrl },
          { shouldPlay: true }
        );
        
        this.state.sound = sound;
        
        // Handle playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.cleanup();
          }
        });
      }
    } catch (error) {
      console.error('[VoiceNarration] Failed to narrate:', error);
      this.cleanup();
    }
  }
  
  /**
   * Narrate a quiz question with options
   */
  async narrateQuiz(
    stepId: string,
    question: string,
    options: { text: string }[],
    narrationOptions?: Partial<NarrationOptions>
  ): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') {
      return;
    }
    
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const optionsText = options
      .map((opt, i) => `Option ${optionLetters[i]}: ${opt.text}`)
      .join('. ');
    
    const fullText = `Quiz time! ${question}. ${optionsText}`;
    
    await this.narrateStep(stepId, 'Quiz', fullText, narrationOptions);
  }
  
  /**
   * Narrate feedback for quiz answer
   */
  async narrateFeedback(
    correct: boolean,
    explanation?: string,
    options?: Partial<NarrationOptions>
  ): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') {
      return;
    }
    
    const feedback = correct
      ? `Correct! ${explanation || 'Great job!'}`
      : `Not quite. ${explanation || 'Let me explain.'}`;
    
    await this.narrateStep('feedback', 'Feedback', feedback, options);
  }
  
  /**
   * Narrate celebration message
   */
  async narrateCelebration(
    badgeName: string,
    message: string,
    options?: Partial<NarrationOptions>
  ): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') {
      return;
    }
    
    const celebrationText = `Congratulations! You've earned the ${badgeName} badge! ${message}`;
    
    await this.narrateStep('celebration', 'Celebration', celebrationText, {
      ...options,
      voiceStyle: 'enthusiastic',
    });
  }
  
  /**
   * Stop current narration
   */
  async stop(): Promise<void> {
    if (this.state.sound) {
      try {
        await this.state.sound.stopAsync();
        await this.state.sound.unloadAsync();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    this.cleanup();
  }
  
  /**
   * Pause current narration
   */
  async pause(): Promise<void> {
    if (this.state.sound && this.state.isPlaying) {
      try {
        await this.state.sound.pauseAsync();
        this.state.isPlaying = false;
      } catch (error) {
        console.error('[VoiceNarration] Failed to pause:', error);
      }
    }
  }
  
  /**
   * Resume paused narration
   */
  async resume(): Promise<void> {
    if (this.state.sound && !this.state.isPlaying) {
      try {
        await this.state.sound.playAsync();
        this.state.isPlaying = true;
      } catch (error) {
        console.error('[VoiceNarration] Failed to resume:', error);
      }
    }
  }
  
  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }
  
  /**
   * Get current step being narrated
   */
  getCurrentStepId(): string | null {
    return this.state.currentStepId;
  }
  
  /**
   * Prepare text for narration
   */
  private prepareText(title: string, message: string, options: NarrationOptions): string {
    let text = message;
    
    // Remove markdown formatting
    text = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/•/g, ',') // Bullet points
      .replace(/\n{2,}/g, '. ') // Multiple newlines
      .replace(/\n/g, ', '); // Single newlines
    
    // Remove code blocks if option set
    if (options.skipCodeBlocks) {
      text = text.replace(/```[\s\S]*?```/g, 'See the code example on screen.');
    }
    
    // Clean up
    text = text
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/\.\s*\./g, '.')
      .trim();
    
    // Add title as intro
    if (title && !text.toLowerCase().startsWith(title.toLowerCase())) {
      text = `${title}. ${text}`;
    }
    
    return text;
  }
  
  /**
   * Get voice ID for language and style
   */
  private getVoice(language: string, style: string): VoicePreset {
    const langVoices = this.voiceMap[language] || this.voiceMap['en-US'];
    return langVoices[style] || langVoices['friendly'];
  }
  
  /**
   * Cleanup state
   */
  private cleanup(): void {
    this.state = {
      isPlaying: false,
      currentStepId: null,
      sound: null,
      queue: [],
    };
  }
}

// Export singleton instance
export const voiceNarrationService = new TutorialVoiceNarrationService();

// Export convenience functions
export const narrateTutorialStep = (
  stepId: string,
  title: string,
  message: string,
  options?: Partial<NarrationOptions>
) => voiceNarrationService.narrateStep(stepId, title, message, options);

export const narrateQuiz = (
  stepId: string,
  question: string,
  options: { text: string }[],
  narrationOptions?: Partial<NarrationOptions>
) => voiceNarrationService.narrateQuiz(stepId, question, options, narrationOptions);

export const narrateFeedback = (
  correct: boolean,
  explanation?: string,
  options?: Partial<NarrationOptions>
) => voiceNarrationService.narrateFeedback(correct, explanation, options);

export const narrateCelebration = (
  badgeName: string,
  message: string,
  options?: Partial<NarrationOptions>
) => voiceNarrationService.narrateCelebration(badgeName, message, options);

export const stopNarration = () => voiceNarrationService.stop();
export const pauseNarration = () => voiceNarrationService.pause();
export const resumeNarration = () => voiceNarrationService.resume();
export const setNarrationEnabled = (enabled: boolean) => voiceNarrationService.setEnabled(enabled);
export const isNarrationEnabled = () => voiceNarrationService.isEnabled();
export const isNarrationPlaying = () => voiceNarrationService.isPlaying();
