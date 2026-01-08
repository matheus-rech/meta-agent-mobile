# MVP Orchestrator Implementation Plan

**Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2026  
**Estimated Time:** 8-10 hours  

---

## Executive Summary

The MVP Orchestrator is a focused implementation that delivers 80% of the value of the full Glass Orchestrator in 10% of the time. It automatically detects data types from spreadsheet columns, suggests appropriate meta-analysis methods, and generates ready-to-run R code. This document provides the complete implementation specification.

---

## 1. Scope Definition

### 1.1 What's Included (MVP)

| Component | Description | Priority |
|-----------|-------------|----------|
| **DataTypeDetector** | Identifies outcome type from column patterns | P0 - Critical |
| **AnalysisSuggester** | Recommends appropriate effect measures and models | P0 - Critical |
| **RCodeGenerator** | Generates primary analysis R code | P0 - Critical |
| **GlassIntegration** | Connects orchestrator to Glass chat | P1 - High |
| **SuggestionUI** | Displays recommendations in spreadsheet | P1 - High |

### 1.2 What's Deferred (Future)

| Component | Reason for Deferral |
|-----------|---------------------|
| ROBAnalyzer | Requires PDF parsing, complex logic |
| GuidelineSelector | Can be manual for MVP |
| OutputGenerator | Methods/Results text generation is complex |
| Missing Data Imputation | Edge case, can handle manually |
| Advanced Analyses (TSA, Bayesian, NMA) | Primary analysis covers most needs |

---

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPREADSHEET DATA                             │
│  (columns: study, year, events_treatment, n_treatment, etc.)    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DataTypeDetector                            │
│                                                                 │
│  Input: Column[] + Row[]                                        │
│  Process: Pattern matching against known column signatures      │
│  Output: DataTypeResult { type, confidence, warnings }          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AnalysisSuggester                           │
│                                                                 │
│  Input: DataTypeResult + study count                            │
│  Process: Map data type to appropriate analyses                 │
│  Output: AnalysisSuggestion { measures, model, tests }          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RCodeGenerator                             │
│                                                                 │
│  Input: AnalysisSuggestion + column mappings                    │
│  Process: Template interpolation with actual column names       │
│  Output: Complete R script ready to execute                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Glass Integration                            │
│                                                                 │
│  • Display suggestion card in chat                              │
│  • "Run Analysis" button executes R code                        │
│  • Results displayed with interpretation                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Detail

```
User enters data in spreadsheet
         │
         ▼
┌─────────────────┐
│ Column Analysis │──────────────────────────────────────┐
└─────────────────┘                                      │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│ Pattern Match:  │                           │ Pattern Match:  │
│ Binary Outcome  │                           │ Continuous      │
│                 │                           │ Outcome         │
│ events_treat ✓  │                           │                 │
│ events_ctrl  ✓  │                           │ mean_treat   ✓  │
│ n_treat      ✓  │                           │ mean_ctrl    ✓  │
│ n_ctrl       ✓  │                           │ sd_treat     ✓  │
└─────────────────┘                           │ sd_ctrl      ✓  │
         │                                    │ n_treat      ✓  │
         ▼                                    │ n_ctrl       ✓  │
┌─────────────────┐                           └─────────────────┘
│ Suggest:        │                                    │
│ • OR or RR      │                                    ▼
│ • RE model      │                           ┌─────────────────┐
│ • Forest plot   │                           │ Suggest:        │
│ • Funnel plot   │                           │ • SMD or MD     │
│ • Egger's test  │                           │ • RE model      │
└─────────────────┘                           │ • Forest plot   │
         │                                    │ • Funnel plot   │
         ▼                                    │ • Egger's test  │
┌─────────────────┐                           └─────────────────┘
│ Generate R Code │                                    │
│                 │                                    ▼
│ library(metafor)│                           ┌─────────────────┐
│ dat <- escalc(  │                           │ Generate R Code │
│   measure="OR", │                           │                 │
│   ai=...,       │                           │ library(metafor)│
│   ...           │                           │ dat <- escalc(  │
│ )               │                           │   measure="SMD",│
│ res <- rma(...) │                           │   m1i=...,      │
└─────────────────┘                           │   ...           │
                                              │ )               │
                                              │ res <- rma(...) │
                                              └─────────────────┘
```

---

## 3. DataTypeDetector Module

### 3.1 Type Definitions

```typescript
// File: lib/glass/orchestrator/types.ts

/**
 * Supported data types for meta-analysis
 */
export enum DataType {
  BINARY = 'binary',           // Events in treatment/control groups
  CONTINUOUS = 'continuous',   // Means and SDs in treatment/control
  PRECALCULATED = 'precalculated', // Effect size + SE already calculated
  DIAGNOSTIC = 'diagnostic',   // TP, FP, FN, TN (2x2 table)
  CORRELATION = 'correlation', // Correlation coefficient + N
  HAZARD_RATIO = 'hazard_ratio', // HR with CI or log(HR) with SE
  UNKNOWN = 'unknown'
}

/**
 * Result of data type detection
 */
export interface DataTypeResult {
  /** Primary detected data type */
  type: DataType;
  
  /** Confidence score 0-1 */
  confidence: number;
  
  /** Columns that matched the pattern */
  matchedColumns: string[];
  
  /** Required columns that are missing */
  missingColumns: string[];
  
  /** Optional columns that could enhance analysis */
  optionalColumns: string[];
  
  /** Warnings about data quality or structure */
  warnings: string[];
  
  /** Number of complete rows (no missing required data) */
  completeRows: number;
  
  /** Total rows in dataset */
  totalRows: number;
}

/**
 * Column signature for pattern matching
 */
export interface ColumnSignature {
  type: DataType;
  required: string[][];  // Array of alternative column name sets
  optional: string[];
  minConfidence: number;
}
```

### 3.2 Column Signatures

