/**
 * useOfflineAnalysis Hook
 * 
 * React hook for running meta-analysis offline using WebR.
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  webRService,
  type WebRStatus,
  type MetaAnalysisResult,
  type ForestPlotData,
} from '../lib/webr';

export interface UseOfflineAnalysisReturn {
  // Status
  status: WebRStatus;
  isSupported: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  runAnalysis: (
    data: { study: string; yi: number; vi: number }[],
    options?: { model?: 'FE' | 'RE' }
  ) => Promise<MetaAnalysisResult>;
  calculateEffectSizes: (
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
    measure?: 'SMD' | 'MD' | 'OR' | 'RR' | 'RD'
  ) => Promise<{ study: string; yi: number; vi: number }[]>;
  runMetaRegression: (
    data: { study: string; yi: number; vi: number; moderator: number }[]
  ) => Promise<{
    intercept: number;
    slope: number;
    slope_pvalue: number;
    r_squared: number;
  }>;
  generateForestPlot: (
    data: { study: string; yi: number; vi: number }[],
    options?: { model?: 'FE' | 'RE'; title?: string }
  ) => Promise<ForestPlotData>;
  
  // Results
  lastResult: MetaAnalysisResult | null;
  lastForestPlot: ForestPlotData | null;
}

export function useOfflineAnalysis(): UseOfflineAnalysisReturn {
  const [status, setStatus] = useState<WebRStatus>(webRService.getStatus());
  const [lastResult, setLastResult] = useState<MetaAnalysisResult | null>(null);
  const [lastForestPlot, setLastForestPlot] = useState<ForestPlotData | null>(null);
  
  const isSupported = Platform.OS === 'web' && typeof WebAssembly !== 'undefined';
  const isReady = status.initialized && !status.loading;
  const isLoading = status.loading;
  const error = status.error;
  
  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = webRService.subscribe(setStatus);
    return unsubscribe;
  }, []);
  
  // Initialize WebR
  const initialize = useCallback(async () => {
    if (!isSupported) {
      throw new Error('WebR is only supported in web browsers');
    }
    await webRService.initialize();
  }, [isSupported]);
  
  // Run meta-analysis
  const runAnalysis = useCallback(async (
    data: { study: string; yi: number; vi: number }[],
    options?: { model?: 'FE' | 'RE' }
  ): Promise<MetaAnalysisResult> => {
    const result = await webRService.runMetaAnalysis(data, options);
    setLastResult(result);
    return result;
  }, []);
  
  // Calculate effect sizes
  const calculateEffectSizes = useCallback(async (
    data: Parameters<typeof webRService.calculateEffectSizes>[0],
    measure?: 'SMD' | 'MD' | 'OR' | 'RR' | 'RD'
  ) => {
    return webRService.calculateEffectSizes(data, measure);
  }, []);
  
  // Run meta-regression
  const runMetaRegression = useCallback(async (
    data: { study: string; yi: number; vi: number; moderator: number }[]
  ) => {
    return webRService.runMetaRegression(data);
  }, []);
  
  // Generate forest plot data
  const generateForestPlot = useCallback(async (
    data: { study: string; yi: number; vi: number }[],
    options?: { model?: 'FE' | 'RE'; title?: string }
  ): Promise<ForestPlotData> => {
    const result = await webRService.generateForestPlotData(data, options);
    setLastForestPlot(result);
    return result;
  }, []);
  
  return {
    status,
    isSupported,
    isReady,
    isLoading,
    error,
    initialize,
    runAnalysis,
    calculateEffectSizes,
    runMetaRegression,
    generateForestPlot,
    lastResult,
    lastForestPlot,
  };
}

export default useOfflineAnalysis;
