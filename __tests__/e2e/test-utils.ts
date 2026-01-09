/**
 * E2E Test Utilities
 * 
 * Shared utilities, mock data, and helpers for end-to-end testing
 * of the complete meta-analysis workflow.
 */

import { DataType } from '@/lib/glass/orchestrator';

/**
 * Mock spreadsheet data for different analysis types
 */
export const MOCK_SPREADSHEETS = {
  binary: {
    name: 'Binary Outcomes Study',
    columns: [
      { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
      { key: 'year', label: 'Year', type: 'number' as const, width: 60 },
      { key: 'events_treatment', label: 'Events (Tx)', type: 'number' as const, width: 80 },
      { key: 'n_treatment', label: 'n (Tx)', type: 'number' as const, width: 60 },
      { key: 'events_control', label: 'Events (Ctrl)', type: 'number' as const, width: 80 },
      { key: 'n_control', label: 'n (Ctrl)', type: 'number' as const, width: 60 },
    ],
    rows: [
      { id: 'row1', study: 'Smith 2020', year: 2020, events_treatment: 15, n_treatment: 100, events_control: 25, n_control: 100 },
      { id: 'row2', study: 'Jones 2021', year: 2021, events_treatment: 20, n_treatment: 150, events_control: 35, n_control: 150 },
      { id: 'row3', study: 'Brown 2022', year: 2022, events_treatment: 8, n_treatment: 80, events_control: 18, n_control: 80 },
      { id: 'row4', study: 'Davis 2023', year: 2023, events_treatment: 12, n_treatment: 120, events_control: 22, n_control: 120 },
    ],
    expectedDataType: DataType.BINARY,
    expectedEffectMeasure: 'OR',
  },

  continuous: {
    name: 'Continuous Outcomes Study',
    columns: [
      { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
      { key: 'year', label: 'Year', type: 'number' as const, width: 60 },
      { key: 'mean_treatment', label: 'Mean (Tx)', type: 'number' as const, width: 80 },
      { key: 'sd_treatment', label: 'SD (Tx)', type: 'number' as const, width: 70 },
      { key: 'n_treatment', label: 'n (Tx)', type: 'number' as const, width: 60 },
      { key: 'mean_control', label: 'Mean (Ctrl)', type: 'number' as const, width: 80 },
      { key: 'sd_control', label: 'SD (Ctrl)', type: 'number' as const, width: 70 },
      { key: 'n_control', label: 'n (Ctrl)', type: 'number' as const, width: 60 },
    ],
    rows: [
      { id: 'row1', study: 'Alpha 2020', year: 2020, mean_treatment: 25.5, sd_treatment: 5.2, n_treatment: 50, mean_control: 22.3, sd_control: 4.8, n_control: 50 },
      { id: 'row2', study: 'Beta 2021', year: 2021, mean_treatment: 28.1, sd_treatment: 6.1, n_treatment: 60, mean_control: 24.5, sd_control: 5.5, n_control: 60 },
      { id: 'row3', study: 'Gamma 2022', year: 2022, mean_treatment: 23.8, sd_treatment: 4.5, n_treatment: 45, mean_control: 21.2, sd_control: 4.2, n_control: 45 },
    ],
    expectedDataType: DataType.CONTINUOUS,
    expectedEffectMeasure: 'SMD',
  },

  diagnostic: {
    name: 'Diagnostic Accuracy Study',
    columns: [
      { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
      { key: 'year', label: 'Year', type: 'number' as const, width: 60 },
      { key: 'tp', label: 'TP', type: 'number' as const, width: 60 },
      { key: 'fp', label: 'FP', type: 'number' as const, width: 60 },
      { key: 'fn', label: 'FN', type: 'number' as const, width: 60 },
      { key: 'tn', label: 'TN', type: 'number' as const, width: 60 },
    ],
    rows: [
      { id: 'row1', study: 'Test A 2020', year: 2020, tp: 85, fp: 10, fn: 15, tn: 90 },
      { id: 'row2', study: 'Test B 2021', year: 2021, tp: 92, fp: 8, fn: 12, tn: 88 },
      { id: 'row3', study: 'Test C 2022', year: 2022, tp: 78, fp: 12, fn: 18, tn: 92 },
    ],
    expectedDataType: DataType.DIAGNOSTIC,
    expectedEffectMeasure: 'SENS',
  },

  precalculated: {
    name: 'Pre-calculated Effects Study',
    columns: [
      { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
      { key: 'year', label: 'Year', type: 'number' as const, width: 60 },
      { key: 'yi', label: 'Effect Size', type: 'number' as const, width: 80 },
      { key: 'sei', label: 'SE', type: 'number' as const, width: 60 },
    ],
    rows: [
      { id: 'row1', study: 'Pre A 2020', year: 2020, yi: 0.35, sei: 0.12 },
      { id: 'row2', study: 'Pre B 2021', year: 2021, yi: 0.42, sei: 0.15 },
      { id: 'row3', study: 'Pre C 2022', year: 2022, yi: 0.28, sei: 0.10 },
      { id: 'row4', study: 'Pre D 2023', year: 2023, yi: 0.38, sei: 0.14 },
    ],
    expectedDataType: DataType.PRECALCULATED,
    expectedEffectMeasure: 'SMD',
  },

  empty: {
    name: 'Empty Study',
    columns: [
      { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
      { key: 'year', label: 'Year', type: 'number' as const, width: 60 },
    ],
    rows: [
      { id: 'row1', study: '', year: '' },
    ],
    expectedDataType: DataType.UNKNOWN,
    expectedEffectMeasure: null,
  },

  invalid: {
    name: 'Invalid Data Study',
    columns: [
      { key: 'study', label: 'Study', type: 'text' as const, width: 120 },
      { key: 'events_treatment', label: 'Events (Tx)', type: 'number' as const, width: 80 },
      { key: 'n_treatment', label: 'n (Tx)', type: 'number' as const, width: 60 },
    ],
    rows: [
      { id: 'row1', study: 'Incomplete', events_treatment: 10, n_treatment: 50 },
    ],
    expectedDataType: DataType.UNKNOWN,
    expectedEffectMeasure: null,
  },
};

/**
 * Mock onboarding state
 */
export const MOCK_ONBOARDING = {
  deviceInfo: {
    platform: 'ios' as const,
    osVersion: '17.0',
    deviceModel: 'iPhone 15 Pro',
    totalMemoryGB: 8,
    availableMemoryGB: 4,
    cpuCores: 6,
    performanceTier: 'high' as const,
    supportsMLAcceleration: true,
  },
  selectedUseCase: 'research' as const,
  recommendedModel: 'llama-3.2-3b-instruct' as const,
};

/**
 * Mock Glass AI responses
 */
export const MOCK_GLASS_RESPONSES = {
  analyzeData: {
    intent: 'full_workflow',
    explanation: 'I detected binary outcome data with events and sample sizes for treatment and control groups. I recommend using Odds Ratio (OR) with a random effects model.',
  },
  explainOR: {
    explanation: 'The Odds Ratio (OR) compares the odds of an event occurring in the treatment group versus the control group. An OR > 1 indicates higher odds in the treatment group.',
  },
  generateCode: {
    script: `library(metafor)
dat <- escalc(measure="OR", ai=events_treatment, bi=n_treatment-events_treatment, 
              ci=events_control, di=n_control-events_control, data=data)
res <- rma(yi, vi, data=dat, method="REML")
forest(res)`,
  },
};

/**
 * Simulate user workflow step
 */
export interface WorkflowStep {
  name: string;
  action: () => Promise<void> | void;
  expectedResult: unknown;
  validate: (result: unknown) => boolean;
}

/**
 * Create a workflow test runner
 */
export function createWorkflowRunner(steps: WorkflowStep[]) {
  return {
    steps,
    async run(): Promise<{ passed: number; failed: number; results: Array<{ step: string; passed: boolean; error?: string }> }> {
      const results: Array<{ step: string; passed: boolean; error?: string }> = [];
      let passed = 0;
      let failed = 0;

      for (const step of steps) {
        try {
          await step.action();
          const isValid = step.validate(step.expectedResult);
          if (isValid) {
            passed++;
            results.push({ step: step.name, passed: true });
          } else {
            failed++;
            results.push({ step: step.name, passed: false, error: 'Validation failed' });
          }
        } catch (error) {
          failed++;
          results.push({ step: step.name, passed: false, error: String(error) });
        }
      }

      return { passed, failed, results };
    },
  };
}

/**
 * Assert helper for E2E tests
 */
export function assertE2E(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`E2E Assertion Failed: ${message}`);
  }
}

/**
 * Wait helper for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock AsyncStorage for testing
 */
export const mockAsyncStorage = {
  store: new Map<string, string>(),
  
  getItem: async (key: string): Promise<string | null> => {
    return mockAsyncStorage.store.get(key) ?? null;
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    mockAsyncStorage.store.set(key, value);
  },
  
  removeItem: async (key: string): Promise<void> => {
    mockAsyncStorage.store.delete(key);
  },
  
  clear: async (): Promise<void> => {
    mockAsyncStorage.store.clear();
  },
};