```typescript
// File: lib/glass/orchestrator/data-type-detector.ts

/**
 * Column name patterns for each data type
 * Uses fuzzy matching to handle variations (e.g., "n_treatment" vs "n_treat" vs "nTreatment")
 */
export const COLUMN_SIGNATURES: ColumnSignature[] = [
  {
    type: DataType.BINARY,
    required: [
      // Primary pattern: event counts
      ['events_treatment', 'events_control', 'n_treatment', 'n_control'],
      // Alternative: explicit event/no-event counts
      ['ai', 'bi', 'ci', 'di'],
      // Alternative: events + totals
      ['events_treat', 'events_ctrl', 'total_treat', 'total_ctrl'],
    ],
    optional: ['study', 'year', 'subgroup', 'quality'],
    minConfidence: 0.90
  },
  
  {
    type: DataType.CONTINUOUS,
    required: [
      // Primary pattern: means, SDs, Ns
      ['mean_treatment', 'mean_control', 'sd_treatment', 'sd_control', 'n_treatment', 'n_control'],
      // Alternative: m1i/m2i notation (metafor style)
      ['m1i', 'm2i', 'sd1i', 'sd2i', 'n1i', 'n2i'],
      // Alternative: shorter names
      ['mean_treat', 'mean_ctrl', 'sd_treat', 'sd_ctrl', 'n_treat', 'n_ctrl'],
    ],
    optional: ['study', 'year', 'subgroup', 'quality', 'se_treatment', 'se_control'],
    minConfidence: 0.90
  },
  
  {
    type: DataType.PRECALCULATED,
    required: [
      // Effect size + SE
      ['effect_size', 'se'],
      ['yi', 'vi'],  // metafor notation (vi = variance)
      ['effect_size', 'ci_lower', 'ci_upper'],
      ['es', 'se'],
      ['smd', 'se'],
      ['or', 'ci_lower', 'ci_upper'],
      ['rr', 'ci_lower', 'ci_upper'],
      ['hr', 'ci_lower', 'ci_upper'],
    ],
    optional: ['study', 'year', 'n_total', 'weight', 'subgroup'],
    minConfidence: 0.85
  },
  
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
    type: DataType.CORRELATION,
    required: [
      ['r', 'n'],
      ['correlation', 'sample_size'],
      ['cor', 'n'],
    ],
    optional: ['study', 'year', 'ci_lower', 'ci_upper'],
    minConfidence: 0.90
  },
  
  {
    type: DataType.HAZARD_RATIO,
    required: [
      ['hr', 'ci_lower', 'ci_upper'],
      ['log_hr', 'se'],
      ['hazard_ratio', 'lower_ci', 'upper_ci'],
    ],
    optional: ['study', 'year', 'events', 'total', 'follow_up'],
    minConfidence: 0.90
  }
];
```

### 3.3 Detection Algorithm

```typescript
// File: lib/glass/orchestrator/data-type-detector.ts

import { DataType, DataTypeResult, ColumnSignature, COLUMN_SIGNATURES } from './types';

/**
 * Normalize column name for matching
 * Handles: snake_case, camelCase, spaces, abbreviations
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\s-]+/g, '_')           // Normalize separators
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .toLowerCase()
    .replace(/treatment/g, 'treat')      // Common abbreviations
    .replace(/control/g, 'ctrl')
    .replace(/standard_deviation/g, 'sd')
    .replace(/sample_size/g, 'n')
    .replace(/confidence_interval/g, 'ci');
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
): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  
  for (const required of requiredSet) {
    const match = actualColumns.find(col => columnMatches(col, required));
    if (match) {
      matched.push(match);
    } else {
      missing.push(required);
    }
  }
  
  return { matched, missing };
}

/**
 * Main detection function
 */
export function detectDataType(
  columns: Array<{ key: string; label: string }>,
  rows: Array<Record<string, unknown>>
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
  
  // Try each signature
  for (const signature of COLUMN_SIGNATURES) {
    for (const requiredSet of signature.required) {
      const { matched, missing } = findMatchingColumns(columnKeys, requiredSet);
      
      // Calculate confidence based on match ratio
      const matchRatio = matched.length / requiredSet.length;
      const confidence = matchRatio * signature.minConfidence;
      
      if (confidence > bestMatch.confidence && missing.length === 0) {
        // Find optional columns
        const optionalMatched = signature.optional.filter(opt =>
          columnKeys.some(col => columnMatches(col, opt))
        );
        
        // Count complete rows
        const completeRows = countCompleteRows(rows, matched);
        
        // Generate warnings
        const warnings = generateWarnings(rows, matched, signature.type);
        
        bestMatch = {
          type: signature.type,
          confidence,
          matchedColumns: matched,
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
      'Could not automatically detect data type. Please verify column names match expected patterns or select data type manually.'
    );
  }
  
  return bestMatch;
}

/**
 * Count rows with all required columns populated
 */
function countCompleteRows(
  rows: Array<Record<string, unknown>>,
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
  rows: Array<Record<string, unknown>>,
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
    // Check for zero cells
    const hasZeroCells = rows.some(row => {
      const events = [row['events_treatment'], row['events_control']];
      return events.some(e => e === 0 || e === '0');
    });
    if (hasZeroCells) {
      warnings.push('Some studies have zero events. Continuity correction will be applied.');
    }
  }
  
  return warnings;
}

/**
 * Levenshtein distance for fuzzy matching
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
```

---

## 4. AnalysisSuggester Module

### 4.1 Type Definitions

```typescript
// File: lib/glass/orchestrator/types.ts (continued)

/**
 * Effect measure options
 */
export type EffectMeasure = 
  | 'OR'   // Odds Ratio
  | 'RR'   // Risk Ratio
  | 'RD'   // Risk Difference
  | 'SMD'  // Standardized Mean Difference
  | 'MD'   // Mean Difference
  | 'COR'  // Correlation
  | 'ZCOR' // Fisher's Z transformed correlation
  | 'HR'   // Hazard Ratio
  | 'SENS' // Sensitivity (diagnostic)
  | 'SPEC' // Specificity (diagnostic)
  | 'DOR'  // Diagnostic Odds Ratio
  ;

/**
 * Analysis suggestion from orchestrator
 */
export interface AnalysisSuggestion {
  /** Detected data type */
  dataType: DataType;
  
  /** Recommended effect measures (in order of preference) */
  effectMeasures: EffectMeasure[];
  
  /** Default effect measure */
  defaultMeasure: EffectMeasure;
  
  /** Model recommendation */
  model: {
    type: 'fixed' | 'random';
    method: string;  // e.g., 'REML', 'DL', 'PM'
    rationale: string;
  };
  
  /** Recommended analyses */
  analyses: AnalysisRecommendation[];
  
  /** Human-readable explanation */
  explanation: string;
  
  /** Confidence in suggestion */
  confidence: number;
}

export interface AnalysisRecommendation {
  name: string;
  description: string;
  required: boolean;
  rFunction: string;
  rationale: string;
}
```

