/**
 * useAutoSave Hook
 * 
 * Automatically saves data at regular intervals to prevent data loss.
 * Features:
 * - Configurable save interval (default 30 seconds)
 * - Debounced saves on data changes
 * - Save status indicator
 * - Manual save trigger
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveOptions {
  /** Storage key for the data */
  storageKey: string;
  /** Interval in milliseconds between auto-saves (default: 30000 = 30 seconds) */
  interval?: number;
  /** Debounce delay for saves triggered by data changes (default: 2000 = 2 seconds) */
  debounceDelay?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save completes */
  onSave?: (success: boolean) => void;
  /** Callback when data is loaded */
  onLoad?: (data: unknown) => void;
}

export interface AutoSaveResult<T> {
  /** Current save status */
  status: SaveStatus;
  /** Last save timestamp */
  lastSaved: Date | null;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Manually trigger a save */
  save: () => Promise<boolean>;
  /** Mark data as changed (triggers debounced save) */
  markChanged: () => void;
  /** Load data from storage */
  load: () => Promise<T | null>;
  /** Clear saved data */
  clear: () => Promise<void>;
}

/**
 * Hook for auto-saving data to AsyncStorage
 */
export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions
): AutoSaveResult<T> {
  const {
    storageKey,
    interval = 30000, // 30 seconds
    debounceDelay = 2000, // 2 seconds
    enabled = true,
    onSave,
    onLoad,
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const dataRef = useRef(data);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Keep data ref updated
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, []);

  /**
   * Save data to AsyncStorage
   */
  const save = useCallback(async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;
    
    try {
      setStatus('saving');
      
      const saveData = {
        data: dataRef.current,
        timestamp: new Date().toISOString(),
        version: 1,
      };
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(saveData));
      
      if (isMountedRef.current) {
        setStatus('saved');
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        onSave?.(true);
        
        // Reset status after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus('idle');
          }
        }, 2000);
      }
      
      return true;
    } catch (error) {
      console.error('[AutoSave] Save failed:', error);
      if (isMountedRef.current) {
        setStatus('error');
        onSave?.(false);
      }
      return false;
    }
  }, [storageKey, onSave]);

  /**
   * Load data from AsyncStorage
   */
  const load = useCallback(async (): Promise<T | null> => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      const loadedData = parsed.data as T;
      
      if (parsed.timestamp) {
        setLastSaved(new Date(parsed.timestamp));
      }
      
      onLoad?.(loadedData);
      return loadedData;
    } catch (error) {
      console.error('[AutoSave] Load failed:', error);
      return null;
    }
  }, [storageKey, onLoad]);

  /**
   * Clear saved data
   */
  const clear = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(storageKey);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      setStatus('idle');
    } catch (error) {
      console.error('[AutoSave] Clear failed:', error);
    }
  }, [storageKey]);

  /**
   * Mark data as changed (triggers debounced save)
   */
  const markChanged = useCallback(() => {
    setHasUnsavedChanges(true);
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new debounce timer
    if (enabled) {
      debounceTimerRef.current = setTimeout(() => {
        save();
      }, debounceDelay);
    }
  }, [enabled, debounceDelay, save]);

  // Set up interval auto-save
  useEffect(() => {
    if (!enabled) {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
      return;
    }

    intervalTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        save();
      }
    }, interval);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [enabled, interval, hasUnsavedChanges, save]);

  return {
    status,
    lastSaved,
    hasUnsavedChanges,
    save,
    markChanged,
    load,
    clear,
  };
}

/**
 * Format last saved time for display
 */
export function formatLastSaved(date: Date | null): string {
  if (!date) return 'Never saved';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  
  return date.toLocaleDateString();
}

/**
 * Get status display text
 */
export function getStatusText(status: SaveStatus): string {
  switch (status) {
    case 'saving': return 'Saving...';
    case 'saved': return 'Saved ✓';
    case 'error': return 'Save failed';
    default: return '';
  }
}

/**
 * Get status color
 */
export function getStatusColor(status: SaveStatus, colors: { success: string; error: string; muted: string }): string {
  switch (status) {
    case 'saving': return colors.muted;
    case 'saved': return colors.success;
    case 'error': return colors.error;
    default: return colors.muted;
  }
}

export default useAutoSave;
