/**
 * MLC Native Integration
 * 
 * Provides actual on-device LLM inference using @react-native-ai/mlc.
 * This module wraps the native MLC module and provides a clean API
 * for the rest of the application.
 * 
 * Requirements:
 * - iOS 14+ (physical device only, not simulator)
 * - New Architecture enabled
 * - Increased Memory Limit entitlement
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import MLC module - this will be available after native build
// For development, we provide a mock implementation
let mlcModule: any = null;
let generateTextFn: any = null;
let streamTextFn: any = null;

// Try to import the actual MLC module
try {
  // Dynamic import to handle cases where native module isn't available
  const mlc = require('@react-native-ai/mlc');
  mlcModule = mlc.mlc;
  
  // Import Vercel AI SDK functions
  const ai = require('ai');
  generateTextFn = ai.generateText;
  streamTextFn = ai.streamText;
} catch (error) {
  console.log('[MLC Native] Native module not available, using mock implementation');
}

/**
 * Supported model IDs
 */
export type MLCNativeModelId = 
  | 'Llama-3.2-3B-Instruct'
  | 'Phi-3-mini-4k-instruct'
  | 'Qwen2.5-1.5B-Instruct'
  | 'Mistral-7B-Instruct';

/**
 * Model instance interface
 */
export interface MLCModelInstance {
  modelId: MLCNativeModelId;
  isDownloaded: boolean;
  isPrepared: boolean;
  download: (options?: { onProgress?: (progress: number) => void }) => Promise<void>;
  prepare: () => Promise<void>;
  dispose: () => void;
}

/**
 * Generation options
 */
export interface MLCNativeGenerationOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

/**
 * Generation result
 */
export interface MLCNativeGenerationResult {
  text: string;
  finishReason: 'stop' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Storage keys for model state persistence
 */
const STORAGE_KEYS = {
  DOWNLOADED_MODELS: 'mlc_native_downloaded_models',
  ACTIVE_MODEL: 'mlc_native_active_model',
};

/**
 * Check if MLC native module is available
 */
export function isMLCNativeAvailable(): boolean {
  // MLC only works on iOS physical devices
  if (Platform.OS !== 'ios') {
    return false;
  }
  
  // Check if native module is loaded
  return mlcModule !== null;
}

/**
 * Check if running on simulator (MLC doesn't work on simulator)
 */
export function isSimulator(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }
  
  // In React Native, we can check for simulator using Platform constants
  // @ts-ignore - This property exists at runtime
  return Platform.isPad === undefined && Platform.isTV === undefined;
}

/**
 * Get a model instance
 */
export function getModelInstance(modelId: MLCNativeModelId): MLCModelInstance | null {
  if (!isMLCNativeAvailable()) {
    console.warn('[MLC Native] Native module not available');
    return null;
  }
  
  try {
    const model = mlcModule.languageModel(modelId);
    return {
      modelId,
      isDownloaded: false,
      isPrepared: false,
      download: async (options) => {
        await model.download(options);
      },
      prepare: async () => {
        await model.prepare();
      },
      dispose: () => {
        // Cleanup if needed
      },
    };
  } catch (error) {
    console.error('[MLC Native] Failed to get model instance:', error);
    return null;
  }
}

/**
 * Generate text using MLC model with Vercel AI SDK
 */
export async function generateText(
  modelId: MLCNativeModelId,
  options: MLCNativeGenerationOptions
): Promise<MLCNativeGenerationResult> {
  if (!isMLCNativeAvailable() || !generateTextFn) {
    throw new Error('MLC native module not available');
  }
  
  try {
    const model = mlcModule.languageModel(modelId);
    
    const result = await generateTextFn({
      model,
      prompt: options.prompt,
      system: options.systemPrompt,
      maxTokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      topP: options.topP ?? 0.9,
      stopSequences: options.stopSequences,
    });
    
    return {
      text: result.text,
      finishReason: result.finishReason ?? 'stop',
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
    };
  } catch (error) {
    console.error('[MLC Native] Generation failed:', error);
    throw error;
  }
}

/**
 * Stream text generation using MLC model with Vercel AI SDK
 */
export async function* streamText(
  modelId: MLCNativeModelId,
  options: MLCNativeGenerationOptions
): AsyncGenerator<string, MLCNativeGenerationResult, unknown> {
  if (!isMLCNativeAvailable() || !streamTextFn) {
    throw new Error('MLC native module not available');
  }
  
  try {
    const model = mlcModule.languageModel(modelId);
    
    const result = await streamTextFn({
      model,
      prompt: options.prompt,
      system: options.systemPrompt,
      maxTokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      topP: options.topP ?? 0.9,
      stopSequences: options.stopSequences,
    });
    
    let fullText = '';
    
    for await (const chunk of result.textStream) {
      fullText += chunk;
      yield chunk;
    }
    
    return {
      text: fullText,
      finishReason: 'stop',
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
    };
  } catch (error) {
    console.error('[MLC Native] Streaming failed:', error);
    throw error;
  }
}

/**
 * Get list of downloaded models from storage
 */
export async function getDownloadedModels(): Promise<MLCNativeModelId[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_MODELS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[MLC Native] Failed to get downloaded models:', error);
  }
  return [];
}

/**
 * Mark a model as downloaded in storage
 */
export async function markModelDownloaded(modelId: MLCNativeModelId): Promise<void> {
  try {
    const downloaded = await getDownloadedModels();
    if (!downloaded.includes(modelId)) {
      downloaded.push(modelId);
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_MODELS, JSON.stringify(downloaded));
    }
  } catch (error) {
    console.error('[MLC Native] Failed to mark model downloaded:', error);
  }
}

/**
 * Remove a model from downloaded list
 */
