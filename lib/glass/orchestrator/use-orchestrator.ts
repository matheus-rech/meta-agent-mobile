/**
 * useOrchestrator Hook
 * 
 * Central state management hook for the Glass Orchestrator.
 * Coordinates data type detection, analysis suggestions, and R code generation.
 */

import { useState, useCallback, useMemo } from 'react';
import { detectDataType, getDataTypeLabel } from './data-type-detector';
import { suggestAnalysis, getEffectMeasureName } from './analysis-suggester';
import { generateRCode } from './r-code-generator';
import {
  DataType,
  DataTypeResult,
  AnalysisSuggestion,
  GeneratedCode,
  ColumnMapping,
  OrchestratorState,
  SpreadsheetColumn,
  SpreadsheetRow,
  EffectMeasure
} from './types';

/**
 * Result of the analyzeData function
 */
export interface AnalysisResult {
  detection: DataTypeResult;
  suggestion: AnalysisSuggestion;
  generatedCode: GeneratedCode;
  columnMapping: ColumnMapping;
}

/**
 * Return type of the useOrchestrator hook
 */
export interface UseOrchestratorReturn extends OrchestratorState {
  /** Analyze spreadsheet data and generate suggestions */
  analyzeData: (
    columns: SpreadsheetColumn[],
    rows: SpreadsheetRow[]
  ) => AnalysisResult | null;
  
  /** Regenerate R code with different effect measure or mapping */
  regenerateCode: (
    measure?: EffectMeasure,
    customMapping?: Partial<ColumnMapping>
  ) => GeneratedCode | null;
  
  /** Update column mapping manually */
  updateMapping: (mapping: Partial<ColumnMapping>) => void;
  
  /** Change the selected effect measure */
  changeEffectMeasure: (measure: EffectMeasure) => void;
  
  /** Reset orchestrator state */
  reset: () => void;
  
  /** Get human-readable data type label */
  getDataTypeLabel: (type: DataType) => string;
  
  /** Get human-readable effect measure name */
  getEffectMeasureName: (measure: EffectMeasure) => string;
  
  /** Current selected effect measure */
  selectedMeasure: EffectMeasure | null;
}

/**
 * Auto-map columns based on detection results
 */
