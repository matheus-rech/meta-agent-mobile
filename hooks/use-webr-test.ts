/**
 * WebR Test Hook
 * 
 * Provides testing utilities for WebR integration.
 * Used to validate that R code execution and plot generation work correctly.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export interface WebRTestResult {
  success: boolean;
  output?: string;
  error?: string;
  plotBase64?: string;
  executionTimeMs?: number;
}

export interface WebRTestState {
  status: 'idle' | 'loading' | 'ready' | 'running' | 'error';
  statusMessage: string;
  lastResult: WebRTestResult | null;
}

/**
 * Sample BCG vaccine trial data for meta-analysis testing
 * This is the classic dataset used in metafor examples
 */
export const BCG_VACCINE_DATA = `
# BCG Vaccine Trial Data
# Classic dataset for meta-analysis demonstration
dat.bcg <- data.frame(
  trial = 1:13,
  author = c("Aronson", "Ferguson & Simes", "Rosenthal et al", "Hart & Sutherland",
             "Frimodt-Moller et al", "Stein & Aronson", "Vandiviere et al",
             "TPT Madras", "Coetzee & Berjak", "Rosenthal et al", "Comstock et al",
             "Comstock & Webster", "Comstock et al"),
  year = c(1948, 1949, 1960, 1977, 1973, 1953, 1973, 1980, 1968, 1961, 1974, 1969, 1976),
  tpos = c(4, 6, 3, 62, 33, 180, 8, 505, 29, 17, 186, 5, 27),
  tneg = c(119, 300, 228, 13536, 5036, 1361, 2537, 87886, 7470, 1699, 50448, 2493, 16886),
  cpos = c(11, 29, 11, 248, 47, 372, 10, 499, 45, 65, 141, 3, 29),
  cneg = c(128, 274, 209, 12619, 5765, 1079, 619, 87892, 7232, 1600, 27197, 2338, 17825),
  ablat = c(44, 55, 42, 52, 13, 44, 19, 13, 27, 42, 18, 33, 33),
  alloc = c("random", "random", "random", "random", "alternate", "alternate",
            "random", "random", "random", "systematic", "systematic",
            "systematic", "systematic")
)
`;

/**
 * R code for running a basic meta-analysis and generating a forest plot
 */
export const FOREST_PLOT_R_CODE = `
library(metafor)

# Load the BCG vaccine data
${BCG_VACCINE_DATA}

# Calculate log odds ratios and sampling variances
dat <- escalc(measure="OR", ai=tpos, bi=tneg, ci=cpos, di=cneg, data=dat.bcg)

# Fit random-effects model using REML
res <- rma(yi, vi, data=dat, method="REML")

# Print summary
print(summary(res))

# Generate forest plot
png("forest_plot.png", width=800, height=600, res=100)
forest(res, 
       slab=paste(dat.bcg$author, dat.bcg$year, sep=", "),
       header=c("Study", "Log Odds Ratio [95% CI]"),
       xlab="Log Odds Ratio",
       mlab="Random Effects Model")
dev.off()

# Return success message
cat("Forest plot generated successfully\\n")
cat("Model estimate:", round(res$beta, 4), "\\n")
cat("95% CI: [", round(res$ci.lb, 4), ",", round(res$ci.ub, 4), "]\\n")
cat("I-squared:", round(res$I2, 2), "%\\n")
`;

/**
 * Simplified R code for testing basic execution
 */
export const SIMPLE_TEST_R_CODE = `
# Simple test to verify R is working
x <- 1:10
mean_x <- mean(x)
sd_x <- sd(x)
cat("Mean:", mean_x, "\\n")
cat("SD:", sd_x, "\\n")
cat("R version:", R.version.string, "\\n")
`;

/**
 * R code to check if metafor is available
 */
export const CHECK_METAFOR_R_CODE = `
# Check if metafor package is available
if (requireNamespace("metafor", quietly = TRUE)) {
  library(metafor)
  cat("metafor version:", as.character(packageVersion("metafor")), "\\n")
  cat("metafor is available and loaded\\n")
} else {
  cat("metafor is NOT available\\n")
  cat("Attempting to install...\\n")
  install.packages("metafor")
}
`;

/**
 * Generate HTML for WebR test page
 * This creates a standalone HTML page that can be loaded in a WebView
 */
