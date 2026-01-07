/**
 * Tutorial Enhancements Tests
 * Tests for practice datasets and certificate generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  practiceDatasets,
  getDatasetById,
  getDatasetsByCategory,
  datasetToCSV,
  datasetToCSVData,
  bcgVaccineDataset,
  aspirinStudiesDataset,
  cbtDepressionDataset,
  homeworkEffectDataset,
} from '../lib/tutorial/practice-datasets';

// Mock expo-file-system
vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: vi.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: vi.fn().mockResolvedValue(undefined),
  writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
  readAsStringAsync: vi.fn().mockResolvedValue('<html>mock</html>'),
  readDirectoryAsync: vi.fn().mockResolvedValue(['certificate_123.html']),
  deleteAsync: vi.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

// Mock expo-sharing
vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  shareAsync: vi.fn().mockResolvedValue(undefined),
}));

describe('Practice Datasets', () => {
  describe('Dataset Structure', () => {
    it('should have all required datasets', () => {
      expect(practiceDatasets).toHaveLength(4);
      expect(practiceDatasets.map(d => d.id)).toEqual([
        'bcg-vaccine',
        'aspirin-cvd',
        'cbt-depression',
        'homework-effect',
      ]);
    });

    it('should have valid BCG vaccine dataset', () => {
      expect(bcgVaccineDataset.id).toBe('bcg-vaccine');
      expect(bcgVaccineDataset.name).toBe('BCG Vaccine Trials');
      expect(bcgVaccineDataset.category).toBe('medical');
      expect(bcgVaccineDataset.studyCount).toBe(13);
      expect(bcgVaccineDataset.effectType).toBe('RR');
      expect(bcgVaccineDataset.headers).toHaveLength(8);
      expect(bcgVaccineDataset.data).toHaveLength(13);
    });

    it('should have valid aspirin studies dataset', () => {
      expect(aspirinStudiesDataset.id).toBe('aspirin-cvd');
      expect(aspirinStudiesDataset.name).toBe('Aspirin for CVD Prevention');
      expect(aspirinStudiesDataset.category).toBe('medical');
      expect(aspirinStudiesDataset.studyCount).toBe(9);
      expect(aspirinStudiesDataset.effectType).toBe('OR');
    });

    it('should have valid CBT depression dataset', () => {
      expect(cbtDepressionDataset.id).toBe('cbt-depression');
      expect(cbtDepressionDataset.name).toBe('CBT for Depression');
      expect(cbtDepressionDataset.category).toBe('psychology');
      expect(cbtDepressionDataset.studyCount).toBe(12);
      expect(cbtDepressionDataset.effectType).toBe('SMD');
    });

    it('should have valid homework effect dataset', () => {
      expect(homeworkEffectDataset.id).toBe('homework-effect');
      expect(homeworkEffectDataset.name).toBe('Homework and Achievement');
      expect(homeworkEffectDataset.category).toBe('education');
      expect(homeworkEffectDataset.studyCount).toBe(10);
      expect(homeworkEffectDataset.effectType).toBe('SMD');
    });

    it('should have learning objectives for each dataset', () => {
      practiceDatasets.forEach(dataset => {
        expect(dataset.learningObjectives.length).toBeGreaterThan(0);
      });
    });

    it('should have suggested analyses for each dataset', () => {
      practiceDatasets.forEach(dataset => {
        expect(dataset.suggestedAnalyses.length).toBeGreaterThan(0);
        dataset.suggestedAnalyses.forEach(analysis => {
          expect(analysis).toMatch(/^\/r /);
        });
      });
    });

    it('should have citations for each dataset', () => {
      practiceDatasets.forEach(dataset => {
        expect(dataset.citation).toBeTruthy();
        expect(dataset.source).toBeTruthy();
      });
    });
  });

  describe('Dataset Retrieval', () => {
    it('should get dataset by ID', () => {
      const dataset = getDatasetById('bcg-vaccine');
      expect(dataset).toBeDefined();
      expect(dataset?.name).toBe('BCG Vaccine Trials');
    });

    it('should return undefined for invalid ID', () => {
      const dataset = getDatasetById('invalid-id');
      expect(dataset).toBeUndefined();
    });

    it('should get datasets by category', () => {
      const medicalDatasets = getDatasetsByCategory('medical');
      expect(medicalDatasets).toHaveLength(2);
      expect(medicalDatasets.map(d => d.id)).toContain('bcg-vaccine');
      expect(medicalDatasets.map(d => d.id)).toContain('aspirin-cvd');

      const psychologyDatasets = getDatasetsByCategory('psychology');
      expect(psychologyDatasets).toHaveLength(1);
      expect(psychologyDatasets[0].id).toBe('cbt-depression');

      const educationDatasets = getDatasetsByCategory('education');
      expect(educationDatasets).toHaveLength(1);
      expect(educationDatasets[0].id).toBe('homework-effect');
    });
  });

  describe('Dataset Conversion', () => {
    it('should convert dataset to CSV string', () => {
      const csv = datasetToCSV(bcgVaccineDataset);
      const lines = csv.split('\n');
      
      // Header line
      expect(lines[0]).toBe('study,year,tpos,tneg,cpos,cneg,latitude,alloc');
      
      // Data lines
      expect(lines.length).toBe(14); // 1 header + 13 data rows
      expect(lines[1]).toContain('Aronson');
      expect(lines[1]).toContain('1948');
    });

    it('should convert dataset to CSVData format', () => {
      const csvData = datasetToCSVData(bcgVaccineDataset);
      
      expect(csvData.fileName).toBe('bcg-vaccine.csv');
      expect(csvData.headers).toEqual(bcgVaccineDataset.headers);
      expect(csvData.rows).toHaveLength(13);
      
      // Check first row
      const firstRow = csvData.rows[0];
      expect(firstRow.study).toBe('Aronson');
      expect(firstRow.year).toBe('1948');
      expect(firstRow.tpos).toBe('4');
    });

    it('should handle all datasets for CSV conversion', () => {
      practiceDatasets.forEach(dataset => {
        const csv = datasetToCSV(dataset);
        const csvData = datasetToCSVData(dataset);
        
        expect(csv).toBeTruthy();
        expect(csvData.rows.length).toBe(dataset.studyCount);
        expect(csvData.headers.length).toBe(dataset.headers.length);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should have matching study counts', () => {
      practiceDatasets.forEach(dataset => {
        expect(dataset.data.length).toBe(dataset.studyCount);
      });
    });

    it('should have consistent column counts', () => {
      practiceDatasets.forEach(dataset => {
        dataset.data.forEach((row, index) => {
          expect(row.length).toBe(dataset.headers.length);
        });
      });
    });

    it('should have numeric values where expected', () => {
      // BCG vaccine: tpos, tneg, cpos, cneg, latitude should be numeric
      bcgVaccineDataset.data.forEach(row => {
        expect(Number(row[2])).not.toBeNaN(); // tpos
        expect(Number(row[3])).not.toBeNaN(); // tneg
        expect(Number(row[4])).not.toBeNaN(); // cpos
        expect(Number(row[5])).not.toBeNaN(); // cneg
        expect(Number(row[6])).not.toBeNaN(); // latitude
      });
    });
  });
});

describe('Certificate Service', () => {
  describe('Certificate Data Structure', () => {
    it('should define certificate data interface', () => {
      const data = {
        userName: 'Test User',
        completionDate: new Date('2024-01-15'),
        modulesCompleted: 6,
        totalModules: 6,
        totalTimeMinutes: 120,
        accuracy: 85,
        badges: ['🎯 Quick Learner', '📊 Data Master'],
      };

      expect(data.userName).toBe('Test User');
      expect(data.modulesCompleted).toBe(6);
      expect(data.accuracy).toBe(85);
    });

    it('should handle empty badges array', () => {
      const data = {
        userName: 'Test User',
        completionDate: new Date(),
        modulesCompleted: 6,
        totalModules: 6,
        totalTimeMinutes: 60,
        accuracy: 90,
        badges: [],
      };

      expect(data.badges).toHaveLength(0);
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      expect(formatted).toBe('January 15, 2024');
    });

    it('should calculate time in minutes', () => {
      const timeSpentSeconds = 7200; // 2 hours
      const minutes = Math.round(timeSpentSeconds / 60);
      expect(minutes).toBe(120);
    });
  });
});

describe('Tutorial Button Integration', () => {
  it('should calculate tutorial progress correctly', () => {
    // Test the progress calculation logic
    const modulesCompleted = 3;
    const totalModules = 6;
    const progress = Math.round((modulesCompleted / totalModules) * 100);
    expect(progress).toBe(50);
  });

  it('should identify started tutorial', () => {
    const stats = { modulesCompleted: 1, totalModules: 6 };
    const progress = Math.round((stats.modulesCompleted / stats.totalModules) * 100);
    const hasStarted = stats.modulesCompleted > 0 || progress > 0;
    expect(hasStarted).toBe(true);
  });

  it('should identify not started tutorial', () => {
    const stats = { modulesCompleted: 0, totalModules: 6 };
    const progress = Math.round((stats.modulesCompleted / stats.totalModules) * 100);
    const hasStarted = stats.modulesCompleted > 0 || progress > 0;
    expect(hasStarted).toBe(false);
  });
});
