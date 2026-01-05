/**
 * WebR Service for React Native
 * 
 * This service provides R execution capabilities using WebR (R compiled to WebAssembly).
 * It uses a WebView-based approach for React Native compatibility.
 * 
 * Architecture:
 * 1. A hidden WebView loads WebR
 * 2. R code is sent to the WebView via postMessage
 * 3. Results are returned via the onMessage callback
 * 
 * Note: This is a proof-of-concept implementation. For production,
 * consider using Polygen or react-native-webassembly for better performance.
 */

import { Platform } from 'react-native';

export interface WebRResult {
  success: boolean;
  output?: string;
  error?: string;
  plots?: string[]; // Base64 encoded plot images
  data?: unknown;
  executionTime?: number;
}

export interface WebRPackage {
  name: string;
  version?: string;
  installed: boolean;
}

export type WebRStatus = 'uninitialized' | 'loading' | 'ready' | 'error' | 'busy';

export interface WebRServiceConfig {
  /** Base URL for WebR CDN (default: https://webr.r-wasm.org/latest/) */
  webRBaseUrl?: string;
  /** Additional package repositories */
  repos?: string[];
  /** Packages to pre-install on initialization */
  preloadPackages?: string[];
  /** Timeout for R code execution in milliseconds (default: 60000) */
  executionTimeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

const DEFAULT_CONFIG: Required<WebRServiceConfig> = {
  webRBaseUrl: 'https://webr.r-wasm.org/latest/',
  repos: [
    'https://repo.r-wasm.org/',
    'https://wviechtb.r-universe.dev/',
  ],
  preloadPackages: ['metafor', 'meta'],
  executionTimeout: 60000,
  debug: false,
};

/**
 * HTML template for the WebR WebView
 * This creates a minimal HTML page that loads WebR and handles message passing
 */
export function generateWebRHtml(config: Required<WebRServiceConfig>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebR Runtime</title>
  <script type="module">
    import { WebR } from '${config.webRBaseUrl}webr.mjs';
    
    // Initialize WebR
    const webR = new WebR({
      baseUrl: '${config.webRBaseUrl}',
    });
    
    let isReady = false;
    let isBusy = false;
    
    // Send message to React Native
    function sendToRN(type, payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
      } else {
        console.log('WebR message:', type, payload);
      }
    }
    
    // Initialize WebR and install packages
    async function initialize() {
      try {
        sendToRN('status', { status: 'loading', message: 'Initializing WebR...' });
        
        await webR.init();
        sendToRN('status', { status: 'loading', message: 'WebR initialized, installing packages...' });
        
        // Install pre-load packages
        const packages = ${JSON.stringify(config.preloadPackages)};
        for (const pkg of packages) {
          try {
            sendToRN('status', { status: 'loading', message: 'Installing ' + pkg + '...' });
            await webR.installPackages([pkg], {
              repos: ${JSON.stringify(config.repos)},
            });
          } catch (e) {
            sendToRN('warning', { message: 'Failed to install ' + pkg + ': ' + e.message });
          }
        }
        
        isReady = true;
        sendToRN('status', { status: 'ready', message: 'WebR is ready' });
        
      } catch (error) {
        sendToRN('status', { status: 'error', message: error.message });
        sendToRN('error', { error: error.message });
      }
    }
    
