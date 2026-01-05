/**
 * Mobile LLM Service
 * 
 * Provides a unified interface for running LLMs on mobile devices.
 * Supports multiple backends:
 * - Cloud API (Gemini, MiniMax, etc.) - default, best quality
 * - On-device SLM (Qwen 2.5 3B, Phi-3.5) - offline fallback
 * 
 * Architecture:
 * - Cloud-first with automatic fallback to on-device
 * - Lazy loading of on-device models
 * - Smart routing based on query complexity
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * LLM Provider types
 */
export type LLMProvider = 
  | 'gemini'      // Google Gemini API (cloud)
  | 'minimax'     // MiniMax API (cloud)
  | 'anthropic'   // Anthropic Claude API (cloud)
  | 'qwen-local'  // Qwen 2.5 Coder 3B (on-device)
  | 'phi-local'   // Phi-3.5 Mini (on-device)
  | 'template';   // Rule-based templates (offline fallback)

/**
 * LLM Message format
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM Completion options
 */
export interface LLMCompletionOptions {
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling (0-2) */
  temperature?: number;
  /** Top-p sampling */
  topP?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Force specific provider */
  provider?: LLMProvider;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * LLM Completion result
 */
export interface LLMCompletionResult {
  success: boolean;
  content?: string;
  error?: string;
  provider: LLMProvider;
  tokensUsed?: number;
  latencyMs?: number;
  cached?: boolean;
}

/**
 * Model download status
 */
export interface ModelDownloadStatus {
  modelId: string;
  status: 'not-downloaded' | 'downloading' | 'downloaded' | 'error';
  progress?: number;
  sizeBytes?: number;
  error?: string;
}

/**
 * LLM Service configuration
 */
export interface LLMServiceConfig {
  /** Default provider to use */
  defaultProvider: LLMProvider;
  /** Enable offline fallback */
  enableOfflineFallback: boolean;
  /** Preferred on-device model */
  preferredLocalModel: 'qwen-local' | 'phi-local';
  /** Enable response caching */
  enableCaching: boolean;
  /** Cache TTL in seconds */
  cacheTTL: number;
  /** Maximum retries for cloud providers */
  maxRetries: number;
  /** Debug mode */
  debug: boolean;
}

const DEFAULT_CONFIG: LLMServiceConfig = {
  defaultProvider: 'gemini',
  enableOfflineFallback: true,
  preferredLocalModel: 'qwen-local',
  enableCaching: true,
  cacheTTL: 3600, // 1 hour
  maxRetries: 2,
  debug: false,
};

/**
 * Simple hash function for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Mobile LLM Service class
 */
export class MobileLLMService {
  private config: LLMServiceConfig;
  private cache: Map<string, { result: LLMCompletionResult; timestamp: number }> = new Map();
  private localModelStatus: ModelDownloadStatus | null = null;
  private isOnline: boolean = true;
  
  constructor(config: Partial<LLMServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Generate a completion from the LLM
   */
  async complete(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {}
  ): Promise<LLMCompletionResult> {
    const startTime = Date.now();
    const provider = options.provider || this.config.defaultProvider;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCached(messages, options);
      if (cached) {
        return { ...cached, cached: true };
      }
    }
    
    // Try primary provider
    let result = await this.tryProvider(provider, messages, options);
    
    // Fallback logic
    if (!result.success && this.config.enableOfflineFallback) {
      // Try cloud fallback first
      if (this.isCloudProvider(provider)) {
        const fallbackProviders: LLMProvider[] = ['minimax', 'anthropic', 'gemini']
          .filter(p => p !== provider) as LLMProvider[];
        
        for (const fallback of fallbackProviders) {
          result = await this.tryProvider(fallback, messages, options);
          if (result.success) break;
        }
      }
      
      // If still failing, try on-device
      if (!result.success) {
        result = await this.tryProvider(this.config.preferredLocalModel, messages, options);
      }
      
      // Last resort: template-based
      if (!result.success) {
        result = await this.tryProvider('template', messages, options);
      }
    }
    
    // Update latency
    result.latencyMs = Date.now() - startTime;
    
    // Cache successful results
    if (result.success && this.config.enableCaching) {
      this.setCache(messages, options, result);
    }
    
    return result;
  }
  
