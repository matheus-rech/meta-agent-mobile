/**
 * WebR Service
 * 
 * Provides offline R execution capabilities using WebR.
 * Enables running meta-analysis functions locally in the browser.
 */

import { Platform } from 'react-native';

// WebR types
interface WebRConsole {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
}

interface WebRInstance {
  init: () => Promise<void>;
  evalR: (code: string) => Promise<unknown>;
  evalRVoid: (code: string) => Promise<void>;
  installPackages: (packages: string[]) => Promise<void>;
  destroy: () => void;
}

export interface WebRStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  packagesLoaded: string[];
  memoryUsage?: number;
}

export interface MetaAnalysisResult {
  estimate: number;
  se: number;
  ci_lower: number;
  ci_upper: number;
  z_value: number;
  p_value: number;
  i_squared: number;
  tau_squared: number;
  q_statistic: number;
  q_df: number;
  q_pvalue: number;
  studies: StudyResult[];
  model: 'FE' | 'RE';
}

export interface StudyResult {
  id: string;
  study: string;
  yi: number;
  vi: number;
  sei: number;
  ci_lower: number;
  ci_upper: number;
  weight: number;
}

export interface ForestPlotData {
  studies: StudyResult[];
  summary: MetaAnalysisResult;
  title?: string;
  xlab?: string;
}

class WebRService {
  private webR: WebRInstance | null = null;
  private status: WebRStatus = {
    initialized: false,
    loading: false,
    error: null,
    packagesLoaded: [],
  };
  private listeners: Set<(status: WebRStatus) => void> = new Set();
  private consoleOutput: string[] = [];
  
  /**
   * Check if WebR is supported on current platform
   */
  isSupported(): boolean {
    // WebR only works in web browsers with WebAssembly support
    return Platform.OS === 'web' && typeof WebAssembly !== 'undefined';
  }
  
  /**
   * Get current status
   */
  getStatus(): WebRStatus {
    return { ...this.status };
  }
  
  /**
   * Subscribe to status changes
   */
  subscribe(listener: (status: WebRStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
  
  private updateStatus(updates: Partial<WebRStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }
  
  /**
   * Initialize WebR
   */
  async initialize(): Promise<void> {
    if (this.status.initialized || this.status.loading) {
      return;
    }
    
    if (!this.isSupported()) {
      this.updateStatus({
        error: 'WebR is only supported in web browsers with WebAssembly',
      });
      return;
    }
    
    this.updateStatus({ loading: true, error: null });
    
    try {
      // Dynamically import WebR (only available on web)
      const { WebR } = await import('webr');
      
      const console: WebRConsole = {
        stdout: (line: string) => {
          this.consoleOutput.push(line);
        },
        stderr: (line: string) => {
          this.consoleOutput.push(`[ERROR] ${line}`);
        },
      };
      
      this.webR = new WebR({
        interactive: false,
        channelType: 1, // SharedArrayBuffer channel
      }) as unknown as WebRInstance;
      
      await this.webR.init();
      
      // Install metafor package for meta-analysis
      await this.installMetaforPackage();
      
      this.updateStatus({
        initialized: true,
        loading: false,
        packagesLoaded: ['metafor'],
      });
    } catch (error) {
      this.updateStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize WebR',
      });
      throw error;
    }
  }
  
  /**
   * Install metafor package
   */
  private async installMetaforPackage(): Promise<void> {
    if (!this.webR) throw new Error('WebR not initialized');
    
    // Load metafor from WebR repository
    await this.webR.evalRVoid(`
      webr::install("metafor", quiet = TRUE)
      library(metafor)
    `);
  }
  