export function generateWebRTestHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebR Test</title>
  <style>
    body { font-family: monospace; padding: 10px; background: #1a1a1a; color: #00ff00; }
    #output { white-space: pre-wrap; font-size: 12px; }
    #status { color: #ffff00; margin-bottom: 10px; }
    #plot { max-width: 100%; margin-top: 10px; }
  </style>
</head>
<body>
  <div id="status">Initializing WebR...</div>
  <div id="output"></div>
  <img id="plot" style="display:none;" />
  
  <script type="module">
    import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';
    
    const statusEl = document.getElementById('status');
    const outputEl = document.getElementById('output');
    const plotEl = document.getElementById('plot');
    
    function log(msg) {
      outputEl.textContent += msg + '\\n';
      sendToRN('log', { message: msg });
    }
    
    function setStatus(status, message) {
      statusEl.textContent = message;
      sendToRN('status', { status, message });
    }
    
    function sendToRN(type, payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
      }
    }
    
    async function init() {
      try {
        setStatus('loading', 'Loading WebR...');
        
        const webR = new WebR();
        await webR.init();
        
        setStatus('loading', 'WebR initialized. Installing packages...');
        log('WebR initialized successfully');
        
        // Install metafor from R-universe
        try {
          setStatus('loading', 'Installing metafor package...');
          await webR.installPackages(['metafor'], {
            repos: ['https://wviechtb.r-universe.dev', 'https://repo.r-wasm.org'],
          });
          log('metafor package installed');
        } catch (e) {
          log('Warning: Could not install metafor: ' + e.message);
        }
        
        setStatus('ready', 'WebR ready');
        sendToRN('ready', { version: 'WebR' });
        
        // Store webR instance for later use
        window.webR = webR;
        
      } catch (error) {
        setStatus('error', 'Error: ' + error.message);
        sendToRN('error', { error: error.message });
      }
    }
    
    // Handle messages from React Native
    window.addEventListener('message', async (event) => {
      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (message.type === 'execute') {
          if (!window.webR) {
            sendToRN('result', { 
              requestId: message.requestId,
              success: false, 
              error: 'WebR not initialized' 
            });
            return;
          }
          
          setStatus('running', 'Executing R code...');
          const startTime = Date.now();
          
          try {
            // Capture output
            let output = '';
            
            // Execute the code
            const result = await window.webR.evalR(message.code);
            
            // Try to get output
            try {
              const outputObj = await result.toJs();
              if (outputObj) {
                output = JSON.stringify(outputObj, null, 2);
              }
            } catch (e) {
              // Result might not be convertible
            }
            
            const executionTime = Date.now() - startTime;
            
            sendToRN('result', {
              requestId: message.requestId,
              success: true,
              output: output || 'Execution completed',
              executionTimeMs: executionTime,
            });
            
            setStatus('ready', 'Execution completed in ' + executionTime + 'ms');
            log('Execution completed in ' + executionTime + 'ms');
            
          } catch (error) {
            sendToRN('result', {
              requestId: message.requestId,
              success: false,
              error: error.message,
              executionTimeMs: Date.now() - startTime,
            });
            setStatus('error', 'Error: ' + error.message);
            log('Error: ' + error.message);
          }
        }
      } catch (error) {
        log('Message handling error: ' + error.message);
      }
    });
    
    // Start initialization
    init();
  </script>
</body>
</html>
`;
}

/**
 * Hook for testing WebR functionality
 */
export function useWebRTest() {
  const [state, setState] = useState<WebRTestState>({
    status: 'idle',
    statusMessage: 'Not started',
    lastResult: null,
  });
  
  const webViewRef = useRef<any>(null);
  const pendingRequests = useRef<Map<string, {
    resolve: (result: WebRTestResult) => void;
    reject: (error: Error) => void;
  }>>(new Map());
  const requestCounter = useRef(0);
  
  /**
   * Handle messages from WebView
   */
  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'status':
          setState(prev => ({
            ...prev,
            status: message.payload.status,
            statusMessage: message.payload.message,
          }));
          break;
          
        case 'ready':
          setState(prev => ({
            ...prev,
            status: 'ready',
            statusMessage: 'WebR is ready',
          }));
          break;
          
        case 'result':
          const pending = pendingRequests.current.get(message.payload.requestId);
          if (pending) {
            pendingRequests.current.delete(message.payload.requestId);
            const result: WebRTestResult = {
              success: message.payload.success,
              output: message.payload.output,
              error: message.payload.error,
              executionTimeMs: message.payload.executionTimeMs,
            };
            setState(prev => ({ ...prev, lastResult: result, status: 'ready' }));
            pending.resolve(result);
          }
          break;
          
        case 'error':
          setState(prev => ({
            ...prev,
            status: 'error',
            statusMessage: message.payload.error,
          }));
          break;
          
        case 'log':
          console.log('[WebR]', message.payload.message);
          break;
      }
    } catch (error) {
      console.error('[WebR] Failed to parse message:', error);
    }
  }, []);
  
  /**
   * Execute R code
   */
  const executeR = useCallback(async (code: string): Promise<WebRTestResult> => {
    if (state.status !== 'ready') {
      return {
        success: false,
        error: `WebR is not ready (status: ${state.status})`,
      };
    }
    
    if (!webViewRef.current) {
      return {
        success: false,
        error: 'WebView not available',
      };
    }
    
    const requestId = `req_${++requestCounter.current}_${Date.now()}`;
    
    setState(prev => ({ ...prev, status: 'running', statusMessage: 'Executing R code...' }));
    
    return new Promise((resolve, reject) => {
      pendingRequests.current.set(requestId, { resolve, reject });
      
      // Set timeout
      setTimeout(() => {
        if (pendingRequests.current.has(requestId)) {
          pendingRequests.current.delete(requestId);
          const result: WebRTestResult = {
            success: false,
            error: 'Execution timed out',
          };
          setState(prev => ({ ...prev, lastResult: result, status: 'ready' }));
          resolve(result);
        }
      }, 120000); // 2 minute timeout
      
      // Send message to WebView
      const message = JSON.stringify({ type: 'execute', code, requestId });
      webViewRef.current.postMessage(message);
    });
  }, [state.status]);
  
  /**
   * Run simple test
   */
  const runSimpleTest = useCallback(() => {
    return executeR(SIMPLE_TEST_R_CODE);
  }, [executeR]);
  
  /**
   * Check metafor availability
   */
  const checkMetafor = useCallback(() => {
    return executeR(CHECK_METAFOR_R_CODE);
  }, [executeR]);
  
  /**
   * Generate forest plot
   */
  const generateForestPlot = useCallback(() => {
    return executeR(FOREST_PLOT_R_CODE);
  }, [executeR]);
  
  return {
    state,
    webViewRef,
    handleMessage,
    executeR,
    runSimpleTest,
    checkMetafor,
    generateForestPlot,
    getTestHtml: generateWebRTestHtml,
  };
}

export default useWebRTest;
