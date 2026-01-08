/**
 * Spreadsheet Data Validation Service
 * 
 * Validates meta-analysis data entries and provides Glass-powered
 * suggestions for fixing errors.
 */

import type { Column, Row, SpreadsheetData } from '@/components/spreadsheet/SpreadsheetEditor';

// Validation error types
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationError {
  rowIndex: number;
  columnKey: string;
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  glassPrompt?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  summary: string;
}

// Validation rules for different column types
export interface ValidationRule {
  columnKey: string;
  validate: (value: string | number | undefined, row: Row, allRows: Row[]) => ValidationError | null;
}

/**
 * Built-in validation rules for meta-analysis data
 */
export const META_ANALYSIS_VALIDATION_RULES: ValidationRule[] = [
  // Study name is required
  {
    columnKey: 'study',
    validate: (value, row, allRows) => {
      if (!value || String(value).trim() === '') {
        return {
          rowIndex: 0, // Will be set by validator
          columnKey: 'study',
          severity: 'error',
          message: 'Study name is required',
          suggestion: 'Enter a unique identifier for this study (e.g., "Smith 2020")',
          glassPrompt: 'I noticed a study is missing its name. Each study needs a unique identifier, typically the first author\'s last name and year (e.g., "Smith 2020"). Would you like me to help you name this study based on your data?',
        };
      }
      
      // Check for duplicates
      const duplicates = allRows.filter(r => r.study === value);
      if (duplicates.length > 1) {
        return {
          rowIndex: 0,
          columnKey: 'study',
          severity: 'warning',
          message: 'Duplicate study name detected',
          suggestion: 'Add a suffix to distinguish studies (e.g., "Smith 2020a", "Smith 2020b")',
          glassPrompt: 'I found duplicate study names. In meta-analysis, each study should have a unique identifier. You can add letters (a, b, c) to distinguish multiple reports from the same author and year.',
        };
      }
      
      return null;
    },
  },
  
  // Year validation
  {
    columnKey: 'year',
    validate: (value) => {
      if (!value) {
        return {
          rowIndex: 0,
          columnKey: 'year',
          severity: 'warning',
          message: 'Publication year is missing',
          suggestion: 'Enter the year the study was published',
          glassPrompt: 'The publication year helps readers understand the temporal context of your meta-analysis. Would you like me to help you find the publication year?',
        };
      }
      
      const year = Number(value);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        return {
          rowIndex: 0,
          columnKey: 'year',
          severity: 'error',
          message: `Invalid year: ${value}`,
          suggestion: `Enter a year between 1900 and ${currentYear}`,
          glassPrompt: `The year "${value}" doesn't look right. Publication years should be between 1900 and ${currentYear}. Did you mean to enter something else?`,
        };
      }
      
      return null;
    },
  },
  
  // Sample size validation (treatment group)
  {
    columnKey: 'n_treatment',
    validate: (value, row) => {
      if (!value && value !== 0) {
        return {
          rowIndex: 0,
          columnKey: 'n_treatment',
          severity: 'error',
          message: 'Treatment group sample size is required',
          suggestion: 'Enter the number of participants in the treatment/intervention group',
          glassPrompt: 'The sample size for the treatment group is missing. This is essential for calculating effect sizes. How many participants were in the intervention group?',
        };
      }
      
      const n = Number(value);
      
      if (isNaN(n) || n < 0) {
        return {
          rowIndex: 0,
          columnKey: 'n_treatment',
          severity: 'error',
          message: 'Sample size cannot be negative',
          suggestion: 'Enter a positive number',
          glassPrompt: 'I noticed a negative sample size, which isn\'t possible. Sample sizes must be positive integers. Would you like me to help you check this value?',
        };
      }
      
      if (n === 0) {
        return {
          rowIndex: 0,
          columnKey: 'n_treatment',
          severity: 'warning',
          message: 'Sample size is zero',
          suggestion: 'A sample size of 0 will exclude this study from analysis',
          glassPrompt: 'A sample size of zero means this study won\'t contribute to the meta-analysis. Is this intentional, or should we check the original paper?',
        };
      }
      
      if (n < 5) {
        return {
          rowIndex: 0,
          columnKey: 'n_treatment',
          severity: 'info',
          message: 'Very small sample size',
          suggestion: 'Consider whether this study should be included or analyzed separately',
          glassPrompt: 'This study has a very small sample size (n < 5). Small studies can have unstable effect estimates. Would you like to discuss how to handle small studies in your meta-analysis?',
        };
      }
      
      return null;
    },
  },
  
  // Sample size validation (control group)
  {
    columnKey: 'n_control',
    validate: (value, row) => {
      if (!value && value !== 0) {
        return {
          rowIndex: 0,
          columnKey: 'n_control',
          severity: 'error',
          message: 'Control group sample size is required',
          suggestion: 'Enter the number of participants in the control/comparison group',
          glassPrompt: 'The sample size for the control group is missing. This is essential for calculating effect sizes. How many participants were in the control group?',
        };
      }
      
      const n = Number(value);
      
      if (isNaN(n) || n < 0) {
        return {
          rowIndex: 0,
          columnKey: 'n_control',
          severity: 'error',
          message: 'Sample size cannot be negative',
          suggestion: 'Enter a positive number',
          glassPrompt: 'I noticed a negative sample size for the control group. Sample sizes must be positive integers. Let me help you verify this value.',
        };
      }
      
      if (n === 0) {
        return {
          rowIndex: 0,
          columnKey: 'n_control',
          severity: 'warning',
          message: 'Control group sample size is zero',
          suggestion: 'A sample size of 0 will exclude this study from analysis',
          glassPrompt: 'The control group has zero participants. This might indicate a single-arm study, which requires different analysis methods. Should we discuss this?',
        };
      }
      
      return null;
    },
  },
  
  // Events validation (binary outcomes)
  {
    columnKey: 'events_treatment',
    validate: (value, row) => {
      const n = Number(row.n_treatment);
      const events = Number(value);
      
      if (value === undefined || value === '') return null; // Optional field
      
      if (isNaN(events) || events < 0) {
        return {
          rowIndex: 0,
          columnKey: 'events_treatment',
          severity: 'error',
          message: 'Events cannot be negative',
          suggestion: 'Enter the number of events (0 or positive)',
          glassPrompt: 'The number of events can\'t be negative. Events represent outcomes like deaths, recoveries, or responses. What value should this be?',
        };
      }
      
      if (!isNaN(n) && events > n) {
        return {
          rowIndex: 0,
          columnKey: 'events_treatment',
          severity: 'error',
          message: 'Events exceed sample size',
          suggestion: `Events (${events}) cannot be greater than sample size (${n})`,
          glassPrompt: `I noticed that the number of events (${events}) is greater than the sample size (${n}). This isn't possible - events can't exceed the total number of participants. Would you like to check these values?`,
        };
      }
      
      return null;
    },
  },
  
  // Events validation (control group)
  {
    columnKey: 'events_control',
    validate: (value, row) => {
      const n = Number(row.n_control);
      const events = Number(value);
      
      if (value === undefined || value === '') return null; // Optional field
      
      if (isNaN(events) || events < 0) {
        return {
          rowIndex: 0,
          columnKey: 'events_control',
          severity: 'error',
          message: 'Events cannot be negative',
          suggestion: 'Enter the number of events (0 or positive)',
          glassPrompt: 'The number of events in the control group can\'t be negative. What should this value be?',
        };
      }
      
      if (!isNaN(n) && events > n) {
        return {
          rowIndex: 0,
          columnKey: 'events_control',
          severity: 'error',
          message: 'Events exceed sample size',
          suggestion: `Events (${events}) cannot be greater than sample size (${n})`,
          glassPrompt: `The control group has more events (${events}) than participants (${n}). Let's check these numbers together.`,
        };
      }
      
      return null;
    },
  },
  
  // Mean validation (continuous outcomes)
  {
    columnKey: 'mean_treatment',
    validate: (value) => {
      if (value === undefined || value === '') return null; // Optional field
      
      const mean = Number(value);
      
      if (isNaN(mean)) {
        return {
          rowIndex: 0,
          columnKey: 'mean_treatment',
          severity: 'error',
          message: 'Mean must be a number',
          suggestion: 'Enter a numeric value for the mean',
          glassPrompt: 'The mean value doesn\'t look like a number. Means should be numeric values. Would you like help extracting this from your paper?',
        };
      }
      
      return null;
    },
  },
  
  // Standard deviation validation
  {
    columnKey: 'sd_treatment',
    validate: (value, row) => {
      if (value === undefined || value === '') return null; // Optional field
      
      const sd = Number(value);
      
      if (isNaN(sd)) {
        return {
          rowIndex: 0,
          columnKey: 'sd_treatment',
          severity: 'error',
          message: 'Standard deviation must be a number',
          suggestion: 'Enter a numeric value for the SD',
          glassPrompt: 'The standard deviation doesn\'t look like a number. Would you like me to help you convert from other measures like SE, CI, or IQR?',
        };
      }
      
      if (sd < 0) {
        return {
          rowIndex: 0,
          columnKey: 'sd_treatment',
          severity: 'error',
          message: 'Standard deviation cannot be negative',
          suggestion: 'SD must be a positive number',
          glassPrompt: 'Standard deviations are always positive (or zero). A negative value suggests a data entry error. Let me help you check this.',
        };
      }
      
      if (sd === 0) {
        return {
          rowIndex: 0,
          columnKey: 'sd_treatment',
          severity: 'warning',
          message: 'Standard deviation is zero',
          suggestion: 'An SD of 0 means no variation - all values are identical',
          glassPrompt: 'A standard deviation of zero means all participants had exactly the same value, which is very unusual. Is this correct, or should we verify?',
        };
      }
      
      return null;
    },
  },
  
  // SD control validation
  {
    columnKey: 'sd_control',
    validate: (value) => {
      if (value === undefined || value === '') return null;
      
      const sd = Number(value);
      
      if (isNaN(sd)) {
        return {
          rowIndex: 0,
          columnKey: 'sd_control',
          severity: 'error',
          message: 'Standard deviation must be a number',
          suggestion: 'Enter a numeric value for the SD',
          glassPrompt: 'The control group SD doesn\'t look like a number. Need help converting from SE or CI?',
        };
      }
      
      if (sd < 0) {
        return {
          rowIndex: 0,
          columnKey: 'sd_control',
          severity: 'error',
          message: 'Standard deviation cannot be negative',
          suggestion: 'SD must be a positive number',
          glassPrompt: 'Standard deviations can\'t be negative. This looks like a data entry error.',
        };
      }
      
      return null;
    },
  },
];

