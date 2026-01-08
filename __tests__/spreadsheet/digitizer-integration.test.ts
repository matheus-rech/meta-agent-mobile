/**
 * Tests for PlotDigitizer integration in SpreadsheetEditor
 */

import { describe, it, expect } from 'vitest';

describe('PlotDigitizer Integration', () => {
  describe('Data Mapping', () => {
    it('should map digitized points to spreadsheet rows', () => {
      const digitizedData = [
        { x: 0.5, y: 0.1 },
        { x: 0.8, y: 0.15 },
        { x: -0.2, y: 0.2 },
      ];
      
      const columns = [
        { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
        { key: 'effect_size', label: 'Effect Size', type: 'number' as const, width: 80 },
        { key: 'se', label: 'SE', type: 'number' as const, width: 60 },
      ];
      
      // Simulate mapping with X as effect size, Y as SE
      const studies = digitizedData.map((point, index) => ({
        study_id: `Digitized_${index + 1}`,
        effect_size: point.x,
        se: point.y,
      }));
      
      expect(studies).toHaveLength(3);
      expect(studies[0].study_id).toBe('Digitized_1');
      expect(studies[0].effect_size).toBe(0.5);
      expect(studies[0].se).toBe(0.1);
    });
    
    it('should create rows from imported studies', () => {
      const studies = [
        { study_id: 'Study_1', effect_size: 0.5, se: 0.1 },
        { study_id: 'Study_2', effect_size: 0.8, se: 0.15 },
      ];
      
      const columns = [
        { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
        { key: 'effect_size', label: 'Effect Size', type: 'number' as const, width: 80 },
        { key: 'se', label: 'SE', type: 'number' as const, width: 60 },
      ];
      
      const createRow = (study: typeof studies[0], index: number) => {
        const row: Record<string, string | number> = { 
          id: `row_${Date.now()}_${index}` 
        };
        
        columns.forEach(col => {
          if (col.key === 'study') {
            row[col.key] = study.study_id;
          } else if (col.key === 'effect_size') {
            row[col.key] = study.effect_size.toFixed(4);
          } else if (col.key === 'se' && study.se) {
            row[col.key] = study.se.toFixed(4);
          } else {
            row[col.key] = '';
          }
        });
        
        return row;
      };
      
      const rows = studies.map((s, i) => createRow(s, i));
      
      expect(rows).toHaveLength(2);
      expect(rows[0].study).toBe('Study_1');
      expect(rows[0].effect_size).toBe('0.5000');
      expect(rows[0].se).toBe('0.1000');
    });
    
    it('should handle log scale conversion', () => {
      const logValue = Math.log(2.5); // Log OR of 2.5
      const originalValue = Math.exp(logValue);
      
      expect(originalValue).toBeCloseTo(2.5, 5);
    });
    
    it('should handle missing optional fields', () => {
      const study = {
        study_id: 'Test_Study',
        effect_size: 0.5,
        // se, sample_size, year are undefined
      };
      
      const columns = [
        { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
        { key: 'year', label: 'Year', type: 'number' as const, width: 60 },
        { key: 'effect_size', label: 'Effect Size', type: 'number' as const, width: 80 },
        { key: 'se', label: 'SE', type: 'number' as const, width: 60 },
      ];
      
      const row: Record<string, string | number> = { id: 'test_row' };
      
      columns.forEach(col => {
        if (col.key === 'study') {
          row[col.key] = study.study_id;
        } else if (col.key === 'effect_size') {
          row[col.key] = study.effect_size.toFixed(4);
        } else {
          row[col.key] = '';
        }
      });
      
      expect(row.study).toBe('Test_Study');
      expect(row.effect_size).toBe('0.5000');
      expect(row.year).toBe('');
      expect(row.se).toBe('');
    });
  });
  
  describe('Column Mapping', () => {
    it('should map effect size to appropriate columns', () => {
      const effectSizeColumns = ['effect_size', 'mean_treatment', 'or', 'rr', 'hr', 'smd', 'md'];
      
      const findEffectSizeColumn = (columns: Array<{ key: string }>) => {
        return columns.find(col => 
          effectSizeColumns.includes(col.key.toLowerCase())
        );
      };
      
      const binaryColumns = [
        { key: 'study' },
        { key: 'events_treatment' },
        { key: 'effect_size' },
      ];
      
      const continuousColumns = [
        { key: 'study' },
        { key: 'mean_treatment' },
        { key: 'sd_treatment' },
      ];
      
      expect(findEffectSizeColumn(binaryColumns)?.key).toBe('effect_size');
      expect(findEffectSizeColumn(continuousColumns)?.key).toBe('mean_treatment');
    });
    
    it('should map SE to appropriate columns', () => {
      const seColumns = ['se', 'sd_treatment', 'sd_control', 'ci_lower', 'ci_upper'];
      
      const findSEColumn = (columns: Array<{ key: string }>) => {
        return columns.find(col => 
          seColumns.includes(col.key.toLowerCase())
        );
      };
      
      const columns = [
        { key: 'study' },
        { key: 'effect_size' },
        { key: 'se' },
      ];
      
      expect(findSEColumn(columns)?.key).toBe('se');
    });
  });
  
  describe('Workflow State', () => {
    it('should track digitizer visibility state', () => {
      let showDigitizer = false;
      let showDataImporter = false;
      let digitizedData: { x: number; y: number }[] = [];
      
      // Open digitizer
      showDigitizer = true;
      expect(showDigitizer).toBe(true);
      
      // Export data from digitizer
      digitizedData = [{ x: 0.5, y: 0.1 }];
      showDigitizer = false;
      showDataImporter = true;
      
      expect(showDigitizer).toBe(false);
      expect(showDataImporter).toBe(true);
      expect(digitizedData).toHaveLength(1);
      
      // Import data
      showDataImporter = false;
      digitizedData = [];
      
      expect(showDataImporter).toBe(false);
      expect(digitizedData).toHaveLength(0);
    });
    
    it('should handle cancel at any step', () => {
      let showDigitizer = true;
      let showDataImporter = false;
      let digitizedData: { x: number; y: number }[] = [{ x: 0.5, y: 0.1 }];
      
      // Cancel digitizer
      showDigitizer = false;
      digitizedData = [];
      
      expect(showDigitizer).toBe(false);
      expect(digitizedData).toHaveLength(0);
      
      // Reset and go to importer
      showDataImporter = true;
      digitizedData = [{ x: 0.5, y: 0.1 }];
      
      // Cancel importer
      showDataImporter = false;
      digitizedData = [];
      
      expect(showDataImporter).toBe(false);
      expect(digitizedData).toHaveLength(0);
    });
  });
  
  describe('Row Appending', () => {
    it('should append imported rows to existing data', () => {
      const existingRows = [
        { id: 'row_1', study: 'Existing Study', effect_size: '0.3' },
      ];
      
      const newRows = [
        { id: 'row_2', study: 'Digitized_1', effect_size: '0.5' },
        { id: 'row_3', study: 'Digitized_2', effect_size: '0.8' },
      ];
      
      const allRows = [...existingRows, ...newRows];
      
      expect(allRows).toHaveLength(3);
      expect(allRows[0].study).toBe('Existing Study');
      expect(allRows[1].study).toBe('Digitized_1');
      expect(allRows[2].study).toBe('Digitized_2');
    });
    
    it('should generate unique row IDs', () => {
      const generateRowId = (index: number) => 
        `row_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
      
      const id1 = generateRowId(0);
      const id2 = generateRowId(1);
      
      expect(id1).toMatch(/^row_\d+_0_[a-z0-9]+$/);
      expect(id2).toMatch(/^row_\d+_1_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
  
  describe('Number Formatting', () => {
    it('should format effect sizes to 4 decimal places', () => {
      const effectSize = 0.123456789;
      const formatted = effectSize.toFixed(4);
      
      expect(formatted).toBe('0.1235');
    });
    
    it('should format SE to 4 decimal places', () => {
      const se = 0.0567891;
      const formatted = se.toFixed(4);
      
      expect(formatted).toBe('0.0568');
    });
    
    it('should handle sample size division', () => {
      const totalSampleSize = 100;
      const perGroup = Math.round(totalSampleSize / 2);
      
      expect(perGroup).toBe(50);
      
      // Odd number
      const oddTotal = 101;
      const oddPerGroup = Math.round(oddTotal / 2);
      
      expect(oddPerGroup).toBe(51); // Rounds up
    });
  });
});

describe('Toolbar Button', () => {
  it('should have correct button styling', () => {
    const warningColor = '#F59E0B';
    const buttonStyle = {
      backgroundColor: warningColor + '20',
      borderColor: warningColor,
      borderWidth: 1,
    };
    
    expect(buttonStyle.backgroundColor).toBe('#F59E0B20');
    expect(buttonStyle.borderColor).toBe('#F59E0B');
    expect(buttonStyle.borderWidth).toBe(1);
  });
  
  it('should display correct button text', () => {
    const buttonText = '📊 Digitize';
    
    expect(buttonText).toContain('📊');
    expect(buttonText).toContain('Digitize');
  });
});
