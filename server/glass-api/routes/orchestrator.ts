/**
 * Orchestrator Routes
 * 
 * Endpoints for data type detection, analysis suggestion, and R code generation.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { detectDataType } from '../../../lib/glass/orchestrator/data-type-detector';
import { suggestAnalysis } from '../../../lib/glass/orchestrator/analysis-suggester';
import { generateRCode } from '../../../lib/glass/orchestrator/r-code-generator';
import { DataType, DataTypeResult, SpreadsheetColumn } from '../../../lib/glass/orchestrator/types';
import { ApiError, ValidationError } from '../middleware/error';

export const orchestratorRouter = Router();

/**
 * Convert string array to SpreadsheetColumn array
 */
function toSpreadsheetColumns(columns: string[]): SpreadsheetColumn[] {
  return columns.map(key => ({ key, label: key }));
}

// =============================================================================
// POST /orchestrator/detect
// Detect the data type from spreadsheet columns
// =============================================================================
orchestratorRouter.post('/detect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { columns, sample_data } = req.body;

    // Validate input
    if (!columns || !Array.isArray(columns)) {
      throw new ValidationError([
        { field: 'columns', message: 'columns must be an array of column names' }
      ]);
    }

    if (columns.length === 0) {
      throw new ValidationError([
        { field: 'columns', message: 'columns array cannot be empty' }
      ]);
    }

    // Convert to SpreadsheetColumn format
    const spreadsheetColumns = toSpreadsheetColumns(columns);
    const rows = sample_data || [];

    // Detect data type
    const result = detectDataType(spreadsheetColumns, rows);

    res.json({
      success: true,
      data: {
        detected_type: result.type,
        confidence: result.confidence,
        matched_columns: result.matchedColumns,
        missing_columns: result.missingColumns,
        optional_columns: result.optionalColumns,
        warnings: result.warnings || [],
        complete_rows: result.completeRows,
        total_rows: result.totalRows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// POST /orchestrator/suggest
// Get analysis recommendations based on data type
// =============================================================================
orchestratorRouter.post('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data_type, study_count, has_subgroups, has_moderators } = req.body;

    // Validate input
    if (!data_type) {
      throw new ValidationError([
        { field: 'data_type', message: 'data_type is required' }
      ]);
    }

    const validTypes = Object.values(DataType);
    if (!validTypes.includes(data_type)) {
      throw new ValidationError([
        { field: 'data_type', message: `data_type must be one of: ${validTypes.join(', ')}` }
      ]);
    }

    // Create a minimal detection result for the suggester
    const detection: DataTypeResult = {
      type: data_type as DataType,
      confidence: 1.0,
      matchedColumns: [],
      missingColumns: [],
      optionalColumns: [],
      warnings: [],
      completeRows: study_count || 10,
      totalRows: study_count || 10,
    };

    // Get suggestion
    const suggestion = suggestAnalysis(detection, study_count || 10);

    // Build recommendations based on context
    const recommendations: string[] = [];

    if (study_count && study_count < 5) {
      recommendations.push(
        'With fewer than 5 studies, heterogeneity estimates may be unreliable. Consider using a fixed-effect model.'
      );
    }

    if (has_subgroups) {
      recommendations.push(
        'Subgroup analysis is recommended to explore sources of heterogeneity.'
      );
    }

    if (has_moderators) {
      recommendations.push(
        'Meta-regression can be used to examine the effect of continuous moderators.'
      );
    }

    res.json({
      success: true,
      data: {
        data_type: suggestion.dataType,
        primary_analysis: {
          effect_measures: suggestion.effectMeasures,
          default_measure: suggestion.defaultMeasure,
          model_type: suggestion.model.type,
          model_method: suggestion.model.method,
          model_rationale: suggestion.model.rationale,
        },
        analyses: suggestion.analyses.map(a => ({
          name: a.name,
          description: a.description,
          required: a.required,
          r_function: a.rFunction,
          rationale: a.rationale,
        })),
        explanation: suggestion.explanation,
        confidence: suggestion.confidence,
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// POST /orchestrator/generate
// Generate R code for the analysis
// =============================================================================
orchestratorRouter.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      data_type, 
      effect_measure, 
      column_mapping, 
    } = req.body;

    // Validate input
    if (!data_type) {
      throw new ValidationError([
        { field: 'data_type', message: 'data_type is required' }
      ]);
    }

    // Create detection result for suggester
    const detection: DataTypeResult = {
      type: data_type as DataType,
      confidence: 1.0,
      matchedColumns: [],
      missingColumns: [],
      optionalColumns: [],
      warnings: [],
      completeRows: 10,
      totalRows: 10,
    };

    // Get suggestion first (needed for code generation)
    const suggestion = suggestAnalysis(detection, 10);

    // Generate R code
    const generated = generateRCode(suggestion, column_mapping || {}, effect_measure);

    res.json({
      success: true,
      data: {
        script: generated.script,
        sections: generated.sections.map(s => ({
          title: s.title,
          code: s.code,
          description: s.description,
        })),
        packages_required: generated.packages,
        output_files: [
          'forest_plot.png',
          'funnel_plot.png',
          'results.json',
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// POST /orchestrator/full-workflow
// Run the complete workflow: detect → suggest → generate
// =============================================================================
orchestratorRouter.post('/full-workflow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { columns, sample_data } = req.body;

    // Validate input
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      throw new ValidationError([
        { field: 'columns', message: 'columns must be a non-empty array of column names' }
      ]);
    }

    // Convert to SpreadsheetColumn format
    const spreadsheetColumns = toSpreadsheetColumns(columns);
    const rows = sample_data || [];

    // Step 1: Detect data type
    const detection = detectDataType(spreadsheetColumns, rows);

    if (detection.type === DataType.UNKNOWN) {
      throw ApiError.badRequest(
        'Could not detect data type from provided columns',
        { columns, warnings: detection.warnings }
      );
    }

    // Step 2: Get analysis suggestion
    const suggestion = suggestAnalysis(detection, rows.length || 10);

    // Step 3: Generate R code
    const generated = generateRCode(suggestion, { study: 'study' });

    res.json({
      success: true,
      data: {
        detection: {
          data_type: detection.type,
          confidence: detection.confidence,
          matched_columns: detection.matchedColumns,
          warnings: detection.warnings,
        },
        suggestion: {
          effect_measures: suggestion.effectMeasures,
          default_measure: suggestion.defaultMeasure,
          model: suggestion.model,
          explanation: suggestion.explanation,
        },
        code: {
          script: generated.script,
          packages_required: generated.packages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
