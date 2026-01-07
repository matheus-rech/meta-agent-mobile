/**
 * API Key Manager
 * 
 * Securely stores and manages API keys for various LLM providers.
 * Uses expo-secure-store for encrypted storage on device.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Provider definitions
export type LLMProvider = 
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'minimax';

export interface ProviderConfig {
  id: LLMProvider;
  name: string;
  description: string;
  baseUrl: string;
  docsUrl: string;
  keyPrefix: string; // Expected prefix for validation (e.g., "sk-" for OpenAI)
  models: ProviderModel[];
  icon: string; // Emoji or icon name
}

export interface ProviderModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  inputPrice: number; // per 1M tokens
  outputPrice: number; // per 1M tokens
  isDefault?: boolean;
}

export interface StoredAPIKey {
  provider: LLMProvider;
  key: string;
  addedAt: number;
  lastUsed?: number;
  isValid?: boolean;
  selectedModel?: string;
}

// Provider configurations
export const PROVIDERS: Record<LLMProvider, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o and GPT-4 models from OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
    icon: '🤖',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable multimodal model',
        contextWindow: 128000,
        inputPrice: 2.50,
        outputPrice: 10.00,
        isDefault: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and affordable',
        contextWindow: 128000,
        inputPrice: 0.15,
        outputPrice: 0.60,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Previous flagship model',
        contextWindow: 128000,
        inputPrice: 10.00,
        outputPrice: 30.00,
      },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models with strong reasoning',
    baseUrl: 'https://api.anthropic.com',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
    icon: '🧠',
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        description: 'Latest balanced model',
        contextWindow: 200000,
        inputPrice: 3.00,
        outputPrice: 15.00,
        isDefault: true,
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Previous Sonnet version',
        contextWindow: 200000,
        inputPrice: 3.00,
        outputPrice: 15.00,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most capable Claude model',
        contextWindow: 200000,
        inputPrice: 15.00,
        outputPrice: 75.00,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fastest Claude model',
        contextWindow: 200000,
        inputPrice: 0.25,
        outputPrice: 1.25,
      },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini models from Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    docsUrl: 'https://aistudio.google.com/apikey',
    keyPrefix: 'AI', // Gemini keys start with AIza...
    icon: '✨',
    models: [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Latest fast model',
        contextWindow: 1000000,
        inputPrice: 0.075,
        outputPrice: 0.30,
        isDefault: true,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable Gemini',
        contextWindow: 2000000,
        inputPrice: 1.25,
        outputPrice: 5.00,
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient',
        contextWindow: 1000000,
        inputPrice: 0.075,
        outputPrice: 0.30,
      },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 100+ models with one API key',
    baseUrl: 'https://openrouter.ai/api/v1',
    docsUrl: 'https://openrouter.ai/keys',
    keyPrefix: 'sk-or-',
    icon: '🔀',
    models: [
      {
        id: 'anthropic/claude-sonnet-4',
        name: 'Claude Sonnet 4 (via OpenRouter)',
        description: 'Anthropic Claude via OpenRouter',
        contextWindow: 200000,
        inputPrice: 3.00,
        outputPrice: 15.00,
        isDefault: true,
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o (via OpenRouter)',
        description: 'OpenAI GPT-4o via OpenRouter',
        contextWindow: 128000,
        inputPrice: 2.50,
        outputPrice: 10.00,
      },
      {
        id: 'google/gemini-2.0-flash',
        name: 'Gemini 2.0 Flash (via OpenRouter)',
        description: 'Google Gemini via OpenRouter',
        contextWindow: 1000000,
        inputPrice: 0.10,
        outputPrice: 0.40,
      },
      {
        id: 'meta-llama/llama-3.1-405b-instruct',
        name: 'Llama 3.1 405B',
        description: 'Meta open source model',
        contextWindow: 131072,
        inputPrice: 2.70,
        outputPrice: 2.70,
      },
      {
        id: 'mistralai/mistral-large',
        name: 'Mistral Large',
        description: 'Mistral flagship model',
        contextWindow: 128000,
        inputPrice: 2.00,
        outputPrice: 6.00,
      },
    ],
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    description: 'MiniMax M2.1 - Open source agentic AI',
    baseUrl: 'https://api.minimax.io/anthropic',
    docsUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key',
    keyPrefix: '', // MiniMax keys don't have a standard prefix
    icon: '🚀',
    models: [
      {
        id: 'MiniMax-M2.1',
        name: 'MiniMax M2.1',
        description: 'Full model with thinking/reasoning',
        contextWindow: 1000000,
        inputPrice: 0.70,
        outputPrice: 2.80,
        isDefault: true,
      },
      {
        id: 'MiniMax-M2.1-lightning',
        name: 'MiniMax M2.1 Lightning',
        description: 'Faster variant',
        contextWindow: 1000000,
        inputPrice: 0.14,
        outputPrice: 0.56,
      },
      {
        id: 'MiniMax-M2',
        name: 'MiniMax M2',
        description: 'Previous version',
        contextWindow: 1000000,
        inputPrice: 0.70,
        outputPrice: 2.80,
      },
    ],
  },
};

// Storage keys
const STORAGE_PREFIX = '@meta_agent/api_keys/';
const METADATA_KEY = '@meta_agent/api_keys_metadata';

type APIKeyListener = (keys: Map<LLMProvider, StoredAPIKey>) => void;

class APIKeyManager {
  private keys: Map<LLMProvider, StoredAPIKey> = new Map();
  private listeners: Set<APIKeyListener> = new Set();
  private initialized: boolean = false;

  /**
   * Initialize the manager by loading stored keys
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load metadata to know which providers have keys
      const metadataStr = await this.getStorage(METADATA_KEY);
      if (!metadataStr) {
        this.initialized = true;
        return;
      }

      const metadata: LLMProvider[] = JSON.parse(metadataStr);
      
      // Load each key
      for (const provider of metadata) {
        const keyData = await this.getSecureStorage(`${STORAGE_PREFIX}${provider}`);
        if (keyData) {
          const stored: StoredAPIKey = JSON.parse(keyData);
          this.keys.set(provider, stored);
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[APIKeyManager] Failed to initialize:', error);
      this.initialized = true;
    }
  }

  /**
   * Save an API key for a provider
   */
  async saveKey(
    provider: LLMProvider, 
    key: string, 
    selectedModel?: string
  ): Promise<{ success: boolean; error?: string }> {
    await this.initialize();
    
    // Basic validation
    const config = PROVIDERS[provider];
    if (!config) {
      return { success: false, error: 'Unknown provider' };
    }

    const trimmedKey = key.trim();
    if (!trimmedKey) {
      return { success: false, error: 'API key cannot be empty' };
    }

    // Validate key format if prefix is specified
    if (config.keyPrefix && !trimmedKey.startsWith(config.keyPrefix)) {
      return { 
        success: false, 
        error: `Invalid key format. ${config.name} keys should start with "${config.keyPrefix}"` 
      };
    }

    const stored: StoredAPIKey = {
      provider,
      key: trimmedKey,
      addedAt: Date.now(),
      selectedModel: selectedModel || config.models.find(m => m.isDefault)?.id,
    };

    try {
      // Store the key securely
      await this.setSecureStorage(`${STORAGE_PREFIX}${provider}`, JSON.stringify(stored));
      
      // Update metadata
      const providers = Array.from(this.keys.keys());
      if (!providers.includes(provider)) {
        providers.push(provider);
      }
      await this.setStorage(METADATA_KEY, JSON.stringify(providers));
      
      // Update in-memory cache
      this.keys.set(provider, stored);
      this.notifyListeners();
      
      return { success: true };
    } catch (error) {
      console.error('[APIKeyManager] Failed to save key:', error);
      return { success: false, error: 'Failed to save API key securely' };
    }
  }

  /**
   * Get an API key for a provider
   */
  async getKey(provider: LLMProvider): Promise<StoredAPIKey | null> {
    await this.initialize();
    return this.keys.get(provider) || null;
  }

  /**
   * Get all stored keys
   */
  async getAllKeys(): Promise<Map<LLMProvider, StoredAPIKey>> {
    await this.initialize();
    return new Map(this.keys);
  }

  /**
   * Delete an API key
   */
  async deleteKey(provider: LLMProvider): Promise<boolean> {
    await this.initialize();
    
    try {
      await this.deleteSecureStorage(`${STORAGE_PREFIX}${provider}`);
      
      // Update metadata
      const providers = Array.from(this.keys.keys()).filter(p => p !== provider);
      await this.setStorage(METADATA_KEY, JSON.stringify(providers));
      
      this.keys.delete(provider);
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('[APIKeyManager] Failed to delete key:', error);
      return false;
    }
  }

  /**
   * Update the selected model for a provider
   */
  async updateSelectedModel(provider: LLMProvider, modelId: string): Promise<boolean> {
    await this.initialize();
    
    const stored = this.keys.get(provider);
    if (!stored) return false;
    
    stored.selectedModel = modelId;
    stored.lastUsed = Date.now();
    
    try {
      await this.setSecureStorage(`${STORAGE_PREFIX}${provider}`, JSON.stringify(stored));
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('[APIKeyManager] Failed to update model:', error);
      return false;
    }
  }

  /**
   * Mark a key as used
   */
  async markKeyUsed(provider: LLMProvider): Promise<void> {
    const stored = this.keys.get(provider);
    if (!stored) return;
    
    stored.lastUsed = Date.now();
    await this.setSecureStorage(`${STORAGE_PREFIX}${provider}`, JSON.stringify(stored));
  }

  /**
   * Set key validation status
   */
  async setKeyValidation(provider: LLMProvider, isValid: boolean): Promise<void> {
    const stored = this.keys.get(provider);
    if (!stored) return;
    
    stored.isValid = isValid;
    await this.setSecureStorage(`${STORAGE_PREFIX}${provider}`, JSON.stringify(stored));
    this.notifyListeners();
  }

  /**
   * Check if any API keys are configured
   */
  hasAnyKeys(): boolean {
    return this.keys.size > 0;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): LLMProvider[] {
    return Array.from(this.keys.keys());
  }

  /**
   * Subscribe to key changes
   */
  subscribe(listener: APIKeyListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const keys = new Map(this.keys);
    this.listeners.forEach(listener => listener(keys));
  }

  // Storage helpers with platform fallback
  private async getSecureStorage(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Web doesn't support SecureStore, use localStorage
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  }

  private async setSecureStorage(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }

  private async deleteSecureStorage(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }

  private async getStorage(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  private async setStorage(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }
}

// Export singleton instance
export const apiKeyManager = new APIKeyManager();

// Export class for testing
export { APIKeyManager };
