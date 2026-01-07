/**
 * Command History Service
 * 
 * Persists command history to AsyncStorage for cross-session access.
 * Provides navigation, search, and management of command history.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@meta_agent/command_history';
const MAX_HISTORY_SIZE = 100;

export interface CommandHistoryEntry {
  command: string;
  timestamp: number;
  sessionId?: string;
}

export interface CommandHistoryState {
  entries: CommandHistoryEntry[];
  currentIndex: number; // -1 means not navigating history
}

type HistoryListener = (state: CommandHistoryState) => void;

class CommandHistoryService {
  private entries: CommandHistoryEntry[] = [];
  private currentIndex: number = -1;
  private listeners: Set<HistoryListener> = new Set();
  private initialized: boolean = false;
  private pendingCommand: string = ''; // Stores current input when navigating

  /**
   * Initialize the service by loading history from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.entries = Array.isArray(parsed) ? parsed : [];
      }
      this.initialized = true;
    } catch (error) {
      console.error('[CommandHistory] Failed to load history:', error);
      this.entries = [];
      this.initialized = true;
    }
  }

  /**
   * Add a command to history
   */
  async addCommand(command: string, sessionId?: string): Promise<void> {
    await this.initialize();
    
    const trimmed = command.trim();
    if (!trimmed) return;
    
    // Skip if it's the same as the last command (deduplication)
    if (this.entries.length > 0 && this.entries[0].command === trimmed) {
      return;
    }
    
    // Skip commands that start with certain prefixes (e.g., passwords)
    if (trimmed.startsWith('/secret') || trimmed.startsWith('/password')) {
      return;
    }
    
    const entry: CommandHistoryEntry = {
      command: trimmed,
      timestamp: Date.now(),
      sessionId,
    };
    
    // Add to front of array (most recent first)
    this.entries.unshift(entry);
    
    // Trim to max size
    if (this.entries.length > MAX_HISTORY_SIZE) {
      this.entries = this.entries.slice(0, MAX_HISTORY_SIZE);
    }
    
    // Reset navigation index
    this.currentIndex = -1;
    this.pendingCommand = '';
    
    // Persist to storage
    await this.persist();
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Navigate to previous command (older)
   */
  navigatePrevious(currentInput: string): string | null {
    if (this.entries.length === 0) return null;
    
    // Store current input when starting navigation
    if (this.currentIndex === -1) {
      this.pendingCommand = currentInput;
    }
    
    // Move to previous (older) command
    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++;
      this.notifyListeners();
      return this.entries[this.currentIndex].command;
    }
    
    return null; // Already at oldest
  }

  /**
   * Navigate to next command (newer)
   */
  navigateNext(): string | null {
    if (this.currentIndex <= -1) return null;
    
    this.currentIndex--;
    this.notifyListeners();
    
    if (this.currentIndex === -1) {
      // Return to pending command
      return this.pendingCommand;
    }
    
    return this.entries[this.currentIndex].command;
  }

  /**
   * Reset navigation state
   */
  resetNavigation(): void {
    this.currentIndex = -1;
    this.pendingCommand = '';
    this.notifyListeners();
  }

  /**
   * Search history for commands matching a query
   */
  search(query: string, limit: number = 10): CommandHistoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries
      .filter(entry => entry.command.toLowerCase().includes(lowerQuery))
      .slice(0, limit);
  }

  /**
   * Get recent commands
   */
  getRecent(limit: number = 20): CommandHistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  /**
   * Get all history entries
   */
  getAll(): CommandHistoryEntry[] {
    return [...this.entries];
  }

  /**
   * Get current navigation state
   */
  getState(): CommandHistoryState {
    return {
      entries: [...this.entries],
      currentIndex: this.currentIndex,
    };
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    this.entries = [];
    this.currentIndex = -1;
    this.pendingCommand = '';
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Remove a specific entry by index
   */
  async removeEntry(index: number): Promise<void> {
    if (index >= 0 && index < this.entries.length) {
      this.entries.splice(index, 1);
      await this.persist();
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get history size
   */
  get size(): number {
    return this.entries.length;
  }

  /**
   * Check if currently navigating history
   */
  get isNavigating(): boolean {
    return this.currentIndex >= 0;
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.error('[CommandHistory] Failed to persist history:', error);
    }
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

// Export singleton instance
export const commandHistory = new CommandHistoryService();

// Export class for testing
export { CommandHistoryService };
