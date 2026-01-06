/**
 * Tests for v2.2 features:
 * - WebR integration
 * - MLC-LLM service
 * - Offline mode indicator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock React Native modules
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: {
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  Animated: {
    Value: vi.fn(() => ({
      setValue: vi.fn(),
    })),
    loop: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
    sequence: vi.fn(),
    timing: vi.fn(),
  },
}));

vi.mock('expo-network', () => ({
  getNetworkStateAsync: vi.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'WIFI',
  })),
  isAirplaneModeEnabledAsync: vi.fn(() => Promise.resolve(false)),
  NetworkStateType: {
    WIFI: 'WIFI',
    CELLULAR: 'CELLULAR',
    ETHERNET: 'ETHERNET',
    NONE: 'NONE',
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

// Import after mocks
import {
  MLCLLMService,
  getMLCLLMService,
  resetMLCLLMService,
  MLC_MODELS,
  MLCModelId,
} from '../lib/llm/mlc-llm-service';

import {
  MobileLLMService,
  getMobileLLMService,
  resetMobileLLMService,
  LLMProvider,
} from '../lib/llm/mobile-llm-service';

import {
  generateWebRTestHtml,
  BCG_VACCINE_DATA,
  FOREST_PLOT_R_CODE,
  SIMPLE_TEST_R_CODE,
  CHECK_METAFOR_R_CODE,
} from '../hooks/use-webr-test';

describe('MLC-LLM Service', () => {
  let service: MLCLLMService;
  
  beforeEach(() => {
    resetMLCLLMService();
    service = getMLCLLMService();
  });
  
  afterEach(() => {
    resetMLCLLMService();
  });
  
  describe('Model Information', () => {
    it('should return all available models', () => {
      const models = service.getAvailableModels();
      expect(models.length).toBe(4);
      expect(models.map(m => m.id)).toContain('Llama-3.2-3B-Instruct');
      expect(models.map(m => m.id)).toContain('Phi-3-mini-4k-instruct');
      expect(models.map(m => m.id)).toContain('Qwen2.5-1.5B-Instruct');
      expect(models.map(m => m.id)).toContain('Mistral-7B-Instruct');
    });
    
    it('should return recommended models', () => {
      const recommended = service.getRecommendedModels();
      expect(recommended.length).toBeGreaterThan(0);
      expect(recommended.every(m => m.recommended)).toBe(true);
    });
    
    it('should have correct model metadata', () => {
      const llama = MLC_MODELS['Llama-3.2-3B-Instruct'];
      expect(llama.name).toBe('Llama 3.2 3B');
      expect(llama.sizeBytes).toBe(2_000_000_000);
      expect(llama.minMemoryGB).toBe(4);
      expect(llama.recommended).toBe(true);
    });
    
    it('should have Qwen as smallest model', () => {
      const qwen = MLC_MODELS['Qwen2.5-1.5B-Instruct'];
      expect(qwen.sizeBytes).toBe(1_000_000_000);
      expect(qwen.minMemoryGB).toBe(2);
    });
  });
  
  describe('Model State Management', () => {
    it('should return not-downloaded for new models', () => {
      const state = service.getModelState('Llama-3.2-3B-Instruct');
      expect(state.status).toBe('not-downloaded');
      expect(state.progress).toBe(0);
    });
    
    it('should track download progress', async () => {
      let lastProgress = 0;
      const progressCallback = (progress: number) => {
        lastProgress = progress;
      };
      
      await service.downloadModel('Qwen2.5-1.5B-Instruct', progressCallback);
      
      expect(lastProgress).toBe(100);
      const state = service.getModelState('Qwen2.5-1.5B-Instruct');
      expect(state.status).toBe('downloaded');
    });
    
    it('should prepare downloaded model', async () => {
      await service.downloadModel('Qwen2.5-1.5B-Instruct');
      await service.prepareModel('Qwen2.5-1.5B-Instruct');
      
      const state = service.getModelState('Qwen2.5-1.5B-Instruct');
      expect(state.status).toBe('ready');
      expect(service.getSelectedModel()).toBe('Qwen2.5-1.5B-Instruct');
    });
    
    it('should delete model', async () => {
      await service.downloadModel('Qwen2.5-1.5B-Instruct');
      await service.deleteModel('Qwen2.5-1.5B-Instruct');
      
      const state = service.getModelState('Qwen2.5-1.5B-Instruct');
      expect(state.status).toBe('not-downloaded');
    });
  });
  
  describe('Text Generation', () => {
    it('should fail without selected model', async () => {
      const result = await service.generate('Hello');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No model selected');
    });
    
    it('should generate text with ready model', async () => {
      await service.downloadModel('Qwen2.5-1.5B-Instruct');
      await service.prepareModel('Qwen2.5-1.5B-Instruct');
      
      const result = await service.generate('Hello world');
      expect(result.success).toBe(true);
      expect(result.text).toBeDefined();
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Storage Usage', () => {
    it('should calculate storage for downloaded models', async () => {
      await service.downloadModel('Qwen2.5-1.5B-Instruct');
      await service.prepareModel('Qwen2.5-1.5B-Instruct');
      
      const usage = await service.getStorageUsage();
      expect(usage.total).toBe(1_000_000_000);
      expect(usage.byModel['Qwen2.5-1.5B-Instruct']).toBe(1_000_000_000);
    });
  });
  
  describe('Subscription', () => {
    it('should notify subscribers of state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      
      await service.downloadModel('Qwen2.5-1.5B-Instruct');
      
      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });
  });
});

describe('Mobile LLM Service', () => {
  let service: MobileLLMService;
  
  beforeEach(() => {
    resetMobileLLMService();
    service = getMobileLLMService();
  });
  
  afterEach(() => {
    resetMobileLLMService();
  });
  
  describe('Provider Management', () => {
    it('should return available providers', () => {
      const providers = service.getAvailableProviders();
      expect(providers).toContain('template');
      expect(providers).toContain('gemini');
    });
    
    it('should include cloud providers when online', () => {
      service.setOnlineStatus(true);
      const providers = service.getAvailableProviders();
      expect(providers).toContain('gemini');
      expect(providers).toContain('minimax');
      expect(providers).toContain('anthropic');
    });
  });
  
  describe('Template Fallback', () => {
    it('should match forest plot template', async () => {
      const result = await service.complete([
        { role: 'user', content: 'How do I create a forest plot?' }
      ], { provider: 'template' });
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('forest');
      expect(result.provider).toBe('template');
    });
    
    it('should match meta-analysis template', async () => {
      const result = await service.complete([
        { role: 'user', content: 'How do I conduct a meta-analysis?' }
      ], { provider: 'template' });
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('metafor');
    });
    
    it('should match heterogeneity template', async () => {
      const result = await service.complete([
        { role: 'user', content: 'What is heterogeneity?' }
      ], { provider: 'template' });
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('heterogeneity');
    });
    
    it('should match funnel plot template', async () => {
      const result = await service.complete([
        { role: 'user', content: 'How to create a funnel plot?' }
      ], { provider: 'template' });
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('funnel');
    });
    
    it('should fail for unmatched queries', async () => {
      const result = await service.complete([
        { role: 'user', content: 'What is the weather today?' }
      ], { provider: 'template' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No template available');
    });
  });
  
  describe('Caching', () => {
    it('should cache successful results', async () => {
      const messages = [{ role: 'user' as const, content: 'forest plot' }];
      
      const result1 = await service.complete(messages, { provider: 'template' });
      const result2 = await service.complete(messages, { provider: 'template' });
      
      expect(result1.success).toBe(true);
      expect(result2.cached).toBe(true);
    });
    
    it('should clear cache', async () => {
      const messages = [{ role: 'user' as const, content: 'forest plot' }];
      
      await service.complete(messages, { provider: 'template' });
      service.clearCache();
      
      const result = await service.complete(messages, { provider: 'template' });
      expect(result.cached).toBeFalsy();
    });
  });
});

describe('WebR Test Utilities', () => {
  describe('HTML Generation', () => {
    it('should generate valid HTML', () => {
      const html = generateWebRTestHtml();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('WebR');
      expect(html).toContain('webr.mjs');
    });
    
    it('should include message handling', () => {
      const html = generateWebRTestHtml();
      expect(html).toContain('ReactNativeWebView');
      expect(html).toContain('postMessage');
    });
    
    it('should include metafor installation', () => {
      const html = generateWebRTestHtml();
      expect(html).toContain('metafor');
      expect(html).toContain('r-universe');
    });
  });
  
  describe('R Code Templates', () => {
    it('should have BCG vaccine data', () => {
      expect(BCG_VACCINE_DATA).toContain('dat.bcg');
      expect(BCG_VACCINE_DATA).toContain('Aronson');
      expect(BCG_VACCINE_DATA).toContain('tpos');
      expect(BCG_VACCINE_DATA).toContain('tneg');
    });
    
    it('should have forest plot code', () => {
      expect(FOREST_PLOT_R_CODE).toContain('library(metafor)');
      expect(FOREST_PLOT_R_CODE).toContain('escalc');
      expect(FOREST_PLOT_R_CODE).toContain('rma');
      expect(FOREST_PLOT_R_CODE).toContain('forest');
    });
    
    it('should have simple test code', () => {
      expect(SIMPLE_TEST_R_CODE).toContain('mean');
      expect(SIMPLE_TEST_R_CODE).toContain('R.version');
    });
    
    it('should have metafor check code', () => {
      expect(CHECK_METAFOR_R_CODE).toContain('requireNamespace');
      expect(CHECK_METAFOR_R_CODE).toContain('metafor');
      expect(CHECK_METAFOR_R_CODE).toContain('packageVersion');
    });
  });
});

describe('Model Metadata Validation', () => {
  it('should have all required fields for each model', () => {
    const requiredFields = ['id', 'name', 'size', 'sizeBytes', 'description', 'minMemoryGB', 'recommended'];
    
    Object.values(MLC_MODELS).forEach(model => {
      requiredFields.forEach(field => {
        expect(model).toHaveProperty(field);
      });
    });
  });
  
  it('should have reasonable size estimates', () => {
    Object.values(MLC_MODELS).forEach(model => {
      expect(model.sizeBytes).toBeGreaterThan(500_000_000); // At least 500MB
      expect(model.sizeBytes).toBeLessThan(10_000_000_000); // Less than 10GB
    });
  });
  
  it('should have reasonable memory requirements', () => {
    Object.values(MLC_MODELS).forEach(model => {
      expect(model.minMemoryGB).toBeGreaterThanOrEqual(2);
      expect(model.minMemoryGB).toBeLessThanOrEqual(16);
    });
  });
});

describe('Offline Mode Integration', () => {
  it('should have tiered fallback strategy', async () => {
    const service = getMobileLLMService({
      enableOfflineFallback: true,
      defaultProvider: 'gemini',
    });
    
    // Template should always be available as last resort
    const providers = service.getAvailableProviders();
    expect(providers).toContain('template');
  });
  
  it('should track online status', () => {
    const service = getMobileLLMService();
    
    service.setOnlineStatus(false);
    let providers = service.getAvailableProviders();
    expect(providers).not.toContain('gemini');
    
    service.setOnlineStatus(true);
    providers = service.getAvailableProviders();
    expect(providers).toContain('gemini');
  });
});
