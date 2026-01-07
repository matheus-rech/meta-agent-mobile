/**
 * BYOK (Bring Your Own Key) Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock SecureStore
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

// Mock Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { APIKeyManager, PROVIDERS, type LLMProvider } from '../lib/api-keys/api-key-manager';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('APIKeyManager', () => {
  let manager: APIKeyManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new APIKeyManager();
    
    // Reset mocks
    (AsyncStorage.getItem as any).mockResolvedValue(null);
    (SecureStore.getItemAsync as any).mockResolvedValue(null);
  });

  describe('PROVIDERS configuration', () => {
    it('should have all 5 providers configured', () => {
      const providers = Object.keys(PROVIDERS);
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('gemini');
      expect(providers).toContain('openrouter');
      expect(providers).toContain('minimax');
      expect(providers.length).toBe(5);
    });

    it('should have valid provider configurations', () => {
      for (const [id, config] of Object.entries(PROVIDERS)) {
        expect(config.id).toBe(id);
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.baseUrl).toMatch(/^https:\/\//);
        expect(config.docsUrl).toMatch(/^https:\/\//);
        expect(config.models.length).toBeGreaterThan(0);
        expect(config.icon).toBeTruthy();
      }
    });

    it('should have at least one default model per provider', () => {
      for (const config of Object.values(PROVIDERS)) {
        const hasDefault = config.models.some(m => m.isDefault);
        expect(hasDefault).toBe(true);
      }
    });
  });

  describe('MiniMax M2.1 provider', () => {
    it('should have MiniMax M2.1 as the primary model', () => {
      const minimax = PROVIDERS.minimax;
      expect(minimax.name).toBe('MiniMax');
      expect(minimax.models[0].id).toBe('MiniMax-M2.1');
      expect(minimax.models[0].isDefault).toBe(true);
    });

    it('should have MiniMax M2.1 Lightning as a faster option', () => {
      const minimax = PROVIDERS.minimax;
      const lightning = minimax.models.find(m => m.id === 'MiniMax-M2.1-lightning');
      expect(lightning).toBeDefined();
      expect(lightning?.name).toContain('Lightning');
    });

    it('should use Anthropic-compatible API base URL', () => {
      const minimax = PROVIDERS.minimax;
      expect(minimax.baseUrl).toBe('https://api.minimax.io/anthropic');
    });
  });

  describe('saveKey', () => {
    it('should save a valid OpenAI key', async () => {
      const result = await manager.saveKey('openai', 'sk-test123456789');
      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should reject empty keys', async () => {
      const result = await manager.saveKey('openai', '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should validate key prefix for OpenAI', async () => {
      const result = await manager.saveKey('openai', 'invalid-key');
      expect(result.success).toBe(false);
      expect(result.error).toContain('sk-');
    });

    it('should validate key prefix for Anthropic', async () => {
      const result = await manager.saveKey('anthropic', 'invalid-key');
      expect(result.success).toBe(false);
      expect(result.error).toContain('sk-ant-');
    });

    it('should accept MiniMax keys without prefix validation', async () => {
      const result = await manager.saveKey('minimax', 'any-key-format');
      expect(result.success).toBe(true);
    });
  });

  describe('getKey', () => {
    it('should return null for unconfigured provider', async () => {
      const key = await manager.getKey('openai');
      expect(key).toBeNull();
    });

    it('should return stored key after saving', async () => {
      // Mock storage to return saved key
      (SecureStore.getItemAsync as any).mockResolvedValue(
        JSON.stringify({
          provider: 'openai',
          key: 'sk-test123',
          addedAt: Date.now(),
        })
      );
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(['openai']));

      // Create new manager to trigger initialization
      const newManager = new APIKeyManager();
      await newManager.initialize();
      
      const key = await newManager.getKey('openai');
      expect(key).toBeDefined();
      expect(key?.key).toBe('sk-test123');
    });
  });

  describe('deleteKey', () => {
    it('should delete stored key', async () => {
      // First save a key
      await manager.saveKey('openai', 'sk-test123456789');
      
      // Then delete it
      const result = await manager.deleteKey('openai');
      expect(result).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  describe('hasAnyKeys', () => {
    it('should return false when no keys configured', () => {
      expect(manager.hasAnyKeys()).toBe(false);
    });

    it('should return true after saving a key', async () => {
      await manager.saveKey('openai', 'sk-test123456789');
      expect(manager.hasAnyKeys()).toBe(true);
    });
  });

  describe('getConfiguredProviders', () => {
    it('should return empty array when no keys configured', () => {
      expect(manager.getConfiguredProviders()).toEqual([]);
    });

    it('should return list of configured providers', async () => {
      await manager.saveKey('openai', 'sk-test123456789');
      await manager.saveKey('anthropic', 'sk-ant-test123456789');
      
      const providers = manager.getConfiguredProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
    });
  });
});

describe('Provider pricing', () => {
  it('should have reasonable pricing for all models', () => {
    for (const config of Object.values(PROVIDERS)) {
      for (const model of config.models) {
        // Input price should be less than output price (generally)
        // or at least both should be positive
        expect(model.inputPrice).toBeGreaterThanOrEqual(0);
        expect(model.outputPrice).toBeGreaterThan(0);
        
        // Context windows should be reasonable
        expect(model.contextWindow).toBeGreaterThanOrEqual(4096);
      }
    }
  });

  it('should have MiniMax as a cost-effective option', () => {
    const minimax = PROVIDERS.minimax;
    const lightning = minimax.models.find(m => m.id === 'MiniMax-M2.1-lightning');
    
    // Lightning should be cheaper than main model
    const main = minimax.models.find(m => m.id === 'MiniMax-M2.1');
    expect(lightning?.inputPrice).toBeLessThan(main?.inputPrice || Infinity);
  });
});

describe('OpenRouter integration', () => {
  it('should provide access to multiple providers through one key', () => {
    const openrouter = PROVIDERS.openrouter;
    
    // Should have models from different providers
    const providers = new Set(openrouter.models.map(m => m.id.split('/')[0]));
    expect(providers.size).toBeGreaterThan(1);
  });

  it('should include Claude, GPT, and Gemini via OpenRouter', () => {
    const openrouter = PROVIDERS.openrouter;
    const modelIds = openrouter.models.map(m => m.id);
    
    expect(modelIds.some(id => id.includes('anthropic'))).toBe(true);
    expect(modelIds.some(id => id.includes('openai'))).toBe(true);
    expect(modelIds.some(id => id.includes('google'))).toBe(true);
  });
});
