/**
 * DataTypeDetector Module
 * 
 * Automatically detects the type of meta-analysis data from spreadsheet columns
 * using pattern matching with fuzzy matching for typos and variations.
 */

import {
  DataType,
  DataTypeResult,
  ColumnSignature,
  SpreadsheetColumn,
  SpreadsheetRow
} from './types';

/**
 * Column name patterns for each data type
 * Uses fuzzy matching to handle variations
 */
export const COLUMN_SIGNATURES: ColumnSignature[] = [
  {
    type: DataType.DIAGNOSTIC,
    required: [
      ['tp', 'fp', 'fn', 'tn'],
      ['true_positive', 'false_positive', 'false_negative', 'true_negative'],
      ['sensitivity', 'specificity', 'n_diseased', 'n_healthy'],
    ],
    optional: ['study', 'year', 'threshold', 'test_name', 'reference_standard'],
    minConfidence: 0.95
  },
  {
    // CONTINUOUS must come before BINARY because it has more required columns
    // and we want to match the more specific pattern first
    type: DataType.CONTINUOUS,
    required: [
      ['mean_treatment', 'mean_control', 'sd_treatment', 'sd_control', 'n_treatment', 'n_control'],
      ['m1i', 'm2i', 'sd1i', 'sd2i', 'n1i', 'n2i'],
      ['mean_treat', 'mean_ctrl', 'sd_treat', 'sd_ctrl', 'n_treat', 'n_ctrl'],
      ['mean_t', 'mean_c', 'sd_t', 'sd_c', 'n_t', 'n_c'],
    ],
    optional: ['study', 'year', 'subgroup', 'quality', 'se_treatment', 'se_control'],
    minConfidence: 0.92
  },
  {
    type: DataType.BINARY,
    required: [
      ['events_treatment', 'events_control', 'n_treatment', 'n_control'],
      ['ai', 'bi', 'ci', 'di'],
      ['events_treat', 'events_ctrl', 'n_treat', 'n_ctrl'],
      ['e_treatment', 'e_control', 'n_treatment', 'n_control'],
      ['event_t', 'event_c', 'n_t', 'n_c'],
    ],
    optional: ['study', 'year', 'subgroup', 'quality', 'author'],
    minConfidence: 0.90
  },
  {
    type: DataType.HAZARD_RATIO,
    required: [
      ['hr', 'ci_lower', 'ci_upper'],
      ['log_hr', 'se_hr'],
      ['hazard_ratio', 'lower_ci', 'upper_ci'],
      ['hr', 'se_hr'],
      ['hazard_ratio', 'hr_lower', 'hr_upper'],
    ],
    optional: ['study', 'year', 'events', 'total', 'follow_up'],
    minConfidence: 0.90
  },
  {
    type: DataType.CORRELATION,
    required: [
      ['correlation', 'sample_size'],
      ['cor', 'sample_size'],
      ['r_value', 'n_pairs'],
      ['pearson_r', 'n'],
    ],
    optional: ['study', 'year', 'ci_lower', 'ci_upper'],
    minConfidence: 0.90
  },
  {
    type: DataType.PRECALCULATED,
    required: [
      ['effect_size', 'se'],
      ['yi', 'vi'],
      ['effect_size', 'ci_lower', 'ci_upper'],
      ['es', 'se'],
      ['smd', 'se'],
      ['effect', 'se'],
      ['effect', 'variance'],
    ],
    optional: ['study', 'year', 'n_total', 'weight', 'subgroup'],
    minConfidence: 0.85
  }
];

/**
 * Normalize column name for matching
 * Handles: snake_case, camelCase, spaces, abbreviations
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\s-]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/treatment/g, 'treat')
    .replace(/control/g, 'ctrl')
    .replace(/standard_deviation/g, 'sd')
    .replace(/sample_size/g, 'n')
    .replace(/confidence_interval/g, 'ci')
    .replace(/intervention/g, 'treat')
    .replace(/placebo/g, 'ctrl')
    .replace(/experimental/g, 'treat')
    .replace(/comparison/g, 'ctrl');
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Check if a column name matches a pattern
 */
function columnMatches(actual: string, pattern: string): boolean {
  const normalizedActual = normalizeColumnName(actual);
  const normalizedPattern = normalizeColumnName(pattern);
  
  // Exact match
  if (normalizedActual === normalizedPattern) return true;
  
  // Contains match (for longer descriptive names)
  if (normalizedActual.includes(normalizedPattern)) return true;
  if (normalizedPattern.includes(normalizedActual) && normalizedActual.length >= 2) return true;
  
  // Levenshtein distance for typos (threshold: 2)
  if (levenshteinDistance(normalizedActual, normalizedPattern) <= 2) return true;
  
  return false;
}

/**
 * Find matching columns for a required set
 */
function findMatchingColumns(
  actualColumns: string[],
  requiredSet: string[]
): { matched: Map<string, string>; missing: string[] } {
  const matched = new Map<string, string>();
  const missing: string[] = [];
  const usedActual = new Set<string>();
  
  for (const required of requiredSet) {
    let foundMatch: string | null = null;
    
    for (const actual of actualColumns) {
      if (!usedActual.has(actual) && columnMatches(actual, required)) {
        foundMatch = actual;
        break;
      }
    }
    
    if (foundMatch) {
      matched.set(required, foundMatch);
      usedActual.add(foundMatch);
    } else {
      missing.push(required);
    }
  }
  
  return { matched, missing };
}

