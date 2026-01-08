/**
 * useHistory Hook
 * 
 * Provides undo/redo functionality with a history stack.
 * Features:
 * - Configurable history size limit
 * - Keyboard shortcuts support (web)
 * - History state inspection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export interface HistoryState<T> {
  /** Current state */
  current: T;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Number of undo steps available */
  undoCount: number;
  /** Number of redo steps available */
  redoCount: number;
}

export interface HistoryActions<T> {
  /** Set new state and add to history */
  set: (newState: T) => void;
  /** Undo to previous state */
  undo: () => void;
  /** Redo to next state */
  redo: () => void;
  /** Clear all history */
  clear: () => void;
  /** Reset to initial state */
  reset: (initialState: T) => void;
  /** Get current history for debugging */
  getHistory: () => { past: T[]; future: T[] };
}

export interface UseHistoryOptions {
  /** Maximum number of history entries (default: 50) */
  maxHistory?: number;
  /** Enable keyboard shortcuts on web (default: true) */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Hook for managing undo/redo history
 */
export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
): [HistoryState<T>, HistoryActions<T>] {
  const {
    maxHistory = 50,
    enableKeyboardShortcuts = true,
  } = options;

  const [current, setCurrent] = useState<T>(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, forceUpdate] = useState({});

  /**
   * Set new state and add current to history
   */
  const set = useCallback((newState: T) => {
    // Add current state to past
    pastRef.current = [...pastRef.current, current].slice(-maxHistory);
    // Clear future (new branch)
    futureRef.current = [];
    // Set new current
    setCurrent(newState);
    forceUpdate({});
  }, [current, maxHistory]);

  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    
    // Get previous state
    const previous = pastRef.current[pastRef.current.length - 1];
    // Remove from past
    pastRef.current = pastRef.current.slice(0, -1);
    // Add current to future
    futureRef.current = [current, ...futureRef.current];
    // Set previous as current
    setCurrent(previous);
    forceUpdate({});
  }, [current]);

  /**
   * Redo to next state
   */
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    
    // Get next state
    const next = futureRef.current[0];
    // Remove from future
    futureRef.current = futureRef.current.slice(1);
    // Add current to past
    pastRef.current = [...pastRef.current, current];
    // Set next as current
    setCurrent(next);
    forceUpdate({});
  }, [current]);

  /**
   * Clear all history
   */
  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    forceUpdate({});
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback((newInitialState: T) => {
    pastRef.current = [];
    futureRef.current = [];
    setCurrent(newInitialState);
    forceUpdate({});
  }, []);

  /**
   * Get current history for debugging
   */
  const getHistory = useCallback(() => ({
    past: [...pastRef.current],
    future: [...futureRef.current],
  }), []);

  // Keyboard shortcuts (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || !enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y = Redo
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, undo, redo]);

  const state: HistoryState<T> = {
    current,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    undoCount: pastRef.current.length,
    redoCount: futureRef.current.length,
  };

  const actions: HistoryActions<T> = {
    set,
    undo,
    redo,
    clear,
    reset,
    getHistory,
  };

  return [state, actions];
}

/**
 * Hook for managing spreadsheet-specific history with row/cell granularity
 */
export interface SpreadsheetHistoryEntry {
  type: 'cell' | 'row_add' | 'row_delete' | 'column_add' | 'column_delete' | 'bulk';
  timestamp: number;
  description: string;
  data: unknown;
}

export function useSpreadsheetHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
) {
  const [state, actions] = useHistory<T>(initialState, options);
  const entriesRef = useRef<SpreadsheetHistoryEntry[]>([]);

  /**
   * Record a cell edit
   */
  const recordCellEdit = useCallback((
    rowIndex: number,
    columnKey: string,
    oldValue: unknown,
    newValue: unknown,
    newState: T
  ) => {
    entriesRef.current.push({
      type: 'cell',
      timestamp: Date.now(),
      description: `Edit cell [${rowIndex}][${columnKey}]: ${oldValue} → ${newValue}`,
      data: { rowIndex, columnKey, oldValue, newValue },
    });
    actions.set(newState);
  }, [actions]);

  /**
   * Record a row addition
   */
  const recordRowAdd = useCallback((rowIndex: number, newState: T) => {
    entriesRef.current.push({
      type: 'row_add',
      timestamp: Date.now(),
      description: `Add row at index ${rowIndex}`,
      data: { rowIndex },
    });
    actions.set(newState);
  }, [actions]);

  /**
   * Record a row deletion
   */
  const recordRowDelete = useCallback((rowIndex: number, deletedRow: unknown, newState: T) => {
    entriesRef.current.push({
      type: 'row_delete',
      timestamp: Date.now(),
      description: `Delete row at index ${rowIndex}`,
      data: { rowIndex, deletedRow },
    });
    actions.set(newState);
  }, [actions]);

  /**
   * Record a bulk operation
   */
  const recordBulkEdit = useCallback((description: string, newState: T) => {
    entriesRef.current.push({
      type: 'bulk',
      timestamp: Date.now(),
      description,
      data: null,
    });
    actions.set(newState);
  }, [actions]);

  /**
   * Get recent history entries
   */
  const getRecentEntries = useCallback((count: number = 10): SpreadsheetHistoryEntry[] => {
    return entriesRef.current.slice(-count);
  }, []);

  return {
    state,
    actions,
    recordCellEdit,
    recordRowAdd,
    recordRowDelete,
    recordBulkEdit,
    getRecentEntries,
  };
}

export default useHistory;
