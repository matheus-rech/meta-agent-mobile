/**
 * MiniMax TTS Service
 * 
 * Text-to-speech service using MiniMax API for Glass 🦊 voice output.
 * Supports multiple languages and voice styles.
 */

// MiniMax API configuration
const MINIMAX_API_KEY = 'sk-cp-2UyY_RQ6sHxiAv43y3mVc_y1aiYTm3KkK1V45XyqFXS-jW9Bf2Z2PFNynpsIBqOWiacDMd9H8WocHAxjGSgyqYamXYMRG-cnD8e8GFz1DqdNBZHNASH2Xt0';
const MINIMAX_GROUP_ID = '1808509574556770305';
const MINIMAX_TTS_URL = `https://api.minimax.chat/v1/t2a_v2?GroupId=${MINIMAX_GROUP_ID}`;

// Voice presets for Glass
export const GLASS_VOICES = {
  // Portuguese voices
  'pt-BR-female': {
    voiceId: 'Portuguese_Female_1',
    name: 'Ana (Portuguese)',
    language: 'Portuguese',
    emotion: 'happy',
  },
  'pt-BR-male': {
    voiceId: 'Portuguese_Male_1', 
    name: 'Carlos (Portuguese)',
    language: 'Portuguese',
    emotion: 'neutral',
  },
  // English voices
  'en-US-female': {
    voiceId: 'English_Female_1',
    name: 'Sarah (English)',
    language: 'English',
    emotion: 'happy',
  },
  'en-US-male': {
    voiceId: 'English_Male_1',
    name: 'James (English)',
    language: 'English',
    emotion: 'neutral',
  },
  // Spanish voices
  'es-ES-female': {
    voiceId: 'Spanish_Female_1',
    name: 'María (Spanish)',
    language: 'Spanish',
    emotion: 'happy',
  },
  // Default Glass voice (friendly female)
  'glass-default': {
    voiceId: 'cute_boy',
    name: 'Glass 🦊',
    language: 'auto',
    emotion: 'happy',
  },
} as const;

export type VoicePreset = keyof typeof GLASS_VOICES;

export interface TTSOptions {
  voicePreset?: VoicePreset;
  speed?: number; // 0.5 - 2.0, default 1.0
  volume?: number; // 0 - 10, default 1
  pitch?: number; // -12 to 12, default 0
  emotion?: 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'neutral';
}

export interface TTSResult {
  audioUrl: string;
  audioBase64?: string;
  duration?: number;
  voiceUsed: string;
}

class MiniMaxTTSService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Convert text to speech using MiniMax API
   */
  async textToSpeech(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    const voicePreset = options.voicePreset || 'glass-default';
    const voice = GLASS_VOICES[voicePreset];

    try {
      const response = await fetch(MINIMAX_TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'speech-01-turbo',
          text: text,
          stream: false,
          voice_setting: {
            voice_id: voice.voiceId,
            speed: options.speed || 1.0,
            vol: options.volume || 1,
            pitch: options.pitch || 0,
            emotion: options.emotion || voice.emotion,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3',
            channel: 1,
          },
          language_boost: voice.language,
        }),
      });

      const result = await response.json();

      if (result.base_resp?.status_code !== 0) {
        throw new Error(result.base_resp?.status_msg || 'TTS API error');
      }

      // The API returns audio data in hex format
      const audioHex = result.data?.audio;
      if (!audioHex) {
        throw new Error('No audio data returned');
      }

      // Convert hex to base64
      const audioBase64 = this.hexToBase64(audioHex);
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

      return {
        audioUrl,
        audioBase64,
        voiceUsed: voice.name,
      };
    } catch (error) {
      console.error('[MiniMax TTS] Error:', error);
      throw error;
    }
  }

  /**
   * Get available voice presets
   */
  getVoices(): Array<{ id: VoicePreset; name: string; language: string }> {
    return Object.entries(GLASS_VOICES).map(([id, voice]) => ({
      id: id as VoicePreset,
      name: voice.name,
      language: voice.language,
    }));
  }

  /**
   * Detect language and return appropriate voice preset
   */
  detectVoiceForLanguage(language: string): VoicePreset {
    if (language.startsWith('pt')) return 'pt-BR-female';
    if (language.startsWith('es')) return 'es-ES-female';
    if (language.startsWith('en')) return 'en-US-female';
    return 'glass-default';
  }

  /**
   * Convert hex string to base64
   */
  private hexToBase64(hex: string): string {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    
    // Convert to base64
    let binary = '';
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    
    return btoa(binary);
  }
}

export const minimaxTTSService = new MiniMaxTTSService();
