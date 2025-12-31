/**
 * SQLite Database Schema for Meta-Analysis Studies
 * Defines tables for studies, outcomes, and meta-analyses
 */

// Study outcome types
export type OutcomeType = "binary" | "continuous" | "proportion" | "survival" | "correlation";

// Risk of bias domains
export type RoBDomain = 
  | "randomization"
  | "deviations"
  | "missing_data"
  | "measurement"
  | "selection"
  | "other";

export type RoBJudgment = "low" | "some_concerns" | "high" | "unclear";

// Database table interfaces
export interface Study {
  id: number;
  project_id: string;
  study_id: string; // User-defined identifier (e.g., "Smith 2020")
  title: string;
  authors: string;
  year: number;
  journal: string | null;
  doi: string | null;
  pmid: string | null;
  country: string | null;
  study_design: string | null;
  population: string | null;
  intervention: string | null;
  comparator: string | null;
  sample_size: number | null;
  follow_up: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Outcome {
  id: number;
  study_id: number; // Foreign key to Study.id
  outcome_name: string;
  outcome_type: OutcomeType;
  // Binary outcome data
  events_treatment: number | null;
  n_treatment: number | null;
  events_control: number | null;
  n_control: number | null;
  // Continuous outcome data
  mean_treatment: number | null;
  sd_treatment: number | null;
  mean_control: number | null;
  sd_control: number | null;
  // Pre-calculated effect sizes
  effect_size: number | null;
  se: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
  // Metadata
  subgroup: string | null;
  time_point: string | null;
  notes: string | null;
  created_at: string;
}

export interface RiskOfBias {
  id: number;
  study_id: number; // Foreign key to Study.id
  tool: string; // "RoB2", "NOS", "ROBINS-I"
  domain: RoBDomain;
  judgment: RoBJudgment;
  support: string | null;
  created_at: string;
}

export interface MetaAnalysis {
  id: number;
  project_id: string;
  name: string;
  description: string | null;
  outcome_type: OutcomeType;
  effect_measure: string; // "OR", "RR", "MD", "SMD", "HR"
  model: string; // "fixed", "random"
  method: string; // "MH", "REML", "DL", "PM"
  // Results
  pooled_effect: number | null;
  pooled_se: number | null;
  pooled_ci_lower: number | null;
  pooled_ci_upper: number | null;
  p_value: number | null;
  i_squared: number | null;
  tau_squared: number | null;
  q_statistic: number | null;
  q_df: number | null;
  q_p_value: number | null;
  // Stored R code
  r_code: string | null;
  // Plot paths
  forest_plot: string | null;
  funnel_plot: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaAnalysisStudy {
  id: number;
  meta_analysis_id: number;
  outcome_id: number;
  included: boolean;
  weight: number | null;
}

// SQL statements for creating tables
export const CREATE_TABLES_SQL = `
-- Studies table
CREATE TABLE IF NOT EXISTS studies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  year INTEGER NOT NULL,
  journal TEXT,
  doi TEXT,
  pmid TEXT,
  country TEXT,
  study_design TEXT,
  population TEXT,
  intervention TEXT,
  comparator TEXT,
  sample_size INTEGER,
  follow_up TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Outcomes table
CREATE TABLE IF NOT EXISTS outcomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  study_id INTEGER NOT NULL,
  outcome_name TEXT NOT NULL,
  outcome_type TEXT NOT NULL,
  events_treatment INTEGER,
  n_treatment INTEGER,
  events_control INTEGER,
  n_control INTEGER,
  mean_treatment REAL,
  sd_treatment REAL,
  mean_control REAL,
  sd_control REAL,
  effect_size REAL,
  se REAL,
  ci_lower REAL,
  ci_upper REAL,
  subgroup TEXT,
  time_point TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE CASCADE
);

-- Risk of bias table
CREATE TABLE IF NOT EXISTS risk_of_bias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  study_id INTEGER NOT NULL,
  tool TEXT NOT NULL,
  domain TEXT NOT NULL,
  judgment TEXT NOT NULL,
  support TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE CASCADE
);

-- Meta-analyses table
CREATE TABLE IF NOT EXISTS meta_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  outcome_type TEXT NOT NULL,
  effect_measure TEXT NOT NULL,
  model TEXT NOT NULL,
  method TEXT NOT NULL,
  pooled_effect REAL,
  pooled_se REAL,
  pooled_ci_lower REAL,
  pooled_ci_upper REAL,
  p_value REAL,
  i_squared REAL,
  tau_squared REAL,
  q_statistic REAL,
  q_df INTEGER,
  q_p_value REAL,
  r_code TEXT,
  forest_plot TEXT,
  funnel_plot TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Meta-analysis studies junction table
CREATE TABLE IF NOT EXISTS meta_analysis_studies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meta_analysis_id INTEGER NOT NULL,
  outcome_id INTEGER NOT NULL,
  included INTEGER DEFAULT 1,
  weight REAL,
  FOREIGN KEY (meta_analysis_id) REFERENCES meta_analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (outcome_id) REFERENCES outcomes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_studies_project ON studies(project_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_study ON outcomes(study_id);
CREATE INDEX IF NOT EXISTS idx_rob_study ON risk_of_bias(study_id);
CREATE INDEX IF NOT EXISTS idx_ma_project ON meta_analyses(project_id);
`;

// SQL for dropping all tables (for reset)
export const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS meta_analysis_studies;
DROP TABLE IF EXISTS meta_analyses;
DROP TABLE IF EXISTS risk_of_bias;
DROP TABLE IF EXISTS outcomes;
DROP TABLE IF EXISTS studies;
`;