  /**
   * Try a specific provider
   */
  private async tryProvider(
    provider: LLMProvider,
    messages: LLMMessage[],
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    try {
      switch (provider) {
        case 'gemini':
          return await this.callGemini(messages, options);
        case 'minimax':
          return await this.callMiniMax(messages, options);
        case 'anthropic':
          return await this.callAnthropic(messages, options);
        case 'qwen-local':
        case 'phi-local':
          return await this.callLocalModel(provider, messages, options);
        case 'template':
          return this.useTemplates(messages);
        default:
          return {
            success: false,
            error: `Unknown provider: ${provider}`,
            provider,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
      };
    }
  }
  
  /**
   * Call Gemini API
   */
  private async callGemini(
    messages: LLMMessage[],
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    // This would be implemented using the server's LLM endpoint
    // For now, return a placeholder indicating the pattern
    return {
      success: false,
      error: 'Gemini API call should go through server tRPC endpoint',
      provider: 'gemini',
    };
  }
  
  /**
   * Call MiniMax API
   */
  private async callMiniMax(
    messages: LLMMessage[],
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    // MiniMax API integration via MCP
    return {
      success: false,
      error: 'MiniMax API call should go through MCP',
      provider: 'minimax',
    };
  }
  
  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    messages: LLMMessage[],
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    return {
      success: false,
      error: 'Anthropic API call should go through server tRPC endpoint',
      provider: 'anthropic',
    };
  }
  
  /**
   * Call on-device local model
   * This is a placeholder for MLC-LLM or ONNX Runtime integration
   */
  private async callLocalModel(
    provider: 'qwen-local' | 'phi-local',
    messages: LLMMessage[],
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    // Check if model is downloaded
    if (!this.localModelStatus || this.localModelStatus.status !== 'downloaded') {
      return {
        success: false,
        error: 'Local model not downloaded. Call downloadLocalModel() first.',
        provider,
      };
    }
    
    // TODO: Integrate with MLC-LLM or ONNX Runtime
    // This would use react-native-mlc-llm or onnxruntime-react-native
    
    // For now, return placeholder
    return {
      success: false,
      error: 'Local model inference not yet implemented',
      provider,
    };
  }
  
  /**
   * Use template-based responses for common queries
   * This is the ultimate fallback when no LLM is available
   */
  private useTemplates(messages: LLMMessage[]): LLMCompletionResult {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return {
        success: false,
        error: 'No user message found',
        provider: 'template',
      };
    }
    
    const query = lastMessage.content.toLowerCase();
    
    // Template matching for common meta-analysis queries
    const templates: Record<string, string> = {
      'forest plot': `To create a forest plot in R:
\`\`\`r
library(metafor)
# Assuming you have effect sizes (yi) and variances (vi)
res <- rma(yi, vi, data=your_data)
forest(res)
\`\`\``,
      
      'meta-analysis': `To conduct a meta-analysis in R:
\`\`\`r
library(metafor)
# For binary outcomes (odds ratio)
dat <- escalc(measure="OR", ai=events_treat, bi=no_events_treat, 
              ci=events_ctrl, di=no_events_ctrl, data=your_data)
res <- rma(yi, vi, data=dat)
summary(res)
\`\`\``,
      
      'heterogeneity': `Heterogeneity in meta-analysis is assessed using:
- I² statistic: percentage of variability due to heterogeneity
- τ² (tau-squared): between-study variance
- Q statistic: test of homogeneity
- Prediction interval: range of true effects

In R:
\`\`\`r
res <- rma(yi, vi, data=dat)
summary(res)  # Shows I², τ², Q, and p-value
predict(res)  # Shows prediction interval
\`\`\``,
      
      'funnel plot': `To create a funnel plot for publication bias:
\`\`\`r
library(metafor)
res <- rma(yi, vi, data=dat)
funnel(res)

# Egger's test for asymmetry
regtest(res)
\`\`\``,
    };
    
