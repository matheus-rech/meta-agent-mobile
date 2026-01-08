/**
 * Glass Orchestrator Type Definitions
 * 
 * Core types for the MVP Orchestrator that handles automatic data type detection,
 * analysis suggestion, and R code generation for meta-analysis.
 */

/**
 * Supported data types for meta-analysis
 */
export enum DataType {
  BINARY = 'binary',
  CONTINUOUS = 'continuous',
  PRECALCULATED = 'precalculated',
  DIAGNOSTIC = 'diagnostic',
  CORRELATION = 'correlation',
  HAZARD_RATIO = 'hazard_ratio',
  UNKNOWN = 'unknown'
}

/**
 * Effect measure options for meta-analysis
 */
export type EffectMeasure =
  | 'OR'    // Odds Ratio
  | 'RR'    // Risk Ratio
  | 'RD'    // Risk Difference
  | 'SMD'   // Standardized Mean Difference
  | 'MD'    // Mean Difference
  | 'COR'   // Correlation
  | 'ZCOR'  // Fisher's Z transformed correlation
  | 'HR'    // Hazard Ratio
  | 'SENS'  // Sensitivity (diagnostic)
  | 'SPEC'  // Specificity (diagnostic)
  | 'DOR';  // Diagnostic Odds Ratio

/**
 * Result of data type detection from spreadsheet columns
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

/**
 * Individual analysis recommendation
 */
export interface AnalysisRecommendation {
  name: string;
  description: string;
  required: boolean;
  rFunction: string;
  rationale: string;
}

/**
 * Complete analysis suggestion from orchestrator
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
    method: string;
    rationale: string;
  };
  
  /** Recommended analyses */
  analyses: AnalysisRecommendation[];
  
  /** Human-readable explanation */
  explanation: string;
  
  /** Confidence in suggestion */
  confidence: number;
}

/**
 * Column mapping for R code generation
 */
export interface ColumnMapping {
  study: string;
  year?: string;
  // Binary outcomes
  events_treatment?: string;
  events_control?: string;
  n_treatment?: string;
  n_control?: string;
  // Continuous outcomes
  mean_treatment?: string;
  mean_control?: string;
  sd_treatment?: string;
  sd_control?: string;
  // Pre-calculated
  effect_size?: string;
  se?: string;
  ci_lower?: string;
  ci_upper?: string;
  variance?: string;
  // Diagnostic
  tp?: string;
  fp?: string;
  fn?: string;
  tn?: string;
  // Correlation
  r?: string;
  n?: string;
  // Hazard ratio
  hr?: string;
  log_hr?: string;
}

/**
 * Individual code section for display
 */
export interface CodeSection {
  title: string;
  code: string;
  description: string;
}

/**
 * Generated R code result
 */
export interface GeneratedCode {
  /** Complete R script */
  script: string;
  
  /** Individual code sections for display */
  sections: CodeSection[];
  
  /** Required R packages */
  packages: string[];
}

/**
 * Orchestrator state for the hook
 */
export interface OrchestratorState {
  detection: DataTypeResult | null;
  suggestion: AnalysisSuggestion | null;
  generatedCode: GeneratedCode | null;
  columnMapping: ColumnMapping | null;
  isAnalyzing: boolean;
  error: string | null;
}

/**
 * Spreadsheet column definition
 */
export interface SpreadsheetColumn {
  key: string;
  label: string;
  type?: 'text' | 'number';
}

/**
 * Spreadsheet row data
 */
export type SpreadsheetRow = Record<string, unknown>;