/**
 * Count rows with all required columns populated
 */
function countCompleteRows(
  rows: SpreadsheetRow[],
  requiredColumns: string[]
): number {
  return rows.filter(row =>
    requiredColumns.every(col => {
      const value = row[col];
      return value !== null && value !== undefined && value !== '';
    })
  ).length;
}

/**
 * Generate warnings based on data quality
 */
function generateWarnings(
  rows: SpreadsheetRow[],
  columns: string[],
  dataType: DataType
): string[] {
  const warnings: string[] = [];
  
  // Check for small sample size
  if (rows.length < 3) {
    warnings.push('Very few studies (< 3). Meta-analysis may not be appropriate.');
  } else if (rows.length < 10) {
    warnings.push('Small number of studies (< 10). Publication bias tests may have low power.');
  }
  
  // Check for missing data
  const completeRows = countCompleteRows(rows, columns);
  const missingPct = ((rows.length - completeRows) / rows.length) * 100;
  if (missingPct > 0) {
    warnings.push(`${missingPct.toFixed(0)}% of rows have missing data in required columns.`);
  }
  
  // Data type specific warnings
  if (dataType === DataType.BINARY) {
    const hasZeroCells = rows.some(row => {
      for (const col of columns) {
        if (col.includes('event') && (row[col] === 0 || row[col] === '0')) {
          return true;
        }
      }
      return false;
    });
    if (hasZeroCells) {
      warnings.push('Some studies have zero events. Continuity correction will be applied.');
    }
  }
  
  if (dataType === DataType.CONTINUOUS) {
    const hasNegativeSD = rows.some(row => {
      for (const col of columns) {
        if (col.includes('sd')) {
          const val = Number(row[col]);
          if (!isNaN(val) && val < 0) return true;
        }
      }
      return false;
    });
    if (hasNegativeSD) {
      warnings.push('Negative standard deviation detected. Please check your data.');
    }
  }
  
  if (dataType === DataType.CORRELATION) {
    const hasInvalidR = rows.some(row => {
      for (const col of columns) {
        if (col === 'r' || col.includes('corr')) {
          const val = Number(row[col]);
          if (!isNaN(val) && (val < -1 || val > 1)) return true;
        }
      }
      return false;
    });
    if (hasInvalidR) {
      warnings.push('Correlation values outside [-1, 1] detected. Please check your data.');
    }
  }
  
  return warnings;
}

/**
 * Main detection function
 */
export function detectDataType(
  columns: SpreadsheetColumn[],
  rows: SpreadsheetRow[]
): DataTypeResult {
  const columnKeys = columns.map(c => c.key);
  
  let bestMatch: DataTypeResult = {
    type: DataType.UNKNOWN,
    confidence: 0,
    matchedColumns: [],
    missingColumns: [],
    optionalColumns: [],
    warnings: [],
    completeRows: 0,
    totalRows: rows.length
  };
  
  // Try each signature in priority order
  for (const signature of COLUMN_SIGNATURES) {
    for (const requiredSet of signature.required) {
      const { matched, missing } = findMatchingColumns(columnKeys, requiredSet);
      
      // Calculate confidence based on match ratio
      const matchRatio = matched.size / requiredSet.length;
      const confidence = matchRatio * signature.minConfidence;
      
      // Only consider if all required columns are present and better than current best
      if (missing.length === 0 && confidence > bestMatch.confidence) {
        // Find optional columns
        const optionalMatched = signature.optional.filter(opt =>
          columnKeys.some(col => columnMatches(col, opt))
        );
        
        // Get actual matched column names
        const matchedColumns = Array.from(matched.values());
        
        // Count complete rows
        const completeRows = countCompleteRows(rows, matchedColumns);
        
        // Generate warnings
        const warnings = generateWarnings(rows, matchedColumns, signature.type);
        
        bestMatch = {
          type: signature.type,
          confidence,
          matchedColumns,
          missingColumns: [],
          optionalColumns: optionalMatched,
          warnings,
          completeRows,
          totalRows: rows.length
        };
      }
    }
  }
  
  // Add warning if no match found
  if (bestMatch.type === DataType.UNKNOWN) {
    bestMatch.warnings.push(
      'Could not automatically detect data type. Please verify column names match expected patterns (e.g., events_treatment, mean_control, tp, fp) or select data type manually.'
    );
  }
  
  return bestMatch;
}

/**
 * Get human-readable label for data type
 */
export function getDataTypeLabel(type: DataType): string {
  const labels: Record<DataType, string> = {
    [DataType.BINARY]: 'Binary Outcomes (Events)',
    [DataType.CONTINUOUS]: 'Continuous Outcomes (Means)',
    [DataType.PRECALCULATED]: 'Pre-calculated Effect Sizes',
    [DataType.DIAGNOSTIC]: 'Diagnostic Test Accuracy',
    [DataType.CORRELATION]: 'Correlations',
    [DataType.HAZARD_RATIO]: 'Time-to-Event (Hazard Ratios)',
    [DataType.UNKNOWN]: 'Unknown'
  };
  return labels[type];
}

/**
 * Get expected columns for a data type
 */
export function getExpectedColumns(type: DataType): string[] {
  const signature = COLUMN_SIGNATURES.find(s => s.type === type);
  if (!signature) return [];
  return signature.required[0] || [];
}