### 4.2 Suggestion Logic

```typescript
// File: lib/glass/orchestrator/analysis-suggester.ts

import { DataType, DataTypeResult, AnalysisSuggestion, EffectMeasure } from './types';

/**
 * Generate analysis suggestions based on detected data type
 */
export function suggestAnalysis(
  detection: DataTypeResult,
  studyCount: number
): AnalysisSuggestion {
  
  switch (detection.type) {
    case DataType.BINARY:
      return suggestBinaryAnalysis(detection, studyCount);
    
    case DataType.CONTINUOUS:
      return suggestContinuousAnalysis(detection, studyCount);
    
    case DataType.PRECALCULATED:
      return suggestPrecalculatedAnalysis(detection, studyCount);
    
    case DataType.DIAGNOSTIC:
      return suggestDiagnosticAnalysis(detection, studyCount);
    
    case DataType.CORRELATION:
      return suggestCorrelationAnalysis(detection, studyCount);
    
    case DataType.HAZARD_RATIO:
      return suggestHazardRatioAnalysis(detection, studyCount);
    
    default:
      return suggestUnknownAnalysis(detection);
  }
}

function suggestBinaryAnalysis(
  detection: DataTypeResult,
  studyCount: number
): AnalysisSuggestion {
  
  const analyses: AnalysisRecommendation[] = [
    {
      name: 'Random-Effects Meta-Analysis',
      description: 'Pool effect sizes using random-effects model',
      required: true,
      rFunction: 'rma(yi, vi, data=dat, method="REML")',
      rationale: 'Random-effects accounts for between-study heterogeneity'
    },
    {
      name: 'Forest Plot',
      description: 'Visualize individual and pooled effects',
      required: true,
      rFunction: 'forest(res, atransf=exp)',
      rationale: 'Essential for presenting meta-analysis results'
    },
    {
      name: 'Heterogeneity Assessment',
      description: 'Calculate I², τ², and Q statistic',
      required: true,
      rFunction: 'Included in rma() output',
      rationale: 'Quantifies between-study variability'
    }
  ];
  
  // Add publication bias tests if enough studies
  if (studyCount >= 10) {
    analyses.push({
      name: 'Funnel Plot',
      description: 'Visual assessment of publication bias',
      required: true,
      rFunction: 'funnel(res)',
      rationale: 'Recommended when ≥10 studies available'
    });
    analyses.push({
      name: "Egger's Test",
      description: 'Statistical test for funnel plot asymmetry',
      required: true,
      rFunction: 'regtest(res)',
      rationale: 'Formal test for small-study effects'
    });
  }
  
  // Add sensitivity analyses
  analyses.push({
    name: 'Leave-One-Out Analysis',
    description: 'Check influence of individual studies',
    required: false,
    rFunction: 'leave1out(res)',
    rationale: 'Identifies influential studies'
  });
  
  return {
    dataType: DataType.BINARY,
    effectMeasures: ['OR', 'RR', 'RD'],
    defaultMeasure: 'OR',
    model: {
      type: 'random',
      method: 'REML',
      rationale: 'REML provides less biased τ² estimates; random-effects recommended for clinical heterogeneity'
    },
    analyses,
    explanation: generateBinaryExplanation(studyCount),
    confidence: detection.confidence
  };
}

function suggestContinuousAnalysis(
  detection: DataTypeResult,
  studyCount: number
): AnalysisSuggestion {
  
  const analyses: AnalysisRecommendation[] = [
    {
      name: 'Random-Effects Meta-Analysis',
      description: 'Pool effect sizes using random-effects model',
      required: true,
      rFunction: 'rma(yi, vi, data=dat, method="REML")',
      rationale: 'Random-effects accounts for between-study heterogeneity'
    },
    {
      name: 'Forest Plot',
      description: 'Visualize individual and pooled effects',
      required: true,
      rFunction: 'forest(res)',
      rationale: 'Essential for presenting meta-analysis results'
    },
    {
      name: 'Heterogeneity Assessment',
      description: 'Calculate I², τ², and Q statistic',
      required: true,
      rFunction: 'Included in rma() output',
      rationale: 'Quantifies between-study variability'
    }
  ];
  
  if (studyCount >= 10) {
    analyses.push({
      name: 'Funnel Plot',
      description: 'Visual assessment of publication bias',
      required: true,
      rFunction: 'funnel(res)',
      rationale: 'Recommended when ≥10 studies available'
    });
    analyses.push({
      name: "Egger's Test",
      description: 'Statistical test for funnel plot asymmetry',
      required: true,
      rFunction: 'regtest(res)',
      rationale: 'Formal test for small-study effects'
    });
  }
  
  analyses.push({
    name: 'Leave-One-Out Analysis',
    description: 'Check influence of individual studies',
    required: false,
    rFunction: 'leave1out(res)',
    rationale: 'Identifies influential studies'
  });
  
  return {
    dataType: DataType.CONTINUOUS,
    effectMeasures: ['SMD', 'MD'],
    defaultMeasure: 'SMD',
    model: {
      type: 'random',
      method: 'REML',
      rationale: 'SMD recommended when studies use different scales; REML for τ² estimation'
    },
    analyses,
    explanation: generateContinuousExplanation(studyCount),
    confidence: detection.confidence
  };
}

function suggestDiagnosticAnalysis(
  detection: DataTypeResult,
  studyCount: number
): AnalysisSuggestion {
  
  return {
    dataType: DataType.DIAGNOSTIC,
    effectMeasures: ['SENS', 'SPEC', 'DOR'],
    defaultMeasure: 'SENS',
    model: {
      type: 'random',
      method: 'bivariate',
      rationale: 'Bivariate model accounts for correlation between sensitivity and specificity'
    },
    analyses: [
      {
        name: 'Bivariate Meta-Analysis',
        description: 'Joint modeling of sensitivity and specificity',
        required: true,
        rFunction: 'reitsma(data)',
        rationale: 'Accounts for threshold effect and correlation'
      },
      {
        name: 'SROC Curve',
        description: 'Summary ROC curve with confidence region',
        required: true,
        rFunction: 'plot(fit, sroclwd=2)',
        rationale: 'Visualizes diagnostic accuracy across thresholds'
      },
      {
        name: 'Forest Plots (Sens/Spec)',
        description: 'Paired forest plots for sensitivity and specificity',
        required: true,
        rFunction: 'forest(fit, type="sens"); forest(fit, type="spec")',
        rationale: 'Shows individual study accuracy measures'
      }
    ],
    explanation: generateDiagnosticExplanation(studyCount),
    confidence: detection.confidence
  };
}

// Helper functions for generating explanations
function generateBinaryExplanation(studyCount: number): string {
  let explanation = `I detected **binary outcome data** (events in treatment and control groups) from ${studyCount} studies. `;
  explanation += `I recommend using the **Odds Ratio (OR)** as the effect measure with a **random-effects model** (REML estimation). `;
  
  if (studyCount >= 10) {
    explanation += `With ${studyCount} studies, you have sufficient power for publication bias assessment using funnel plots and Egger's test.`;
  } else {
    explanation += `Note: With only ${studyCount} studies, publication bias tests have limited power and should be interpreted cautiously.`;
  }
  
  return explanation;
}

