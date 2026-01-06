/**
 * Network Status Hook
 * 
 * Monitors network connectivity and provides offline detection.
 * Uses expo-network for reliable cross-platform network state.
 */

import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';
import { Platform, AppState, AppStateStatus } from 'react-native';

export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none';

export interface NetworkStatus {
  /** Whether the device is connected to the internet */
  isConnected: boolean;
  /** Whether the connection is reachable (can actually reach servers) */
  isInternetReachable: boolean | null;
  /** Type of network connection */
  type: NetworkType;
  /** Whether we're in airplane mode */
  isAirplaneMode: boolean;
  /** Last time the status was checked */
  lastChecked: number;
  /** Whether the status is being checked */
  isChecking: boolean;
}

const DEFAULT_STATUS: NetworkStatus = {
  isConnected: true,
  isInternetReachable: null,
  type: 'unknown',
  isAirplaneMode: false,
  lastChecked: 0,
  isChecking: true,
};

/**
 * Hook for monitoring network status
 */
export function useNetworkStatus(): NetworkStatus & {
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS);
  
  /**
   * Check current network status
   */
  const checkNetworkStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      let type: NetworkType = 'unknown';
      switch (networkState.type) {
        case Network.NetworkStateType.WIFI:
          type = 'wifi';
          break;
        case Network.NetworkStateType.CELLULAR:
          type = 'cellular';
          break;
        case Network.NetworkStateType.ETHERNET:
          type = 'ethernet';
          break;
        case Network.NetworkStateType.NONE:
          type = 'none';
          break;
      }
      
      // Check airplane mode (iOS only)
      let isAirplaneMode = false;
      if (Platform.OS === 'ios') {
        try {
          isAirplaneMode = await Network.isAirplaneModeEnabledAsync();
        } catch {
          // Airplane mode check might fail on some devices
        }
      }
      
      setStatus({
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? null,
        type,
        isAirplaneMode,
        lastChecked: Date.now(),
        isChecking: false,
      });
    } catch (error) {
      console.error('[Network] Failed to check status:', error);
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        lastChecked: Date.now(),
      }));
    }
  }, []);
  
  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Refresh network status when app becomes active
      checkNetworkStatus();
    }
  }, [checkNetworkStatus]);
  
  // Initial check and setup listeners
  useEffect(() => {
    checkNetworkStatus();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Periodic check every 30 seconds
    const interval = setInterval(checkNetworkStatus, 30000);
    
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkNetworkStatus, handleAppStateChange]);
  
  return {
    ...status,
    refresh: checkNetworkStatus,
  };
}

/**
 * Simple hook that just returns whether we're online
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  
  // Consider online if connected and either internet is reachable or we haven't checked yet
  return isConnected && (isInternetReachable === null || isInternetReachable);
}

export default useNetworkStatus;
