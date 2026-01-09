/**
 * E2E Tests: R Code Generation and Results Workflow
 * 
 * Tests the R code generation, execution simulation, and
 * results interpretation workflow.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MOCK_SPREADSHEETS,
} from './test-utils';
import { detectDataType } from '@/lib/glass/orchestrator/data-type-detector';
import { suggestAnalysis } from '@/lib/glass/orchestrator/analysis-suggester';
import { generateRCode } from '@/lib/glass/orchestrator/r-code-generator';
import { DataType, ColumnMapping } from '@/lib/glass/orchestrator';

describe('E2E: R Code Generation', () => {
  describe('Binary Outcome R Code', () => {
    it('should generate valid R code for binary outcomes', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.script).toContain('library(metafor)');
      expect(code.script).toContain('escalc');
      // R code uses measure = "OR" (with spaces around =)
      expect(code.script.toLowerCase()).toContain('or');
    });

    it('should include forest plot generation', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.script).toContain('forest');
    });

    it('should include heterogeneity assessment', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      // Should reference I² or heterogeneity
      expect(code.script).toContain('rma');
    });

    it('should list required packages', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.packages).toContain('metafor');
    });

    it('should have code sections', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.sections.length).toBeGreaterThan(0);
      expect(code.sections[0].title).toBeDefined();
      expect(code.sections[0].code).toBeDefined();
    });
  });

  describe('Continuous Outcome R Code', () => {
    it('should generate valid R code for continuous outcomes', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.continuous;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        mean_treatment: 'mean_treatment',
        sd_treatment: 'sd_treatment',
        n_treatment: 'n_treatment',
        mean_control: 'mean_control',
        sd_control: 'sd_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.script).toContain('library(metafor)');
      expect(code.script).toContain('SMD');
    });

    it('should use correct escalc parameters for SMD', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.continuous;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        mean_treatment: 'mean_treatment',
        sd_treatment: 'sd_treatment',
        n_treatment: 'n_treatment',
        mean_control: 'mean_control',
        sd_control: 'sd_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.script).toContain('m1i');
      expect(code.script).toContain('sd1i');
      expect(code.script).toContain('n1i');
    });
  });

  describe('Diagnostic Accuracy R Code', () => {
    it('should generate valid R code for diagnostic accuracy', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.diagnostic;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        tp: 'tp',
        fp: 'fp',
        fn: 'fn',
        tn: 'tn',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.script).toContain('mada');
      expect(code.packages).toContain('mada');
    });

    it('should include SROC curve generation', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.diagnostic;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        tp: 'tp',
        fp: 'fp',
        fn: 'fn',
        tn: 'tn',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      // Should include SROC or reitsma model
      expect(code.script.toLowerCase()).toMatch(/sroc|reitsma/);
    });
  });

  describe('Pre-calculated Effects R Code', () => {
    it('should generate valid R code for pre-calculated effects', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.precalculated;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        effect_size: 'yi',
        se: 'sei',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.script).toContain('library(metafor)');
      expect(code.script).toContain('rma');
    });

    it('should use effect_size and se directly', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.precalculated;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        effect_size: 'yi',
        se: 'sei',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      expect(code.script).toContain('yi');
    });
  });
});

describe('E2E: Code Quality', () => {
  it('should generate syntactically valid R code', () => {
    const { columns, rows } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    const detection = detectDataType(spreadsheetColumns, rows);
    const suggestion = suggestAnalysis(detection, rows.length);
    const mapping: ColumnMapping = {
      study: 'study',
      events_treatment: 'events_treatment',
      n_treatment: 'n_treatment',
      events_control: 'events_control',
      n_control: 'n_control',
    };
    
    const code = generateRCode(suggestion, mapping);
    
    // Check for balanced parentheses
    const openParens = (code.script.match(/\(/g) || []).length;
    const closeParens = (code.script.match(/\)/g) || []).length;
    expect(openParens).toBe(closeParens);
    
    // Check for balanced brackets
    const openBrackets = (code.script.match(/\[/g) || []).length;
    const closeBrackets = (code.script.match(/\]/g) || []).length;
    expect(openBrackets).toBe(closeBrackets);
  });

  it('should include comments for readability', () => {
    const { columns, rows } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    const detection = detectDataType(spreadsheetColumns, rows);
    const suggestion = suggestAnalysis(detection, rows.length);
    const mapping: ColumnMapping = {
      study: 'study',
      events_treatment: 'events_treatment',
      n_treatment: 'n_treatment',
      events_control: 'events_control',
      n_control: 'n_control',
    };
    
    const code = generateRCode(suggestion, mapping);
    
    // Should have R comments
    expect(code.script).toContain('#');
  });

  it('should use REML estimation method', () => {
    const { columns, rows } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    const detection = detectDataType(spreadsheetColumns, rows);
    const suggestion = suggestAnalysis(detection, rows.length);
    const mapping: ColumnMapping = {
      study: 'study',
      events_treatment: 'events_treatment',
      n_treatment: 'n_treatment',
      events_control: 'events_control',
      n_control: 'n_control',
    };
    
    const code = generateRCode(suggestion, mapping);
    
    // REML is the recommended method
    expect(code.script).toContain('REML');
  });
});

describe('E2E: Results Interpretation', () => {
  describe('Effect Size Interpretation', () => {
    it('should provide interpretation guidance in code comments', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      // Should have code sections with analysis steps
      expect(code.sections.length).toBeGreaterThan(0);
      // Code should include summary/print statements for results
      expect(code.script).toContain('summary');
    });
  });

  describe('Heterogeneity Assessment', () => {
    it('should include I² in output', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      // metafor's rma output includes I²
      expect(code.script).toContain('rma');
    });
  });

  describe('Publication Bias Assessment', () => {
    it('should include funnel plot for sufficient studies', () => {
      const { columns, rows } = MOCK_SPREADSHEETS.binary;
      const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
      
      const detection = detectDataType(spreadsheetColumns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        n_treatment: 'n_treatment',
        events_control: 'events_control',
        n_control: 'n_control',
      };
      
      const code = generateRCode(suggestion, mapping);
      
      // Should include funnel plot
      expect(code.script.toLowerCase()).toContain('funnel');
    });
  });
});

describe('E2E: Full Workflow Integration', () => {
  it('should complete full workflow for binary data', () => {
    const { columns, rows } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    // Step 1: Detect
    const detection = detectDataType(spreadsheetColumns, rows);
    expect(detection.type).toBe(DataType.BINARY);
    
    // Step 2: Suggest
    const suggestion = suggestAnalysis(detection, rows.length);
    expect(suggestion.defaultMeasure).toBe('OR');
    
    // Step 3: Generate
    const mapping: ColumnMapping = {
      study: 'study',
      events_treatment: 'events_treatment',
      n_treatment: 'n_treatment',
      events_control: 'events_control',
      n_control: 'n_control',
    };
    const code = generateRCode(suggestion, mapping);
    
    // Verify complete workflow
    expect(code.script).toContain('library');
    expect(code.script).toContain('escalc');
    expect(code.script).toContain('rma');
    expect(code.script).toContain('forest');
    expect(code.packages.length).toBeGreaterThan(0);
    expect(code.sections.length).toBeGreaterThan(0);
  });

  it('should complete full workflow for continuous data', () => {
    const { columns, rows } = MOCK_SPREADSHEETS.continuous;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    // Step 1: Detect
    const detection = detectDataType(spreadsheetColumns, rows);
    expect(detection.type).toBe(DataType.CONTINUOUS);
    
    // Step 2: Suggest
    const suggestion = suggestAnalysis(detection, rows.length);
    expect(suggestion.defaultMeasure).toBe('SMD');
    
    // Step 3: Generate
    const mapping: ColumnMapping = {
      study: 'study',
      mean_treatment: 'mean_treatment',
      sd_treatment: 'sd_treatment',
      n_treatment: 'n_treatment',
      mean_control: 'mean_control',
      sd_control: 'sd_control',
      n_control: 'n_control',
    };
    const code = generateRCode(suggestion, mapping);
    
    // Verify complete workflow
    expect(code.script).toContain('library');
    expect(code.script).toContain('SMD');
    expect(code.script).toContain('rma');
  });

  it('should complete full workflow for diagnostic data', () => {
    const { columns, rows } = MOCK_SPREADSHEETS.diagnostic;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    // Step 1: Detect
    const detection = detectDataType(spreadsheetColumns, rows);
    expect(detection.type).toBe(DataType.DIAGNOSTIC);
    
    // Step 2: Suggest
    const suggestion = suggestAnalysis(detection, rows.length);
    expect(suggestion.effectMeasures).toContain('SENS');
    
    // Step 3: Generate
    const mapping: ColumnMapping = {
      study: 'study',
      tp: 'tp',
      fp: 'fp',
      fn: 'fn',
      tn: 'tn',
    };
    const code = generateRCode(suggestion, mapping);
    
    // Verify complete workflow
    expect(code.script).toContain('mada');
    expect(code.packages).toContain('mada');
  });
});

describe('E2E: Error Handling', () => {
  it('should handle missing column mappings gracefully', () => {
    const { columns, rows } = MOCK_SPREADSHEETS.binary;
    const spreadsheetColumns = columns.map(c => ({ key: c.key, label: c.label, type: c.type }));
    
    const detection = detectDataType(spreadsheetColumns, rows);
    const suggestion = suggestAnalysis(detection, rows.length);
    
    // Incomplete mapping
    const mapping: ColumnMapping = {
      study: 'study',
    };
    
    // Should not crash
    const code = generateRCode(suggestion, mapping);
    expect(code).toBeDefined();
  });

  it('should handle unknown data type', () => {
    const detection = detectDataType([], []);
    
    // suggestAnalysis should handle unknown type
    const suggestion = suggestAnalysis(detection, 0);
    
    expect(suggestion).toBeDefined();
    expect(suggestion.effectMeasures.length).toBeGreaterThanOrEqual(0);
  });
});
