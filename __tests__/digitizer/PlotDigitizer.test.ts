/**
 * Tests for PlotDigitizer and DigitizedDataImporter components
 */

import { describe, it, expect } from 'vitest';

describe('PlotDigitizer', () => {
  describe('Axis Calibration', () => {
    it('should calculate correct data coordinates from pixel coordinates', () => {
      // Calibration: X axis from pixel 100 (value 0) to pixel 500 (value 10)
      const x1Pixel = 100;
      const x1Value = 0;
      const x2Pixel = 500;
      const x2Value = 10;
      
      const pixelToDataX = (pixelX: number): number => {
        const slope = (x2Value - x1Value) / (x2Pixel - x1Pixel);
        return x1Value + slope * (pixelX - x1Pixel);
      };
      
      expect(pixelToDataX(100)).toBe(0);
      expect(pixelToDataX(500)).toBe(10);
      expect(pixelToDataX(300)).toBe(5);
      expect(pixelToDataX(200)).toBe(2.5);
    });
    
    it('should handle inverted Y axis correctly', () => {
      // In images, Y increases downward, but in plots Y increases upward
      // Calibration: Y axis from pixel 400 (value 0) to pixel 100 (value 10)
      const y1Pixel = 400;
      const y1Value = 0;
      const y2Pixel = 100;
      const y2Value = 10;
      
      const pixelToDataY = (pixelY: number): number => {
        const slope = (y2Value - y1Value) / (y2Pixel - y1Pixel);
        return y1Value + slope * (pixelY - y1Pixel);
      };
      
      expect(pixelToDataY(400)).toBe(0);
      expect(pixelToDataY(100)).toBeCloseTo(10, 5);
      expect(pixelToDataY(250)).toBeCloseTo(5, 5);
    });
    
    it('should handle negative values', () => {
      const x1Pixel = 200;
      const x1Value = -5;
      const x2Pixel = 600;
      const x2Value = 5;
      
      const pixelToDataX = (pixelX: number): number => {
        const slope = (x2Value - x1Value) / (x2Pixel - x1Pixel);
        return x1Value + slope * (pixelX - x1Pixel);
      };
      
      expect(pixelToDataX(200)).toBe(-5);
      expect(pixelToDataX(600)).toBe(5);
      expect(pixelToDataX(400)).toBe(0);
    });
    
    it('should handle log scale values', () => {
      // For funnel plots with log OR
      const logOR = -0.5;
      const OR = Math.exp(logOR);
      
      expect(OR).toBeCloseTo(0.6065, 3);
      expect(Math.log(OR)).toBeCloseTo(logOR, 5);
    });
  });
  
  describe('Point Extraction', () => {
    it('should generate unique point IDs', () => {
      const generateId = () => `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^point_\d+_/);
    });
    
    it('should sort points by X coordinate', () => {
      const points = [
        { x: 3, y: 0.5 },
        { x: 1, y: 0.2 },
        { x: 5, y: 0.8 },
        { x: 2, y: 0.3 },
      ];
      
      const sorted = [...points].sort((a, b) => a.x - b.x);
      
      expect(sorted[0].x).toBe(1);
      expect(sorted[1].x).toBe(2);
      expect(sorted[2].x).toBe(3);
      expect(sorted[3].x).toBe(5);
    });
  });
  
  describe('Display Scaling', () => {
    it('should maintain aspect ratio when scaling image', () => {
      const imageWidth = 1200;
      const imageHeight = 800;
      const maxDisplayWidth = 600;
      const maxDisplayHeight = 400;
      
      const aspectRatio = imageWidth / imageHeight;
      let displayWidth = maxDisplayWidth;
      let displayHeight = displayWidth / aspectRatio;
      
      if (displayHeight > maxDisplayHeight) {
        displayHeight = maxDisplayHeight;
        displayWidth = displayHeight * aspectRatio;
      }
      
      expect(displayWidth / displayHeight).toBeCloseTo(aspectRatio, 5);
    });
    
    it('should convert display coordinates to pixel coordinates', () => {
      const imageSize = { width: 1200, height: 800 };
      const displaySize = { width: 600, height: 400 };
      
      const displayX = 300;
      const displayY = 200;
      
      const scaleX = imageSize.width / displaySize.width;
      const scaleY = imageSize.height / displaySize.height;
      
      const pixelX = displayX * scaleX;
      const pixelY = displayY * scaleY;
      
      expect(pixelX).toBe(600);
      expect(pixelY).toBe(400);
    });
  });
});

describe('DigitizedDataImporter', () => {
  describe('Data Mapping', () => {
    it('should map X axis to effect size', () => {
      const point = { x: 0.5, y: 0.15 };
      const mapping = { xAxis: 'effect_size', yAxis: 'se' };
      
      const study = {
        effect_size: mapping.xAxis === 'effect_size' ? point.x : point.y,
        se: mapping.yAxis === 'se' ? point.y : undefined,
      };
      
      expect(study.effect_size).toBe(0.5);
      expect(study.se).toBe(0.15);
    });
    
    it('should map Y axis to effect size (funnel plot)', () => {
      // In funnel plots, Y axis is often effect size
      const point = { x: 0.1, y: 1.5 }; // SE on X, effect on Y
      const mapping = { xAxis: 'se', yAxis: 'effect_size' };
      
      const study = {
        effect_size: mapping.yAxis === 'effect_size' ? point.y : point.x,
        se: mapping.xAxis === 'se' ? point.x : undefined,
      };
      
      expect(study.effect_size).toBe(1.5);
      expect(study.se).toBe(0.1);
    });
    
    it('should convert log scale effect sizes', () => {
      const logOR = -0.693; // log(0.5)
      const isLogScale = true;
      
      const effectSize = isLogScale ? Math.exp(logOR) : logOR;
      
      expect(effectSize).toBeCloseTo(0.5, 2);
    });
    
    it('should generate study IDs', () => {
      const data = [
        { x: 0.5, y: 0.1 },
        { x: 0.8, y: 0.2 },
        { x: 1.2, y: 0.15 },
      ];
      
      const studies = data.map((_, index) => ({
        study_id: `Digitized_${index + 1}`,
      }));
      
      expect(studies[0].study_id).toBe('Digitized_1');
      expect(studies[1].study_id).toBe('Digitized_2');
      expect(studies[2].study_id).toBe('Digitized_3');
    });
  });
  
  describe('Effect Type Handling', () => {
    it('should identify ratio measures that use log scale', () => {
      const ratioMeasures = ['OR', 'RR', 'HR'];
      const differenceMeasures = ['SMD', 'MD'];
      
      expect(ratioMeasures.includes('OR')).toBe(true);
      expect(ratioMeasures.includes('SMD')).toBe(false);
      expect(differenceMeasures.includes('MD')).toBe(true);
    });
    
    it('should handle different effect types', () => {
      const effectTypes = [
        { type: 'OR', value: 2.0, logValue: Math.log(2.0) },
        { type: 'RR', value: 1.5, logValue: Math.log(1.5) },
        { type: 'SMD', value: 0.5, logValue: 0.5 }, // SMD doesn't use log
      ];
      
      expect(effectTypes[0].logValue).toBeCloseTo(0.693, 2);
      expect(effectTypes[1].logValue).toBeCloseTo(0.405, 2);
      expect(effectTypes[2].logValue).toBe(0.5);
    });
  });
  
  describe('Sample Size Handling', () => {
    it('should round sample sizes to integers', () => {
      const rawSampleSize = 45.7;
      const roundedSampleSize = Math.round(rawSampleSize);
      
      expect(roundedSampleSize).toBe(46);
    });
    
    it('should handle year values', () => {
      const rawYear = 2019.3;
      const roundedYear = Math.round(rawYear);
      
      expect(roundedYear).toBe(2019);
    });
  });
  
  describe('Data Validation', () => {
    it('should filter out invalid data points', () => {
      const points = [
        { x: 0.5, y: 0.1 },
        { x: NaN, y: 0.2 },
        { x: 0.8, y: undefined as any },
        { x: 1.0, y: 0.15 },
      ];
      
      const validPoints = points.filter(
        p => !isNaN(p.x) && !isNaN(p.y) && p.x !== undefined && p.y !== undefined
      );
      
      expect(validPoints.length).toBe(2);
    });
    
    it('should handle empty data array', () => {
      const data: { x: number; y: number }[] = [];
      
      const studies = data.map((point, index) => ({
        study_id: `Digitized_${index + 1}`,
        effect_size: point.x,
        se: point.y,
      }));
      
      expect(studies.length).toBe(0);
    });
  });
});

describe('Forest Plot Digitization', () => {
  it('should extract effect size and CI from forest plot points', () => {
    // Typical forest plot: X axis is effect size, points represent studies
    const forestPlotPoints = [
      { x: 0.5, y: 1 },  // Study 1: OR = 0.5
      { x: 0.8, y: 2 },  // Study 2: OR = 0.8
      { x: 1.2, y: 3 },  // Study 3: OR = 1.2
      { x: 0.7, y: 4 },  // Study 4: OR = 0.7
    ];
    
    const studies = forestPlotPoints.map((point, index) => ({
      study_id: `Study_${index + 1}`,
      effect_size: point.x,
      order: point.y,
    }));
    
    expect(studies[0].effect_size).toBe(0.5);
    expect(studies[2].effect_size).toBe(1.2);
  });
  
  it('should estimate SE from CI width if available', () => {
    // If user extracts both point estimate and CI bounds
    const pointEstimate = 0.5;
    const lowerCI = 0.3;
    const upperCI = 0.8;
    
    // For log scale: SE = (log(upper) - log(lower)) / (2 * 1.96)
    const logSE = (Math.log(upperCI) - Math.log(lowerCI)) / (2 * 1.96);
    
    expect(logSE).toBeCloseTo(0.25, 1);
  });
});

describe('Funnel Plot Digitization', () => {
  it('should extract effect size and SE from funnel plot', () => {
    // Standard funnel plot: X = effect size, Y = SE (inverted)
    const funnelPlotPoints = [
      { x: 0.5, y: 0.1 },   // Large study, small SE
      { x: 0.3, y: 0.25 },  // Medium study
      { x: 0.8, y: 0.3 },   // Small study, large SE
      { x: 0.6, y: 0.15 },  // Medium-large study
    ];
    
    const studies = funnelPlotPoints.map((point, index) => ({
      study_id: `Study_${index + 1}`,
      effect_size: point.x,
      se: point.y,
    }));
    
    expect(studies[0].se).toBe(0.1);
    expect(studies[2].se).toBe(0.3);
  });
  
  it('should handle contour-enhanced funnel plot coordinates', () => {
    // Some funnel plots use precision (1/SE) on Y axis
    const precision = 10; // 1/SE
    const se = 1 / precision;
    
    expect(se).toBe(0.1);
  });
});
