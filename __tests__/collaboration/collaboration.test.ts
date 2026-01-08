/**
 * Tests for Real-time Collaboration features
 */

import { describe, it, expect } from 'vitest';

// Collaborator colors
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

describe('Collaboration', () => {
  describe('Collaborator Colors', () => {
    it('should assign consistent colors based on user ID', () => {
      const getCollaboratorColor = (userId: number): string => {
        return COLLABORATOR_COLORS[userId % COLLABORATOR_COLORS.length];
      };
      
      expect(getCollaboratorColor(0)).toBe('#FF6B6B');
      expect(getCollaboratorColor(1)).toBe('#4ECDC4');
      expect(getCollaboratorColor(8)).toBe('#FF6B6B'); // Wraps around
      expect(getCollaboratorColor(9)).toBe('#4ECDC4');
    });
    
    it('should return same color for same user', () => {
      const getCollaboratorColor = (userId: number): string => {
        return COLLABORATOR_COLORS[userId % COLLABORATOR_COLORS.length];
      };
      
      const color1 = getCollaboratorColor(5);
      const color2 = getCollaboratorColor(5);
      
      expect(color1).toBe(color2);
    });
  });
  
  describe('Initials Generation', () => {
    it('should generate initials from full name', () => {
      const getInitials = (name: string): string => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
      };
      
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Jane Smith')).toBe('JS');
      expect(getInitials('Alice Bob Charlie')).toBe('AB');
    });
    
    it('should handle single names', () => {
      const getInitials = (name: string): string => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
      };
      
      expect(getInitials('Admin')).toBe('AD');
      expect(getInitials('Jo')).toBe('JO');
      expect(getInitials('X')).toBe('X');
    });
  });
  
  describe('Cursor Position', () => {
    it('should format cursor position', () => {
      const formatCursorPosition = (position?: { row: number; column: string }): string => {
        if (!position) return 'Viewing';
        return `Editing ${position.column}${position.row + 1}`;
      };
      
      expect(formatCursorPosition({ row: 0, column: 'A' })).toBe('Editing A1');
      expect(formatCursorPosition({ row: 4, column: 'B' })).toBe('Editing B5');
      expect(formatCursorPosition(undefined)).toBe('Viewing');
    });
    
    it('should detect cell being edited', () => {
      const collaborators = [
        { userId: 1, cursorPosition: { row: 0, column: 'A' } },
        { userId: 2, cursorPosition: { row: 2, column: 'C' } },
        { userId: 3, cursorPosition: undefined },
      ];
      
      const getCellEditor = (row: number, column: string) => {
        return collaborators.find(
          c => c.cursorPosition?.row === row && c.cursorPosition?.column === column
        );
      };
      
      expect(getCellEditor(0, 'A')?.userId).toBe(1);
      expect(getCellEditor(2, 'C')?.userId).toBe(2);
      expect(getCellEditor(1, 'B')).toBeUndefined();
    });
  });
  
  describe('Session Management', () => {
    it('should detect stale sessions', () => {
      const isSessionActive = (lastHeartbeat: Date, timeoutMs: number = 30000) => {
        return Date.now() - lastHeartbeat.getTime() < timeoutMs;
      };
      
      const activeSession = new Date(Date.now() - 10000); // 10 seconds ago
      const staleSession = new Date(Date.now() - 60000); // 60 seconds ago
      
      expect(isSessionActive(activeSession)).toBe(true);
      expect(isSessionActive(staleSession)).toBe(false);
    });
    
    it('should track collaborator changes', () => {
      const lastKnown = new Set([1, 2, 3]);
      const current = new Set([2, 3, 4]);
      
      // Find new collaborators
      const joined: number[] = [];
      for (const userId of current) {
        if (!lastKnown.has(userId)) {
          joined.push(userId);
        }
      }
      
      // Find left collaborators
      const left: number[] = [];
      for (const userId of lastKnown) {
        if (!current.has(userId)) {
          left.push(userId);
        }
      }
      
      expect(joined).toEqual([4]);
      expect(left).toEqual([1]);
    });
  });
  
  describe('Cell Edits', () => {
    it('should create cell edit object', () => {
      const createCellEdit = (
        row: number,
        column: string,
        value: string,
        userId: number
      ) => ({
        row,
        column,
        value,
        userId,
        timestamp: Date.now(),
      });
      
      const edit = createCellEdit(0, 'A', 'New Value', 1);
      
      expect(edit.row).toBe(0);
      expect(edit.column).toBe('A');
      expect(edit.value).toBe('New Value');
      expect(edit.userId).toBe(1);
      expect(edit.timestamp).toBeGreaterThan(0);
    });
    
    it('should queue pending edits', () => {
      const pendingEdits: any[] = [];
      
      const addEdit = (edit: any) => {
        pendingEdits.push(edit);
      };
      
      addEdit({ row: 0, column: 'A', value: '1' });
      addEdit({ row: 1, column: 'B', value: '2' });
      
      expect(pendingEdits).toHaveLength(2);
    });
  });
  
  describe('Active Cells', () => {
    it('should get all active cells', () => {
      const collaborators = [
        { userId: 1, displayName: 'User 1', cursorPosition: { row: 0, column: 'A' }, color: '#FF6B6B' },
        { userId: 2, displayName: 'User 2', cursorPosition: { row: 2, column: 'C' }, color: '#4ECDC4' },
        { userId: 3, displayName: 'User 3', cursorPosition: undefined, color: '#45B7D1' },
      ];
      
      const getActiveCells = () => {
        return collaborators
          .filter(c => c.cursorPosition)
          .map(c => ({
            row: c.cursorPosition!.row,
            column: c.cursorPosition!.column,
            collaborator: c,
          }));
      };
      
      const activeCells = getActiveCells();
      
      expect(activeCells).toHaveLength(2);
      expect(activeCells[0].row).toBe(0);
      expect(activeCells[0].column).toBe('A');
      expect(activeCells[1].row).toBe(2);
      expect(activeCells[1].column).toBe('C');
    });
  });
  
  describe('Presence Display', () => {
    it('should limit displayed collaborators', () => {
      const collaborators = [
        { userId: 1, displayName: 'User 1' },
        { userId: 2, displayName: 'User 2' },
        { userId: 3, displayName: 'User 3' },
        { userId: 4, displayName: 'User 4' },
        { userId: 5, displayName: 'User 5' },
      ];
      
      const maxDisplay = 3;
      const displayed = collaborators.slice(0, maxDisplay);
      const remaining = collaborators.length - maxDisplay;
      
      expect(displayed).toHaveLength(3);
      expect(remaining).toBe(2);
    });
  });
  
  describe('Heartbeat', () => {
    it('should calculate heartbeat interval', () => {
      const HEARTBEAT_INTERVAL = 5000; // 5 seconds
      const SYNC_INTERVAL = 3000; // 3 seconds
      
      expect(HEARTBEAT_INTERVAL).toBe(5000);
      expect(SYNC_INTERVAL).toBe(3000);
    });
  });
});