  /**
   * Run meta-analysis on provided data
   */
  async runMetaAnalysis(
    data: { study: string; yi: number; vi: number }[],
    options: {
      model?: 'FE' | 'RE';
      method?: 'REML' | 'DL' | 'HE' | 'ML';
    } = {}
  ): Promise<MetaAnalysisResult> {
    if (!this.webR || !this.status.initialized) {
      await this.initialize();
    }
    
    if (!this.webR) {
      throw new Error('WebR initialization failed');
    }
    
    const { model = 'RE', method = 'REML' } = options;
    
    // Prepare data for R
    const studies = data.map(d => `"${d.study}"`).join(', ');
    const yi = data.map(d => d.yi).join(', ');
    const vi = data.map(d => d.vi).join(', ');
    
    const rCode = `
      library(metafor)
      
      # Create data frame
      dat <- data.frame(
        study = c(${studies}),
        yi = c(${yi}),
        vi = c(${vi})
      )
      
      # Run meta-analysis
      res <- rma(yi = yi, vi = vi, data = dat, method = "${model === 'FE' ? 'FE' : method}")
      
      # Calculate study-level statistics
      sei <- sqrt(dat$vi)
      ci_lower <- dat$yi - 1.96 * sei
      ci_upper <- dat$yi + 1.96 * sei
      weights <- weights(res)
      
      # Return results as JSON
      result <- list(
        estimate = as.numeric(res$beta),
        se = as.numeric(res$se),
        ci_lower = as.numeric(res$ci.lb),
        ci_upper = as.numeric(res$ci.ub),
        z_value = as.numeric(res$zval),
        p_value = as.numeric(res$pval),
        i_squared = as.numeric(res$I2),
        tau_squared = as.numeric(ifelse(is.null(res$tau2), 0, res$tau2)),
        q_statistic = as.numeric(res$QE),
        q_df = as.numeric(res$k - 1),
        q_pvalue = as.numeric(res$QEp),
        model = "${model}",
        studies = lapply(1:nrow(dat), function(i) {
          list(
            id = as.character(i),
            study = dat$study[i],
            yi = dat$yi[i],
            vi = dat$vi[i],
            sei = sei[i],
            ci_lower = ci_lower[i],
            ci_upper = ci_upper[i],
            weight = weights[i]
          )
        })
      )
      
      jsonlite::toJSON(result, auto_unbox = TRUE)
    `;
    
    const resultJson = await this.webR.evalR(rCode) as string;
    return JSON.parse(resultJson);
  }
  
  /**
   * Calculate effect sizes from raw data
   */
  async calculateEffectSizes(
    data: {
      study: string;
      n1: number;
      n2: number;
      mean1?: number;
      mean2?: number;
      sd1?: number;
      sd2?: number;
      events1?: number;
      events2?: number;
    }[],
    measure: 'SMD' | 'MD' | 'OR' | 'RR' | 'RD' = 'SMD'
  ): Promise<{ study: string; yi: number; vi: number }[]> {
    if (!this.webR || !this.status.initialized) {
      await this.initialize();
    }
    
    if (!this.webR) {
      throw new Error('WebR initialization failed');
    }
    
    // Build R code based on measure type
    let rCode = 'library(metafor)\n';
    
    if (measure === 'SMD' || measure === 'MD') {
      // Continuous outcome
      const studies = data.map(d => `"${d.study}"`).join(', ');
      const n1 = data.map(d => d.n1).join(', ');
      const n2 = data.map(d => d.n2).join(', ');
      const mean1 = data.map(d => d.mean1 ?? 0).join(', ');
      const mean2 = data.map(d => d.mean2 ?? 0).join(', ');
      const sd1 = data.map(d => d.sd1 ?? 1).join(', ');
      const sd2 = data.map(d => d.sd2 ?? 1).join(', ');
      
      rCode += `
        dat <- escalc(measure = "${measure}",
          n1i = c(${n1}), n2i = c(${n2}),
          m1i = c(${mean1}), m2i = c(${mean2}),
          sd1i = c(${sd1}), sd2i = c(${sd2})
        )
        dat$study <- c(${studies})
        jsonlite::toJSON(data.frame(study = dat$study, yi = dat$yi, vi = dat$vi), auto_unbox = TRUE)
      `;
    } else {
      // Binary outcome
      const studies = data.map(d => `"${d.study}"`).join(', ');
      const n1 = data.map(d => d.n1).join(', ');
      const n2 = data.map(d => d.n2).join(', ');
      const events1 = data.map(d => d.events1 ?? 0).join(', ');
      const events2 = data.map(d => d.events2 ?? 0).join(', ');
      
      rCode += `
        dat <- escalc(measure = "${measure}",
          ai = c(${events1}), bi = c(${n1}) - c(${events1}),
          ci = c(${events2}), di = c(${n2}) - c(${events2})
        )
        dat$study <- c(${studies})
        jsonlite::toJSON(data.frame(study = dat$study, yi = dat$yi, vi = dat$vi), auto_unbox = TRUE)
      `;
    }
    
    const resultJson = await this.webR.evalR(rCode) as string;
    return JSON.parse(resultJson);
  }
  
