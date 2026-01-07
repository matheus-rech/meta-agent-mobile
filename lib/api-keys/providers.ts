/**
 * LLM Provider Clients
 * 
 * Unified interface for calling various LLM APIs.
 * Each provider implements the same interface for consistent usage.
 */

import { LLMProvider, PROVIDERS, apiKeyManager } from './api-key-manager';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export interface GenerateResult {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model?: string;
  provider?: LLMProvider;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

type StreamCallback = (chunk: StreamChunk) => void;

/**
 * Base provider interface
 */
interface ProviderClient {
  generate(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<GenerateResult>;
  
  generateStream(
    messages: ChatMessage[],
    options: GenerateOptions,
    onChunk: StreamCallback
  ): Promise<GenerateResult>;
  
  validateKey(key: string): Promise<boolean>;
}

/**
 * OpenAI Provider Client
 */
class OpenAIClient implements ProviderClient {
  private baseUrl = 'https://api.openai.com/v1';

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('openai');
    if (!stored) {
      return { success: false, error: 'No OpenAI API key configured' };
    }

    const model = options.model || stored.selectedModel || 'gpt-4o';
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.key}`,
        },
        body: JSON.stringify({
          model,
          messages: this.formatMessages(messages, options.systemPrompt),
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      await apiKeyManager.markKeyUsed('openai');

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
        model,
        provider: 'openai',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async generateStream(
    messages: ChatMessage[],
    options: GenerateOptions,
    onChunk: StreamCallback
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('openai');
    if (!stored) {
      return { success: false, error: 'No OpenAI API key configured' };
    }

    const model = options.model || stored.selectedModel || 'gpt-4o';
    let fullContent = '';

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.key}`,
        },
        body: JSON.stringify({
          model,
          messages: this.formatMessages(messages, options.systemPrompt),
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', done: true });
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk({ content, done: false });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      await apiKeyManager.markKeyUsed('openai');

      return {
        success: true,
        content: fullContent,
        model,
        provider: 'openai',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private formatMessages(messages: ChatMessage[], systemPrompt?: string) {
    const formatted = [...messages];
    if (systemPrompt && !formatted.some(m => m.role === 'system')) {
      formatted.unshift({ role: 'system', content: systemPrompt });
    }
    return formatted;
  }
}

/**
 * Anthropic Provider Client
 */
class AnthropicClient implements ProviderClient {
  private baseUrl = 'https://api.anthropic.com/v1';

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('anthropic');
    if (!stored) {
      return { success: false, error: 'No Anthropic API key configured' };
    }

    const model = options.model || stored.selectedModel || 'claude-sonnet-4-20250514';
    const { systemPrompt, userMessages } = this.extractSystem(messages, options.systemPrompt);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': stored.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: userMessages,
          system: systemPrompt,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      await apiKeyManager.markKeyUsed('anthropic');

      const content = data.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      return {
        success: true,
        content,
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
        },
        model,
        provider: 'anthropic',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async generateStream(
    messages: ChatMessage[],
    options: GenerateOptions,
    onChunk: StreamCallback
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('anthropic');
    if (!stored) {
      return { success: false, error: 'No Anthropic API key configured' };
    }

    const model = options.model || stored.selectedModel || 'claude-sonnet-4-20250514';
    const { systemPrompt, userMessages } = this.extractSystem(messages, options.systemPrompt);
    let fullContent = '';

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': stored.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: userMessages,
          system: systemPrompt,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              fullContent += data.delta.text;
              onChunk({ content: data.delta.text, done: false });
            }
            if (data.type === 'message_stop') {
              onChunk({ content: '', done: true });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      await apiKeyManager.markKeyUsed('anthropic');

      return {
        success: true,
        content: fullContent,
        model,
        provider: 'anthropic',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple validation endpoint
      // We'll make a minimal request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      });
      return response.ok || response.status === 400; // 400 means key is valid but request is bad
    } catch {
      return false;
    }
  }

  private extractSystem(messages: ChatMessage[], systemPrompt?: string) {
    const systemMessages = messages.filter(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const system = systemPrompt || systemMessages.map(m => m.content).join('\n') || undefined;
    
    return { systemPrompt: system, userMessages };
  }
}

/**
 * Gemini Provider Client
 */
class GeminiClient implements ProviderClient {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('gemini');
    if (!stored) {
      return { success: false, error: 'No Gemini API key configured' };
    }

    const model = options.model || stored.selectedModel || 'gemini-2.0-flash';

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${stored.key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: this.formatMessages(messages),
            systemInstruction: options.systemPrompt ? {
              parts: [{ text: options.systemPrompt }]
            } : undefined,
            generationConfig: {
              maxOutputTokens: options.maxTokens || 4096,
              temperature: options.temperature ?? 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      await apiKeyManager.markKeyUsed('gemini');

      const content = data.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join('') || '';

      return {
        success: true,
        content,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount || 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        },
        model,
        provider: 'gemini',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async generateStream(
    messages: ChatMessage[],
    options: GenerateOptions,
    onChunk: StreamCallback
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('gemini');
    if (!stored) {
      return { success: false, error: 'No Gemini API key configured' };
    }

    const model = options.model || stored.selectedModel || 'gemini-2.0-flash';
    let fullContent = '';

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${model}:streamGenerateContent?key=${stored.key}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: this.formatMessages(messages),
            systemInstruction: options.systemPrompt ? {
              parts: [{ text: options.systemPrompt }]
            } : undefined,
            generationConfig: {
              maxOutputTokens: options.maxTokens || 4096,
              temperature: options.temperature ?? 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onChunk({ content: '', done: true });
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullContent += text;
              onChunk({ content: text, done: false });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      await apiKeyManager.markKeyUsed('gemini');

      return {
        success: true,
        content: fullContent,
        model,
        provider: 'gemini',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${key}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private formatMessages(messages: ChatMessage[]) {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  }
}

/**
 * OpenRouter Provider Client
 */
class OpenRouterClient implements ProviderClient {
  private baseUrl = 'https://openrouter.ai/api/v1';

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('openrouter');
    if (!stored) {
      return { success: false, error: 'No OpenRouter API key configured' };
    }

    const model = options.model || stored.selectedModel || 'anthropic/claude-sonnet-4';

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.key}`,
          'HTTP-Referer': 'https://meta-agent.app',
          'X-Title': 'Meta Agent',
        },
        body: JSON.stringify({
          model,
          messages: this.formatMessages(messages, options.systemPrompt),
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      await apiKeyManager.markKeyUsed('openrouter');

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
        },
        model,
        provider: 'openrouter',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async generateStream(
    messages: ChatMessage[],
    options: GenerateOptions,
    onChunk: StreamCallback
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('openrouter');
    if (!stored) {
      return { success: false, error: 'No OpenRouter API key configured' };
    }

    const model = options.model || stored.selectedModel || 'anthropic/claude-sonnet-4';
    let fullContent = '';

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.key}`,
          'HTTP-Referer': 'https://meta-agent.app',
          'X-Title': 'Meta Agent',
        },
        body: JSON.stringify({
          model,
          messages: this.formatMessages(messages, options.systemPrompt),
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', done: true });
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk({ content, done: false });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      await apiKeyManager.markKeyUsed('openrouter');

      return {
        success: true,
        content: fullContent,
        model,
        provider: 'openrouter',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private formatMessages(messages: ChatMessage[], systemPrompt?: string) {
    const formatted = [...messages];
    if (systemPrompt && !formatted.some(m => m.role === 'system')) {
      formatted.unshift({ role: 'system', content: systemPrompt });
    }
    return formatted;
  }
}

/**
 * MiniMax Provider Client
 * Uses Anthropic-compatible API
 */
class MiniMaxClient implements ProviderClient {
  private baseUrl = 'https://api.minimax.io/anthropic/v1';

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('minimax');
    if (!stored) {
      return { success: false, error: 'No MiniMax API key configured' };
    }

    const model = options.model || stored.selectedModel || 'MiniMax-M2.1';
    const { systemPrompt, userMessages } = this.extractSystem(messages, options.systemPrompt);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': stored.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: userMessages,
          system: systemPrompt,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      await apiKeyManager.markKeyUsed('minimax');

      // MiniMax returns thinking and text blocks
      const content = data.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      return {
        success: true,
        content,
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
        },
        model,
        provider: 'minimax',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async generateStream(
    messages: ChatMessage[],
    options: GenerateOptions,
    onChunk: StreamCallback
  ): Promise<GenerateResult> {
    const stored = await apiKeyManager.getKey('minimax');
    if (!stored) {
      return { success: false, error: 'No MiniMax API key configured' };
    }

    const model = options.model || stored.selectedModel || 'MiniMax-M2.1';
    const { systemPrompt, userMessages } = this.extractSystem(messages, options.systemPrompt);
    let fullContent = '';

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': stored.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: userMessages,
          system: systemPrompt,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: error.error?.message || `HTTP ${response.status}` 
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            // Handle text delta (skip thinking delta for cleaner output)
            if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
              const text = data.delta.text || '';
              if (text) {
                fullContent += text;
                onChunk({ content: text, done: false });
              }
            }
            if (data.type === 'message_stop') {
              onChunk({ content: '', done: true });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      await apiKeyManager.markKeyUsed('minimax');

      return {
        success: true,
        content: fullContent,
        model,
        provider: 'minimax',
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.1-lightning',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      });
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }

  private extractSystem(messages: ChatMessage[], systemPrompt?: string) {
    const systemMessages = messages.filter(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const system = systemPrompt || systemMessages.map(m => m.content).join('\n') || undefined;
    
    return { systemPrompt: system, userMessages };
  }
}

// Provider client instances
const clients: Record<LLMProvider, ProviderClient> = {
  openai: new OpenAIClient(),
  anthropic: new AnthropicClient(),
  gemini: new GeminiClient(),
  openrouter: new OpenRouterClient(),
  minimax: new MiniMaxClient(),
};

/**
 * Get a provider client
 */
export function getProviderClient(provider: LLMProvider): ProviderClient {
  return clients[provider];
}

/**
 * Generate text using the best available provider
 * Tries user-configured providers first, then falls back
 */
export async function generateWithBestProvider(
  messages: ChatMessage[],
  options: GenerateOptions = {},
  preferredProvider?: LLMProvider
): Promise<GenerateResult> {
  await apiKeyManager.initialize();
  
  // Build provider priority list
  const configuredProviders = apiKeyManager.getConfiguredProviders();
  
  let providerOrder: LLMProvider[] = [];
  
  if (preferredProvider && configuredProviders.includes(preferredProvider)) {
    providerOrder = [preferredProvider, ...configuredProviders.filter(p => p !== preferredProvider)];
  } else {
    providerOrder = configuredProviders;
  }

  // Try each provider in order
  for (const provider of providerOrder) {
    const client = clients[provider];
    const result = await client.generate(messages, options);
    
    if (result.success) {
      return result;
    }
    
    console.warn(`[Providers] ${provider} failed:`, result.error);
  }

  return {
    success: false,
    error: configuredProviders.length === 0
      ? 'No API keys configured. Add your API keys in Settings → API Keys.'
      : 'All configured providers failed. Check your API keys.',
  };
}

/**
 * Validate an API key for a provider
 */
export async function validateProviderKey(
  provider: LLMProvider,
  key: string
): Promise<boolean> {
  const client = clients[provider];
  return client.validateKey(key);
}
