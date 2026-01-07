/**
 * MLC-LLM Service for React Native
 * 
 * Provides on-device LLM inference using MLC (Machine Learning Compilation).
 * Uses @react-native-ai/mlc package from Callstack for React Native integration.
 * 
 * Supported Models:
 * - Llama-3.2-3B-Instruct (~2GB)
 * - Phi-3-mini-4k-instruct (~2.5GB)
 * - Qwen2.5-1.5B-Instruct (~1GB)
 * - Mistral-7B-Instruct (~4.5GB) - requires high-end devices
 * 
 * Requirements:
 * - iOS 14+
 * - React Native New Architecture
 * - "Increased Memory Limit" capability in Xcode
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getMLCImplementation, 
  isMLCNativeAvailable,
  MLCNativeModelId,
  MLCNativeGenerationResult,
} from './mlc-native';

/**
 * Available MLC models
 */
export type MLCModelId = MLCNativeModelId;

/**
 * Model license types
 */
export type ModelLicense = 
  | 'Llama 3.2 Community'
  | 'MIT'
  | 'Apache 2.0'
  | 'Qwen License';

/**
 * Model information
 */
export interface MLCModelInfo {
  id: MLCModelId;
  name: string;
  creator: string;
  size: string;
  sizeBytes: number;
  description: string;
  detailedDescription: string;
  license: ModelLicense;
  licenseUrl: string;
  capabilities: string[];
  bestFor: string[];
  minMemoryGB: number;
  recommended: boolean;
  isOpenSource: boolean;
}

/**
 * Available open source models with their metadata
 * All models are fully open source and can run completely offline on your device.
 * Your data never leaves your phone - complete privacy guaranteed.
 */
export const MLC_MODELS: Record<MLCModelId, MLCModelInfo> = {
  'Llama-3.2-3B-Instruct': {
    id: 'Llama-3.2-3B-Instruct',
    name: 'Llama 3.2 3B',
    creator: 'Meta',
    size: '~2GB',
    sizeBytes: 2_000_000_000,
    description: 'Meta\'s latest open source model - powerful and efficient',
    detailedDescription: 'Llama 3.2 is Meta\'s newest open source language model, designed specifically for edge deployment. It offers an excellent balance of capability and efficiency, making it ideal for mobile devices. Trained on diverse data with strong instruction-following abilities.',
    license: 'Llama 3.2 Community',
    licenseUrl: 'https://llama.meta.com/llama3_2/license/',
    capabilities: [
      'General conversation',
      'Code assistance',
      'Text summarization',
      'Question answering',
      'Creative writing',
    ],
    bestFor: [
      'Meta-analysis guidance',
      'Research methodology questions',
      'Data interpretation help',
    ],
    minMemoryGB: 4,
    recommended: true,
    isOpenSource: true,
  },
  'Phi-3-mini-4k-instruct': {
    id: 'Phi-3-mini-4k-instruct',
    name: 'Phi-3 Mini',
    creator: 'Microsoft',
    size: '~2.5GB',
    sizeBytes: 2_500_000_000,
    description: 'Microsoft\'s MIT-licensed model - exceptional reasoning',
    detailedDescription: 'Phi-3 Mini is Microsoft\'s breakthrough small language model released under the permissive MIT license. Despite its compact size, it demonstrates remarkable reasoning capabilities and outperforms many larger models on benchmarks. Optimized for logical thinking and structured tasks.',
    license: 'MIT',
    licenseUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/blob/main/LICENSE',
    capabilities: [
      'Logical reasoning',
      'Mathematical thinking',
      'Code generation',
      'Structured analysis',
      'Step-by-step explanations',
    ],
    bestFor: [
      'Statistical analysis guidance',
      'R code generation',
      'Interpreting heterogeneity',
    ],
    minMemoryGB: 4,
    recommended: true,
    isOpenSource: true,
  },
  'Qwen2.5-1.5B-Instruct': {
    id: 'Qwen2.5-1.5B-Instruct',
    name: 'Qwen 2.5 1.5B',
    creator: 'Alibaba',
    size: '~1GB',
    sizeBytes: 1_000_000_000,
    description: 'Alibaba\'s Apache 2.0 model - fastest on-device inference',
    detailedDescription: 'Qwen 2.5 is Alibaba\'s open source model family released under the permissive Apache 2.0 license. The 1.5B version is optimized for mobile deployment, offering the fastest inference speeds while maintaining strong multilingual capabilities. Perfect for quick responses.',
    license: 'Apache 2.0',
    licenseUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/blob/main/LICENSE',
    capabilities: [
      'Fast responses',
      'Multilingual support',
      'Basic reasoning',
      'Text completion',
      'Simple Q&A',
    ],
    bestFor: [
      'Quick lookups',
      'Simple explanations',
      'Older devices with limited RAM',
    ],
    minMemoryGB: 2,
    recommended: true,
    isOpenSource: true,
  },
  'Mistral-7B-Instruct': {
    id: 'Mistral-7B-Instruct',
    name: 'Mistral 7B',
    creator: 'Mistral AI',
    size: '~4.5GB',
    sizeBytes: 4_500_000_000,
    description: 'Mistral AI\'s Apache 2.0 model - highest quality responses',
    detailedDescription: 'Mistral 7B is the flagship open source model from Mistral AI, a leading European AI company. Released under Apache 2.0, it delivers the highest quality responses among mobile-compatible models. Requires a high-end device with 8GB+ RAM but provides near-cloud-quality results.',
    license: 'Apache 2.0',
    licenseUrl: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/blob/main/LICENSE',
    capabilities: [
      'Complex reasoning',
      'Detailed explanations',
      'Code generation',
      'Creative writing',
      'Nuanced analysis',
    ],
    bestFor: [
      'Complex meta-analysis questions',
      'Detailed methodology guidance',
      'High-end devices (iPhone 15 Pro+)',
    ],
    minMemoryGB: 8,
    recommended: false,
    isOpenSource: true,
  },
};

