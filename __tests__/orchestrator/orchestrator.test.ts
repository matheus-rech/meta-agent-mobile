/**
 * MVP Orchestrator Tests
 * 
 * Comprehensive tests for data type detection, analysis suggestion,
 * and R code generation.
 */

import { describe, it, expect } from 'vitest';
import {
  detectDataType,
  suggestAnalysis,
  generateRCode,
  getDataTypeLabel,
  getEffectMeasureName,
  DataType,
  ColumnMapping
} from '../../lib/glass/orchestrator';

describe('DataTypeDetector', () => {
  describe('Binary outcome detection', () => {
    it('should detect binary data with standard column names', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treatment', label: 'Events Treatment' },
        { key: 'events_control', label: 'Events Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = [
        { study: 'Smith 2020', events_treatment: 10, events_control: 5, n_treatment: 50, n_control: 50 },
        { study: 'Jones 2021', events_treatment: 15, events_control: 8, n_treatment: 60, n_control: 60 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.BINARY);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matchedColumns).toContain('events_treatment');
      expect(result.matchedColumns).toContain('events_control');
    });
    
    it('should detect binary data with abbreviated column names', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treat', label: 'Events Treat' },
        { key: 'events_ctrl', label: 'Events Ctrl' },
        { key: 'n_treat', label: 'N Treat' },
        { key: 'n_ctrl', label: 'N Ctrl' }
      ];
      const rows = [
        { study: 'Smith 2020', events_treat: 10, events_ctrl: 5, n_treat: 50, n_ctrl: 50 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.BINARY);
    });
    
    it('should warn about zero events', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treatment', label: 'Events Treatment' },
        { key: 'events_control', label: 'Events Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = [
        { study: 'Smith 2020', events_treatment: 0, events_control: 5, n_treatment: 50, n_control: 50 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.warnings.some(w => w.includes('zero events'))).toBe(true);
    });
  });
  
  describe('Continuous outcome detection', () => {
    it('should detect continuous data with standard column names', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'mean_treatment', label: 'Mean Treatment' },
        { key: 'mean_control', label: 'Mean Control' },
        { key: 'sd_treatment', label: 'SD Treatment' },
        { key: 'sd_control', label: 'SD Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = [
        { study: 'Smith 2020', mean_treatment: 5.2, mean_control: 4.1, sd_treatment: 1.2, sd_control: 1.3, n_treatment: 50, n_control: 50 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.CONTINUOUS);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
    
    it('should detect continuous data with metafor notation', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'm1i', label: 'Mean 1' },
        { key: 'm2i', label: 'Mean 2' },
        { key: 'sd1i', label: 'SD 1' },
        { key: 'sd2i', label: 'SD 2' },
        { key: 'n1i', label: 'N 1' },
        { key: 'n2i', label: 'N 2' }
      ];
      const rows = [
        { study: 'Smith 2020', m1i: 5.2, m2i: 4.1, sd1i: 1.2, sd2i: 1.3, n1i: 50, n2i: 50 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.CONTINUOUS);
    });
  });
  
  describe('Diagnostic accuracy detection', () => {
    it('should detect diagnostic data with 2x2 table columns', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'tp', label: 'True Positive' },
        { key: 'fp', label: 'False Positive' },
        { key: 'fn', label: 'False Negative' },
        { key: 'tn', label: 'True Negative' }
      ];
      const rows = [
        { study: 'Smith 2020', tp: 80, fp: 10, fn: 5, tn: 105 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.DIAGNOSTIC);
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });
  
  describe('Pre-calculated effect sizes detection', () => {
    it('should detect pre-calculated data with effect_size and se', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'effect_size', label: 'Effect Size' },
        { key: 'se', label: 'Standard Error' }
      ];
      const rows = [
        { study: 'Smith 2020', effect_size: 0.5, se: 0.15 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.PRECALCULATED);
    });
    
    it('should detect pre-calculated data with yi and vi (metafor notation)', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'yi', label: 'Effect Size' },
        { key: 'vi', label: 'Variance' }
      ];
      const rows = [
        { study: 'Smith 2020', yi: 0.5, vi: 0.0225 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.PRECALCULATED);
    });
  });
  
  describe('Correlation detection', () => {
    it('should detect correlation data with explicit column names', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'correlation', label: 'Correlation' },
        { key: 'sample_size', label: 'Sample Size' }
      ];
      const rows = [
        { study: 'Smith 2020', correlation: 0.35, sample_size: 100 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.CORRELATION);
    });
  });
  
  describe('Hazard ratio detection', () => {
    it('should detect hazard ratio data with HR and CI', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'hr', label: 'Hazard Ratio' },
        { key: 'ci_lower', label: 'CI Lower' },
        { key: 'ci_upper', label: 'CI Upper' }
      ];
      const rows = [
        { study: 'Smith 2020', hr: 0.75, ci_lower: 0.55, ci_upper: 1.02 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.HAZARD_RATIO);
    });
  });
  
  describe('Unknown data type', () => {
    it('should return unknown for unrecognized columns', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'foo', label: 'Foo' },
        { key: 'bar', label: 'Bar' }
      ];
      const rows = [
        { study: 'Smith 2020', foo: 1, bar: 2 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.type).toBe(DataType.UNKNOWN);
      expect(result.confidence).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
  
  describe('Warnings', () => {
    it('should warn about small number of studies', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'effect_size', label: 'Effect Size' },
        { key: 'se', label: 'Standard Error' }
      ];
      const rows = [
        { study: 'Smith 2020', effect_size: 0.5, se: 0.15 },
        { study: 'Jones 2021', effect_size: 0.3, se: 0.12 }
      ];
      
      const result = detectDataType(columns, rows);
      
      expect(result.warnings.some(w => w.includes('Very few studies'))).toBe(true);
    });
    
    it('should warn about small number of studies with < 10 studies', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'effect_size', label: 'Effect Size' },
        { key: 'se', label: 'Standard Error' }
      ];
      const rows = Array.from({ length: 5 }, (_, i) => ({
        study: `Study ${i + 1}`,
        effect_size: 0.5 + i * 0.1,
        se: 0.15
      }));
      
      const result = detectDataType(columns, rows);
      
      // Check for small study warning (< 10 studies)
      expect(result.warnings.some(w => w.includes('Small number of studies') || w.includes('publication bias'))).toBe(true);
    });
  });
});

