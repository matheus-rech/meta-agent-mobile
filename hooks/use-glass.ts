/**
 * useGlass Hook
 * 
 * Manages Glass 🦊 AI agent state and interactions using MiniMax M2.1 API
 * with Gemini RAG for knowledge-grounded responses.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { miniAgentService, type ChatMessage, type MiniAgentResponse } from "@/lib/glass/mini-agent.service";
import { geminiFileSearchService } from "@/lib/glass/gemini-file-search.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const GLASS_SESSION_KEY = "@glass_session";
const GLASS_HISTORY_KEY = "@glass_history";

// Message types for Glass chat
export interface GlassMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  skillsUsed?: string[];
  sources?: { title: string; excerpt: string }[];
  language?: string;
}

// Glass state
export type GlassState = 'idle' | 'thinking' | 'talking' | 'error';

interface UseGlassReturn {
  messages: GlassMessage[];
  isReady: boolean;
  isThinking: boolean;
  glassState: GlassState;
  sessionId: string;
  currentLanguage: string;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  setLanguage: (lang: string) => void;
  getSkills: () => { id: string; name: string; description: string }[];
}

// API keys (from environment or hardcoded for testing)
const MINIMAX_API_KEY = 'sk-cp-2UyY_RQ6sHxiAv43y3mVc_y1aiYTm3KkK1V45XyqFXS-jW9Bf2Z2PFNynpsIBqOWiacDMd9H8WocHAxjGSgyqYamXYMRG-cnD8e8GFz1DqdNBZHNASH2Xt0';
const GEMINI_API_KEY = 'AIzaSyAyV5v8S1YRmVV6xwZ3ZJfwk1r1MID9Oco';

export function useGlass(): UseGlassReturn {
  const [messages, setMessages] = useState<GlassMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [glassState, setGlassState] = useState<GlassState>('idle');
  const [sessionId, setSessionId] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('auto');
  const initRef = useRef(false);

  // Generate unique message ID
  const generateId = () => `glass_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Generate session ID
  const generateSessionId = () => `session_${Date.now().toString(36)}`;

  // Initialize services
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        // Initialize MiniMax service
        await miniAgentService.initialize({
          apiKey: MINIMAX_API_KEY,
          baseUrl: 'https://api.minimax.io/anthropic',
          model: 'MiniMax-M2.1',
        });

        // Initialize Gemini RAG service
        await geminiFileSearchService.initialize({
          apiKey: GEMINI_API_KEY,
        });

        // Load or create session
        const storedSession = await AsyncStorage.getItem(GLASS_SESSION_KEY);
        if (storedSession) {
          setSessionId(storedSession);
        } else {
          const newSession = generateSessionId();
          setSessionId(newSession);
          await AsyncStorage.setItem(GLASS_SESSION_KEY, newSession);
        }

        // Load conversation history
        const storedHistory = await AsyncStorage.getItem(GLASS_HISTORY_KEY);
        if (storedHistory) {
          try {
            const history = JSON.parse(storedHistory) as GlassMessage[];
            setMessages(history.slice(-50)); // Keep last 50 messages
            
            // Restore to MiniMax service
            const chatHistory: ChatMessage[] = history.map(m => ({
              role: m.role,
              content: m.content,
            }));
            miniAgentService.setHistory(chatHistory);
          } catch (e) {
            console.error('[useGlass] Failed to parse history:', e);
          }
        }

        setIsReady(true);
        console.log('[useGlass] Glass 🦊 initialized successfully');
      } catch (error) {
        console.error('[useGlass] Initialization failed:', error);
        setGlassState('error');
      }
    };

    initialize();
  }, []);

  // Save messages to storage
  const saveMessages = useCallback(async (msgs: GlassMessage[]) => {
    try {
      await AsyncStorage.setItem(GLASS_HISTORY_KEY, JSON.stringify(msgs.slice(-50)));
    } catch (e) {
      console.error('[useGlass] Failed to save history:', e);
    }
  }, []);

  // Send a message to Glass
  const sendMessage = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed || !isReady) return;

    // Add user message
    const userMessage: GlassMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      saveMessages(updated);
      return updated;
    });

    // Set thinking state
    setIsThinking(true);
    setGlassState('thinking');

    try {
      // Call MiniMax with RAG
      const response: MiniAgentResponse = await miniAgentService.chat(trimmed, {
        useRAG: true,
        language: currentLanguage !== 'auto' ? currentLanguage : undefined,
      });

      // Add assistant message
      const assistantMessage: GlassMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        skillsUsed: response.skillsUsed,
        sources: response.sources,
        language: response.language,
      };

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        saveMessages(updated);
        return updated;
      });

      // Update language if detected
      if (response.language && currentLanguage === 'auto') {
        setCurrentLanguage(response.language);
      }

      setGlassState('talking');
      
      // Return to idle after a brief delay
      setTimeout(() => {
        setGlassState('idle');
      }, 1000);
    } catch (error) {
      console.error('[useGlass] Chat error:', error);
      
      // Add error message
      const errorMessage: GlassMessage = {
        id: generateId(),
        role: 'system',
        content: `🦊 Oops! I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: Date.now(),
      };

      setMessages(prev => {
        const updated = [...prev, errorMessage];
        saveMessages(updated);
        return updated;
      });

      setGlassState('error');
      
      // Return to idle after delay
      setTimeout(() => {
        setGlassState('idle');
      }, 2000);
    } finally {
      setIsThinking(false);
    }
  }, [isReady, currentLanguage, saveMessages]);

  // Clear all messages
  const clearMessages = useCallback(async () => {
    setMessages([]);
    miniAgentService.clearHistory();
    await AsyncStorage.removeItem(GLASS_HISTORY_KEY);
    
    // Generate new session
    const newSession = generateSessionId();
    setSessionId(newSession);
    await AsyncStorage.setItem(GLASS_SESSION_KEY, newSession);
  }, []);

  // Set language preference
  const setLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
  }, []);

  // Get available skills
  const getSkills = useCallback(() => {
    return miniAgentService.getSkills();
  }, []);

  return {
    messages,
    isReady,
    isThinking,
    glassState,
    sessionId,
    currentLanguage,
    sendMessage,
    clearMessages,
    setLanguage,
    getSkills,
  };
}

export default useGlass;
