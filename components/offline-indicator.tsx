/**
 * Offline Mode Indicator Component
 * 
 * Displays the current network and LLM status in the app header.
 * Shows:
 * - Network connectivity (online/offline)
 * - Current LLM tier (cloud/local/template)
 * - Model download progress when applicable
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Animated,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useNetworkStatus, NetworkType } from '@/hooks/use-network-status';
import { getMLCLLMService, MLCModelState, MLCModelId } from '@/lib/llm/mlc-llm-service';
import { getMobileLLMService, LLMProvider } from '@/lib/llm/mobile-llm-service';

export type LLMTier = 'cloud' | 'local' | 'template' | 'unavailable';

interface OfflineIndicatorProps {
  /** Whether to show expanded details */
  expanded?: boolean;
  /** Callback when indicator is pressed */
  onPress?: () => void;
  /** Custom style */
  style?: object;
}

/**
 * Get icon for network type
 */
function getNetworkIcon(type: NetworkType, isConnected: boolean): string {
  if (!isConnected) return '○';
  switch (type) {
    case 'wifi': return '◉';
    case 'cellular': return '◎';
    case 'ethernet': return '◈';
    default: return '◉';
  }
}

/**
 * Get icon for LLM tier
 */
function getLLMTierIcon(tier: LLMTier): string {
  switch (tier) {
    case 'cloud': return '☁';
    case 'local': return '⚡';
    case 'template': return '📋';
    case 'unavailable': return '⚠';
  }
}

/**
 * Get label for LLM tier
 */
function getLLMTierLabel(tier: LLMTier): string {
  switch (tier) {
    case 'cloud': return 'Cloud AI';
    case 'local': return 'On-Device';
    case 'template': return 'Templates';
    case 'unavailable': return 'Unavailable';
  }
}

export function OfflineIndicator({ 
  expanded = false, 
  onPress,
  style,
}: OfflineIndicatorProps) {
  const colors = useColors();
  const networkStatus = useNetworkStatus();
  const [llmTier, setLLMTier] = useState<LLMTier>('cloud');
  const [localModelState, setLocalModelState] = useState<MLCModelState | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  
  // Determine current LLM tier based on network and model status
  useEffect(() => {
    const mlcService = getMLCLLMService();
    const llmService = getMobileLLMService();
    
    // Subscribe to MLC model state changes
    const unsubscribe = mlcService.subscribe((states) => {
      // Find a ready model
      let readyModel: MLCModelState | null = null;
      for (const [_, state] of states) {
        if (state.status === 'ready') {
          readyModel = state;
          break;
        }
        if (state.status === 'downloading' || state.status === 'preparing') {
          setLocalModelState(state);
        }
      }
      
      if (readyModel) {
        setLocalModelState(readyModel);
      }
    });
    
    // Determine tier based on network status
    if (networkStatus.isConnected && networkStatus.isInternetReachable !== false) {
      setLLMTier('cloud');
    } else if (localModelState?.status === 'ready') {
      setLLMTier('local');
    } else {
      setLLMTier('template');
    }
    
    return unsubscribe;
  }, [networkStatus.isConnected, networkStatus.isInternetReachable, localModelState?.status]);
  
  // Pulse animation when offline
  useEffect(() => {
    if (!networkStatus.isConnected) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [networkStatus.isConnected, pulseAnim]);
  
  // Get status color
  const getStatusColor = () => {
    if (!networkStatus.isConnected) return colors.error;
    if (llmTier === 'cloud') return colors.success;
    if (llmTier === 'local') return colors.primary;
    return colors.warning;
  };
  
  const statusColor = getStatusColor();
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Animated.View style={[styles.statusDot, { backgroundColor: statusColor, opacity: pulseAnim }]} />
      
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.icon, { color: statusColor }]}>
            {getNetworkIcon(networkStatus.type, networkStatus.isConnected)}
          </Text>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {networkStatus.isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        {expanded && (
          <View style={styles.details}>
            <View style={styles.row}>
              <Text style={[styles.icon, { color: colors.muted }]}>
                {getLLMTierIcon(llmTier)}
              </Text>
              <Text style={[styles.detailText, { color: colors.muted }]}>
                {getLLMTierLabel(llmTier)}
              </Text>
            </View>
            
            {localModelState?.status === 'downloading' && (
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { backgroundColor: colors.border }
                  ]}
                >
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        backgroundColor: colors.primary,
                        width: `${localModelState.progress}%`,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.muted }]}>
                  {localModelState.progress}%
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      {!expanded && (
        <Text style={[styles.tierBadge, { color: colors.muted }]}>
          {getLLMTierIcon(llmTier)}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Compact version for header bar
 */
export function OfflineIndicatorCompact({ onPress }: { onPress?: () => void }) {
  const colors = useColors();
  const networkStatus = useNetworkStatus();
  const [llmTier, setLLMTier] = useState<LLMTier>('cloud');
  
  useEffect(() => {
    if (networkStatus.isConnected && networkStatus.isInternetReachable !== false) {
      setLLMTier('cloud');
    } else {
      setLLMTier('template');
    }
  }, [networkStatus.isConnected, networkStatus.isInternetReachable]);
  
  const isOnline = networkStatus.isConnected;
  const statusColor = isOnline ? colors.success : colors.error;
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactContainer,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.compactDot, { backgroundColor: statusColor }]} />
      <Text style={[styles.compactText, { color: colors.muted }]}>
        {getLLMTierIcon(llmTier)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierBadge: {
    fontSize: 16,
  },
  details: {
    marginTop: 8,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    width: 30,
    textAlign: 'right',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactText: {
    fontSize: 14,
  },
});

export default OfflineIndicator;