/**
 * Validate a single cell value
 */
export function validateCell(
  value: string | number | undefined,
  columnKey: string,
  row: Row,
  allRows: Row[],
  rowIndex: number,
  customRules?: ValidationRule[]
): ValidationError | null {
  const rules = customRules || META_ANALYSIS_VALIDATION_RULES;
  const rule = rules.find(r => r.columnKey === columnKey);
  
  if (!rule) return null;
  
  const error = rule.validate(value, row, allRows);
  if (error) {
    return { ...error, rowIndex };
  }
  
  return null;
}

/**
 * Validate entire spreadsheet data
 */
export function validateSpreadsheet(
  data: SpreadsheetData,
  customRules?: ValidationRule[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const infos: ValidationError[] = [];
  
  const rules = customRules || META_ANALYSIS_VALIDATION_RULES;
  
  // Validate each row
  data.rows.forEach((row, rowIndex) => {
    // Validate each column
    data.columns.forEach(column => {
      const value = row[column.key];
      const error = validateCell(value, column.key, row, data.rows, rowIndex, rules);
      
      if (error) {
        switch (error.severity) {
          case 'error':
            errors.push(error);
            break;
          case 'warning':
            warnings.push(error);
            break;
          case 'info':
            infos.push(error);
            break;
        }
      }
    });
  });
  
  // Generate summary
  const isValid = errors.length === 0;
  let summary = '';
  
  if (isValid && warnings.length === 0 && infos.length === 0) {
    summary = '✅ All data looks good! Ready for analysis.';
  } else if (isValid) {
    summary = `⚠️ ${warnings.length} warning(s) and ${infos.length} suggestion(s) to review.`;
  } else {
    summary = `❌ ${errors.length} error(s) must be fixed before analysis.`;
  }
  
  return {
    isValid,
    errors,
    warnings,
    infos,
    summary,
  };
}

/**
 * Get validation color for a cell
 */
export function getValidationColor(
  error: ValidationError | null,
  colors: { error: string; warning: string; success: string }
): string | undefined {
  if (!error) return undefined;
  
  switch (error.severity) {
    case 'error':
      return colors.error + '30'; // 30% opacity
    case 'warning':
      return colors.warning + '30';
    case 'info':
      return colors.success + '20';
    default:
      return undefined;
  }
}

/**
 * Format validation errors for Glass to speak
 */
export function formatValidationForVoice(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'Your data looks complete and valid. Ready to run the meta-analysis!';
  }
  
  const parts: string[] = [];
  
  if (result.errors.length > 0) {
    parts.push(`I found ${result.errors.length} error${result.errors.length > 1 ? 's' : ''} that need to be fixed.`);
    
    // Describe first few errors
    result.errors.slice(0, 3).forEach(error => {
      parts.push(`Row ${error.rowIndex + 1}, ${error.columnKey}: ${error.message}.`);
    });
    
    if (result.errors.length > 3) {
      parts.push(`And ${result.errors.length - 3} more errors.`);
    }
  }
  
  if (result.warnings.length > 0) {
    parts.push(`There are also ${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''} to review.`);
  }
  
  return parts.join(' ');
}
