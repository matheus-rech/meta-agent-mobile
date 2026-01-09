/**
 * useGlass Hook
 * 
 * Manages Glass 🦊 AI agent state and interactions using server-side tRPC endpoint
 * that proxies to MiniMax M2.1 API.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
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

// Available skills for Glass
const GLASS_SKILLS = [
  { id: 'meta-analysis-fundamentals', name: 'Meta-Analysis Fundamentals', description: 'Core concepts' },
  { id: 'forest-plot-creation', name: 'Forest Plot Creation', description: 'Visualization' },
  { id: 'heterogeneity-analysis', name: 'Heterogeneity Analysis', description: 'I² and tau²' },
  { id: 'publication-bias-detection', name: 'Publication Bias', description: 'Funnel plots' },
  { id: 'data-extraction', name: 'Data Extraction', description: 'Effect sizes' },
  { id: 'grade-assessment', name: 'GRADE Assessment', description: 'Evidence certainty' },
  { id: 'r-code-generation', name: 'R Code Generation', description: 'metafor package' },
  { id: 'socratic-teaching', name: 'Socratic Teaching', description: 'Guided learning' },
  { id: 'network-meta-analysis', name: 'Network Meta-Analysis', description: 'Indirect comparisons' },
  { id: 'bayesian-meta-analysis', name: 'Bayesian Meta-Analysis', description: 'Bayesian approaches' },
  { id: 'ipd-meta-analysis', name: 'IPD Meta-Analysis', description: 'Individual data' },
  { id: 'trial-sequential-analysis', name: 'Trial Sequential Analysis', description: 'TSA' },
  { id: 'diagnostic-meta-analysis', name: 'Diagnostic Meta-Analysis', description: 'Sensitivity/specificity' },
];

export function useGlass(): UseGlassReturn {
  const [messages, setMessages] = useState<GlassMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [glassState, setGlassState] = useState<GlassState>('idle');
  const [sessionId, setSessionId] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('auto');
  const initRef = useRef(false);

  // tRPC mutation for Glass chat
  const glassChatMutation = trpc.glass.chat.useMutation();

  // Generate unique message ID
  const generateId = () => `glass_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Generate session ID
  const generateSessionId = () => `session_${Date.now().toString(36)}`;

  // Initialize
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
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
      // Build history for API call
      const history = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Call server-side Glass endpoint via tRPC
      const response = await glassChatMutation.mutateAsync({
        message: trimmed,
        history,
        language: currentLanguage !== 'auto' ? currentLanguage : undefined,
        useRAG: true,
      });

      if (response.success) {
        // Add assistant message
        const assistantMessage: GlassMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
          skillsUsed: response.skillsUsed,
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
      } else {
        throw new Error(response.content || 'Unknown error');
      }
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
  }, [isReady, currentLanguage, saveMessages, messages, glassChatMutation]);

  // Clear all messages
  const clearMessages = useCallback(async () => {
    setMessages([]);
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
    return GLASS_SKILLS;
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
