/**
 * Spreadsheet Services
 * 
 * Validation, templates, and utilities for spreadsheet data management
 */

export {
  validateCell,
  validateSpreadsheet,
  getValidationColor,
  formatValidationForVoice,
  META_ANALYSIS_VALIDATION_RULES,
  type ValidationError,
  type ValidationResult,
  type ValidationSeverity,
  type ValidationRule,
} from './validation.service';

export {
  getAllTemplates,
  getTemplatesByType,
  getTemplateById,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  getStudyTypeLabel,
  getStudyTypeEmoji,
  BUILT_IN_TEMPLATES,
  type SpreadsheetTemplate,
  type StudyType,
} from './template.service';
