/**
 * CollaboratorPresence Component
 * 
 * Shows active collaborators and their cursor positions in the spreadsheet.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import type { Collaborator } from '@/hooks/useCollaboration';

interface CollaboratorPresenceProps {
  collaborators: Collaborator[];
  compact?: boolean;
}

export function CollaboratorPresence({
  collaborators,
  compact = false,
}: CollaboratorPresenceProps) {
  const colors = useColors();
  
  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    avatarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: compact ? 24 : 32,
      height: compact ? 24 : 32,
      borderRadius: compact ? 12 : 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -8,
      borderWidth: 2,
      borderColor: colors.background,
    },
    avatarFirst: {
      marginLeft: 0,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: compact ? 10 : 12,
      fontWeight: 'bold',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    countBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 4,
    },
    countText: {
      fontSize: 10,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
      position: 'absolute',
      bottom: 0,
      right: 0,
      borderWidth: 1,
      borderColor: colors.background,
    },
    labelContainer: {
      marginLeft: 8,
    },
    labelText: {
      fontSize: 11,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  }), [colors, compact]);
  
  if (collaborators.length === 0) {
    return null;
  }
  
  const displayedCollaborators = collaborators.slice(0, 3);
  const remainingCount = collaborators.length - 3;
  
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.avatarContainer}>
        {displayedCollaborators.map((collaborator, index) => (
          <View
            key={collaborator.userId}
            style={[
              dynamicStyles.avatar,
              { backgroundColor: collaborator.color },
              index === 0 && dynamicStyles.avatarFirst,
            ]}
          >
            <Text style={dynamicStyles.avatarText}>
              {getInitials(collaborator.displayName)}
            </Text>
            <View style={dynamicStyles.statusDot} />
          </View>
        ))}
        
        {remainingCount > 0 && (
          <View style={dynamicStyles.countBadge}>
            <Text style={dynamicStyles.countText}>+{remainingCount}</Text>
          </View>
        )}
      </View>
      
      {!compact && (
        <View style={dynamicStyles.labelContainer}>
          <Text style={dynamicStyles.labelText}>
            {collaborators.length} editing
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * CollaboratorCursor Component
 * 
 * Shows a cursor indicator for a collaborator in a cell.
 */
interface CollaboratorCursorProps {
  collaborator: Collaborator;
  position: 'top' | 'left' | 'corner';
}

export function CollaboratorCursor({
  collaborator,
  position,
}: CollaboratorCursorProps) {
  const colors = useColors();
  
  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      position: 'absolute',
      zIndex: 100,
      ...(position === 'top' && { top: -2, left: 0, right: 0 }),
      ...(position === 'left' && { top: 0, bottom: 0, left: -2 }),
      ...(position === 'corner' && { top: -16, left: 0 }),
    },
    bar: {
      backgroundColor: collaborator.color,
      ...(position === 'top' && { height: 2, width: '100%' }),
      ...(position === 'left' && { width: 2, height: '100%' }),
    },
    label: {
      backgroundColor: collaborator.color,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 2,
    },
    labelText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  }), [collaborator.color, position]);
  
  if (position === 'corner') {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.label}>
          <Text style={dynamicStyles.labelText} numberOfLines={1}>
            {collaborator.displayName.split(' ')[0]}
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.bar} />
    </View>
  );
}

/**
 * CollaboratorList Component
 * 
 * Full list of collaborators with details.
 */
interface CollaboratorListProps {
  collaborators: Collaborator[];
}

export function CollaboratorList({ collaborators }: CollaboratorListProps) {
  const colors = useColors();
  
  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    collaboratorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    collaboratorRowLast: {
      borderBottomWidth: 0,
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    status: {
      fontSize: 10,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    emptyText: {
      fontSize: 11,
      color: colors.muted,
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  }), [colors]);
  
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  const formatCursorPosition = (position?: { row: number; column: string }): string => {
    if (!position) return 'Viewing';
    return `Editing ${position.column}${position.row + 1}`;
  };
  
  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerText}>
          👥 Collaborators ({collaborators.length})
        </Text>
      </View>
      
      {collaborators.length === 0 ? (
        <Text style={dynamicStyles.emptyText}>
          No other collaborators online
        </Text>
      ) : (
        collaborators.map((collaborator, index) => (
          <View
            key={collaborator.userId}
            style={[
              dynamicStyles.collaboratorRow,
              index === collaborators.length - 1 && dynamicStyles.collaboratorRowLast,
            ]}
          >
            <View style={[dynamicStyles.avatar, { backgroundColor: collaborator.color }]}>
              <Text style={dynamicStyles.avatarText}>
                {getInitials(collaborator.displayName)}
              </Text>
            </View>
            <View style={dynamicStyles.info}>
              <Text style={dynamicStyles.name}>{collaborator.displayName}</Text>
              <Text style={dynamicStyles.status}>
                {formatCursorPosition(collaborator.cursorPosition)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export default CollaboratorPresence;
