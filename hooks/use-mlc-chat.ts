/**
 * MLC Chat Hook
 * 
 * Provides a React hook for using MLC-LLM with streaming responses.
 * Integrates with the Vercel AI SDK patterns for familiar API.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getMLCLLMService, MLCModelId, MLCGenerationOptions } from '@/lib/llm/mlc-llm-service';

/**
 * Message role types
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

/**
 * Chat state
 */
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
}

/**
 * Chat options
 */
export interface UseChatOptions {
  /** Initial messages */
  initialMessages?: ChatMessage[];
  /** System prompt */
  systemPrompt?: string;
  /** Generation options */
  generationOptions?: Omit<MLCGenerationOptions, 'systemPrompt'>;
  /** Callback when response starts */
  onStart?: () => void;
  /** Callback when response completes */
  onFinish?: (message: ChatMessage) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Generate unique message ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for MLC-LLM chat with streaming
 */
export function useMLCChat(options: UseChatOptions = {}) {
  const {
    initialMessages = [],
    systemPrompt,
    generationOptions = {},
    onStart,
    onFinish,
    onError,
  } = options;
  
  const [state, setState] = useState<ChatState>({
    messages: initialMessages,
    isLoading: false,
    error: null,
    isStreaming: false,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const mlcService = getMLCLLMService();
  
  /**
   * Add a message to the chat
   */
  const addMessage = useCallback((role: MessageRole, content: string): ChatMessage => {
    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      createdAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
    
    return message;
  }, []);
  
  /**
   * Update the last assistant message (for streaming)
   */
  const updateLastAssistantMessage = useCallback((content: string, isStreaming: boolean = true) => {
    setState(prev => {
      const messages = [...prev.messages];
      const lastIndex = messages.length - 1;
      
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content,
          isStreaming,
        };
      }
      
      return { ...prev, messages, isStreaming };
    });
  }, []);
  
  /**
   * Send a message and get a streaming response
   */
  const sendMessage = useCallback(async (content: string) => {
    // Check if model is ready
    const selectedModel = mlcService.getSelectedModel();
    if (!selectedModel) {
      const error = new Error('No model selected. Please download and activate a model first.');
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
      return;
    }
    
    const modelState = mlcService.getModelState(selectedModel);
    if (modelState.status !== 'ready') {
      const error = new Error(`Model is not ready (status: ${modelState.status})`);
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
      return;
    }
    
    // Add user message
    addMessage('user', content);
    
    // Add empty assistant message for streaming
    const assistantMessage = addMessage('assistant', '');
    
    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true,
      isStreaming: true,
      error: null,
    }));
    
    onStart?.();
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      // Build prompt from message history
      const messageHistory = state.messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      
      const fullPrompt = messageHistory 
        ? `${messageHistory}\n\nUser: ${content}\n\nAssistant:`
        : content;
      
      // Stream the response
      let fullResponse = '';
      const stream = mlcService.generateStream(fullPrompt, {
        ...generationOptions,
        systemPrompt,
      });
      
      for await (const chunk of stream) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        fullResponse += chunk;
        updateLastAssistantMessage(fullResponse, true);
      }
      
      // Finalize the message
      updateLastAssistantMessage(fullResponse, false);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
      }));
      
      const finalMessage: ChatMessage = {
        ...assistantMessage,
        content: fullResponse,
        isStreaming: false,
      };
      
      onFinish?.(finalMessage);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        error: errorMessage,
      }));
      
      // Update assistant message with error
      updateLastAssistantMessage(`Error: ${errorMessage}`, false);
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    mlcService,
    state.messages,
    addMessage,
    updateLastAssistantMessage,
    systemPrompt,
    generationOptions,
    onStart,
    onFinish,
    onError,
  ]);
  
  /**
   * Send a message without streaming (single response)
   */
  const sendMessageSync = useCallback(async (content: string) => {
    // Check if model is ready
    const selectedModel = mlcService.getSelectedModel();
    if (!selectedModel) {
      const error = new Error('No model selected. Please download and activate a model first.');
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
      return;
    }
    
    // Add user message
    addMessage('user', content);
    
    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    
    onStart?.();
    
    try {
      // Build prompt from message history
      const messageHistory = state.messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      
      const fullPrompt = messageHistory 
        ? `${messageHistory}\n\nUser: ${content}\n\nAssistant:`
        : content;
      
      // Generate response
      const result = await mlcService.generate(fullPrompt, {
        ...generationOptions,
        systemPrompt,
      });
      
      if (result.success && result.text) {
        const message = addMessage('assistant', result.text);
        onFinish?.(message);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      addMessage('assistant', `Error: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    mlcService,
    state.messages,
    addMessage,
    systemPrompt,
    generationOptions,
    onStart,
    onFinish,
    onError,
  ]);
  
  /**
   * Stop the current generation
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      isStreaming: false,
    }));
  }, []);
  
  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
    }));
  }, []);
  
  /**
   * Set error
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);
  
  /**
   * Reload the last response
   */
  const reload = useCallback(async () => {
    const messages = state.messages;
    const lastUserMessageIndex = messages.length - 1 - [...messages].reverse().findIndex((m: ChatMessage) => m.role === 'user');
    if (lastUserMessageIndex >= messages.length) {
      return; // No user message found
    }
    
    if (lastUserMessageIndex === -1) {
      return;
    }
    
    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove messages after the last user message
    setState(prev => ({
      ...prev,
      messages: prev.messages.slice(0, lastUserMessageIndex + 1),
    }));
    
    // Resend the message
    await sendMessage(lastUserMessage.content);
  }, [state.messages, sendMessage]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    sendMessage,
    sendMessageSync,
    stop,
    clearMessages,
    setError,
    reload,
    addMessage,
  };
}

/**
 * Hook for checking MLC model status
 */
export function useMLCModelStatus() {
  const [isReady, setIsReady] = useState(false);
  const [selectedModel, setSelectedModel] = useState<MLCModelId | null>(null);
  const [isNative, setIsNative] = useState(false);
  
  useEffect(() => {
    const mlcService = getMLCLLMService();
    
    const checkStatus = () => {
      const model = mlcService.getSelectedModel();
      setSelectedModel(model);
      setIsNative(mlcService.isUsingNativeModule());
      
      if (model) {
        const state = mlcService.getModelState(model);
        setIsReady(state.status === 'ready');
      } else {
        setIsReady(false);
      }
    };
    
    // Initial check
    checkStatus();
    
    // Subscribe to changes
    const unsubscribe = mlcService.subscribe(() => {
      checkStatus();
    });
    
    return unsubscribe;
  }, []);
  
  return {
    isReady,
    selectedModel,
    isNative,
  };
}

export default useMLCChat;