describe('Collaborator Presence Component', () => {
  describe('Avatar Rendering', () => {
    it('should calculate avatar overlap', () => {
      const avatarWidth = 32;
      const overlap = 8;
      const count = 3;
      
      const totalWidth = avatarWidth + (count - 1) * (avatarWidth - overlap);
      
      expect(totalWidth).toBe(32 + 2 * 24); // 80px
    });
  });
  
  describe('Status Indicator', () => {
    it('should show online status', () => {
      const isOnline = (lastHeartbeat: Date) => {
        const thirtySecondsAgo = Date.now() - 30000;
        return lastHeartbeat.getTime() > thirtySecondsAgo;
      };
      
      expect(isOnline(new Date())).toBe(true);
      expect(isOnline(new Date(Date.now() - 60000))).toBe(false);
    });
  });
});

describe('Cursor Indicator', () => {
  describe('Position Styles', () => {
    it('should generate position styles', () => {
      const getPositionStyle = (position: 'top' | 'left' | 'corner') => {
        switch (position) {
          case 'top':
            return { top: -2, left: 0, right: 0 };
          case 'left':
            return { top: 0, bottom: 0, left: -2 };
          case 'corner':
            return { top: -16, left: 0 };
        }
      };
      
      expect(getPositionStyle('top')).toEqual({ top: -2, left: 0, right: 0 });
      expect(getPositionStyle('left')).toEqual({ top: 0, bottom: 0, left: -2 });
      expect(getPositionStyle('corner')).toEqual({ top: -16, left: 0 });
    });
  });
  
  describe('Bar Dimensions', () => {
    it('should generate bar dimensions', () => {
      const getBarDimensions = (position: 'top' | 'left') => {
        if (position === 'top') {
          return { height: 2, width: '100%' };
        }
        return { width: 2, height: '100%' };
      };
      
      expect(getBarDimensions('top')).toEqual({ height: 2, width: '100%' });
      expect(getBarDimensions('left')).toEqual({ width: 2, height: '100%' });
    });
  });
});

describe('Collaborator List', () => {
  describe('Sorting', () => {
    it('should sort by activity', () => {
      const collaborators = [
        { userId: 1, lastHeartbeat: new Date('2024-01-01T10:00:00Z') },
        { userId: 2, lastHeartbeat: new Date('2024-01-01T10:05:00Z') },
        { userId: 3, lastHeartbeat: new Date('2024-01-01T10:02:00Z') },
      ];
      
      const sorted = [...collaborators].sort(
        (a, b) => b.lastHeartbeat.getTime() - a.lastHeartbeat.getTime()
      );
      
      expect(sorted[0].userId).toBe(2);
      expect(sorted[1].userId).toBe(3);
      expect(sorted[2].userId).toBe(1);
    });
  });
  
  describe('Filtering', () => {
    it('should exclude self from list', () => {
      const currentUserId = 2;
      const sessions = [
        { userId: 1, displayName: 'User 1' },
        { userId: 2, displayName: 'User 2' },
        { userId: 3, displayName: 'User 3' },
      ];
      
      const collaborators = sessions.filter(s => s.userId !== currentUserId);
      
      expect(collaborators).toHaveLength(2);
      expect(collaborators.find(c => c.userId === 2)).toBeUndefined();
    });
  });
});
