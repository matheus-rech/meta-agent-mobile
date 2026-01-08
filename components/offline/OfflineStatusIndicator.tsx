/**
 * OfflineStatusIndicator Component
 * 
 * Shows the current offline/WebR status in the UI.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useColors } from '../../hooks/use-colors';
import { webRService, type WebRStatus } from '../../lib/webr';

interface OfflineStatusIndicatorProps {
  compact?: boolean;
  onPress?: () => void;
}

export function OfflineStatusIndicator({
  compact = false,
  onPress,
}: OfflineStatusIndicatorProps) {
  const colors = useColors();
  const [status, setStatus] = useState<WebRStatus>(webRService.getStatus());
  const isSupported = webRService.isSupported();
  
  useEffect(() => {
    const unsubscribe = webRService.subscribe(setStatus);
    return unsubscribe;
  }, []);
  
  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        icon: '🌐',
        text: 'Online Only',
        color: colors.muted,
        description: 'WebR requires web browser',
      };
    }
    
    if (status.loading) {
      return {
        icon: '⏳',
        text: 'Loading R...',
        color: colors.warning,
        description: 'Initializing WebR engine',
      };
    }
    
    if (status.error) {
      return {
        icon: '❌',
        text: 'Error',
        color: colors.error,
        description: status.error,
      };
    }
    
    if (status.initialized) {
      return {
        icon: '✅',
        text: 'Offline Ready',
        color: colors.success,
        description: `R engine loaded (${status.packagesLoaded.join(', ')})`,
      };
    }
    
    return {
      icon: '💤',
      text: 'Offline Available',
      color: colors.primary,
      description: 'Tap to enable offline mode',
    };
  };
  
  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }
    
    if (!status.initialized && !status.loading && isSupported) {
      try {
        await webRService.initialize();
      } catch (error) {
        console.error('Failed to initialize WebR:', error);
      }
    }
  };
  
  const statusInfo = getStatusInfo();
  
  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 4 : 8,
      padding: compact ? 4 : 8,
      borderRadius: 8,
      backgroundColor: `${statusInfo.color}15`,
      borderWidth: 1,
      borderColor: `${statusInfo.color}30`,
    },
    icon: {
      fontSize: compact ? 12 : 16,
    },
    textContainer: {
      flex: compact ? 0 : 1,
    },
    statusText: {
      fontSize: compact ? 10 : 12,
      fontWeight: '600',
      color: statusInfo.color,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    descriptionText: {
      fontSize: 10,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  });
  
  const content = (
    <View style={dynamicStyles.container}>
      {status.loading ? (
        <ActivityIndicator size="small" color={statusInfo.color} />
      ) : (
        <Text style={dynamicStyles.icon}>{statusInfo.icon}</Text>
      )}
      <View style={dynamicStyles.textContainer}>
        <Text style={dynamicStyles.statusText}>{statusInfo.text}</Text>
        {!compact && (
          <Text style={dynamicStyles.descriptionText} numberOfLines={1}>
            {statusInfo.description}
          </Text>
        )}
      </View>
    </View>
  );
  
  if (!status.initialized && !status.loading && isSupported) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
}

export default OfflineStatusIndicator;
