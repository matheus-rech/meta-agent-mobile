/**
 * useCloudSync Hook
 * 
 * Manages cloud synchronization of spreadsheets and learning progress.
 * Handles offline mode, conflict resolution, and real-time collaboration.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';
import { useAuth } from './use-auth';
import type { SpreadsheetData } from '@/components/spreadsheet/SpreadsheetEditor';

// Storage keys
const STORAGE_KEYS = {
  SPREADSHEETS: 'cloud_sync_spreadsheets',
  PROGRESS: 'cloud_sync_progress',
  LAST_SYNC: 'cloud_sync_last_sync',
  PENDING_CHANGES: 'cloud_sync_pending_changes',
};

interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingChanges: number;
  error: string | null;
}

interface CloudSpreadsheet extends SpreadsheetData {
  id?: number;
  shareId?: string;
  version?: number;
  isPublic?: boolean;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'spreadsheet' | 'progress';
  data: any;
  timestamp: number;
}

export function useCloudSync() {
  const { user, isAuthenticated } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncedAt: null,
    pendingChanges: 0,
    error: null,
  });
  
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // tRPC mutations
  const createSpreadsheetMutation = trpc.sync.spreadsheets.create.useMutation();
  const updateSpreadsheetMutation = trpc.sync.spreadsheets.update.useMutation();
  const deleteSpreadsheetMutation = trpc.sync.spreadsheets.delete.useMutation();
  const syncProgressMutation = trpc.sync.progress.sync.useMutation();
  
  // tRPC queries
  const spreadsheetsQuery = trpc.sync.spreadsheets.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
  
  const progressQuery = trpc.sync.progress.get.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
  
  /**
   * Load pending changes from storage
   */
  const loadPendingChanges = useCallback(async (): Promise<PendingChange[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHANGES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[CloudSync] Failed to load pending changes:', error);
      return [];
    }
  }, []);
  
  /**
   * Save pending changes to storage
   */
  const savePendingChanges = useCallback(async (changes: PendingChange[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(changes));
      setSyncState(prev => ({ ...prev, pendingChanges: changes.length }));
    } catch (error) {
      console.error('[CloudSync] Failed to save pending changes:', error);
    }
  }, []);
  
  /**
   * Add a pending change
   */
  const addPendingChange = useCallback(async (change: Omit<PendingChange, 'id' | 'timestamp'>) => {
    const changes = await loadPendingChanges();
    const newChange: PendingChange = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    changes.push(newChange);
    await savePendingChanges(changes);
    return newChange.id;
  }, [loadPendingChanges, savePendingChanges]);
  
  /**
   * Process pending changes
   */
  const processPendingChanges = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const changes = await loadPendingChanges();
    if (changes.length === 0) return;
    
    const processedIds: string[] = [];
    
    for (const change of changes) {
      try {
        if (change.entityType === 'spreadsheet') {
          if (change.type === 'create') {
            await createSpreadsheetMutation.mutateAsync(change.data);
          } else if (change.type === 'update') {
            await updateSpreadsheetMutation.mutateAsync(change.data);
          } else if (change.type === 'delete') {
            await deleteSpreadsheetMutation.mutateAsync(change.data);
          }
        } else if (change.entityType === 'progress') {
          // Progress is synced separately
        }
        
        processedIds.push(change.id);
      } catch (error) {
        console.error('[CloudSync] Failed to process change:', change.id, error);
        // Keep failed changes for retry
      }
    }
    
    // Remove processed changes
    const remainingChanges = changes.filter(c => !processedIds.includes(c.id));
    await savePendingChanges(remainingChanges);
  }, [
    isAuthenticated,
    loadPendingChanges,
    savePendingChanges,
    createSpreadsheetMutation,
    updateSpreadsheetMutation,
    deleteSpreadsheetMutation,
  ]);
  
  /**
   * Sync spreadsheet to cloud
   */
  const syncSpreadsheet = useCallback(async (
    spreadsheet: CloudSpreadsheet,
    action: 'create' | 'update' | 'delete'
  ) => {
    if (!isAuthenticated) {
      // Queue for later sync
      await addPendingChange({
        type: action,
        entityType: 'spreadsheet',
        data: spreadsheet,
      });
      return { success: true, queued: true };
    }
    
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
      
      if (action === 'create') {
        const result = await createSpreadsheetMutation.mutateAsync({
          name: spreadsheet.name,
          columns: spreadsheet.columns,
          rows: spreadsheet.rows,
          templateType: (spreadsheet as any).templateType,
        });
        return { ...result, synced: true };
      } else if (action === 'update' && spreadsheet.id) {
        const result = await updateSpreadsheetMutation.mutateAsync({
          id: spreadsheet.id,
          name: spreadsheet.name,
          columns: spreadsheet.columns,
          rows: spreadsheet.rows,
          isPublic: spreadsheet.isPublic,
        });
        return { ...result, synced: true };
      } else if (action === 'delete' && spreadsheet.id) {
        await deleteSpreadsheetMutation.mutateAsync({ id: spreadsheet.id });
        return { success: true };
      }
      
      return { success: false, error: 'Invalid action' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncState(prev => ({ ...prev, error: errorMessage }));
      
      // Queue for retry
      await addPendingChange({
        type: action,
        entityType: 'spreadsheet',
        data: spreadsheet,
      });
      
      return { success: false, error: errorMessage, queued: true };
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [
    isAuthenticated,
    addPendingChange,
    createSpreadsheetMutation,
    updateSpreadsheetMutation,
    deleteSpreadsheetMutation,
  ]);
  
  /**
   * Sync learning progress to cloud
   */
  const syncProgress = useCallback(async (progress: {
    tutorialProgress?: object;
    completedTutorials?: string[];
    badges?: string[];
    quizData?: object;
    streakData?: object;
    totalLearningTime?: number;
  }) => {
    if (!isAuthenticated) {
      // Store locally for later sync
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
      return { success: true, queued: true };
    }
    
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
      
      const lastSyncStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : new Date(0);
      
      const result = await syncProgressMutation.mutateAsync({
        deviceProgress: progress,
        deviceLastSync: lastSync.toISOString(),
      });
      
      // Update last sync time
      const now = new Date();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
      setSyncState(prev => ({ ...prev, lastSyncedAt: now }));
      
      return { success: true, progress: result.progress };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [isAuthenticated, syncProgressMutation]);
  
  /**
   * Full sync - sync all pending changes and fetch latest data
   */
  const fullSync = useCallback(async () => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
      
      // Process pending changes first
      await processPendingChanges();
      
      // Refetch data
      await spreadsheetsQuery.refetch();
      await progressQuery.refetch();
      
      // Update last sync time
      const now = new Date();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
      setSyncState(prev => ({ ...prev, lastSyncedAt: now }));
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [isAuthenticated, processPendingChanges, spreadsheetsQuery, progressQuery]);
  
  /**
   * Get cloud spreadsheets
   */
  const getCloudSpreadsheets = useCallback(() => {
    if (!spreadsheetsQuery.data) return { owned: [], collaborated: [] };
    const data = spreadsheetsQuery.data as { owned?: any[]; collaborated?: any[]; success: boolean };
    return {
      owned: data.owned || [],
      collaborated: data.collaborated || [],
    };
  }, [spreadsheetsQuery.data]);
  
  /**
   * Get cloud progress
   */
  const getCloudProgress = useCallback(() => {
    return progressQuery.data?.progress || null;
  }, [progressQuery.data]);
  
  // Load last sync time on mount
  useEffect(() => {
    const loadLastSync = async () => {
      const lastSyncStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSyncStr) {
        setSyncState(prev => ({ ...prev, lastSyncedAt: new Date(lastSyncStr) }));
      }
      
      const changes = await loadPendingChanges();
      setSyncState(prev => ({ ...prev, pendingChanges: changes.length }));
    };
    
    loadLastSync();
  }, [loadPendingChanges]);
  
  // Auto-sync every 5 minutes when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      syncIntervalRef.current = setInterval(() => {
        fullSync();
      }, 5 * 60 * 1000);
      
      // Initial sync
      fullSync();
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isAuthenticated, fullSync]);
  
  return {
    // State
    syncState,
    isAuthenticated,
    
    // Data
    cloudSpreadsheets: getCloudSpreadsheets(),
    cloudProgress: getCloudProgress(),
    
    // Actions
    syncSpreadsheet,
    syncProgress,
    fullSync,
    
    // Loading states
    isLoadingSpreadsheets: spreadsheetsQuery.isLoading,
    isLoadingProgress: progressQuery.isLoading,
    
    // Refetch
    refetchSpreadsheets: spreadsheetsQuery.refetch,
    refetchProgress: progressQuery.refetch,
  };
}

export default useCloudSync;
