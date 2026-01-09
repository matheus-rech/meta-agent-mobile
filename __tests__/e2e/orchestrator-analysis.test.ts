/**
 * E2E Tests: Orchestrator and Analysis Workflow
 * 
 * Tests the data type detection, analysis suggestion, and
 * orchestrator integration with Glass AI.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MOCK_SPREADSHEETS,
} from './test-utils';
import { detectDataType } from '@/lib/glass/orchestrator/data-type-detector';
import { suggestAnalysis } from '@/lib/glass/orchestrator/analysis-suggester';
import { generateRCode } from '@/lib/glass/orchestrator/r-code-generator';
import { DataType } from '@/lib/glass/orchestrator';
import glassOrchestratorIntegration from '@/lib/glass/orchestrator-integration';

describe('E2E: Data Type Detection', () => {
  describe('Binary Outcome Detection', () => {
    it('should detect binary data from events and sample sizes', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.type).toBe(DataType.BINARY);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should identify required columns for binary analysis', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.matchedColumns).toContain('events_treatment');
      expect(result.matchedColumns).toContain('n_treatment');
      expect(result.matchedColumns).toContain('events_control');
      expect(result.matchedColumns).toContain('n_control');
    });

    it('should report complete rows count', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.completeRows).toBe(rows.length);
      expect(result.totalRows).toBe(rows.length);
    });
  });

  describe('Continuous Outcome Detection', () => {
    it('should detect continuous data from means and SDs', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.continuous;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.type).toBe(DataType.CONTINUOUS);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should identify mean and SD columns', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.continuous;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.matchedColumns).toContain('mean_treatment');
      expect(result.matchedColumns).toContain('sd_treatment');
      expect(result.matchedColumns).toContain('mean_control');
      expect(result.matchedColumns).toContain('sd_control');
    });
  });

  describe('Diagnostic Accuracy Detection', () => {
    it('should detect diagnostic data from TP/FP/FN/TN', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.diagnostic;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.type).toBe(DataType.DIAGNOSTIC);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should identify all diagnostic columns', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.diagnostic;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.matchedColumns).toContain('tp');
      expect(result.matchedColumns).toContain('fp');
      expect(result.matchedColumns).toContain('fn');
      expect(result.matchedColumns).toContain('tn');
    });
  });

  describe('Pre-calculated Effects Detection', () => {
    it('should detect pre-calculated effect sizes', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.precalculated;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.type).toBe(DataType.PRECALCULATED);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Unknown Data Type', () => {
    it('should return unknown for empty data', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.empty;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      expect(result.type).toBe(DataType.UNKNOWN);
    });

    it('should return unknown for incomplete data', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.invalid;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const result = detectDataType(spreadsheetColumns, rows);
      
      // Should be unknown since control group data is missing
      expect(result.type).toBe(DataType.UNKNOWN);
    });
  });
});

describe('E2E: Analysis Suggestion', () => {
  describe('Binary Analysis Suggestions', () => {
    it('should suggest OR for binary outcomes', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.effectMeasures).toContain('OR');
      expect(suggestion.defaultMeasure).toBe('OR');
    });

    it('should recommend random effects model', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.model.type).toBe('random');
      expect(suggestion.model.method).toBeDefined();
    });

    it('should include required analyses', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      const requiredAnalyses = suggestion.analyses.filter(a => a.required);
      expect(requiredAnalyses.length).toBeGreaterThan(0);
      
      // Should include forest plot
      const forestPlot = suggestion.analyses.find(a => 
        a.name.toLowerCase().includes('forest')
      );
      expect(forestPlot).toBeDefined();
    });

    it('should provide explanation', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.explanation).toBeDefined();
      expect(suggestion.explanation.length).toBeGreaterThan(0);
    });
  });

  describe('Continuous Analysis Suggestions', () => {
    it('should suggest SMD for continuous outcomes', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.continuous;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.effectMeasures).toContain('SMD');
      expect(suggestion.defaultMeasure).toBe('SMD');
    });

    it('should also offer MD as alternative', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.continuous;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.effectMeasures).toContain('MD');
    });
  });

  describe('Diagnostic Analysis Suggestions', () => {
    it('should suggest SENS and SPEC for diagnostic accuracy', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.diagnostic;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.effectMeasures).toContain('SENS');
      expect(suggestion.effectMeasures).toContain('SPEC');
    });

    it('should include DOR in suggestions', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.diagnostic;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.effectMeasures).toContain('DOR');
    });
  });

  describe('Pre-calculated Analysis Suggestions', () => {
    it('should handle pre-calculated effects', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.precalculated;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      const detection = detectDataType(spreadsheetColumns, rows);
      
      const suggestion = suggestAnalysis(detection, rows.length);
      
      expect(suggestion.defaultMeasure).toBeDefined();
      expect(suggestion.model.type).toBe('random');
    });
  });
});

describe('E2E: Glass Orchestrator Integration', () => {
  beforeEach(() => {
    glassOrchestratorIntegration.clearContext();
  });

  describe('Intent Detection', () => {
    it('should detect full workflow intent', () => {
      const intent = glassOrchestratorIntegration.detectIntent('analyze my data');
      expect(intent.intent).toBe('full');
    });

    it('should detect detection intent', () => {
      const intent = glassOrchestratorIntegration.detectIntent('what type of data is this');
      expect(intent.intent).toBe('detect');
    });

    it('should detect suggestion intent', () => {
      const intent = glassOrchestratorIntegration.detectIntent('what analysis should I use');
      expect(intent.intent).toBe('suggest');
    });

    it('should detect generate intent', () => {
      const intent = glassOrchestratorIntegration.detectIntent('generate R code');
      expect(intent.intent).toBe('generate');
    });

    it('should detect explain intent', () => {
      const intent = glassOrchestratorIntegration.detectIntent('explain odds ratio');
      expect(intent.intent).toBe('explain');
    });
  });

  describe('Message Processing', () => {
    it('should process analyze request with data', async () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const response = await glassOrchestratorIntegration.processMessage(
        'analyze my data',
        { columns: spreadsheetColumns, rows }
      );
      
      expect(response).toContain('Binary');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle missing data gracefully', async () => {
      const response = await glassOrchestratorIntegration.processMessage(
        'analyze my data'
      );
      
      expect(response).toContain('spreadsheet');
    });

    it('should explain effect measures', async () => {
      const response = await glassOrchestratorIntegration.processMessage(
        'explain odds ratio'
      );
      
      expect(response).toContain('Odds Ratio');
    });

    it('should provide help message', async () => {
      const response = await glassOrchestratorIntegration.processMessage(
        'help'
      );
      
      // Help message should contain guidance
      expect(response.length).toBeGreaterThan(0);
      expect(response.toLowerCase()).toContain('help');
    });
  });

  describe('Context Management', () => {
    it('should maintain context across calls', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      // First call sets context
      glassOrchestratorIntegration.setSpreadsheetData(spreadsheetColumns, rows);
      
      // Get context
      const context = glassOrchestratorIntegration.getContext();
      
      expect(context.detection).toBeDefined();
      expect(context.detection?.type).toBe(DataType.BINARY);
    });

    it('should clear context', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      glassOrchestratorIntegration.setSpreadsheetData(spreadsheetColumns, rows);
      glassOrchestratorIntegration.clearContext();
      
      const context = glassOrchestratorIntegration.getContext();
      
      expect(context.detection).toBeNull();
    });
  });
});

describe('E2E: Full Analysis Workflow', () => {
  it('should complete binary analysis workflow', () => {
    const { columns, rows, expectedDataType, expectedEffectMeasure } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    // Step 1: Detect data type
    const detection = detectDataType(spreadsheetColumns, rows);
    expect(detection.type).toBe(expectedDataType);
    
    // Step 2: Get analysis suggestion
    const suggestion = suggestAnalysis(detection, rows.length);
    expect(suggestion.defaultMeasure).toBe(expectedEffectMeasure);
    
    // Step 3: Generate R code
    const columnMapping = {
      study: 'study',
      events_treatment: 'events_treatment',
      n_treatment: 'n_treatment',
      events_control: 'events_control',
      n_control: 'n_control',
    };
    const code = generateRCode(suggestion, columnMapping);
    
    expect(code.script).toContain('library(metafor)');
    expect(code.script).toContain('escalc');
    expect(code.packages).toContain('metafor');
  });

  it('should complete continuous analysis workflow', () => {
    const { columns, rows, expectedDataType, expectedEffectMeasure } = MOCK_SPREADSHEETS.continuous;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    // Step 1: Detect data type
    const detection = detectDataType(spreadsheetColumns, rows);
    expect(detection.type).toBe(expectedDataType);
    
    // Step 2: Get analysis suggestion
    const suggestion = suggestAnalysis(detection, rows.length);
    expect(suggestion.defaultMeasure).toBe(expectedEffectMeasure);
    
    // Step 3: Generate R code
    const columnMapping = {
      study: 'study',
      mean_treatment: 'mean_treatment',
      sd_treatment: 'sd_treatment',
      n_treatment: 'n_treatment',
      mean_control: 'mean_control',
      sd_control: 'sd_control',
      n_control: 'n_control',
    };
    const code = generateRCode(suggestion, columnMapping);
    
    expect(code.script).toContain('library(metafor)');
    expect(code.script).toContain('SMD');
  });

  it('should complete diagnostic analysis workflow', () => {
    const { columns, rows, expectedDataType } = MOCK_SPREADSHEETS.diagnostic;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    // Step 1: Detect data type
    const detection = detectDataType(spreadsheetColumns, rows);
    expect(detection.type).toBe(expectedDataType);
    
    // Step 2: Get analysis suggestion
    const suggestion = suggestAnalysis(detection, rows.length);
    expect(suggestion.effectMeasures).toContain('SENS');
    expect(suggestion.effectMeasures).toContain('SPEC');
    
    // Step 3: Generate R code
    const columnMapping = {
      study: 'study',
      tp: 'tp',
      fp: 'fp',
      fn: 'fn',
      tn: 'tn',
    };
    const code = generateRCode(suggestion, columnMapping);
    
    expect(code.script).toContain('mada');
    expect(code.packages).toContain('mada');
  });

  it('should complete pre-calculated analysis workflow', () => {
    const { columns, rows, expectedDataType } = MOCK_SPREADSHEETS.precalculated;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    // Step 1: Detect data type
    const detection = detectDataType(spreadsheetColumns, rows);
    expect(detection.type).toBe(expectedDataType);
    
    // Step 2: Get analysis suggestion
    const suggestion = suggestAnalysis(detection, rows.length);
    expect(suggestion.defaultMeasure).toBeDefined();
    
    // Step 3: Generate R code
    const columnMapping = {
      study: 'study',
      yi: 'yi',
      sei: 'sei',
    };
    const code = generateRCode(suggestion, columnMapping);
    
    expect(code.script).toContain('library(metafor)');
    expect(code.packages).toContain('metafor');
  });
});

describe('E2E: Edge Cases', () => {
  it('should handle empty spreadsheet', () => {
    const detection = detectDataType([], []);
    
    expect(detection.type).toBe(DataType.UNKNOWN);
    expect(detection.warnings.length).toBeGreaterThan(0);
  });

  it('should handle spreadsheet with only headers', () => {
    const { columns } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    const detection = detectDataType(spreadsheetColumns, []);
    
    // With headers but no data, detection may still identify type from column names
    // but should have 0 complete rows
    expect(detection.completeRows).toBe(0);
    expect(detection.totalRows).toBe(0);
  });

  it('should handle mixed data types gracefully', () => {
    const mixedColumns = [
      { key: 'study', label: 'Study', type: 'text' as const },
      { key: 'events_treatment', label: 'Events (Tx)', type: 'number' as const },
      { key: 'mean_treatment', label: 'Mean (Tx)', type: 'number' as const },
    ];
    
    const detection = detectDataType(mixedColumns, []);
    
    // Should not crash, may return unknown
    expect(detection).toBeDefined();
  });

  it('should handle very small sample sizes', () => {
    const { columns } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    const smallRows = [
      { id: 'row1', study: 'Small 2024', year: 2024, events_treatment: 1, n_treatment: 5, events_control: 2, n_control: 5 },
    ];
    
    const detection = detectDataType(spreadsheetColumns, smallRows);
    const suggestion = suggestAnalysis(detection, smallRows.length);
    
    // Should still work - detection should identify binary data
    expect(detection.type).toBe(DataType.BINARY);
    // Small sample size should still produce valid suggestion
    expect(suggestion.defaultMeasure).toBeDefined();
  });
});