describe('AnalysisSuggester', () => {
  describe('Binary outcome suggestions', () => {
    it('should suggest OR as default for binary data', () => {
      const detection = {
        type: DataType.BINARY,
        confidence: 0.9,
        matchedColumns: ['events_treatment', 'events_control', 'n_treatment', 'n_control'],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      };
      
      const suggestion = suggestAnalysis(detection, 10);
      
      expect(suggestion.defaultMeasure).toBe('OR');
      expect(suggestion.effectMeasures).toContain('OR');
      expect(suggestion.effectMeasures).toContain('RR');
      expect(suggestion.model.type).toBe('random');
    });
    
    it('should include publication bias tests for >= 10 studies', () => {
      const detection = {
        type: DataType.BINARY,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 15,
        totalRows: 15
      };
      
      const suggestion = suggestAnalysis(detection, 15);
      
      expect(suggestion.analyses.some(a => a.name === 'Funnel Plot')).toBe(true);
      expect(suggestion.analyses.some(a => a.name === "Egger's Test")).toBe(true);
    });
    
    it('should not include publication bias tests for < 10 studies', () => {
      const detection = {
        type: DataType.BINARY,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 5,
        totalRows: 5
      };
      
      const suggestion = suggestAnalysis(detection, 5);
      
      expect(suggestion.analyses.some(a => a.name === 'Funnel Plot')).toBe(false);
    });
  });
  
  describe('Continuous outcome suggestions', () => {
    it('should suggest SMD as default for continuous data', () => {
      const detection = {
        type: DataType.CONTINUOUS,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      };
      
      const suggestion = suggestAnalysis(detection, 10);
      
      expect(suggestion.defaultMeasure).toBe('SMD');
      expect(suggestion.effectMeasures).toContain('SMD');
      expect(suggestion.effectMeasures).toContain('MD');
    });
  });
  
  describe('Diagnostic accuracy suggestions', () => {
    it('should suggest bivariate model for diagnostic data', () => {
      const detection = {
        type: DataType.DIAGNOSTIC,
        confidence: 0.95,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      };
      
      const suggestion = suggestAnalysis(detection, 10);
      
      expect(suggestion.model.method).toBe('bivariate');
      expect(suggestion.analyses.some(a => a.name === 'SROC Curve')).toBe(true);
    });
  });
});