export async function markModelRemoved(modelId: MLCNativeModelId): Promise<void> {
  try {
    const downloaded = await getDownloadedModels();
    const filtered = downloaded.filter(id => id !== modelId);
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_MODELS, JSON.stringify(filtered));
  } catch (error) {
    console.error('[MLC Native] Failed to mark model removed:', error);
  }
}

/**
 * Get the currently active model
 */
export async function getActiveModel(): Promise<MLCNativeModelId | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODEL);
    return stored as MLCNativeModelId | null;
  } catch (error) {
    console.error('[MLC Native] Failed to get active model:', error);
    return null;
  }
}

/**
 * Set the active model
 */
export async function setActiveModel(modelId: MLCNativeModelId | null): Promise<void> {
  try {
    if (modelId) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MODEL);
    }
  } catch (error) {
    console.error('[MLC Native] Failed to set active model:', error);
  }
}

/**
 * Mock implementation for development/testing
 * This is used when the native module isn't available
 */
export class MLCNativeMock {
  private downloadedModels: Set<MLCNativeModelId> = new Set();
  private preparedModel: MLCNativeModelId | null = null;
  
  isAvailable(): boolean {
    return true; // Mock is always "available"
  }
  
  async downloadModel(
    modelId: MLCNativeModelId,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Simulate download progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 50));
      onProgress?.(i);
    }
    this.downloadedModels.add(modelId);
  }
  
  async prepareModel(modelId: MLCNativeModelId): Promise<void> {
    if (!this.downloadedModels.has(modelId)) {
      throw new Error('Model not downloaded');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    this.preparedModel = modelId;
  }
  
  async generate(options: MLCNativeGenerationOptions): Promise<MLCNativeGenerationResult> {
    if (!this.preparedModel) {
      throw new Error('No model prepared');
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      text: `[Mock Response from ${this.preparedModel}]\n\n` +
        `This is a simulated response. In production with a physical iOS device, ` +
        `this would be generated by the actual ${this.preparedModel} model.\n\n` +
        `Your prompt: "${options.prompt.substring(0, 100)}..."`,
      finishReason: 'stop',
      usage: {
        promptTokens: options.prompt.split(' ').length,
        completionTokens: 50,
        totalTokens: options.prompt.split(' ').length + 50,
      },
    };
  }
  
  async *stream(options: MLCNativeGenerationOptions): AsyncGenerator<string, void, unknown> {
    if (!this.preparedModel) {
      throw new Error('No model prepared');
    }
    
    const response = `This is a streaming mock response from ${this.preparedModel}. ` +
      `Each word is yielded separately to simulate real streaming behavior.`;
    
    const words = response.split(' ');
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 30));
      yield word + ' ';
    }
  }
  
  isModelDownloaded(modelId: MLCNativeModelId): boolean {
    return this.downloadedModels.has(modelId);
  }
  
  isModelPrepared(modelId: MLCNativeModelId): boolean {
    return this.preparedModel === modelId;
  }
  
  deleteModel(modelId: MLCNativeModelId): void {
    this.downloadedModels.delete(modelId);
    if (this.preparedModel === modelId) {
      this.preparedModel = null;
    }
  }
}

// Export a singleton mock instance for development
export const mlcMock = new MLCNativeMock();

/**
 * Get the appropriate MLC implementation based on availability
 */
export function getMLCImplementation(): {
  isNative: boolean;
  isAvailable: () => boolean;
  downloadModel: (modelId: MLCNativeModelId, onProgress?: (progress: number) => void) => Promise<void>;
  prepareModel: (modelId: MLCNativeModelId) => Promise<void>;
  generate: (options: MLCNativeGenerationOptions & { modelId: MLCNativeModelId }) => Promise<MLCNativeGenerationResult>;
  stream: (options: MLCNativeGenerationOptions & { modelId: MLCNativeModelId }) => AsyncGenerator<string, void, unknown>;
  isModelDownloaded: (modelId: MLCNativeModelId) => boolean;
  isModelPrepared: (modelId: MLCNativeModelId) => boolean;
  deleteModel: (modelId: MLCNativeModelId) => void;
} {
  if (isMLCNativeAvailable()) {
    // Return native implementation
    return {
      isNative: true,
      isAvailable: () => true,
      downloadModel: async (modelId, onProgress) => {
        const model = getModelInstance(modelId);
        if (!model) throw new Error('Failed to get model instance');
        await model.download({ onProgress });
        await markModelDownloaded(modelId);
      },
      prepareModel: async (modelId) => {
        const model = getModelInstance(modelId);
        if (!model) throw new Error('Failed to get model instance');
        await model.prepare();
        await setActiveModel(modelId);
      },
      generate: async (options) => {
        return generateText(options.modelId, options);
      },
      stream: async function* (options) {
        yield* streamText(options.modelId, options);
      },
      isModelDownloaded: (modelId) => {
        // This would need to check actual file system
        return false;
      },
      isModelPrepared: (modelId) => {
        // This would need to check runtime state
        return false;
      },
      deleteModel: async (modelId) => {
        await markModelRemoved(modelId);
        // Native cleanup would happen here
      },
    };
  }
  
  // Return mock implementation
  return {
    isNative: false,
    isAvailable: () => mlcMock.isAvailable(),
    downloadModel: (modelId, onProgress) => mlcMock.downloadModel(modelId, onProgress),
    prepareModel: (modelId) => mlcMock.prepareModel(modelId),
    generate: (options) => mlcMock.generate(options),
    stream: (options) => mlcMock.stream(options),
    isModelDownloaded: (modelId) => mlcMock.isModelDownloaded(modelId),
    isModelPrepared: (modelId) => mlcMock.isModelPrepared(modelId),
    deleteModel: (modelId) => mlcMock.deleteModel(modelId),
  };
}
