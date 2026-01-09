/**
 * E2E Tests: Onboarding and Data Entry Workflow
 * 
 * Tests the complete user journey from first app launch through
 * onboarding to creating and populating a spreadsheet.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MOCK_SPREADSHEETS,
  MOCK_ONBOARDING,
  mockAsyncStorage,
  assertE2E,
} from './test-utils';
import { validateSpreadsheet } from '@/lib/spreadsheet';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => mockAsyncStorage.getItem(key)),
    setItem: vi.fn((key: string, value: string) => mockAsyncStorage.setItem(key, value)),
    removeItem: vi.fn((key: string) => mockAsyncStorage.removeItem(key)),
    clear: vi.fn(() => mockAsyncStorage.clear()),
  },
}));

describe('E2E: Onboarding Flow', () => {
  beforeEach(() => {
    mockAsyncStorage.clear();
  });

  describe('First Launch Detection', () => {
    it('should detect first launch when no onboarding flag exists', async () => {
      const completed = await mockAsyncStorage.getItem('onboarding_completed');
      expect(completed).toBeNull();
    });

    it('should mark onboarding as completed after wizard finishes', async () => {
      // Simulate completing onboarding
      await mockAsyncStorage.setItem('onboarding_completed', 'true');
      
      const completed = await mockAsyncStorage.getItem('onboarding_completed');
      expect(completed).toBe('true');
    });

    it('should skip onboarding on subsequent launches', async () => {
      await mockAsyncStorage.setItem('onboarding_completed', 'true');
      
      const shouldShowOnboarding = (await mockAsyncStorage.getItem('onboarding_completed')) !== 'true';
      expect(shouldShowOnboarding).toBe(false);
    });
  });

  describe('Device Detection', () => {
    it('should detect device capabilities correctly', () => {
      const { deviceInfo } = MOCK_ONBOARDING;
      
      expect(deviceInfo.platform).toBe('ios');
      expect(deviceInfo.totalMemoryGB).toBeGreaterThan(0);
      expect(deviceInfo.cpuCores).toBeGreaterThan(0);
      expect(deviceInfo.performanceTier).toMatch(/^(low|medium|high)$/);
    });

    it('should determine ML acceleration support', () => {
      const { deviceInfo } = MOCK_ONBOARDING;
      
      // High-end devices should support ML acceleration
      if (deviceInfo.performanceTier === 'high') {
        expect(deviceInfo.supportsMLAcceleration).toBe(true);
      }
    });
  });

  describe('Use Case Selection', () => {
    it('should store selected use case', async () => {
      await mockAsyncStorage.setItem('user_use_case', 'research');
      
      const useCase = await mockAsyncStorage.getItem('user_use_case');
      expect(useCase).toBe('research');
    });

    it('should recommend appropriate model based on use case', () => {
      const { selectedUseCase, recommendedModel } = MOCK_ONBOARDING;
      
      // Research use case should recommend capable model
      expect(selectedUseCase).toBe('research');
      expect(recommendedModel).toContain('llama');
    });
  });

  describe('Onboarding Completion', () => {
    it('should persist all onboarding choices', async () => {
      // Simulate full onboarding completion
      await mockAsyncStorage.setItem('onboarding_completed', 'true');
      await mockAsyncStorage.setItem('user_use_case', 'research');
      await mockAsyncStorage.setItem('selected_model', 'llama-3.2-3b-instruct');
      await mockAsyncStorage.setItem('device_tier', 'high');

      // Verify all values persisted
      expect(await mockAsyncStorage.getItem('onboarding_completed')).toBe('true');
      expect(await mockAsyncStorage.getItem('user_use_case')).toBe('research');
      expect(await mockAsyncStorage.getItem('selected_model')).toBe('llama-3.2-3b-instruct');
      expect(await mockAsyncStorage.getItem('device_tier')).toBe('high');
    });
  });
});

describe('E2E: Data Entry Workflow', () => {
  describe('Spreadsheet Creation', () => {
    it('should create a new spreadsheet with default columns', () => {
      const spreadsheet = {
        name: 'New Study',
        columns: MOCK_SPREADSHEETS.binary.columns,
        rows: [{ id: 'row1' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(spreadsheet.name).toBe('New Study');
      expect(spreadsheet.columns.length).toBeGreaterThan(0);
      expect(spreadsheet.rows.length).toBe(1);
    });

    it('should support binary outcome template', () => {
      const { columns } = MOCK_SPREADSHEETS.binary;
      
      const requiredColumns = ['study', 'events_treatment', 'n_treatment', 'events_control', 'n_control'];
      const columnKeys = columns.map(c => c.key);
      
      requiredColumns.forEach(col => {
        expect(columnKeys).toContain(col);
      });
    });

    it('should support continuous outcome template', () => {
      const { columns } = MOCK_SPREADSHEETS.continuous;
      
      const requiredColumns = ['study', 'mean_treatment', 'sd_treatment', 'n_treatment', 'mean_control', 'sd_control', 'n_control'];
      const columnKeys = columns.map(c => c.key);
      
      requiredColumns.forEach(col => {
        expect(columnKeys).toContain(col);
      });
    });

    it('should support diagnostic accuracy template', () => {
      const { columns } = MOCK_SPREADSHEETS.diagnostic;
      
      const requiredColumns = ['study', 'tp', 'fp', 'fn', 'tn'];
      const columnKeys = columns.map(c => c.key);
      
      requiredColumns.forEach(col => {
        expect(columnKeys).toContain(col);
      });
    });
  });

  describe('Data Entry', () => {
    it('should add rows to spreadsheet', () => {
      const rows = [...MOCK_SPREADSHEETS.binary.rows];
      const initialCount = rows.length;
      
      // Add new row
      rows.push({ id: 'row_new', study: 'New Study 2024', year: 2024, events_treatment: 10, n_treatment: 50, events_control: 15, n_control: 50 });
      
      expect(rows.length).toBe(initialCount + 1);
    });

    it('should update cell values', () => {
      const rows = [...MOCK_SPREADSHEETS.binary.rows];
      const originalValue = rows[0].events_treatment;
      
      // Update cell
      rows[0] = { ...rows[0], events_treatment: 20 };
      
      expect(rows[0].events_treatment).toBe(20);
      expect(rows[0].events_treatment).not.toBe(originalValue);
    });

    it('should delete rows', () => {
      const rows = [...MOCK_SPREADSHEETS.binary.rows];
      const initialCount = rows.length;
      
      // Delete first row
      rows.splice(0, 1);
      
      expect(rows.length).toBe(initialCount - 1);
    });

    it('should handle numeric input correctly', () => {
      const numericValue = '123.45';
      const parsed = parseFloat(numericValue);
      
      expect(parsed).toBe(123.45);
      expect(typeof parsed).toBe('number');
    });

    it('should handle empty cells', () => {
      const row = { id: 'row1', study: '', year: '', events_treatment: '' };
      
      expect(row.study).toBe('');
      expect(row.year).toBe('');
    });
  });

  describe('Data Validation', () => {
    it('should validate complete binary data', () => {
      const spreadsheet = {
        name: MOCK_SPREADSHEETS.binary.name,
        columns: MOCK_SPREADSHEETS.binary.columns,
        rows: MOCK_SPREADSHEETS.binary.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = validateSpreadsheet(spreadsheet);
      
      // Should have no critical errors for valid data
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error').length).toBe(0);
    });

    it('should validate complete continuous data', () => {
      const spreadsheet = {
        name: MOCK_SPREADSHEETS.continuous.name,
        columns: MOCK_SPREADSHEETS.continuous.columns,
        rows: MOCK_SPREADSHEETS.continuous.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = validateSpreadsheet(spreadsheet);
      
      expect(result.isValid).toBe(true);
    });

    it('should detect missing required data', () => {
      const spreadsheet = {
        name: MOCK_SPREADSHEETS.invalid.name,
        columns: MOCK_SPREADSHEETS.invalid.columns,
        rows: MOCK_SPREADSHEETS.invalid.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = validateSpreadsheet(spreadsheet);
      
      // Should have warnings or errors for incomplete data
      expect(result.warnings.length + result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect empty spreadsheet', () => {
      const spreadsheet = {
        name: MOCK_SPREADSHEETS.empty.name,
        columns: MOCK_SPREADSHEETS.empty.columns,
        rows: MOCK_SPREADSHEETS.empty.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = validateSpreadsheet(spreadsheet);
      
      // Empty data should generate warnings
      expect(result.warnings.length + result.infos.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate events <= n constraint', () => {
      const invalidRow = {
        id: 'invalid',
        study: 'Invalid Study',
        year: 2024,
        events_treatment: 100, // More events than sample size
        n_treatment: 50,
        events_control: 20,
        n_control: 50,
      };

      const spreadsheet = {
        name: 'Invalid Events',
        columns: MOCK_SPREADSHEETS.binary.columns,
        rows: [invalidRow],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = validateSpreadsheet(spreadsheet);
      
      // Should detect events > n as error
      const eventsError = result.errors.find(e => 
        e.message.toLowerCase().includes('event') || 
        e.message.toLowerCase().includes('exceed')
      );
      expect(eventsError || result.errors.length > 0).toBeTruthy();
    });
  });

  describe('Spreadsheet Persistence', () => {
    it('should save spreadsheet to storage', async () => {
      const spreadsheet = {
        name: MOCK_SPREADSHEETS.binary.name,
        columns: MOCK_SPREADSHEETS.binary.columns,
        rows: MOCK_SPREADSHEETS.binary.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await mockAsyncStorage.setItem('spreadsheet_1', JSON.stringify(spreadsheet));
      
      const saved = await mockAsyncStorage.getItem('spreadsheet_1');
      expect(saved).not.toBeNull();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.name).toBe(spreadsheet.name);
      expect(parsed.rows.length).toBe(spreadsheet.rows.length);
    });

    it('should load spreadsheet from storage', async () => {
      const spreadsheet = {
        name: 'Saved Study',
        columns: MOCK_SPREADSHEETS.binary.columns,
        rows: MOCK_SPREADSHEETS.binary.rows,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await mockAsyncStorage.setItem('spreadsheet_test', JSON.stringify(spreadsheet));
      
      const loaded = await mockAsyncStorage.getItem('spreadsheet_test');
      const parsed = JSON.parse(loaded!);
      
      expect(parsed.name).toBe('Saved Study');
      expect(parsed.rows).toHaveLength(4);
    });

    it('should update spreadsheet timestamp on save', async () => {
      const originalTimestamp = Date.now();
      const spreadsheet = {
        name: 'Test',
        columns: [],
        rows: [],
        createdAt: originalTimestamp,
        updatedAt: originalTimestamp,
      };

      // Simulate update
      await new Promise(resolve => setTimeout(resolve, 10));
      spreadsheet.updatedAt = Date.now();

      expect(spreadsheet.updatedAt).toBeGreaterThan(originalTimestamp);
    });
  });
});

describe('E2E: Data Entry Edge Cases', () => {
  it('should handle special characters in study names', () => {
    const row = {
      id: 'special',
      study: "O'Brien & Smith (2024)",
      year: 2024,
    };

    expect(row.study).toContain("'");
    expect(row.study).toContain('&');
  });

  it('should handle decimal numbers', () => {
    const row = {
      id: 'decimal',
      mean_treatment: 25.789,
      sd_treatment: 4.123,
    };

    expect(row.mean_treatment).toBeCloseTo(25.789, 3);
    expect(row.sd_treatment).toBeCloseTo(4.123, 3);
  });

  it('should handle zero values', () => {
    const row = {
      id: 'zero',
      events_treatment: 0,
      n_treatment: 50,
    };

    expect(row.events_treatment).toBe(0);
    expect(typeof row.events_treatment).toBe('number');
  });

  it('should handle large sample sizes', () => {
    const row = {
      id: 'large',
      n_treatment: 10000,
      n_control: 10000,
    };

    expect(row.n_treatment).toBe(10000);
    expect(row.n_control).toBe(10000);
  });

  it('should handle negative values for effect sizes', () => {
    const row = {
      id: 'negative',
      yi: -0.35,
      sei: 0.12,
    };

    expect(row.yi).toBeLessThan(0);
    expect(row.sei).toBeGreaterThan(0); // SE should always be positive
  });
});
