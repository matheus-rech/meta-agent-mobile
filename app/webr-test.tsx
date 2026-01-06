/**
 * WebR Test Screen
 * 
 * A dedicated screen for testing WebR integration.
 * Allows running R code and viewing results.
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  useWebRTest, 
  generateWebRTestHtml,
  SIMPLE_TEST_R_CODE,
  CHECK_METAFOR_R_CODE,
  FOREST_PLOT_R_CODE,
} from '@/hooks/use-webr-test';

export default function WebRTestScreen() {
  const colors = useColors();
  const {
    state,
    webViewRef,
    handleMessage,
    executeR,
    runSimpleTest,
    checkMetafor,
    generateForestPlot,
  } = useWebRTest();
  
  const [logs, setLogs] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);
  
  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    handleMessage(event);
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'log') {
        addLog(message.payload.message);
      } else if (message.type === 'status') {
        addLog(`Status: ${message.payload.message}`);
      } else if (message.type === 'result') {
        if (message.payload.success) {
          addLog(`✓ Execution completed in ${message.payload.executionTimeMs}ms`);
          if (message.payload.output) {
            addLog(`Output: ${message.payload.output.substring(0, 500)}`);
          }
        } else {
          addLog(`✗ Error: ${message.payload.error}`);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [handleMessage, addLog]);
  
  const runTest = useCallback(async (name: string, testFn: () => Promise<any>) => {
    addLog(`Running ${name}...`);
    try {
      const result = await testFn();
      if (result.success) {
        addLog(`✓ ${name} completed successfully`);
      } else {
        addLog(`✗ ${name} failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`✗ ${name} error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [addLog]);
  
  const isReady = state.status === 'ready';
  const isLoading = state.status === 'loading' || state.status === 'running';
  
  // Only render WebView on native platforms
  const showWebView = Platform.OS !== 'web';
  
  return (
    <ScreenContainer className="flex-1 bg-background">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          WebR Integration Test
        </Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: isReady ? colors.success : isLoading ? colors.warning : colors.error 
        }]}>
          <Text style={styles.statusText}>{state.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={[styles.statusMessage, { color: colors.muted }]}>
        {state.statusMessage}
      </Text>
      
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            !isReady && styles.buttonDisabled,
          ]}
          onPress={() => runTest('Simple Test', runSimpleTest)}
          disabled={!isReady}
        >
          <Text style={styles.buttonText}>Simple Test</Text>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            !isReady && styles.buttonDisabled,
          ]}
          onPress={() => runTest('Check metafor', checkMetafor)}
          disabled={!isReady}
        >
          <Text style={styles.buttonText}>Check metafor</Text>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 },
            !isReady && styles.buttonDisabled,
          ]}
          onPress={() => runTest('Forest Plot', generateForestPlot)}
          disabled={!isReady}
        >
          <Text style={styles.buttonText}>Forest Plot</Text>
        </Pressable>
      </View>
      
      <View style={[styles.logContainer, { borderColor: colors.border }]}>
        <Text style={[styles.logTitle, { color: colors.muted }]}>Console Output</Text>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.logScroll}
          contentContainerStyle={styles.logContent}
        >
          {logs.length === 0 ? (
            <Text style={[styles.logEmpty, { color: colors.muted }]}>
              Waiting for WebR to initialize...
            </Text>
          ) : (
            logs.map((log, index) => (
              <Text 
                key={index} 
                style={[
                  styles.logLine, 
                  { color: log.includes('✓') ? colors.success : log.includes('✗') ? colors.error : colors.foreground }
                ]}
              >
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            {state.statusMessage}
          </Text>
        </View>
      )}
      
      {showWebView && (
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: generateWebRTestHtml() }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            onError={(e) => addLog(`WebView error: ${e.nativeEvent.description}`)}
            style={styles.webview}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusMessage: {
    paddingHorizontal: 16,
    paddingTop: 4,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  logContainer: {
    flex: 1,
    margin: 16,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  logTitle: {
    padding: 8,
    fontSize: 12,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logScroll: {
    flex: 1,
  },
  logContent: {
    padding: 8,
  },
  logEmpty: {
    fontStyle: 'italic',
  },
  logLine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  webviewContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  webview: {
    width: 1,
    height: 1,
  },
});
