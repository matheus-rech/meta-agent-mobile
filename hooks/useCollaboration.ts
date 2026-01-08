/**
 * useCollaboration Hook
 * 
 * Manages real-time collaborative editing for spreadsheets.
 * Uses polling-based approach for cross-device sync with presence awareness.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from './use-auth';

// Polling interval for real-time updates (in milliseconds)
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const SYNC_INTERVAL = 3000; // 3 seconds

export interface Collaborator {
  id: number;
  userId: number;
  displayName: string;
  cursorPosition?: {
    row: number;
    column: string;
  };
  lastHeartbeat: Date;
  color: string;
}

export interface CellEdit {
  row: number;
  column: string;
  value: string;
  userId: number;
  timestamp: number;
}

// Generate consistent colors for collaborators
const COLLABORATOR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

function getCollaboratorColor(userId: number): string {
  return COLLABORATOR_COLORS[userId % COLLABORATOR_COLORS.length];
}

interface UseCollaborationOptions {
  spreadsheetId: number;
  onRemoteEdit?: (edit: CellEdit) => void;
  onCollaboratorJoin?: (collaborator: Collaborator) => void;
  onCollaboratorLeave?: (userId: number) => void;
}

export function useCollaboration({
  spreadsheetId,
  onRemoteEdit,
  onCollaboratorJoin,
  onCollaboratorLeave,
}: UseCollaborationOptions) {
  const { user, isAuthenticated } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [pendingEdits, setPendingEdits] = useState<CellEdit[]>([]);
  
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKnownCollaboratorsRef = useRef<Set<number>>(new Set());
  
  // tRPC mutations
  const registerSessionMutation = trpc.sync.sessions.register.useMutation();
  const heartbeatMutation = trpc.sync.sessions.heartbeat.useMutation();
  const leaveSessionMutation = trpc.sync.sessions.leave.useMutation();
  
  // tRPC queries
  const sessionsQuery = trpc.sync.sessions.list.useQuery(
    { spreadsheetId },
    {
      enabled: isAuthenticated && spreadsheetId > 0,
      refetchInterval: SYNC_INTERVAL,
    }
  );
  
  /**
   * Join the collaborative session
   */
  const joinSession = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const result = await registerSessionMutation.mutateAsync({
        spreadsheetId,
        displayName: user.name || 'Anonymous',
      });
      
      setSessionId(result.sessionId);
      setIsConnected(true);
      
      console.log('[Collaboration] Joined session:', result.sessionId);
    } catch (error) {
      console.error('[Collaboration] Failed to join session:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, user, spreadsheetId, registerSessionMutation]);
  
  /**
   * Leave the collaborative session
   */
  const leaveSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await leaveSessionMutation.mutateAsync({ sessionId });
      setSessionId(null);
      setIsConnected(false);
      console.log('[Collaboration] Left session');
    } catch (error) {
      console.error('[Collaboration] Failed to leave session:', error);
    }
  }, [sessionId, leaveSessionMutation]);
  
  /**
   * Send heartbeat with cursor position
   */
  const sendHeartbeat = useCallback(async (cursorPosition?: { row: number; column: string }) => {
    if (!sessionId) return;
    
    try {
      await heartbeatMutation.mutateAsync({
        sessionId,
        cursorPosition,
      });
    } catch (error) {
      console.error('[Collaboration] Heartbeat failed:', error);
      // Try to reconnect
      setIsConnected(false);
      joinSession();
    }
  }, [sessionId, heartbeatMutation, joinSession]);
  
  /**
   * Update cursor position
   */
  const updateCursor = useCallback((row: number, column: string) => {
    sendHeartbeat({ row, column });
  }, [sendHeartbeat]);
  
  /**
   * Broadcast a cell edit to other collaborators
   */
  const broadcastEdit = useCallback((row: number, column: string, value: string) => {
    if (!user) return;
    
    const edit: CellEdit = {
      row,
      column,
      value,
      userId: user.id,
      timestamp: Date.now(),
    };
    
    // Add to pending edits for sync
    setPendingEdits(prev => [...prev, edit]);
  }, [user]);
  
  /**
   * Process active sessions and detect changes
   */
  useEffect(() => {
    if (!sessionsQuery.data?.sessions) return;
    
    const sessions = sessionsQuery.data.sessions;
    const currentCollaboratorIds = new Set(sessions.map((s: any) => s.userId));
    
    // Convert sessions to collaborators
    const newCollaborators: Collaborator[] = sessions
      .filter((s: any) => s.userId !== user?.id) // Exclude self
      .map((s: any) => ({
        id: s.id,
        userId: s.userId,
        displayName: s.displayName || 'Anonymous',
        cursorPosition: s.cursorPosition as { row: number; column: string } | undefined,
        lastHeartbeat: new Date(s.lastHeartbeat),
        color: getCollaboratorColor(s.userId),
      }));
    
    // Detect new collaborators
    for (const session of sessions) {
      if (!lastKnownCollaboratorsRef.current.has(session.userId) && session.userId !== user?.id) {
        const collaborator = newCollaborators.find(c => c.userId === session.userId);
        if (collaborator && onCollaboratorJoin) {
          onCollaboratorJoin(collaborator);
        }
      }
    }
    
    // Detect left collaborators
    for (const userId of lastKnownCollaboratorsRef.current) {
      if (!currentCollaboratorIds.has(userId) && onCollaboratorLeave) {
        onCollaboratorLeave(userId);
      }
    }
    
    lastKnownCollaboratorsRef.current = currentCollaboratorIds;
    setCollaborators(newCollaborators);
  }, [sessionsQuery.data, user?.id, onCollaboratorJoin, onCollaboratorLeave]);
  
  // Join session on mount
  useEffect(() => {
    if (isAuthenticated && spreadsheetId > 0) {
      joinSession();
    }
    
    return () => {
      leaveSession();
    };
  }, [isAuthenticated, spreadsheetId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Start heartbeat interval
  useEffect(() => {
    if (isConnected && sessionId) {
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat();
      }, HEARTBEAT_INTERVAL);
    }
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [isConnected, sessionId, sendHeartbeat]);
  
  /**
   * Get collaborator by user ID
   */
  const getCollaborator = useCallback((userId: number): Collaborator | undefined => {
    return collaborators.find(c => c.userId === userId);
  }, [collaborators]);
  
  /**
   * Check if a cell is being edited by another collaborator
   */
  const getCellEditor = useCallback((row: number, column: string): Collaborator | undefined => {
    return collaborators.find(
      c => c.cursorPosition?.row === row && c.cursorPosition?.column === column
    );
  }, [collaborators]);
  
  /**
   * Get all cells currently being edited
   */
  const getActiveCells = useCallback((): Array<{ row: number; column: string; collaborator: Collaborator }> => {
    return collaborators
      .filter(c => c.cursorPosition)
      .map(c => ({
        row: c.cursorPosition!.row,
        column: c.cursorPosition!.column,
        collaborator: c,
      }));
  }, [collaborators]);
  
  return {
    // State
    collaborators,
    isConnected,
    sessionId,
    
    // Actions
    joinSession,
    leaveSession,
    updateCursor,
    broadcastEdit,
    
    // Helpers
    getCollaborator,
    getCellEditor,
    getActiveCells,
    
    // Colors
    getCollaboratorColor,
  };
}

export default useCollaboration;
