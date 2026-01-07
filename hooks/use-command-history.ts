/**
 * useCommandHistory Hook
 * 
 * React hook for accessing and managing command history.
 * Provides navigation, search, and persistence functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  commandHistory, 
  CommandHistoryEntry, 
  CommandHistoryState 
} from '@/lib/history/command-history';

interface UseCommandHistoryOptions {
  /** Session ID to tag commands with */
  sessionId?: string;
  /** Auto-initialize on mount */
  autoInit?: boolean;
}

interface UseCommandHistoryReturn {
  /** All history entries */
  history: CommandHistoryEntry[];
  /** Current navigation index (-1 if not navigating) */
  currentIndex: number;
  /** Whether currently navigating through history */
  isNavigating: boolean;
  /** Total number of entries */
  count: number;
  /** Whether history is initialized */
  isReady: boolean;
  /** Add a command to history */
  addCommand: (command: string) => Promise<void>;
  /** Navigate to previous (older) command */
  navigatePrevious: (currentInput: string) => string | null;
  /** Navigate to next (newer) command */
  navigateNext: () => string | null;
  /** Reset navigation state */
  resetNavigation: () => void;
  /** Search history */
  search: (query: string, limit?: number) => CommandHistoryEntry[];
  /** Get recent commands */
  getRecent: (limit?: number) => CommandHistoryEntry[];
  /** Clear all history */
  clearHistory: () => Promise<void>;
  /** Format history for display */
  formatHistoryDisplay: (limit?: number) => string;
}

export function useCommandHistory(
  options: UseCommandHistoryOptions = {}
): UseCommandHistoryReturn {
  const { sessionId, autoInit = true } = options;
  
  const [state, setState] = useState<CommandHistoryState>({
    entries: [],
    currentIndex: -1,
  });
  const [isReady, setIsReady] = useState(false);
  const sessionIdRef = useRef(sessionId);
  
  // Update session ID ref
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Initialize and subscribe to changes
  useEffect(() => {
    if (!autoInit) return;
    
    let mounted = true;
    
    const init = async () => {
      await commandHistory.initialize();
      if (mounted) {
        setState(commandHistory.getState());
        setIsReady(true);
      }
    };
    
    init();
    
    const unsubscribe = commandHistory.subscribe((newState) => {
      if (mounted) {
        setState(newState);
      }
    });
    
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [autoInit]);

  const addCommand = useCallback(async (command: string) => {
    await commandHistory.addCommand(command, sessionIdRef.current);
  }, []);

  const navigatePrevious = useCallback((currentInput: string): string | null => {
    return commandHistory.navigatePrevious(currentInput);
  }, []);

  const navigateNext = useCallback((): string | null => {
    return commandHistory.navigateNext();
  }, []);

  const resetNavigation = useCallback(() => {
    commandHistory.resetNavigation();
  }, []);

  const search = useCallback((query: string, limit?: number): CommandHistoryEntry[] => {
    return commandHistory.search(query, limit);
  }, []);

  const getRecent = useCallback((limit?: number): CommandHistoryEntry[] => {
    return commandHistory.getRecent(limit);
  }, []);

  const clearHistory = useCallback(async () => {
    await commandHistory.clearHistory();
  }, []);

  const formatHistoryDisplay = useCallback((limit: number = 20): string => {
    const recent = commandHistory.getRecent(limit);
    if (recent.length === 0) {
      return 'No command history yet.';
    }
    
    const lines = [
      '┌─────────────────────────────────────────────────┐',
      '│              COMMAND HISTORY                    │',
      '├─────────────────────────────────────────────────┤',
    ];
    
    recent.forEach((entry, index) => {
      const num = String(index + 1).padStart(2, ' ');
      const time = new Date(entry.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const cmd = entry.command.length > 30 
        ? entry.command.slice(0, 27) + '...' 
        : entry.command.padEnd(30, ' ');
      lines.push(`│ ${num}. ${time} ${cmd}│`);
    });
    
    lines.push('└─────────────────────────────────────────────────┘');
    lines.push('');
    lines.push('Use ↑/↓ arrows to navigate history');
    
    return lines.join('\n');
  }, []);

  return {
    history: state.entries,
    currentIndex: state.currentIndex,
    isNavigating: state.currentIndex >= 0,
    count: state.entries.length,
    isReady,
    addCommand,
    navigatePrevious,
    navigateNext,
    resetNavigation,
    search,
    getRecent,
    clearHistory,
    formatHistoryDisplay,
  };
}
