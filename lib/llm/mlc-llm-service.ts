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

/**
 * Available MLC models
 */
export type MLCModelId = 
  | 'Llama-3.2-3B-Instruct'
  | 'Phi-3-mini-4k-instruct'
  | 'Qwen2.5-1.5B-Instruct'
  | 'Mistral-7B-Instruct';

/**
 * Model information
 */
export interface MLCModelInfo {
  id: MLCModelId;
  name: string;
  size: string;
  sizeBytes: number;
  description: string;
  minMemoryGB: number;
  recommended: boolean;
}

/**
 * Available models with their metadata
 */
export const MLC_MODELS: Record<MLCModelId, MLCModelInfo> = {
  'Llama-3.2-3B-Instruct': {
    id: 'Llama-3.2-3B-Instruct',
    name: 'Llama 3.2 3B',
    size: '~2GB',
    sizeBytes: 2_000_000_000,
    description: 'Meta\'s latest small model, excellent for general tasks',
    minMemoryGB: 4,
    recommended: true,
  },
  'Phi-3-mini-4k-instruct': {
    id: 'Phi-3-mini-4k-instruct',
    name: 'Phi-3 Mini',
    size: '~2.5GB',
    sizeBytes: 2_500_000_000,
    description: 'Microsoft\'s efficient model, great for reasoning',
    minMemoryGB: 4,
    recommended: true,
  },
  'Qwen2.5-1.5B-Instruct': {
    id: 'Qwen2.5-1.5B-Instruct',
    name: 'Qwen 2.5 1.5B',
    size: '~1GB',
    sizeBytes: 1_000_000_000,
    description: 'Alibaba\'s lightweight model, fast inference',
    minMemoryGB: 2,
    recommended: true,
  },
  'Mistral-7B-Instruct': {
    id: 'Mistral-7B-Instruct',
    name: 'Mistral 7B',
    size: '~4.5GB',
    sizeBytes: 4_500_000_000,
    description: 'High-quality model, requires high-end device',
    minMemoryGB: 8,
    recommended: false,
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
 * Note: This is an interface layer. The actual MLC integration requires:
 * 1. Installing @react-native-ai/mlc
 * 2. Enabling New Architecture in React Native
 * 3. Adding "Increased Memory Limit" capability in Xcode
 */
export class MLCLLMService {
  private modelStates: Map<MLCModelId, MLCModelState> = new Map();
  private selectedModel: MLCModelId | null = null;
  private mlcInstance: any = null; // Will hold the actual MLC instance
  private isInitialized = false;
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
   * Get all available models
   */
  getAvailableModels(): MLCModelInfo[] {
    return Object.values(MLC_MODELS);
  }
  
  /**
   * Get recommended models for the current device
   */
  getRecommendedModels(): MLCModelInfo[] {
    // On iOS, we can check device capabilities
    // For now, return models marked as recommended
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
    
    // Check if running on simulator (MLC doesn't work on simulator)
    // This would need actual device detection
    return true;
  }
  
  /**
   * Download a model
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
      // In production, this would use the actual MLC API:
      // const model = mlc.languageModel(modelId);
      // await model.download({ onProgress });
      
      // Simulate download progress for now
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.modelStates.set(modelId, {
          modelId,
          status: 'downloading',
          progress: i,
        });
        this.notifyListeners();
        onProgress?.(i);
      }
      
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
   * Prepare a downloaded model for inference
   */
  async prepareModel(modelId: MLCModelId): Promise<boolean> {
    const state = this.getModelState(modelId);
    if (state.status !== 'downloaded') {
      console.error('[MLC] Model must be downloaded before preparing');
      return false;
    }
    
    this.modelStates.set(modelId, {
      ...state,
      status: 'preparing',
    });
    this.notifyListeners();
    
    try {
      // In production, this would use the actual MLC API:
      // const model = mlc.languageModel(modelId);
      // await model.prepare();
      
      // Simulate preparation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      // In production, this would delete the actual model files
      
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
   * Generate text using the selected model
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
      // In production, this would use the actual MLC API:
      // const model = mlc.languageModel(this.selectedModel);
      // const { text } = await generateText({
      //   model,
      //   prompt,
      //   maxTokens: options.maxTokens,
      //   temperature: options.temperature,
      // });
      
      // For now, return a placeholder response
      const response = `[MLC Response from ${this.selectedModel}]\n\n` +
        `This is a placeholder response. In production, this would be generated by the ${this.selectedModel} model.\n\n` +
        `Your prompt was: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
      
      // Update last used timestamp
      this.modelStates.set(this.selectedModel, {
        ...state,
        lastUsed: Date.now(),
      });
      await this.saveState();
      
      return {
        success: true,
        text: response,
        tokensGenerated: response.split(' ').length,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        latencyMs: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Generate text with streaming
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
    
    // In production, this would use the actual MLC streaming API
    // For now, simulate streaming
    const words = `This is a streaming response from ${this.selectedModel}. Each word is yielded separately.`.split(' ');
    
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 50));
      yield word + ' ';
    }
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
    this.mlcInstance = null;
    this.isInitialized = false;
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
