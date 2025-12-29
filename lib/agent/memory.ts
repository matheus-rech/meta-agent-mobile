/**
 * Memory System
 * Manages conversation history and session state
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, SessionState } from "./types";

const STORAGE_KEYS = {
  MESSAGES: "agent_messages",
  SESSION: "agent_session",
  HISTORY: "command_history",
};

const MAX_MESSAGES = 100;
const MAX_HISTORY = 500;

export class Memory {
  private messages: Message[] = [];
  private commandHistory: string[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Load memory from persistent storage
   */
  async load(): Promise<void> {
    try {
      const [messagesJson, historyJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
      ]);

      if (messagesJson) {
        this.messages = JSON.parse(messagesJson);
      }

      if (historyJson) {
        this.commandHistory = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error("Failed to load memory:", error);
      this.messages = [];
      this.commandHistory = [];
    }
  }

  /**
   * Save memory to persistent storage
   */
  async save(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messages)),
        AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.commandHistory)),
      ]);
    } catch (error) {
      console.error("Failed to save memory:", error);
    }
  }

  /**
   * Add a message to conversation history
   */
  addMessage(message: Omit<Message, "timestamp">): Message {
    const fullMessage: Message = {
      ...message,
      timestamp: Date.now(),
    };

    this.messages.push(fullMessage);

    // Trim to max messages
    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }

    // Auto-save
    this.save();

    return fullMessage;
  }

  /**
   * Add a command to history
   */
  addToHistory(command: string): void {
    // Avoid duplicates at the end
    if (this.commandHistory[this.commandHistory.length - 1] !== command) {
      this.commandHistory.push(command);
    }

    // Trim to max history
    if (this.commandHistory.length > MAX_HISTORY) {
      this.commandHistory = this.commandHistory.slice(-MAX_HISTORY);
    }

    this.save();
  }

  /**
   * Get conversation history
   */
  getMessages(limit?: number): Message[] {
    const n = limit || MAX_MESSAGES;
    return this.messages.slice(-n);
  }

  /**
   * Get messages formatted for AI API
   */
  getFormattedHistory(limit: number = 20): { role: "user" | "assistant"; content: string }[] {
    return this.messages
      .filter((m) => m.role !== "system")
      .slice(-limit)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }

  /**
   * Get command history
   */
  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  /**
   * Search command history
   */
  searchHistory(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    return this.commandHistory.filter((cmd) =>
      cmd.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messages = [];
    this.save();
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory = [];
    this.save();
  }

  /**
   * Clear everything
   */
  async clearAll(): Promise<void> {
    this.messages = [];
    this.commandHistory = [];
    this.sessionId = this.generateSessionId();
    
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES),
      AsyncStorage.removeItem(STORAGE_KEYS.HISTORY),
      AsyncStorage.removeItem(STORAGE_KEYS.SESSION),
    ]);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get session state
   */
  getState(): SessionState {
    return {
      id: this.sessionId,
      messages: this.messages,
      isThinking: false,
      lastActivity: Date.now(),
    };
  }

  /**
   * Get summary of recent activity
   */
  getSummary(): string {
    const recent = this.messages.slice(-10);
    const topics = new Set<string>();

    for (const msg of recent) {
      const words = msg.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 6) {
          topics.add(word);
        }
      }
    }

    return `Recent topics: ${Array.from(topics).slice(0, 10).join(", ")}`;
  }
}

// Singleton instance
let memoryInstance: Memory | null = null;

export function getMemory(): Memory {
  if (!memoryInstance) {
    memoryInstance = new Memory();
  }
  return memoryInstance;
}

export async function initializeMemory(): Promise<Memory> {
  const memory = getMemory();
  await memory.load();
  return memory;
}
