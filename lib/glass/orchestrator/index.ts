/**
 * Glass Orchestrator
 * 
 * Automated meta-analysis workflow engine that detects data types,
 * suggests appropriate analyses, and generates executable R code.
 */

// Types
export * from './types';

// Core modules
export { detectDataType, getDataTypeLabel, getExpectedColumns, COLUMN_SIGNATURES } from './data-type-detector';
export { suggestAnalysis, getEffectMeasureName } from './analysis-suggester';
export { generateRCode } from './r-code-generator';

// React hook
export { useOrchestrator, createAnalysisSummary } from './use-orchestrator';
export type { AnalysisResult, UseOrchestratorReturn } from './use-orchestrator';