function generateContinuousExplanation(studyCount: number): string {
  let explanation = `I detected **continuous outcome data** (means and standard deviations) from ${studyCount} studies. `;
  explanation += `I recommend using the **Standardized Mean Difference (SMD)** if studies used different measurement scales, or **Mean Difference (MD)** if scales are identical. `;
  explanation += `A **random-effects model** with REML estimation is recommended.`;
  
  return explanation;
}

function generateDiagnosticExplanation(studyCount: number): string {
  return `I detected **diagnostic accuracy data** (2×2 tables with TP, FP, FN, TN) from ${studyCount} studies. ` +
    `For diagnostic meta-analysis, I recommend the **bivariate model** which jointly estimates sensitivity and specificity ` +
    `while accounting for their correlation. The **SROC curve** will visualize the trade-off between sensitivity and specificity.`;
}

// Similar functions for other data types...
function suggestPrecalculatedAnalysis(detection: DataTypeResult, studyCount: number): AnalysisSuggestion {
  return {
    dataType: DataType.PRECALCULATED,
    effectMeasures: ['OR', 'RR', 'SMD', 'MD', 'HR'],
    defaultMeasure: 'SMD',
    model: {
      type: 'random',
      method: 'REML',
      rationale: 'Pre-calculated effect sizes can be directly pooled'
    },
    analyses: [
      {
        name: 'Random-Effects Meta-Analysis',
        description: 'Pool pre-calculated effect sizes',
        required: true,
        rFunction: 'rma(yi, sei=se, data=dat, method="REML")',
        rationale: 'Direct pooling of reported effect sizes'
      },
      {
        name: 'Forest Plot',
        description: 'Visualize individual and pooled effects',
        required: true,
        rFunction: 'forest(res)',
        rationale: 'Essential for presenting results'
      }
    ],
    explanation: `I detected **pre-calculated effect sizes** with standard errors from ${studyCount} studies. These can be directly pooled using a random-effects model.`,
    confidence: detection.confidence
  };
}

function suggestCorrelationAnalysis(detection: DataTypeResult, studyCount: number): AnalysisSuggestion {
  return {
    dataType: DataType.CORRELATION,
    effectMeasures: ['COR', 'ZCOR'],
    defaultMeasure: 'ZCOR',
    model: {
      type: 'random',
      method: 'REML',
      rationale: "Fisher's Z transformation normalizes the distribution"
    },
    analyses: [
      {
        name: 'Random-Effects Meta-Analysis',
        description: "Pool correlations using Fisher's Z",
        required: true,
        rFunction: 'rma(yi, vi, data=dat, method="REML")',
        rationale: "Z transformation recommended for pooling correlations"
      },
      {
        name: 'Forest Plot',
        description: 'Visualize correlations (back-transformed)',
        required: true,
        rFunction: 'forest(res, atransf=transf.ztor)',
        rationale: 'Show results on correlation scale'
      }
    ],
    explanation: `I detected **correlation data** from ${studyCount} studies. I recommend using Fisher's Z transformation for pooling, then back-transforming for interpretation.`,
    confidence: detection.confidence
  };
}

function suggestHazardRatioAnalysis(detection: DataTypeResult, studyCount: number): AnalysisSuggestion {
  return {
    dataType: DataType.HAZARD_RATIO,
    effectMeasures: ['HR'],
    defaultMeasure: 'HR',
    model: {
      type: 'random',
      method: 'REML',
      rationale: 'Log(HR) is pooled, then exponentiated'
    },
    analyses: [
      {
        name: 'Random-Effects Meta-Analysis',
        description: 'Pool hazard ratios on log scale',
        required: true,
        rFunction: 'rma(yi, vi, data=dat, method="REML")',
        rationale: 'HRs pooled on log scale for normality'
      },
      {
        name: 'Forest Plot',
        description: 'Visualize HRs with confidence intervals',
        required: true,
        rFunction: 'forest(res, atransf=exp)',
        rationale: 'Show results on HR scale'
      }
    ],
    explanation: `I detected **time-to-event data** (hazard ratios) from ${studyCount} studies. HRs will be pooled on the log scale and back-transformed for interpretation.`,
    confidence: detection.confidence
  };
}