    // Execute R code
    async function executeR(code, requestId) {
      if (!isReady) {
        sendToRN('result', {
          requestId,
          success: false,
          error: 'WebR is not ready',
        });
        return;
      }
      
      if (isBusy) {
        sendToRN('result', {
          requestId,
          success: false,
          error: 'WebR is busy with another execution',
        });
        return;
      }
      
      isBusy = true;
      const startTime = Date.now();
      
      try {
        // Capture output
        let output = '';
        let plots = [];
        
        // Set up output capture
        await webR.evalR(\`
          .webr_output <- character()
          .webr_plots <- list()
          
          # Capture print output
          sink(textConnection(".webr_output", "w", local = TRUE))
        \`);
        
        // Execute the code
        const result = await webR.evalR(code);
        
        // Get captured output
        await webR.evalR('sink()');
        const outputResult = await webR.evalR('.webr_output');
        output = await outputResult.toJs();
        if (Array.isArray(output)) {
          output = output.join('\\n');
        }
        
        // Try to get the result value
        let data = null;
        try {
          data = await result.toJs();
        } catch (e) {
          // Result might not be convertible to JS
        }
        
        const executionTime = Date.now() - startTime;
        
        sendToRN('result', {
          requestId,
          success: true,
          output: output || 'Execution completed',
          data,
          plots,
          executionTime,
        });
        
      } catch (error) {
        sendToRN('result', {
          requestId,
          success: false,
          error: error.message,
          executionTime: Date.now() - startTime,
        });
      } finally {
        isBusy = false;
      }
    }
    
    // Check if a package is installed
    async function checkPackage(packageName, requestId) {
      if (!isReady) {
        sendToRN('packageCheck', {
          requestId,
          name: packageName,
          installed: false,
          error: 'WebR is not ready',
        });
        return;
      }
      
      try {
        const result = await webR.evalR(\`requireNamespace("\${packageName}", quietly = TRUE)\`);
        const installed = await result.toJs();
        
        sendToRN('packageCheck', {
          requestId,
          name: packageName,
          installed: installed === true,
        });
      } catch (error) {
        sendToRN('packageCheck', {
          requestId,
          name: packageName,
          installed: false,
          error: error.message,
        });
      }
    }
    
    // Install a package
    async function installPackage(packageName, requestId) {
      if (!isReady) {
        sendToRN('packageInstall', {
          requestId,
          name: packageName,
          success: false,
          error: 'WebR is not ready',
        });
        return;
      }
      
      try {
        sendToRN('status', { status: 'busy', message: 'Installing ' + packageName + '...' });
        
        await webR.installPackages([packageName], {
          repos: ${JSON.stringify(config.repos)},
        });
        
        sendToRN('packageInstall', {
          requestId,
          name: packageName,
          success: true,
        });
        
        sendToRN('status', { status: 'ready', message: 'Package installed' });
        
      } catch (error) {
        sendToRN('packageInstall', {
          requestId,
          name: packageName,
          success: false,
          error: error.message,
        });
        sendToRN('status', { status: 'ready', message: 'Package installation failed' });
      }
    }
    
    // Handle messages from React Native
    window.addEventListener('message', async (event) => {
      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        switch (message.type) {
          case 'execute':
            await executeR(message.code, message.requestId);
            break;
          case 'checkPackage':
            await checkPackage(message.packageName, message.requestId);
            break;
          case 'installPackage':
            await installPackage(message.packageName, message.requestId);
            break;
          case 'getStatus':
            sendToRN('status', {
              status: isReady ? (isBusy ? 'busy' : 'ready') : 'loading',
            });
            break;
        }
      } catch (error) {
        sendToRN('error', { error: 'Failed to parse message: ' + error.message });
      }
    });
    
    // Start initialization
    initialize();
  </script>
</head>
<body>
  <div id="status">Loading WebR...</div>
</body>
</html>
`;
}

/**
 * WebR Service class
 * Manages the WebR WebView and provides a clean API for R execution
 */
export class WebRService {
  private config: Required<WebRServiceConfig>;
  private status: WebRStatus = 'uninitialized';
  private pendingRequests: Map<string, {
    resolve: (value: WebRResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private statusListeners: Set<(status: WebRStatus, message?: string) => void> = new Set();
  private requestCounter = 0;
  
  constructor(config: WebRServiceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Get the HTML content for the WebR WebView
   */
  getWebViewHtml(): string {
    return generateWebRHtml(this.config);
  }
  
  /**
   * Get current status
   */
  getStatus(): WebRStatus {
    return this.status;
  }
  
  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: WebRStatus, message?: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
  
  /**
   * Handle messages from the WebView
   * Call this from the WebView's onMessage handler
   */
  handleWebViewMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (this.config.debug) {
        console.log('[WebR] Message:', message);
      }
      
      switch (message.type) {
        case 'status':
          this.status = message.payload.status;
          this.statusListeners.forEach(listener => 
            listener(message.payload.status, message.payload.message)
          );
          break;
          
        case 'result':
          this.resolveRequest(message.payload.requestId, {
            success: message.payload.success,
            output: message.payload.output,
            error: message.payload.error,
            plots: message.payload.plots,
            data: message.payload.data,
            executionTime: message.payload.executionTime,
          });
          break;
          
        case 'packageCheck':
        case 'packageInstall':
          this.resolveRequest(message.payload.requestId, {
            success: message.payload.success ?? message.payload.installed,
            error: message.payload.error,
          });
          break;
          
        case 'error':
          console.error('[WebR] Error:', message.payload.error);
          break;
          
        case 'warning':
          console.warn('[WebR] Warning:', message.payload.message);
          break;
      }
    } catch (error) {
      console.error('[WebR] Failed to parse message:', error);
    }
  }
  
  /**
   * Generate a message to send to the WebView
   */
  createExecuteMessage(code: string): { message: string; requestId: string } {
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;
    return {
      message: JSON.stringify({ type: 'execute', code, requestId }),
      requestId,
    };
  }
  
  /**
   * Execute R code (returns a promise that resolves when the WebView responds)
   * Note: You need to actually send the message to the WebView and call handleWebViewMessage
   */
  async executeR(
    code: string,
    sendMessage: (message: string) => void
  ): Promise<WebRResult> {
    if (this.status !== 'ready') {
      return {
        success: false,
        error: `WebR is not ready (status: ${this.status})`,
      };
    }
    
    const { message, requestId } = this.createExecuteMessage(code);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve({
          success: false,
          error: `Execution timed out after ${this.config.executionTimeout}ms`,
        });
      }, this.config.executionTimeout);
      
      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      sendMessage(message);
    });
  }
  
  /**
   * Check if a package is installed
   */
  async checkPackage(
    packageName: string,
    sendMessage: (message: string) => void
  ): Promise<boolean> {
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;
    const message = JSON.stringify({ type: 'checkPackage', packageName, requestId });
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve(false);
      }, 10000);
      
      this.pendingRequests.set(requestId, {
        resolve: (result) => resolve(result.success),
        reject: () => resolve(false),
        timeout,
      });
      sendMessage(message);
    });
  }
  
  /**
   * Install a package
   */
  async installPackage(
    packageName: string,
    sendMessage: (message: string) => void
  ): Promise<WebRResult> {
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;
    const message = JSON.stringify({ type: 'installPackage', packageName, requestId });
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve({
          success: false,
          error: 'Package installation timed out',
        });
      }, 120000); // 2 minute timeout for package installation
      
      this.pendingRequests.set(requestId, { resolve, reject: () => {}, timeout });
      sendMessage(message);
    });
  }
  
  private resolveRequest(requestId: string, result: WebRResult): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);
      pending.resolve(result);
    }
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.pendingRequests.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingRequests.clear();
    this.statusListeners.clear();
  }
}

// Singleton instance
let webRServiceInstance: WebRService | null = null;

export function getWebRService(config?: WebRServiceConfig): WebRService {
  if (!webRServiceInstance) {
    webRServiceInstance = new WebRService(config);
  }
  return webRServiceInstance;
}

export function resetWebRService(): void {
  if (webRServiceInstance) {
    webRServiceInstance.dispose();
    webRServiceInstance = null;
  }
}
