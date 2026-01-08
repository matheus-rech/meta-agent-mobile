/**
 * Spreadsheet Template Service
 * 
 * Manages reusable spreadsheet templates for different study types
 * (RCT, cohort, case-control, etc.)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Column } from '@/components/spreadsheet/SpreadsheetEditor';

// Template storage key
const TEMPLATES_STORAGE_KEY = '@glass/spreadsheet_templates';

// Template types
export type StudyType = 'rct' | 'cohort' | 'case_control' | 'cross_sectional' | 'custom';

export interface SpreadsheetTemplate {
  id: string;
  name: string;
  description: string;
  studyType: StudyType;
  columns: Column[];
  createdAt: number;
  updatedAt: number;
  isBuiltIn: boolean;
}

/**
 * Built-in templates for common study types
 */
export const BUILT_IN_TEMPLATES: SpreadsheetTemplate[] = [
  {
    id: 'rct-binary',
    name: 'RCT - Binary Outcomes',
    description: 'Randomized controlled trials with binary outcomes (e.g., events, response rates)',
    studyType: 'rct',
    columns: [
      { key: 'study', label: 'Study', type: 'text', required: true, width: 120 },
      { key: 'year', label: 'Year', type: 'number', required: true, width: 70 },
      { key: 'n_treatment', label: 'n (Treatment)', type: 'number', required: true, width: 100 },
      { key: 'events_treatment', label: 'Events (Treatment)', type: 'number', required: true, width: 120 },
      { key: 'n_control', label: 'n (Control)', type: 'number', required: true, width: 100 },
      { key: 'events_control', label: 'Events (Control)', type: 'number', required: true, width: 120 },
      { key: 'notes', label: 'Notes', type: 'text', required: false, width: 150 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'rct-continuous',
    name: 'RCT - Continuous Outcomes',
    description: 'Randomized controlled trials with continuous outcomes (means and SDs)',
    studyType: 'rct',
    columns: [
      { key: 'study', label: 'Study', type: 'text', required: true, width: 120 },
      { key: 'year', label: 'Year', type: 'number', required: true, width: 70 },
      { key: 'n_treatment', label: 'n (Treatment)', type: 'number', required: true, width: 100 },
      { key: 'mean_treatment', label: 'Mean (Treatment)', type: 'number', required: true, width: 120 },
      { key: 'sd_treatment', label: 'SD (Treatment)', type: 'number', required: true, width: 100 },
      { key: 'n_control', label: 'n (Control)', type: 'number', required: true, width: 100 },
      { key: 'mean_control', label: 'Mean (Control)', type: 'number', required: true, width: 120 },
      { key: 'sd_control', label: 'SD (Control)', type: 'number', required: true, width: 100 },
      { key: 'notes', label: 'Notes', type: 'text', required: false, width: 150 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'cohort-binary',
    name: 'Cohort Study - Binary Outcomes',
    description: 'Prospective or retrospective cohort studies with binary outcomes',
    studyType: 'cohort',
    columns: [
      { key: 'study', label: 'Study', type: 'text', required: true, width: 120 },
      { key: 'year', label: 'Year', type: 'number', required: true, width: 70 },
      { key: 'design', label: 'Design', type: 'text', required: false, width: 100 },
      { key: 'n_exposed', label: 'n (Exposed)', type: 'number', required: true, width: 100 },
      { key: 'events_exposed', label: 'Events (Exposed)', type: 'number', required: true, width: 120 },
      { key: 'n_unexposed', label: 'n (Unexposed)', type: 'number', required: true, width: 100 },
      { key: 'events_unexposed', label: 'Events (Unexposed)', type: 'number', required: true, width: 120 },
      { key: 'follow_up', label: 'Follow-up (years)', type: 'number', required: false, width: 120 },
      { key: 'quality', label: 'Quality Score', type: 'number', required: false, width: 100 },
      { key: 'notes', label: 'Notes', type: 'text', required: false, width: 150 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'case-control',
    name: 'Case-Control Study',
    description: 'Case-control studies with exposure data',
    studyType: 'case_control',
    columns: [
      { key: 'study', label: 'Study', type: 'text', required: true, width: 120 },
      { key: 'year', label: 'Year', type: 'number', required: true, width: 70 },
      { key: 'cases_exposed', label: 'Cases (Exposed)', type: 'number', required: true, width: 120 },
      { key: 'cases_unexposed', label: 'Cases (Unexposed)', type: 'number', required: true, width: 130 },
      { key: 'controls_exposed', label: 'Controls (Exposed)', type: 'number', required: true, width: 130 },
      { key: 'controls_unexposed', label: 'Controls (Unexposed)', type: 'number', required: true, width: 140 },
      { key: 'matching', label: 'Matching', type: 'text', required: false, width: 100 },
      { key: 'quality', label: 'Quality Score', type: 'number', required: false, width: 100 },
      { key: 'notes', label: 'Notes', type: 'text', required: false, width: 150 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'cross-sectional',
    name: 'Cross-Sectional Study',
    description: 'Cross-sectional studies with prevalence data',
    studyType: 'cross_sectional',
    columns: [
      { key: 'study', label: 'Study', type: 'text', required: true, width: 120 },
      { key: 'year', label: 'Year', type: 'number', required: true, width: 70 },
      { key: 'country', label: 'Country', type: 'text', required: false, width: 100 },
      { key: 'n_total', label: 'Total N', type: 'number', required: true, width: 80 },
      { key: 'n_cases', label: 'Cases', type: 'number', required: true, width: 80 },
      { key: 'prevalence', label: 'Prevalence (%)', type: 'number', required: false, width: 110 },
      { key: 'ci_lower', label: '95% CI Lower', type: 'number', required: false, width: 100 },
      { key: 'ci_upper', label: '95% CI Upper', type: 'number', required: false, width: 100 },
      { key: 'quality', label: 'Quality Score', type: 'number', required: false, width: 100 },
      { key: 'notes', label: 'Notes', type: 'text', required: false, width: 150 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'diagnostic-accuracy',
    name: 'Diagnostic Accuracy',
    description: 'Diagnostic test accuracy studies (sensitivity, specificity)',
    studyType: 'custom',
    columns: [
      { key: 'study', label: 'Study', type: 'text', required: true, width: 120 },
      { key: 'year', label: 'Year', type: 'number', required: true, width: 70 },
      { key: 'tp', label: 'True Positive', type: 'number', required: true, width: 100 },
      { key: 'fp', label: 'False Positive', type: 'number', required: true, width: 100 },
      { key: 'fn', label: 'False Negative', type: 'number', required: true, width: 100 },
      { key: 'tn', label: 'True Negative', type: 'number', required: true, width: 100 },
      { key: 'threshold', label: 'Threshold', type: 'text', required: false, width: 100 },
      { key: 'quality', label: 'QUADAS-2', type: 'number', required: false, width: 100 },
      { key: 'notes', label: 'Notes', type: 'text', required: false, width: 150 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
  {
    id: 'pre-calculated',
    name: 'Pre-calculated Effect Sizes',
    description: 'Studies with pre-calculated effect sizes and standard errors',
    studyType: 'custom',
    columns: [
      { key: 'study', label: 'Study', type: 'text', required: true, width: 120 },
      { key: 'year', label: 'Year', type: 'number', required: true, width: 70 },
      { key: 'effect_size', label: 'Effect Size', type: 'number', required: true, width: 100 },
      { key: 'se', label: 'Standard Error', type: 'number', required: true, width: 110 },
      { key: 'ci_lower', label: '95% CI Lower', type: 'number', required: false, width: 100 },
      { key: 'ci_upper', label: '95% CI Upper', type: 'number', required: false, width: 100 },
      { key: 'n_total', label: 'Total N', type: 'number', required: false, width: 80 },
      { key: 'weight', label: 'Weight', type: 'number', required: false, width: 80 },
      { key: 'notes', label: 'Notes', type: 'text', required: false, width: 150 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isBuiltIn: true,
  },
];

/**
 * Get all templates (built-in + user-created)
 */
export async function getAllTemplates(): Promise<SpreadsheetTemplate[]> {
  try {
    const stored = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
    const userTemplates: SpreadsheetTemplate[] = stored ? JSON.parse(stored) : [];
    
    // Combine built-in and user templates
    return [...BUILT_IN_TEMPLATES, ...userTemplates];
  } catch (error) {
    console.error('Error loading templates:', error);
    return BUILT_IN_TEMPLATES;
  }
}

/**
 * Get templates by study type
 */
export async function getTemplatesByType(studyType: StudyType): Promise<SpreadsheetTemplate[]> {
  const all = await getAllTemplates();
  return all.filter(t => t.studyType === studyType);
}

/**
 * Get a specific template by ID
 */
export async function getTemplateById(id: string): Promise<SpreadsheetTemplate | null> {
  const all = await getAllTemplates();
  return all.find(t => t.id === id) || null;
}

/**
 * Save a new user template
 */
export async function saveTemplate(template: Omit<SpreadsheetTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>): Promise<SpreadsheetTemplate> {
  try {
    const stored = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
    const userTemplates: SpreadsheetTemplate[] = stored ? JSON.parse(stored) : [];
    
    const newTemplate: SpreadsheetTemplate = {
      ...template,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBuiltIn: false,
    };
    
    userTemplates.push(newTemplate);
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(userTemplates));
    
    return newTemplate;
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
}

/**
 * Update an existing user template
 */
export async function updateTemplate(id: string, updates: Partial<SpreadsheetTemplate>): Promise<SpreadsheetTemplate | null> {
  try {
    const stored = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
    const userTemplates: SpreadsheetTemplate[] = stored ? JSON.parse(stored) : [];
    
    const index = userTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      console.error('Template not found:', id);
      return null;
    }
    
    userTemplates[index] = {
      ...userTemplates[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(userTemplates));
    
    return userTemplates[index];
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * Delete a user template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
    const userTemplates: SpreadsheetTemplate[] = stored ? JSON.parse(stored) : [];
    
    const filtered = userTemplates.filter(t => t.id !== id);
    
    if (filtered.length === userTemplates.length) {
      return false; // Template not found
    }
    
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

/**
 * Get study type display name
 */
export function getStudyTypeLabel(studyType: StudyType): string {
  const labels: Record<StudyType, string> = {
    rct: 'Randomized Controlled Trial',
    cohort: 'Cohort Study',
    case_control: 'Case-Control Study',
    cross_sectional: 'Cross-Sectional Study',
    custom: 'Custom',
  };
  return labels[studyType];
}

/**
 * Get study type emoji
 */
export function getStudyTypeEmoji(studyType: StudyType): string {
  const emojis: Record<StudyType, string> = {
    rct: '🎲',
    cohort: '📊',
    case_control: '🔍',
    cross_sectional: '📸',
    custom: '⚙️',
  };
  return emojis[studyType];
}