function autoMapColumns(
  columns: SpreadsheetColumn[],
  detection: DataTypeResult
): ColumnMapping {
  const mapping: ColumnMapping = { study: 'study' };
  const columnKeys = columns.map(c => c.key);
  
  // Helper to find a column that matches any of the patterns
  const findColumn = (patterns: string[]): string | undefined => {
    for (const pattern of patterns) {
      const normalizedPattern = pattern.toLowerCase().replace(/[_\s-]+/g, '_');
      for (const col of columnKeys) {
        const normalizedCol = col.toLowerCase().replace(/[_\s-]+/g, '_');
        if (normalizedCol === normalizedPattern || 
            normalizedCol.includes(normalizedPattern) ||
            normalizedPattern.includes(normalizedCol)) {
          return col;
        }
      }
    }
    return undefined;
  };
  
  // Map study identifier
  const studyCol = findColumn(['study', 'author', 'study_id', 'studyid', 'id', 'name']);
  if (studyCol) mapping.study = studyCol;
  
  // Map year
  const yearCol = findColumn(['year', 'pub_year', 'publication_year']);
  if (yearCol) mapping.year = yearCol;
  
  // Map based on data type
  switch (detection.type) {
    case DataType.BINARY:
      mapping.events_treatment = findColumn(['events_treatment', 'events_treat', 'e_treatment', 'event_t', 'ai']);
      mapping.events_control = findColumn(['events_control', 'events_ctrl', 'e_control', 'event_c', 'ci']);
      mapping.n_treatment = findColumn(['n_treatment', 'n_treat', 'n_t', 'total_treatment']);
      mapping.n_control = findColumn(['n_control', 'n_ctrl', 'n_c', 'total_control']);
      break;
      
    case DataType.CONTINUOUS:
      mapping.mean_treatment = findColumn(['mean_treatment', 'mean_treat', 'mean_t', 'm1i']);
      mapping.mean_control = findColumn(['mean_control', 'mean_ctrl', 'mean_c', 'm2i']);
      mapping.sd_treatment = findColumn(['sd_treatment', 'sd_treat', 'sd_t', 'sd1i']);
      mapping.sd_control = findColumn(['sd_control', 'sd_ctrl', 'sd_c', 'sd2i']);
      mapping.n_treatment = findColumn(['n_treatment', 'n_treat', 'n_t', 'n1i']);
      mapping.n_control = findColumn(['n_control', 'n_ctrl', 'n_c', 'n2i']);
      break;
      
    case DataType.PRECALCULATED:
      mapping.effect_size = findColumn(['effect_size', 'es', 'yi', 'smd', 'or', 'rr', 'hr', 'effect']);
      mapping.se = findColumn(['se', 'sei', 'standard_error']);
      mapping.variance = findColumn(['vi', 'variance', 'var']);
      mapping.ci_lower = findColumn(['ci_lower', 'lower_ci', 'lower', 'ci_lb']);
      mapping.ci_upper = findColumn(['ci_upper', 'upper_ci', 'upper', 'ci_ub']);
      break;
      
    case DataType.DIAGNOSTIC:
      mapping.tp = findColumn(['tp', 'true_positive', 'true_pos']);
      mapping.fp = findColumn(['fp', 'false_positive', 'false_pos']);
      mapping.fn = findColumn(['fn', 'false_negative', 'false_neg']);
      mapping.tn = findColumn(['tn', 'true_negative', 'true_neg']);
      break;
      
    case DataType.CORRELATION:
      mapping.r = findColumn(['r', 'correlation', 'cor', 'rho']);
      mapping.n = findColumn(['n', 'sample_size', 'n_total']);
      break;
      
    case DataType.HAZARD_RATIO:
      mapping.hr = findColumn(['hr', 'hazard_ratio']);
      mapping.log_hr = findColumn(['log_hr', 'loghr']);
      mapping.se = findColumn(['se', 'sei', 'standard_error']);
      mapping.ci_lower = findColumn(['ci_lower', 'lower_ci', 'lower']);
      mapping.ci_upper = findColumn(['ci_upper', 'upper_ci', 'upper']);
      break;
  }
  
  // Also use matched columns from detection
  for (const col of detection.matchedColumns) {
    const normalizedCol = col.toLowerCase().replace(/[_\s-]+/g, '_');
    
    // Binary
    if (normalizedCol.includes('event') && normalizedCol.includes('treat') && !mapping.events_treatment) {
      mapping.events_treatment = col;
    }
    if (normalizedCol.includes('event') && (normalizedCol.includes('ctrl') || normalizedCol.includes('control')) && !mapping.events_control) {
      mapping.events_control = col;
    }
    
    // Continuous
    if (normalizedCol.includes('mean') && normalizedCol.includes('treat') && !mapping.mean_treatment) {
      mapping.mean_treatment = col;
    }
    if (normalizedCol.includes('mean') && (normalizedCol.includes('ctrl') || normalizedCol.includes('control')) && !mapping.mean_control) {
      mapping.mean_control = col;
    }
    if (normalizedCol.includes('sd') && normalizedCol.includes('treat') && !mapping.sd_treatment) {
      mapping.sd_treatment = col;
    }
    if (normalizedCol.includes('sd') && (normalizedCol.includes('ctrl') || normalizedCol.includes('control')) && !mapping.sd_control) {
      mapping.sd_control = col;
    }
    
    // Sample sizes
    if ((normalizedCol === 'n_treat' || normalizedCol === 'n_treatment' || normalizedCol === 'n1i') && !mapping.n_treatment) {
      mapping.n_treatment = col;
    }
    if ((normalizedCol === 'n_ctrl' || normalizedCol === 'n_control' || normalizedCol === 'n2i') && !mapping.n_control) {
      mapping.n_control = col;
    }
    
    // Diagnostic
    if ((normalizedCol === 'tp' || normalizedCol === 'true_positive') && !mapping.tp) {
      mapping.tp = col;
    }
    if ((normalizedCol === 'fp' || normalizedCol === 'false_positive') && !mapping.fp) {
      mapping.fp = col;
    }
    if ((normalizedCol === 'fn' || normalizedCol === 'false_negative') && !mapping.fn) {
      mapping.fn = col;
    }
    if ((normalizedCol === 'tn' || normalizedCol === 'true_negative') && !mapping.tn) {
      mapping.tn = col;
    }
  }
  
  return mapping;
}

/**
 * Main orchestrator hook
 */