function suggestUnknownAnalysis(detection: DataTypeResult): AnalysisSuggestion {
  return {
    dataType: DataType.UNKNOWN,
    effectMeasures: [],
    defaultMeasure: 'SMD',
    model: {
      type: 'random',
      method: 'REML',
      rationale: 'Default recommendation'
    },
    analyses: [],
    explanation: 'I could not automatically detect your data type. Please check that your column names match expected patterns (e.g., events_treatment, mean_control, tp, fp, etc.) or manually specify the data type.',
    confidence: 0
  };
}
```

---

## 5. RCodeGenerator Module

### 5.1 Code Generation

```typescript
// File: lib/glass/orchestrator/r-code-generator.ts

import { DataType, AnalysisSuggestion, EffectMeasure } from './types';

export interface ColumnMapping {
  study: string;
  year?: string;
  // Binary
  events_treatment?: string;
  events_control?: string;
  n_treatment?: string;
  n_control?: string;
  // Continuous
  mean_treatment?: string;
  mean_control?: string;
  sd_treatment?: string;
  sd_control?: string;
  // Pre-calculated
  effect_size?: string;
  se?: string;
  ci_lower?: string;
  ci_upper?: string;
  // Diagnostic
  tp?: string;
  fp?: string;
  fn?: string;
  tn?: string;
  // Correlation
  r?: string;
  n?: string;
  // HR
  hr?: string;
  log_hr?: string;
}

export interface GeneratedCode {
  /** Complete R script */
  script: string;
  
  /** Individual code sections for display */
  sections: CodeSection[];
  
  /** Required R packages */
  packages: string[];
}

export interface CodeSection {
  title: string;
  code: string;
  description: string;
}

/**
 * Generate complete R code for meta-analysis
 */
export function generateRCode(
  suggestion: AnalysisSuggestion,
  mapping: ColumnMapping,
  measure: EffectMeasure = suggestion.defaultMeasure
): GeneratedCode {
  
  switch (suggestion.dataType) {
    case DataType.BINARY:
      return generateBinaryCode(mapping, measure);
    
    case DataType.CONTINUOUS:
      return generateContinuousCode(mapping, measure);
    
    case DataType.PRECALCULATED:
      return generatePrecalculatedCode(mapping, measure);
    
    case DataType.DIAGNOSTIC:
      return generateDiagnosticCode(mapping);
    
    case DataType.CORRELATION:
      return generateCorrelationCode(mapping);
    
    case DataType.HAZARD_RATIO:
      return generateHazardRatioCode(mapping);
    
    default:
      throw new Error(`Unsupported data type: ${suggestion.dataType}`);
  }
}

function generateBinaryCode(
  mapping: ColumnMapping,
  measure: EffectMeasure
): GeneratedCode {
  
  const sections: CodeSection[] = [];
  
  // Section 1: Setup
  sections.push({
    title: 'Setup',
    description: 'Load required packages',
    code: `# Meta-Analysis of Binary Outcomes
# Generated by Glass Orchestrator

library(metafor)

# Load your data
# dat <- read.csv("your_data.csv")
`
  });
  
  // Section 2: Effect Size Calculation
  sections.push({
    title: 'Calculate Effect Sizes',
    description: `Calculate ${measure} and variance for each study`,
    code: `# Calculate ${measure} (${getEffectMeasureName(measure)})
dat <- escalc(
  measure = "${measure}",
  ai = ${mapping.events_treatment || 'events_treatment'},
  bi = ${mapping.n_treatment || 'n_treatment'} - ${mapping.events_treatment || 'events_treatment'},
  ci = ${mapping.events_control || 'events_control'},
  di = ${mapping.n_control || 'n_control'} - ${mapping.events_control || 'events_control'},
  data = dat,
  slab = ${mapping.study || 'study'}
)

# View calculated effect sizes
print(dat[, c("${mapping.study || 'study'}", "yi", "vi")])
`
  });
  
  // Section 3: Meta-Analysis Model
  sections.push({
    title: 'Fit Random-Effects Model',
    description: 'Pool effect sizes using REML estimation',
    code: `# Fit random-effects model
res <- rma(yi, vi, data = dat, method = "REML")

# Summary of results
summary(res)

# Pooled effect on original scale
predict(res, transf = exp, digits = 3)
`
  });
  
  // Section 4: Forest Plot
  sections.push({
    title: 'Forest Plot',
    description: 'Visualize individual and pooled effects',
    code: `# Forest plot
forest(res,
       atransf = exp,
       at = log(c(0.25, 0.5, 1, 2, 4)),
       xlim = c(-8, 6),
       header = TRUE,
       slab = dat$${mapping.study || 'study'})
`
  });
  
  // Section 5: Heterogeneity
  sections.push({
    title: 'Heterogeneity Assessment',
    description: 'Assess between-study variability',
    code: `# Heterogeneity statistics
cat("\\nHeterogeneity Assessment:\\n")
cat(sprintf("Q = %.2f, df = %d, p = %.4f\\n", res$QE, res$k - 1, res$QEp))
cat(sprintf("I² = %.1f%%\\n", res$I2))
cat(sprintf("τ² = %.4f\\n", res$tau2))

# Prediction interval
pi <- predict(res, transf = exp)
cat(sprintf("\\n95%% Prediction Interval: %.2f to %.2f\\n", pi$pi.lb, pi$pi.ub))
`
  });
  
  // Section 6: Publication Bias
  sections.push({
    title: 'Publication Bias Assessment',
    description: 'Funnel plot and Egger\'s test',
    code: `# Funnel plot
funnel(res, main = "Funnel Plot")

# Egger's regression test
regtest(res)

# Trim-and-fill analysis
taf <- trimfill(res)
summary(taf)
funnel(taf, main = "Trim-and-Fill Funnel Plot")
`
  });
  
  // Section 7: Sensitivity Analysis
  sections.push({
    title: 'Sensitivity Analyses',
    description: 'Leave-one-out and influence diagnostics',
    code: `# Leave-one-out analysis
loo <- leave1out(res, transf = exp)
print(loo)

# Influence diagnostics
inf <- influence(res)
plot(inf)
`
  });
  
  // Combine all sections
  const script = sections.map(s => 
    `# ============================================\n# ${s.title}\n# ${s.description}\n# ============================================\n\n${s.code}`
  ).join('\n\n');
  
  return {
    script,
    sections,
    packages: ['metafor']
  };
}