/**
 * Model download status
 */
export type ModelStatus = 
  | 'not-downloaded'
  | 'downloading'
  | 'downloaded'
  | 'preparing'
  | 'ready'
  | 'error';

/**
 * Model state
 */
export interface MLCModelState {
  modelId: MLCModelId;
  status: ModelStatus;
  progress: number;
  error?: string;
  lastUsed?: number;
}

/**
 * Generation options
 */
export interface MLCGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

/**
 * Generation result
 */
export interface MLCGenerationResult {
  success: boolean;
  text?: string;
  error?: string;
  tokensGenerated?: number;
  latencyMs?: number;
  isNative?: boolean;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  MODEL_STATES: 'mlc_model_states',
  SELECTED_MODEL: 'mlc_selected_model',
};

/**
 * MLC-LLM Service class
 * 
 * Now uses the actual @react-native-ai/mlc native module when available,
 * with automatic fallback to mock implementation for development.
 */
export class MLCLLMService {
  private modelStates: Map<MLCModelId, MLCModelState> = new Map();
  private selectedModel: MLCModelId | null = null;
  private mlcImpl = getMLCImplementation();
  private listeners: Set<(states: Map<MLCModelId, MLCModelState>) => void> = new Set();
  
  constructor() {
    this.loadStoredState();
  }
  