describe('RCodeGenerator', () => {
  describe('Binary outcome code generation', () => {
    it('should generate valid R code for binary outcomes', () => {
      const suggestion = suggestAnalysis({
        type: DataType.BINARY,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      }, 10);
      
      const mapping: ColumnMapping = {
        study: 'study',
        events_treatment: 'events_treatment',
        events_control: 'events_control',
        n_treatment: 'n_treatment',
        n_control: 'n_control'
      };
      
      const result = generateRCode(suggestion, mapping, 'OR');
      
      expect(result.script).toContain('library(metafor)');
      expect(result.script).toContain('escalc');
      expect(result.script).toContain('measure = "OR"');
      expect(result.script).toContain('rma(');
      expect(result.script).toContain('forest(');
      expect(result.packages).toContain('metafor');
    });
    
    it('should include funnel plot code', () => {
      const suggestion = suggestAnalysis({
        type: DataType.BINARY,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      }, 10);
      
      const mapping: ColumnMapping = { study: 'study' };
      const result = generateRCode(suggestion, mapping);
      
      expect(result.script).toContain('funnel(');
      expect(result.script).toContain('regtest(');
    });
  });
  
  describe('Continuous outcome code generation', () => {
    it('should generate valid R code for continuous outcomes', () => {
      const suggestion = suggestAnalysis({
        type: DataType.CONTINUOUS,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      }, 10);
      
      const mapping: ColumnMapping = {
        study: 'study',
        mean_treatment: 'mean_treatment',
        mean_control: 'mean_control',
        sd_treatment: 'sd_treatment',
        sd_control: 'sd_control',
        n_treatment: 'n_treatment',
        n_control: 'n_control'
      };
      
      const result = generateRCode(suggestion, mapping, 'SMD');
      
      expect(result.script).toContain('measure = "SMD"');
      expect(result.script).toContain('m1i =');
      expect(result.script).toContain('sd1i =');
    });
  });
  
  describe('Diagnostic accuracy code generation', () => {
    it('should generate valid R code for diagnostic accuracy', () => {
      const suggestion = suggestAnalysis({
        type: DataType.DIAGNOSTIC,
        confidence: 0.95,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      }, 10);
      
      const mapping: ColumnMapping = {
        study: 'study',
        tp: 'tp',
        fp: 'fp',
        fn: 'fn',
        tn: 'tn'
      };
      
      const result = generateRCode(suggestion, mapping);
      
      expect(result.script).toContain('library(mada)');
      expect(result.script).toContain('reitsma(');
      expect(result.packages).toContain('mada');
    });
  });
  
  describe('Correlation code generation', () => {
    it('should generate valid R code for correlations', () => {
      const suggestion = suggestAnalysis({
        type: DataType.CORRELATION,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      }, 10);
      
      const mapping: ColumnMapping = {
        study: 'study',
        r: 'r',
        n: 'n'
      };
      
      const result = generateRCode(suggestion, mapping);
      
      expect(result.script).toContain('measure = "ZCOR"');
      expect(result.script).toContain('transf.ztor');
    });
  });
  
  describe('Hazard ratio code generation', () => {
    it('should generate valid R code for hazard ratios', () => {
      const suggestion = suggestAnalysis({
        type: DataType.HAZARD_RATIO,
        confidence: 0.9,
        matchedColumns: [],
        missingColumns: [],
        optionalColumns: [],
        warnings: [],
        completeRows: 10,
        totalRows: 10
      }, 10);
      
      const mapping: ColumnMapping = {
        study: 'study',
        hr: 'hr',
        ci_lower: 'ci_lower',
        ci_upper: 'ci_upper'
      };
      
      const result = generateRCode(suggestion, mapping);
      
      expect(result.script).toContain('log(dat$hr)');
      expect(result.script).toContain('transf = exp');
    });
  });
});

describe('Utility functions', () => {
  describe('getDataTypeLabel', () => {
    it('should return correct labels for all data types', () => {
      expect(getDataTypeLabel(DataType.BINARY)).toBe('Binary Outcomes (Events)');
      expect(getDataTypeLabel(DataType.CONTINUOUS)).toBe('Continuous Outcomes (Means)');
      expect(getDataTypeLabel(DataType.DIAGNOSTIC)).toBe('Diagnostic Test Accuracy');
      expect(getDataTypeLabel(DataType.PRECALCULATED)).toBe('Pre-calculated Effect Sizes');
      expect(getDataTypeLabel(DataType.CORRELATION)).toBe('Correlations');
      expect(getDataTypeLabel(DataType.HAZARD_RATIO)).toBe('Time-to-Event (Hazard Ratios)');
      expect(getDataTypeLabel(DataType.UNKNOWN)).toBe('Unknown');
    });
  });
  
  describe('getEffectMeasureName', () => {
    it('should return correct names for all effect measures', () => {
      expect(getEffectMeasureName('OR')).toBe('Odds Ratio');
      expect(getEffectMeasureName('RR')).toBe('Risk Ratio');
      expect(getEffectMeasureName('SMD')).toBe('Standardized Mean Difference');
      expect(getEffectMeasureName('MD')).toBe('Mean Difference');
      expect(getEffectMeasureName('HR')).toBe('Hazard Ratio');
      expect(getEffectMeasureName('ZCOR')).toBe("Fisher's Z Correlation");
    });
  });
});