function generateContinuousCode(
  mapping: ColumnMapping,
  measure: EffectMeasure
): GeneratedCode {
  
  const sections: CodeSection[] = [];
  
  sections.push({
    title: 'Setup',
    description: 'Load required packages',
    code: `# Meta-Analysis of Continuous Outcomes
# Generated by Glass Orchestrator

library(metafor)
`
  });
  
  sections.push({
    title: 'Calculate Effect Sizes',
    description: `Calculate ${measure} and variance for each study`,
    code: `# Calculate ${measure} (${getEffectMeasureName(measure)})
dat <- escalc(
  measure = "${measure}",
  m1i = ${mapping.mean_treatment || 'mean_treatment'},
  sd1i = ${mapping.sd_treatment || 'sd_treatment'},
  n1i = ${mapping.n_treatment || 'n_treatment'},
  m2i = ${mapping.mean_control || 'mean_control'},
  sd2i = ${mapping.sd_control || 'sd_control'},
  n2i = ${mapping.n_control || 'n_control'},
  data = dat,
  slab = ${mapping.study || 'study'}
)
`
  });
  
  sections.push({
    title: 'Fit Random-Effects Model',
    description: 'Pool effect sizes using REML estimation',
    code: `# Fit random-effects model
res <- rma(yi, vi, data = dat, method = "REML")
summary(res)
`
  });
  
  sections.push({
    title: 'Forest Plot',
    description: 'Visualize individual and pooled effects',
    code: `# Forest plot
forest(res, header = TRUE, slab = dat$${mapping.study || 'study'})
`
  });
  
  sections.push({
    title: 'Heterogeneity & Publication Bias',
    description: 'Assess heterogeneity and publication bias',
    code: `# Heterogeneity
cat(sprintf("I² = %.1f%%, τ² = %.4f\\n", res$I2, res$tau2))

# Funnel plot and Egger's test
funnel(res)
regtest(res)
`
  });
  
  const script = sections.map(s => `# ${s.title}\n${s.code}`).join('\n\n');
  
  return {
    script,
    sections,
    packages: ['metafor']
  };
}

function generateDiagnosticCode(mapping: ColumnMapping): GeneratedCode {
  
  const sections: CodeSection[] = [];
  
  sections.push({
    title: 'Setup',
    description: 'Load required packages for diagnostic meta-analysis',
    code: `# Diagnostic Test Accuracy Meta-Analysis
# Generated by Glass Orchestrator

library(mada)
library(metafor)
`
  });
  
  sections.push({
    title: 'Prepare Data',
    description: 'Format 2x2 table data',
    code: `# Ensure data has correct column names
# Required: TP, FP, FN, TN
dat <- data.frame(
  study = dat$${mapping.study || 'study'},
  TP = dat$${mapping.tp || 'tp'},
  FP = dat$${mapping.fp || 'fp'},
  FN = dat$${mapping.fn || 'fn'},
  TN = dat$${mapping.tn || 'tn'}
)
`
  });
  
  sections.push({
    title: 'Bivariate Model',
    description: 'Fit bivariate random-effects model',
    code: `# Fit bivariate model (Reitsma et al.)
fit <- reitsma(dat)
summary(fit)

# Summary operating point (sensitivity, specificity)
print(summary(fit)$coefficients)
`
  });
  
  sections.push({
    title: 'SROC Curve',
    description: 'Summary ROC curve with confidence region',
    code: `# SROC curve
plot(fit, 
     sroclwd = 2,
     main = "Summary ROC Curve")
points(fpr(dat), sens(dat), pch = 19)

# Add confidence and prediction regions
plot(fit, sroclwd = 2, predict = TRUE)
`
  });
  
  sections.push({
    title: 'Forest Plots',
    description: 'Paired forest plots for sensitivity and specificity',
    code: `# Forest plot - Sensitivity
forest(fit, type = "sens", main = "Sensitivity")

# Forest plot - Specificity  
forest(fit, type = "spec", main = "Specificity")
`
  });
  
  const script = sections.map(s => `# ${s.title}\n${s.code}`).join('\n\n');
  
  return {
    script,
    sections,
    packages: ['mada', 'metafor']
  };
}

// Helper function
function getEffectMeasureName(measure: EffectMeasure): string {
  const names: Record<EffectMeasure, string> = {
    'OR': 'Odds Ratio',
    'RR': 'Risk Ratio',
    'RD': 'Risk Difference',
    'SMD': 'Standardized Mean Difference',
    'MD': 'Mean Difference',
    'COR': 'Correlation',
    'ZCOR': "Fisher's Z Correlation",
    'HR': 'Hazard Ratio',
    'SENS': 'Sensitivity',
    'SPEC': 'Specificity',
    'DOR': 'Diagnostic Odds Ratio'
  };
  return names[measure] || measure;
}

// Additional generators for other data types...
function generatePrecalculatedCode(mapping: ColumnMapping, measure: EffectMeasure): GeneratedCode {
  const script = `# Pre-calculated Effect Sizes Meta-Analysis
library(metafor)

# Fit model directly with provided effect sizes
res <- rma(
  yi = ${mapping.effect_size || 'effect_size'},
  sei = ${mapping.se || 'se'},
  data = dat,
  method = "REML",
  slab = ${mapping.study || 'study'}
)

summary(res)
forest(res, header = TRUE)
funnel(res)
`;

  return {
    script,
    sections: [{ title: 'Complete Analysis', code: script, description: 'Pre-calculated effect sizes' }],
    packages: ['metafor']
  };
}

function generateCorrelationCode(mapping: ColumnMapping): GeneratedCode {
  const script = `# Correlation Meta-Analysis
library(metafor)

# Transform correlations to Fisher's Z
dat <- escalc(
  measure = "ZCOR",
  ri = ${mapping.r || 'r'},
  ni = ${mapping.n || 'n'},
  data = dat,
  slab = ${mapping.study || 'study'}
)

# Fit model
res <- rma(yi, vi, data = dat, method = "REML")
summary(res)

# Back-transform to correlation scale
predict(res, transf = transf.ztor, digits = 3)

# Forest plot (on r scale)
forest(res, atransf = transf.ztor, header = TRUE)
`;

  return {
    script,
    sections: [{ title: 'Complete Analysis', code: script, description: 'Correlation meta-analysis' }],
    packages: ['metafor']
  };
}