  /**
   * Load stored state from AsyncStorage
   */
  private async loadStoredState(): Promise<void> {
    try {
      const statesJson = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_STATES);
      if (statesJson) {
        const states = JSON.parse(statesJson) as Array<[MLCModelId, MLCModelState]>;
        this.modelStates = new Map(states);
      }
      
      const selectedModel = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
      if (selectedModel) {
        this.selectedModel = selectedModel as MLCModelId;
      }
    } catch (error) {
      console.error('[MLC] Failed to load stored state:', error);
    }
  }
  
  /**
   * Save state to AsyncStorage
   */
  private async saveState(): Promise<void> {
    try {
      const states = Array.from(this.modelStates.entries());
      await AsyncStorage.setItem(STORAGE_KEYS.MODEL_STATES, JSON.stringify(states));
      
      if (this.selectedModel) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, this.selectedModel);
      }
    } catch (error) {
      console.error('[MLC] Failed to save state:', error);
    }
  }
  
  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(new Map(this.modelStates)));
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(listener: (states: Map<MLCModelId, MLCModelState>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Check if using native implementation
   */
  isUsingNativeModule(): boolean {
    return this.mlcImpl.isNative;
  }
  
  /**
   * Get all available models
   */
  getAvailableModels(): MLCModelInfo[] {
    return Object.values(MLC_MODELS);
  }
  
  /**
   * Get recommended models for the current device
   */
  getRecommendedModels(): MLCModelInfo[] {
    return Object.values(MLC_MODELS).filter(m => m.recommended);
  }
  
  /**
   * Get model state
   */
  getModelState(modelId: MLCModelId): MLCModelState {
    return this.modelStates.get(modelId) || {
      modelId,
      status: 'not-downloaded',
      progress: 0,
    };
  }
  
  /**
   * Get all model states
   */
  getAllModelStates(): Map<MLCModelId, MLCModelState> {
    return new Map(this.modelStates);
  }
  
  /**
   * Get currently selected model
   */
  getSelectedModel(): MLCModelId | null {
    return this.selectedModel;
  }
  
  /**
   * Check if MLC is available on this device
   */
  isAvailable(): boolean {
    // MLC currently only supports iOS
    if (Platform.OS !== 'ios') {
      return false;
    }
    
    return this.mlcImpl.isAvailable();
  }
  
  /**
   * Download a model using native MLC module
   */
  async downloadModel(
    modelId: MLCModelId,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      console.error('[MLC] MLC is not available on this device');
      return false;
    }
    
    const modelInfo = MLC_MODELS[modelId];
    if (!modelInfo) {
      console.error('[MLC] Unknown model:', modelId);
      return false;
    }
    
    // Update state to downloading
    this.modelStates.set(modelId, {
      modelId,
      status: 'downloading',
      progress: 0,
    });
    this.notifyListeners();
    await this.saveState();
    
    try {
      // Use the actual MLC implementation (native or mock)
      await this.mlcImpl.downloadModel(modelId, (progress) => {
        this.modelStates.set(modelId, {
          modelId,
          status: 'downloading',
          progress,
        });
        this.notifyListeners();
        onProgress?.(progress);
      });
      
      // Update state to downloaded
      this.modelStates.set(modelId, {
        modelId,
        status: 'downloaded',
        progress: 100,
      });
      this.notifyListeners();
      await this.saveState();
      
      return true;
    } catch (error) {
      this.modelStates.set(modelId, {
        modelId,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Download failed',
      });
      this.notifyListeners();
      await this.saveState();
      
      return false;
    }
  }
  
  /**
   * Prepare a downloaded model for inference using native MLC module
   */
  async prepareModel(modelId: MLCModelId): Promise<boolean> {
    const state = this.getModelState(modelId);
    if (state.status !== 'downloaded' && state.status !== 'ready') {
      console.error('[MLC] Model must be downloaded before preparing');
      return false;
    }
    
    this.modelStates.set(modelId, {
      ...state,
      status: 'preparing',
    });
    this.notifyListeners();
    
    try {
      // Use the actual MLC implementation
      await this.mlcImpl.prepareModel(modelId);
      
      this.modelStates.set(modelId, {
        ...state,
        status: 'ready',
        lastUsed: Date.now(),
      });
      this.selectedModel = modelId;
      this.notifyListeners();
      await this.saveState();
      
      return true;
    } catch (error) {
      this.modelStates.set(modelId, {
        ...state,
        status: 'error',
        error: error instanceof Error ? error.message : 'Preparation failed',
      });
      this.notifyListeners();
      await this.saveState();
      
      return false;
    }
  }
  
  /**
   * Delete a downloaded model
   */
  async deleteModel(modelId: MLCModelId): Promise<boolean> {
    try {
      this.mlcImpl.deleteModel(modelId);
      
      this.modelStates.delete(modelId);
      if (this.selectedModel === modelId) {
        this.selectedModel = null;
      }
      this.notifyListeners();
      await this.saveState();
      
      return true;
    } catch (error) {
      console.error('[MLC] Failed to delete model:', error);
      return false;
    }
  }
  
  /**
   * Generate text using the selected model with native MLC inference
   */
  async generate(
    prompt: string,
    options: MLCGenerationOptions = {}
  ): Promise<MLCGenerationResult> {
    if (!this.selectedModel) {
      return {
        success: false,
        error: 'No model selected. Download and prepare a model first.',
      };
    }
    
    const state = this.getModelState(this.selectedModel);
    if (state.status !== 'ready') {
      return {
        success: false,
        error: `Model is not ready (status: ${state.status})`,
      };
    }
    
    const startTime = Date.now();
    
    try {
      // Use the actual MLC implementation for generation
      const result = await this.mlcImpl.generate({
        modelId: this.selectedModel,
        prompt,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
        stopSequences: options.stopSequences,
      });
      
      // Update last used timestamp
      this.modelStates.set(this.selectedModel, {
        ...state,
        lastUsed: Date.now(),
      });
      await this.saveState();
      
      return {
        success: true,
        text: result.text,
        tokensGenerated: result.usage?.completionTokens,
        latencyMs: Date.now() - startTime,
        isNative: this.mlcImpl.isNative,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        latencyMs: Date.now() - startTime,
        isNative: this.mlcImpl.isNative,
      };
    }
  }
  
  /**
   * Generate text with streaming using native MLC inference
   */
  async *generateStream(
    prompt: string,
    options: MLCGenerationOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.selectedModel) {
      throw new Error('No model selected');
    }
    
    const state = this.getModelState(this.selectedModel);
    if (state.status !== 'ready') {
      throw new Error(`Model is not ready (status: ${state.status})`);
    }
    
    // Use the actual MLC implementation for streaming
    const stream = this.mlcImpl.stream({
      modelId: this.selectedModel,
      prompt,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      stopSequences: options.stopSequences,
    });
    
    for await (const chunk of stream) {
      yield chunk;
    }
    
    // Update last used timestamp
    this.modelStates.set(this.selectedModel, {
      ...state,
      lastUsed: Date.now(),
    });
    await this.saveState();
  }
  
  /**
   * Get storage usage for all downloaded models
   */
  async getStorageUsage(): Promise<{ total: number; byModel: Record<MLCModelId, number> }> {
    const byModel: Record<string, number> = {};
    let total = 0;
    
    for (const [modelId, state] of this.modelStates) {
      if (state.status === 'downloaded' || state.status === 'ready') {
        const modelInfo = MLC_MODELS[modelId];
        if (modelInfo) {
          byModel[modelId] = modelInfo.sizeBytes;
          total += modelInfo.sizeBytes;
        }
      }
    }
    
    return { total, byModel: byModel as Record<MLCModelId, number> };
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.listeners.clear();
  }
}

// Singleton instance
let mlcServiceInstance: MLCLLMService | null = null;

export function getMLCLLMService(): MLCLLMService {
  if (!mlcServiceInstance) {
    mlcServiceInstance = new MLCLLMService();
  }
  return mlcServiceInstance;
}

export function resetMLCLLMService(): void {
  if (mlcServiceInstance) {
    mlcServiceInstance.dispose();
    mlcServiceInstance = null;
  }
}