export function useOrchestrator(): UseOrchestratorReturn {
  const [state, setState] = useState<OrchestratorState>({
    detection: null,
    suggestion: null,
    generatedCode: null,
    columnMapping: null,
    isAnalyzing: false,
    error: null
  });
  
  const [selectedMeasure, setSelectedMeasure] = useState<EffectMeasure | null>(null);
  
  /**
   * Analyze spreadsheet data and generate suggestions
   */
  const analyzeData = useCallback((
    columns: SpreadsheetColumn[],
    rows: SpreadsheetRow[]
  ): AnalysisResult | null => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      // Step 1: Detect data type
      const detection = detectDataType(columns, rows);
      
      if (detection.type === DataType.UNKNOWN) {
        setState({
          detection,
          suggestion: null,
          generatedCode: null,
          columnMapping: null,
          isAnalyzing: false,
          error: 'Could not detect data type. Please check column names.'
        });
        return null;
      }
      
      // Step 2: Generate suggestions
      const suggestion = suggestAnalysis(detection, rows.length);
      
      // Step 3: Auto-generate column mapping
      const columnMapping = autoMapColumns(columns, detection);
      
      // Step 4: Generate R code
      const generatedCode = generateRCode(suggestion, columnMapping);
      
      // Update selected measure
      setSelectedMeasure(suggestion.defaultMeasure);
      
      setState({
        detection,
        suggestion,
        generatedCode,
        columnMapping,
        isAnalyzing: false,
        error: null
      });
      
      return { detection, suggestion, generatedCode, columnMapping };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));
      return null;
    }
  }, []);
  
  /**
   * Regenerate R code with different effect measure or mapping
   */
  const regenerateCode = useCallback((
    measure?: EffectMeasure,
    customMapping?: Partial<ColumnMapping>
  ): GeneratedCode | null => {
    if (!state.suggestion || !state.columnMapping) {
      return null;
    }
    
    const effectMeasure = measure || selectedMeasure || state.suggestion.defaultMeasure;
    const mapping = customMapping 
      ? { ...state.columnMapping, ...customMapping }
      : state.columnMapping;
    
    try {
      const generatedCode = generateRCode(state.suggestion, mapping, effectMeasure);
      
      if (measure) {
        setSelectedMeasure(measure);
      }
      
      setState(prev => ({
        ...prev,
        generatedCode,
        columnMapping: mapping,
        error: null
      }));
      
      return generatedCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Code generation failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [state.suggestion, state.columnMapping, selectedMeasure]);
  
  /**
   * Update column mapping manually
   */
  const updateMapping = useCallback((mapping: Partial<ColumnMapping>) => {
    if (!state.columnMapping) return;
    
    const newMapping = { ...state.columnMapping, ...mapping };
    setState(prev => ({ ...prev, columnMapping: newMapping }));
    
    // Regenerate code with new mapping
    if (state.suggestion) {
      const measure = selectedMeasure || state.suggestion.defaultMeasure;
      const generatedCode = generateRCode(state.suggestion, newMapping, measure);
      setState(prev => ({ ...prev, generatedCode }));
    }
  }, [state.columnMapping, state.suggestion, selectedMeasure]);
  
  /**
   * Change the selected effect measure
   */
  const changeEffectMeasure = useCallback((measure: EffectMeasure) => {
    setSelectedMeasure(measure);
    regenerateCode(measure);
  }, [regenerateCode]);
  
  /**
   * Reset orchestrator state
   */
  const reset = useCallback(() => {
    setState({
      detection: null,
      suggestion: null,
      generatedCode: null,
      columnMapping: null,
      isAnalyzing: false,
      error: null
    });
    setSelectedMeasure(null);
  }, []);
  
  return {
    ...state,
    selectedMeasure,
    analyzeData,
    regenerateCode,
    updateMapping,
    changeEffectMeasure,
    reset,
    getDataTypeLabel,
    getEffectMeasureName
  };
}

/**
 * Utility function to create a summary message from analysis results
 */
export function createAnalysisSummary(result: AnalysisResult): string {
  const { detection, suggestion } = result;
  
  let summary = `**Data Type Detected:** ${getDataTypeLabel(detection.type)} (${Math.round(detection.confidence * 100)}% confidence)\n\n`;
  
  summary += `**Matched Columns:** ${detection.matchedColumns.join(', ')}\n\n`;
  
  summary += `**Recommended Analysis:**\n`;
  summary += `- Effect Measure: ${suggestion.defaultMeasure} (${getEffectMeasureName(suggestion.defaultMeasure)})\n`;
  summary += `- Model: ${suggestion.model.type}-effects with ${suggestion.model.method} estimation\n`;
  summary += `- ${suggestion.analyses.filter(a => a.required).length} required analyses, ${suggestion.analyses.filter(a => !a.required).length} optional\n\n`;
  
  if (detection.warnings.length > 0) {
    summary += `**Warnings:**\n`;
    detection.warnings.forEach(w => {
      summary += `- ${w}\n`;
    });
    summary += '\n';
  }
  
  summary += suggestion.explanation;
  
  return summary;
}

/**
 * Export types for external use
 */
export type {
  DataType,
  DataTypeResult,
  AnalysisSuggestion,
  GeneratedCode,
  ColumnMapping,
  OrchestratorState,
  SpreadsheetColumn,
  SpreadsheetRow,
  EffectMeasure
};