function generateHazardRatioCode(mapping: ColumnMapping): GeneratedCode {
  const script = `# Hazard Ratio Meta-Analysis
library(metafor)

# If HR and CI provided, calculate log(HR) and SE
dat$yi <- log(dat$${mapping.hr || 'hr'})
dat$sei <- (log(dat$${mapping.ci_upper || 'ci_upper'}) - log(dat$${mapping.ci_lower || 'ci_lower'})) / (2 * 1.96)

# Fit model
res <- rma(yi, sei = sei, data = dat, method = "REML", slab = ${mapping.study || 'study'})
summary(res)

# Results on HR scale
predict(res, transf = exp, digits = 3)

# Forest plot
forest(res, atransf = exp, header = TRUE)
`;

  return {
    script,
    sections: [{ title: 'Complete Analysis', code: script, description: 'Hazard ratio meta-analysis' }],
    packages: ['metafor']
  };
}
```

---

## 6. Glass Integration

### 6.1 Orchestrator Hook

```typescript
// File: lib/glass/orchestrator/use-orchestrator.ts

import { useState, useCallback, useMemo } from 'react';
import { detectDataType } from './data-type-detector';
import { suggestAnalysis } from './analysis-suggester';
import { generateRCode, ColumnMapping } from './r-code-generator';
import { DataType, DataTypeResult, AnalysisSuggestion, EffectMeasure } from './types';

export interface OrchestratorState {
  detection: DataTypeResult | null;
  suggestion: AnalysisSuggestion | null;
  generatedCode: string | null;
  isAnalyzing: boolean;
  error: string | null;
}

export function useOrchestrator() {
  const [state, setState] = useState<OrchestratorState>({
    detection: null,
    suggestion: null,
    generatedCode: null,
    isAnalyzing: false,
    error: null
  });
  
  const analyzeData = useCallback((
    columns: Array<{ key: string; label: string }>,
    rows: Array<Record<string, unknown>>
  ) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      // Step 1: Detect data type
      const detection = detectDataType(columns, rows);
      
      // Step 2: Generate suggestions
      const suggestion = suggestAnalysis(detection, rows.length);
      
      // Step 3: Auto-generate column mapping
      const mapping = autoMapColumns(columns, detection);
      
      // Step 4: Generate R code
      const { script } = generateRCode(suggestion, mapping);
      
      setState({
        detection,
        suggestion,
        generatedCode: script,
        isAnalyzing: false,
        error: null
      });
      
      return { detection, suggestion, generatedCode: script };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));
      return null;
    }
  }, []);
  
  const regenerateCode = useCallback((
    measure: EffectMeasure,
    customMapping?: Partial<ColumnMapping>
  ) => {
    if (!state.suggestion || !state.detection) return null;
    
    const mapping = customMapping || autoMapColumns([], state.detection);
    const { script } = generateRCode(state.suggestion, mapping as ColumnMapping, measure);
    
    setState(prev => ({ ...prev, generatedCode: script }));
    return script;
  }, [state.suggestion, state.detection]);
  
  const reset = useCallback(() => {
    setState({
      detection: null,
      suggestion: null,
      generatedCode: null,
      isAnalyzing: false,
      error: null
    });
  }, []);
  
  return {
    ...state,
    analyzeData,
    regenerateCode,
    reset
  };
}

/**
 * Auto-map columns based on detection results
 */
function autoMapColumns(
  columns: Array<{ key: string; label: string }>,
  detection: DataTypeResult
): ColumnMapping {
  const mapping: ColumnMapping = { study: 'study' };
  
  // Use matched columns from detection
  for (const col of detection.matchedColumns) {
    const normalizedKey = col.toLowerCase().replace(/[_\s-]+/g, '_');
    
    if (normalizedKey.includes('study') || normalizedKey.includes('author')) {
      mapping.study = col;
    } else if (normalizedKey.includes('event') && normalizedKey.includes('treat')) {
      mapping.events_treatment = col;
    } else if (normalizedKey.includes('event') && normalizedKey.includes('ctrl')) {
      mapping.events_control = col;
    } else if (normalizedKey.includes('n_') && normalizedKey.includes('treat')) {
      mapping.n_treatment = col;
    } else if (normalizedKey.includes('n_') && normalizedKey.includes('ctrl')) {
      mapping.n_control = col;
    } else if (normalizedKey.includes('mean') && normalizedKey.includes('treat')) {
      mapping.mean_treatment = col;
    } else if (normalizedKey.includes('mean') && normalizedKey.includes('ctrl')) {
      mapping.mean_control = col;
    } else if (normalizedKey.includes('sd') && normalizedKey.includes('treat')) {
      mapping.sd_treatment = col;
    } else if (normalizedKey.includes('sd') && normalizedKey.includes('ctrl')) {
      mapping.sd_control = col;
    } else if (normalizedKey === 'tp' || normalizedKey === 'true_positive') {
      mapping.tp = col;
    } else if (normalizedKey === 'fp' || normalizedKey === 'false_positive') {
      mapping.fp = col;
    } else if (normalizedKey === 'fn' || normalizedKey === 'false_negative') {
      mapping.fn = col;
    } else if (normalizedKey === 'tn' || normalizedKey === 'true_negative') {
      mapping.tn = col;
    }
  }
  
  return mapping;
}
```

### 6.2 Suggestion Card Component

```typescript
// File: components/glass/AnalysisSuggestionCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { AnalysisSuggestion, DataTypeResult } from '@/lib/glass/orchestrator/types';

interface AnalysisSuggestionCardProps {
  detection: DataTypeResult;
  suggestion: AnalysisSuggestion;
  onAccept: () => void;
  onCustomize: () => void;
  onDismiss: () => void;
}