  /**
   * Run meta-regression
   */
  async runMetaRegression(
    data: { study: string; yi: number; vi: number; moderator: number }[],
    options: { method?: 'REML' | 'DL' | 'ML' } = {}
  ): Promise<{
    intercept: number;
    slope: number;
    intercept_se: number;
    slope_se: number;
    intercept_pvalue: number;
    slope_pvalue: number;
    r_squared: number;
    tau_squared: number;
    qm_statistic: number;
    qm_pvalue: number;
  }> {
    if (!this.webR || !this.status.initialized) {
      await this.initialize();
    }
    
    if (!this.webR) {
      throw new Error('WebR initialization failed');
    }
    
    const { method = 'REML' } = options;
    
    const studies = data.map(d => `"${d.study}"`).join(', ');
    const yi = data.map(d => d.yi).join(', ');
    const vi = data.map(d => d.vi).join(', ');
    const moderator = data.map(d => d.moderator).join(', ');
    
    const rCode = `
      library(metafor)
      
      dat <- data.frame(
        study = c(${studies}),
        yi = c(${yi}),
        vi = c(${vi}),
        moderator = c(${moderator})
      )
      
      res <- rma(yi = yi, vi = vi, mods = ~ moderator, data = dat, method = "${method}")
      
      result <- list(
        intercept = as.numeric(res$beta[1]),
        slope = as.numeric(res$beta[2]),
        intercept_se = as.numeric(res$se[1]),
        slope_se = as.numeric(res$se[2]),
        intercept_pvalue = as.numeric(res$pval[1]),
        slope_pvalue = as.numeric(res$pval[2]),
        r_squared = as.numeric(ifelse(is.null(res$R2), 0, res$R2)),
        tau_squared = as.numeric(res$tau2),
        qm_statistic = as.numeric(res$QM),
        qm_pvalue = as.numeric(res$QMp)
      )
      
      jsonlite::toJSON(result, auto_unbox = TRUE)
    `;
    
    const resultJson = await this.webR.evalR(rCode) as string;
    return JSON.parse(resultJson);
  }
  
  /**
   * Generate forest plot data
   */
  async generateForestPlotData(
    data: { study: string; yi: number; vi: number }[],
    options: { model?: 'FE' | 'RE'; title?: string; xlab?: string } = {}
  ): Promise<ForestPlotData> {
    const result = await this.runMetaAnalysis(data, { model: options.model });
    
    return {
      studies: result.studies,
      summary: result,
      title: options.title,
      xlab: options.xlab,
    };
  }
  
  /**
   * Get console output
   */
  getConsoleOutput(): string[] {
    return [...this.consoleOutput];
  }
  
  /**
   * Clear console output
   */
  clearConsoleOutput(): void {
    this.consoleOutput = [];
  }
  
  /**
   * Destroy WebR instance
   */
  destroy(): void {
    if (this.webR) {
      this.webR.destroy();
      this.webR = null;
    }
    this.updateStatus({
      initialized: false,
      loading: false,
      packagesLoaded: [],
    });
  }
}

export const webRService = new WebRService();

// Convenience exports
export const initializeWebR = () => webRService.initialize();
export const runMetaAnalysis = (
  data: { study: string; yi: number; vi: number }[],
  options?: { model?: 'FE' | 'RE'; method?: 'REML' | 'DL' | 'HE' | 'ML' }
) => webRService.runMetaAnalysis(data, options);
export const calculateEffectSizes = (
  data: Parameters<typeof webRService.calculateEffectSizes>[0],
  measure?: 'SMD' | 'MD' | 'OR' | 'RR' | 'RD'
) => webRService.calculateEffectSizes(data, measure);
export const runMetaRegression = (
  data: { study: string; yi: number; vi: number; moderator: number }[],
  options?: { method?: 'REML' | 'DL' | 'ML' }
) => webRService.runMetaRegression(data, options);
export const generateForestPlotData = (
  data: { study: string; yi: number; vi: number }[],
  options?: { model?: 'FE' | 'RE'; title?: string; xlab?: string }
) => webRService.generateForestPlotData(data, options);
export const getWebRStatus = () => webRService.getStatus();
export const subscribeToWebRStatus = (listener: (status: WebRStatus) => void) =>
  webRService.subscribe(listener);