    // Find matching template
    for (const [key, response] of Object.entries(templates)) {
      if (query.includes(key)) {
        return {
          success: true,
          content: response,
          provider: 'template',
        };
      }
    }
    
    // No template match
    return {
      success: false,
      error: 'No template available for this query. Please try a cloud provider.',
      provider: 'template',
    };
  }
  
  /**
   * Check if provider is cloud-based
   */
  private isCloudProvider(provider: LLMProvider): boolean {
    return ['gemini', 'minimax', 'anthropic'].includes(provider);
  }
  
  /**
   * Get cached result
   */
  private getCached(
    messages: LLMMessage[],
    options: LLMCompletionOptions
  ): LLMCompletionResult | null {
    const key = this.getCacheKey(messages, options);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = (Date.now() - cached.timestamp) / 1000;
    if (age > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }
  
  /**
   * Set cache entry
   */
  private setCache(
    messages: LLMMessage[],
    options: LLMCompletionOptions,
    result: LLMCompletionResult
  ): void {
    const key = this.getCacheKey(messages, options);
    this.cache.set(key, { result, timestamp: Date.now() });
    
    // Limit cache size
    if (this.cache.size > 100) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }
  }
  
  /**
   * Generate cache key
   */
  private getCacheKey(messages: LLMMessage[], options: LLMCompletionOptions): string {
    const content = JSON.stringify({ messages, options });
    return hashString(content);
  }
  
  /**
   * Check local model download status
   */
  async getLocalModelStatus(): Promise<ModelDownloadStatus> {
    if (this.localModelStatus) {
      return this.localModelStatus;
    }
    
    // Check AsyncStorage for downloaded model
    const modelId = this.config.preferredLocalModel === 'qwen-local' 
      ? 'qwen2.5-coder-3b-q4' 
      : 'phi-3.5-mini-q4';
    
    try {
      const stored = await AsyncStorage.getItem(`model_${modelId}`);
      if (stored) {
        this.localModelStatus = JSON.parse(stored);
        return this.localModelStatus!;
      }
    } catch (error) {
      // Ignore storage errors
    }
    
    return {
      modelId,
      status: 'not-downloaded',
    };
  }
  
  /**
   * Download local model
   * This is a placeholder for actual model download logic
   */
  async downloadLocalModel(
    onProgress?: (progress: number) => void
  ): Promise<ModelDownloadStatus> {
    const modelId = this.config.preferredLocalModel === 'qwen-local' 
      ? 'qwen2.5-coder-3b-q4' 
      : 'phi-3.5-mini-q4';
    
    this.localModelStatus = {
      modelId,
      status: 'downloading',
      progress: 0,
      sizeBytes: 2100000000, // ~2.1GB for Q4
    };
    
    // TODO: Implement actual download from Hugging Face or custom CDN
    // This would use expo-file-system to download the GGUF file
    
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      this.localModelStatus.progress = i;
      onProgress?.(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.localModelStatus.status = 'downloaded';
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(
      `model_${modelId}`,
      JSON.stringify(this.localModelStatus)
    );
    
    return this.localModelStatus;
  }
  
  /**
   * Delete local model
   */
  async deleteLocalModel(): Promise<void> {
    if (this.localModelStatus) {
      await AsyncStorage.removeItem(`model_${this.localModelStatus.modelId}`);
      this.localModelStatus = null;
    }
  }
  
  /**
   * Set online/offline status
   */
  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get available providers
   */
  getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = ['template'];
    
    if (this.isOnline) {
      providers.unshift('gemini', 'minimax', 'anthropic');
    }
    
    if (this.localModelStatus?.status === 'downloaded') {
      providers.push(this.config.preferredLocalModel);
    }
    
    return providers;
  }
}

// Singleton instance
let llmServiceInstance: MobileLLMService | null = null;

export function getMobileLLMService(config?: Partial<LLMServiceConfig>): MobileLLMService {
  if (!llmServiceInstance) {
    llmServiceInstance = new MobileLLMService(config);
  }
  return llmServiceInstance;
}

export function resetMobileLLMService(): void {
  if (llmServiceInstance) {
    llmServiceInstance.clearCache();
    llmServiceInstance = null;
  }
}