export function AnalysisSuggestionCard({
  detection,
  suggestion,
  onAccept,
  onCustomize,
  onDismiss
}: AnalysisSuggestionCardProps) {
  const colors = useColors();
  
  const confidenceColor = suggestion.confidence >= 0.9 
    ? colors.success 
    : suggestion.confidence >= 0.7 
      ? colors.warning 
      : colors.error;
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.emoji]}>🔬</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Analysis Suggestion
          </Text>
          <View style={styles.confidenceBadge}>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
            <Text style={[styles.confidenceText, { color: colors.muted }]}>
              {Math.round(suggestion.confidence * 100)}% confident
            </Text>
          </View>
        </View>
      </View>
      
      {/* Detection Result */}
      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Detected Data Type
        </Text>
        <Text style={[styles.dataType, { color: colors.primary }]}>
          {formatDataType(detection.type)}
        </Text>
        <Text style={[styles.columns, { color: colors.muted }]}>
          Matched columns: {detection.matchedColumns.join(', ')}
        </Text>
      </View>
      
      {/* Recommendation */}
      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recommended Analysis
        </Text>
        <Text style={[styles.recommendation, { color: colors.foreground }]}>
          • Effect measure: <Text style={{ fontWeight: 'bold' }}>{suggestion.defaultMeasure}</Text>
        </Text>
        <Text style={[styles.recommendation, { color: colors.foreground }]}>
          • Model: <Text style={{ fontWeight: 'bold' }}>{suggestion.model.type}-effects ({suggestion.model.method})</Text>
        </Text>
        <Text style={[styles.recommendation, { color: colors.foreground }]}>
          • Analyses: {suggestion.analyses.filter(a => a.required).length} required, {suggestion.analyses.filter(a => !a.required).length} optional
        </Text>
      </View>
      
      {/* Explanation */}
      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <Text style={[styles.explanation, { color: colors.muted }]}>
          {suggestion.explanation}
        </Text>
      </View>
      
      {/* Warnings */}
      {detection.warnings.length > 0 && (
        <View style={[styles.warningsSection, { backgroundColor: colors.warning + '20' }]}>
          {detection.warnings.map((warning, i) => (
            <Text key={i} style={[styles.warning, { color: colors.warning }]}>
              ⚠️ {warning}
            </Text>
          ))}
        </View>
      )}
      
      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onAccept}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.background }]}>
            Run Analysis
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onCustomize}
          style={[styles.secondaryButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
            Customize
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onDismiss}>
          <Text style={[styles.dismissText, { color: colors.muted }]}>
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatDataType(type: string): string {
  const labels: Record<string, string> = {
    binary: 'Binary Outcomes (Events)',
    continuous: 'Continuous Outcomes (Means)',
    precalculated: 'Pre-calculated Effect Sizes',
    diagnostic: 'Diagnostic Test Accuracy',
    correlation: 'Correlations',
    hazard_ratio: 'Time-to-Event (Hazard Ratios)',
    unknown: 'Unknown'
  };
  return labels[type] || type;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  dataType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  columns: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  recommendation: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  explanation: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  warningsSection: {
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  warning: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
  dismissText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier New' }),
  },
});
```

---

## 7. Implementation Checklist

### Phase 1: Core Modules (4 hours)

| Task | File | Est. Time | Status |
|------|------|-----------|--------|
| Create types.ts | `lib/glass/orchestrator/types.ts` | 30 min | ⬜ |
| Implement DataTypeDetector | `lib/glass/orchestrator/data-type-detector.ts` | 90 min | ⬜ |
| Implement AnalysisSuggester | `lib/glass/orchestrator/analysis-suggester.ts` | 60 min | ⬜ |
| Implement RCodeGenerator | `lib/glass/orchestrator/r-code-generator.ts` | 60 min | ⬜ |

### Phase 2: Integration (3 hours)

| Task | File | Est. Time | Status |
|------|------|-----------|--------|
| Create useOrchestrator hook | `lib/glass/orchestrator/use-orchestrator.ts` | 45 min | ⬜ |
| Create AnalysisSuggestionCard | `components/glass/AnalysisSuggestionCard.tsx` | 60 min | ⬜ |
| Integrate with SpreadsheetEditor | `components/spreadsheet/SpreadsheetEditor.tsx` | 45 min | ⬜ |
| Connect to Glass chat | `hooks/useGlass.ts` | 30 min | ⬜ |

### Phase 3: Testing (2 hours)

| Task | File | Est. Time | Status |
|------|------|-----------|--------|
| Unit tests for DataTypeDetector | `__tests__/orchestrator/data-type-detector.test.ts` | 45 min | ⬜ |
| Unit tests for AnalysisSuggester | `__tests__/orchestrator/analysis-suggester.test.ts` | 30 min | ⬜ |
| Unit tests for RCodeGenerator | `__tests__/orchestrator/r-code-generator.test.ts` | 30 min | ⬜ |
| Integration tests | `__tests__/orchestrator/integration.test.ts` | 15 min | ⬜ |

### Phase 4: Polish (1 hour)

| Task | Est. Time | Status |
|------|-----------|--------|
| Error handling and edge cases | 30 min | ⬜ |
| Documentation and comments | 15 min | ⬜ |
| Final testing and checkpoint | 15 min | ⬜ |

**Total: 10 hours**

---

## 8. Success Criteria

The MVP Orchestrator is complete when:

1. **DataTypeDetector** correctly identifies all 6 data types with >90% accuracy on test data
2. **AnalysisSuggester** provides appropriate recommendations for each data type
3. **RCodeGenerator** produces valid, executable R code for all data types
4. **UI Integration** displays suggestion card in spreadsheet and Glass chat
5. **"Run Analysis" button** executes generated R code and displays results
6. **All tests pass** with >85% code coverage
7. **No TypeScript errors** in the codebase

---

## 9. Future Enhancements (Post-MVP)

After validating the MVP with users, consider adding:

1. **Subgroup analysis detection** - Identify moderator columns and suggest subgroup analyses
2. **Network structure detection** - Identify multi-treatment comparisons for NMA
3. **Custom column mapping UI** - Allow users to manually map columns if auto-detection fails
4. **Effect measure comparison** - Show results with different effect measures side-by-side
5. **Export to manuscript** - Generate methods text from analysis parameters
