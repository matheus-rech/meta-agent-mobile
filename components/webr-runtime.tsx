/**
 * WebR Runtime Component
 * 
 * A hidden WebView that runs WebR (R compiled to WebAssembly).
 * This component should be mounted once at the app root level.
 * 
 * Usage:
 * 1. Mount <WebRRuntime /> in your app layout
 * 2. Use the useWebR() hook to execute R code
 */

import React, { useRef, useEffect, useCallback, useState, createContext, useContext } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { 
  WebRService, 
  getWebRService, 
  WebRResult, 
  WebRStatus,
  WebRServiceConfig,
} from '@/lib/webr/webr-service';

interface WebRContextValue {
  status: WebRStatus;
  statusMessage: string;
  executeR: (code: string) => Promise<WebRResult>;
  checkPackage: (packageName: string) => Promise<boolean>;
  installPackage: (packageName: string) => Promise<WebRResult>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

const WebRContext = createContext<WebRContextValue | null>(null);

interface WebRRuntimeProps {
  /** Configuration for WebR service */
  config?: WebRServiceConfig;
  /** Called when WebR status changes */
  onStatusChange?: (status: WebRStatus, message?: string) => void;
  /** Called when WebR encounters an error */
  onError?: (error: string) => void;
  /** Show debug information */
  debug?: boolean;
  children?: React.ReactNode;
}

export function WebRRuntime({ 
  config, 
  onStatusChange, 
  onError,
  debug = false,
  children,
}: WebRRuntimeProps) {
  const webViewRef = useRef<WebView>(null);
  const serviceRef = useRef<WebRService>(getWebRService(config));
  const [status, setStatus] = useState<WebRStatus>('uninitialized');
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  
  // Handle messages from WebView
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    if (debug) {
      console.log('[WebRRuntime] Message:', data);
    }
    serviceRef.current.handleWebViewMessage(data);
  }, [debug]);
  
  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = serviceRef.current.onStatusChange((newStatus, message) => {
      setStatus(newStatus);
      if (message) {
        setStatusMessage(message);
      }
      if (newStatus === 'error' && message) {
        setError(message);
        onError?.(message);
      }
      onStatusChange?.(newStatus, message);
    });
    
    return unsubscribe;
  }, [onStatusChange, onError]);
  
  // Send message to WebView
  const sendMessage = useCallback((message: string) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(message);
    }
  }, []);
  
  // Execute R code
  const executeR = useCallback(async (code: string): Promise<WebRResult> => {
    return serviceRef.current.executeR(code, sendMessage);
  }, [sendMessage]);
  
  // Check if package is installed
  const checkPackage = useCallback(async (packageName: string): Promise<boolean> => {
    return serviceRef.current.checkPackage(packageName, sendMessage);
  }, [sendMessage]);
  
  // Install package
  const installPackage = useCallback(async (packageName: string): Promise<WebRResult> => {
    return serviceRef.current.installPackage(packageName, sendMessage);
  }, [sendMessage]);
  
  // Context value
  const contextValue: WebRContextValue = {
    status,
    statusMessage,
    executeR,
    checkPackage,
    installPackage,
    isReady: status === 'ready',
    isLoading: status === 'loading',
    error,
  };
  
  // Get HTML content
  const html = serviceRef.current.getWebViewHtml();
  
  // Only render WebView on native platforms
  // On web, we could potentially use WebR directly
  const showWebView = Platform.OS !== 'web';
  
  return (
    <WebRContext.Provider value={contextValue}>
      {showWebView && (
        <View style={styles.container}>
          <WebView
            ref={webViewRef}
            source={{ html }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            onError={(syntheticEvent: { nativeEvent: { description: string } }) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[WebRRuntime] WebView error:', nativeEvent);
              setError(nativeEvent.description);
              onError?.(nativeEvent.description);
            }}
            onHttpError={(syntheticEvent: { nativeEvent: { statusCode: number } }) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[WebRRuntime] HTTP error:', nativeEvent.statusCode);
            }}
            style={styles.webview}
          />
        </View>
      )}
      {children}
    </WebRContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
  webview: {
    width: 1,
    height: 1,
  },
});

/**
 * Hook to access WebR functionality
 * Must be used within a WebRRuntime provider
 */
export function useWebR(): WebRContextValue {
  const context = useContext(WebRContext);
  if (!context) {
    throw new Error('useWebR must be used within a WebRRuntime provider');
  }
  return context;
}

/**
 * Hook to execute R code
 * Returns a function that executes R code and returns the result
 */
export function useExecuteR() {
  const { executeR, isReady, status } = useWebR();
  
  const execute = useCallback(async (code: string): Promise<WebRResult> => {
    if (!isReady) {
      return {
        success: false,
        error: `WebR is not ready (status: ${status})`,
      };
    }
    return executeR(code);
  }, [executeR, isReady, status]);
  
  return { execute, isReady, status };
}

export default WebRRuntime;
