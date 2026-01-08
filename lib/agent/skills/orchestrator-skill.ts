/**
 * Orchestrator Skill for Glass Integration
 * 
 * Integrates the MVP Orchestrator with Glass chat to provide
 * natural language explanations of data analysis recommendations.
 */

import { Skill } from '../types';
import {
  detectDataType,
  suggestAnalysis,
  generateRCode,
  getDataTypeLabel,
  getEffectMeasureName,
  createAnalysisSummary,
  DataType,
  DataTypeResult,
  AnalysisSuggestion,
  GeneratedCode,
  ColumnMapping,
  SpreadsheetColumn,
  SpreadsheetRow,
  EffectMeasure
} from '../../glass/orchestrator';

/**
 * Generate natural language explanation for data type detection
 */
export function explainDataTypeDetection(detection: DataTypeResult): string {
  if (detection.type === DataType.UNKNOWN) {
    return `I couldn't automatically detect the type of data in your spreadsheet. 

**What I found:**
- ${detection.matchedColumns.length > 0 ? `Columns: ${detection.matchedColumns.join(', ')}` : 'No recognizable column patterns'}

**What I need:**
To analyze your data, I need columns that match one of these patterns:

• **Binary outcomes**: events_treatment, events_control, n_treatment, n_control
• **Continuous outcomes**: mean_treatment, mean_control, sd_treatment, sd_control, n_treatment, n_control
• **Diagnostic accuracy**: tp, fp, fn, tn (2×2 table)
• **Pre-calculated effects**: effect_size, se (or yi, vi)
• **Correlations**: correlation, sample_size
• **Hazard ratios**: hr, ci_lower, ci_upper

Could you rename your columns to match one of these patterns, or tell me what type of data you have?`;
  }

  const typeLabel = getDataTypeLabel(detection.type);
  const confidence = Math.round(detection.confidence * 100);
  
  let explanation = `I detected **${typeLabel}** in your spreadsheet with ${confidence}% confidence.\n\n`;
  
  explanation += `**Matched columns:** ${detection.matchedColumns.join(', ')}\n\n`;
  
  if (detection.optionalColumns.length > 0) {
    explanation += `**Optional columns found:** ${detection.optionalColumns.join(', ')}\n\n`;
  }
  
  explanation += `**Data summary:**\n`;
  explanation += `- ${detection.completeRows} of ${detection.totalRows} rows have complete data\n`;
  
  if (detection.warnings.length > 0) {
    explanation += `\n**⚠️ Warnings:**\n`;
    detection.warnings.forEach(w => {
      explanation += `- ${w}\n`;
    });
  }
  
  return explanation;
}

/**
 * Generate natural language explanation for analysis suggestion
 */
export function explainAnalysisSuggestion(suggestion: AnalysisSuggestion): string {
  if (suggestion.dataType === DataType.UNKNOWN) {
    return 'I need to know your data type before I can suggest analyses.';
  }

  let explanation = `## Recommended Analysis Plan\n\n`;
  explanation += suggestion.explanation + '\n\n';
  
  // Effect measures
  explanation += `### Effect Measure\n`;
  explanation += `I recommend using **${suggestion.defaultMeasure}** (${getEffectMeasureName(suggestion.defaultMeasure)}).\n\n`;
  
  if (suggestion.effectMeasures.length > 1) {
    const alternatives = suggestion.effectMeasures
      .filter(m => m !== suggestion.defaultMeasure)
      .map(m => `${m} (${getEffectMeasureName(m)})`);
    explanation += `Alternative options: ${alternatives.join(', ')}\n\n`;
  }
  
  // Model
  explanation += `### Statistical Model\n`;
  explanation += `**${suggestion.model.type === 'random' ? 'Random-effects' : 'Fixed-effect'} model** with ${suggestion.model.method} estimation.\n`;
  explanation += `*Rationale: ${suggestion.model.rationale}*\n\n`;
  
  // Required analyses
  const required = suggestion.analyses.filter(a => a.required);
  const optional = suggestion.analyses.filter(a => !a.required);
  
  explanation += `### Required Analyses\n`;
  required.forEach(a => {
    explanation += `1. **${a.name}** - ${a.description}\n`;
  });
  explanation += '\n';
  
  if (optional.length > 0) {
    explanation += `### Optional Analyses\n`;
    optional.forEach(a => {
      explanation += `- **${a.name}** - ${a.description}\n`;
    });
    explanation += '\n';
  }
  
  return explanation;
}

/**
 * Generate natural language explanation for R code
 */
export function explainRCode(code: GeneratedCode): string {
  let explanation = `## Generated R Code\n\n`;
  
  explanation += `I've generated a complete R script with ${code.sections.length} sections:\n\n`;
  
  code.sections.forEach((section, i) => {
    explanation += `${i + 1}. **${section.title}** - ${section.description}\n`;
  });
  
  explanation += `\n**Required packages:** ${code.packages.join(', ')}\n\n`;
  
  explanation += `### How to Use\n`;
  explanation += `1. Copy the code below into R or RStudio\n`;
  explanation += `2. Make sure you have the required packages installed\n`;
  explanation += `3. Load your data (replace the commented line with your actual data)\n`;
  explanation += `4. Run the script section by section\n\n`;
  
  explanation += `\`\`\`r\n${code.script}\n\`\`\`\n`;
  
  return explanation;
}

/**
 * Generate complete analysis workflow explanation
 */
export function explainFullWorkflow(
  detection: DataTypeResult,
  suggestion: AnalysisSuggestion,
  code: GeneratedCode
): string {
  let explanation = `# Meta-Analysis Workflow\n\n`;
  
  // Step 1: Data Detection
  explanation += `## Step 1: Data Type Detection\n\n`;
  explanation += explainDataTypeDetection(detection);
  explanation += '\n---\n\n';
  
  // Step 2: Analysis Recommendation
  explanation += `## Step 2: Analysis Recommendations\n\n`;
  explanation += explainAnalysisSuggestion(suggestion);
  explanation += '\n---\n\n';
  
  // Step 3: R Code
  explanation += `## Step 3: R Code\n\n`;
  explanation += explainRCode(code);
  
  return explanation;
}

/**
 * Generate conversational response for Glass
 */
export function generateConversationalResponse(
  detection: DataTypeResult,
  suggestion: AnalysisSuggestion,
  context: 'detection' | 'suggestion' | 'code' | 'full'
): string {
  switch (context) {
    case 'detection':
      return explainDataTypeDetection(detection);
    case 'suggestion':
      return explainAnalysisSuggestion(suggestion);
    case 'code':
      if (suggestion.dataType === DataType.UNKNOWN) {
        return 'I need to detect your data type first before generating R code.';
      }
      const mapping: ColumnMapping = { study: 'study' };
      const code = generateRCode(suggestion, mapping);
      return explainRCode(code);
    case 'full':
      if (suggestion.dataType === DataType.UNKNOWN) {
        return explainDataTypeDetection(detection);
      }
      const fullMapping: ColumnMapping = { study: 'study' };
      const fullCode = generateRCode(suggestion, fullMapping);
      return explainFullWorkflow(detection, suggestion, fullCode);
    default:
      return 'I can help you analyze your meta-analysis data. What would you like to know?';
  }
}

/**
 * Orchestrator skill definition for Glass
 */
export const orchestratorSkill: Skill = {
  name: 'data-orchestrator',
  description: 'Automatically detects data types, suggests appropriate meta-analyses, and generates R code with natural language explanations',
  triggers: [
    'analyze my data', 'analyze data', 'what analysis',
    'detect data type', 'data type',
    'suggest analysis', 'recommend analysis', 'what should i run',
    'generate r code', 'r code', 'generate code',
    'help me analyze', 'run meta-analysis',
    'what kind of data', 'identify data',
    'appropriate analysis', 'which analysis',
    'orchestrator', 'auto-detect'
  ],
  tools: [
    {
      name: 'detect_data_type',
      description: 'Automatically detect the type of meta-analysis data from spreadsheet columns',
      handler: async (args: { columns?: SpreadsheetColumn[]; rows?: SpreadsheetRow[] }) => {
        if (!args.columns || !args.rows) {
          return {
            type: 'orchestrator',
            action: 'detect',
            success: false,
            message: 'Please provide spreadsheet columns and rows for analysis.',
            explanation: 'I need access to your spreadsheet data to detect the data type. Please open a spreadsheet first.'
          };
        }
        
        const detection = detectDataType(args.columns, args.rows);
        const explanation = explainDataTypeDetection(detection);
        
        return {
          type: 'orchestrator',
          action: 'detect',
          success: detection.type !== DataType.UNKNOWN,
          detection,
          explanation,
          message: detection.type !== DataType.UNKNOWN 
            ? `Detected ${getDataTypeLabel(detection.type)} data`
            : 'Could not detect data type'
        };
      }
    },
    {
      name: 'suggest_analysis',
      description: 'Suggest appropriate meta-analysis methods based on detected data type',
      handler: async (args: { detection?: DataTypeResult; studyCount?: number }) => {
        if (!args.detection) {
          return {
            type: 'orchestrator',
            action: 'suggest',
            success: false,
            message: 'Please detect data type first.',
            explanation: 'I need to know your data type before suggesting analyses. Run data type detection first.'
          };
        }
        
        const suggestion = suggestAnalysis(args.detection, args.studyCount || 10);
        const explanation = explainAnalysisSuggestion(suggestion);
        
        return {
          type: 'orchestrator',
          action: 'suggest',
          success: suggestion.dataType !== DataType.UNKNOWN,
          suggestion,
          explanation,
          message: `Recommended: ${suggestion.defaultMeasure} with ${suggestion.model.type}-effects model`
        };
      }
    },
    {
      name: 'generate_analysis_code',
      description: 'Generate complete R code for the recommended meta-analysis',
      handler: async (args: { 
        suggestion?: AnalysisSuggestion; 
        mapping?: ColumnMapping;
        measure?: EffectMeasure;
      }) => {
        if (!args.suggestion) {
          return {
            type: 'orchestrator',
            action: 'generate',
            success: false,
            message: 'Please get analysis suggestions first.',
            explanation: 'I need analysis recommendations before generating code. Run the suggestion step first.'
          };
        }
        
        const mapping = args.mapping || { study: 'study' };
        const measure = args.measure || args.suggestion.defaultMeasure;
        const code = generateRCode(args.suggestion, mapping, measure);
        const explanation = explainRCode(code);
        
        return {
          type: 'orchestrator',
          action: 'generate',
          success: true,
          code,
          explanation,
          message: `Generated R code with ${code.sections.length} sections using ${code.packages.join(', ')}`
        };
      }
    },
    {
      name: 'full_analysis_workflow',
      description: 'Run complete workflow: detect data type, suggest analysis, and generate R code',
      handler: async (args: { 
        columns?: SpreadsheetColumn[]; 
        rows?: SpreadsheetRow[];
        measure?: EffectMeasure;
      }) => {
        if (!args.columns || !args.rows) {
          return {
            type: 'orchestrator',
            action: 'full_workflow',
            success: false,
            message: 'Please provide spreadsheet data.',
            explanation: 'I need access to your spreadsheet data to run the full analysis workflow.'
          };
        }
        
        // Step 1: Detect
        const detection = detectDataType(args.columns, args.rows);
        
        if (detection.type === DataType.UNKNOWN) {
          return {
            type: 'orchestrator',
            action: 'full_workflow',
            success: false,
            detection,
            explanation: explainDataTypeDetection(detection),
            message: 'Could not detect data type'
          };
        }
        
        // Step 2: Suggest
        const suggestion = suggestAnalysis(detection, args.rows.length);
        
        // Step 3: Generate code
        const mapping = autoMapColumnsFromDetection(args.columns, detection);
        const measure = args.measure || suggestion.defaultMeasure;
        const code = generateRCode(suggestion, mapping, measure);
        
        // Full explanation
        const explanation = explainFullWorkflow(detection, suggestion, code);
        
        return {
          type: 'orchestrator',
          action: 'full_workflow',
          success: true,
          detection,
          suggestion,
          code,
          mapping,
          explanation,
          message: `Complete analysis ready: ${getDataTypeLabel(detection.type)} → ${measure} → ${code.sections.length} R code sections`
        };
      }
    },
    {
      name: 'explain_effect_measure',
      description: 'Explain what an effect measure means and when to use it',
      handler: async (args: { measure?: EffectMeasure }) => {
        const explanations: Record<EffectMeasure, string> = {
          'OR': `**Odds Ratio (OR)**

The odds ratio compares the odds of an event occurring in the treatment group versus the control group.

**Interpretation:**
- OR = 1: No difference between groups
- OR > 1: Higher odds in treatment group
- OR < 1: Lower odds in treatment group

**When to use:**
- Binary outcomes (yes/no, success/failure)
- Case-control studies
- When events are rare (<10% in both groups)

**Example:** OR = 2.5 means the odds of the event are 2.5 times higher in the treatment group.`,

          'RR': `**Risk Ratio (RR)**

The risk ratio (also called relative risk) compares the probability of an event in the treatment group versus the control group.

**Interpretation:**
- RR = 1: No difference between groups
- RR > 1: Higher risk in treatment group
- RR < 1: Lower risk in treatment group

**When to use:**
- Binary outcomes in cohort studies or RCTs
- When you want to communicate "how many times more likely"
- Preferred over OR when events are common (>10%)

**Example:** RR = 0.75 means the risk is 25% lower in the treatment group.`,

          'RD': `**Risk Difference (RD)**

The risk difference (also called absolute risk reduction) is the absolute difference in event rates between groups.

**Interpretation:**
- RD = 0: No difference between groups
- RD > 0: Higher risk in treatment group
- RD < 0: Lower risk in treatment group

**When to use:**
- When absolute differences matter clinically
- For calculating Number Needed to Treat (NNT = 1/|RD|)
- When communicating results to patients

**Example:** RD = -0.10 means 10 fewer events per 100 patients in the treatment group.`,

          'SMD': `**Standardized Mean Difference (SMD)**

The SMD (also called Cohen's d or Hedges' g) expresses the difference between group means in standard deviation units.

**Interpretation:**
- SMD = 0: No difference
- |SMD| ≈ 0.2: Small effect
- |SMD| ≈ 0.5: Medium effect
- |SMD| ≈ 0.8: Large effect

**When to use:**
- Continuous outcomes measured on different scales
- Combining studies that used different instruments
- When original units are not meaningful

**Example:** SMD = 0.6 means the treatment group scored 0.6 standard deviations higher.`,

          'MD': `**Mean Difference (MD)**

The mean difference is the raw difference between group means in original units.

**Interpretation:**
- MD = 0: No difference
- MD > 0: Higher mean in treatment group
- MD < 0: Lower mean in treatment group

**When to use:**
- Continuous outcomes on the same scale
- When original units are clinically meaningful
- When all studies used identical measurement instruments

**Example:** MD = -5.2 mmHg means blood pressure was 5.2 mmHg lower in the treatment group.`,

          'COR': `**Correlation (r)**

The Pearson correlation coefficient measures the linear relationship between two continuous variables.

**Interpretation:**
- r = 0: No linear relationship
- r = 1: Perfect positive correlation
- r = -1: Perfect negative correlation
- |r| < 0.3: Weak
- 0.3 ≤ |r| < 0.5: Moderate
- |r| ≥ 0.5: Strong

**When to use:**
- Association between two continuous variables
- Reliability or validity studies

**Example:** r = 0.65 indicates a strong positive correlation.`,

          'ZCOR': `**Fisher's Z Transformed Correlation**

Fisher's Z transformation converts correlations to a scale with better statistical properties for meta-analysis.

**Why transform?**
- Correlations are bounded (-1 to 1)
- Distribution becomes skewed near boundaries
- Z transformation normalizes the distribution

**Interpretation:**
Results are back-transformed to correlation scale for reporting.

**When to use:**
- Always recommended for meta-analysis of correlations
- Automatically applied by metafor package`,

          'HR': `**Hazard Ratio (HR)**

The hazard ratio compares the instantaneous risk (hazard) of an event between groups in time-to-event analysis.

**Interpretation:**
- HR = 1: No difference in survival
- HR > 1: Higher hazard (worse survival) in treatment group
- HR < 1: Lower hazard (better survival) in treatment group

**When to use:**
- Survival/time-to-event outcomes
- When follow-up times vary between studies
- Cancer, cardiovascular, and mortality outcomes

**Example:** HR = 0.70 means 30% reduction in hazard (risk of event at any time point).`,

          'SENS': `**Sensitivity**

Sensitivity (true positive rate) is the proportion of actual positives correctly identified by a diagnostic test.

**Formula:** Sensitivity = TP / (TP + FN)

**Interpretation:**
- 100%: Test catches all cases
- High sensitivity: Good for ruling OUT disease (SnNout)

**When to use:**
- Diagnostic test accuracy meta-analysis
- Screening tests where missing cases is costly`,

          'SPEC': `**Specificity**

Specificity (true negative rate) is the proportion of actual negatives correctly identified by a diagnostic test.

**Formula:** Specificity = TN / (TN + FP)

**Interpretation:**
- 100%: No false positives
- High specificity: Good for ruling IN disease (SpPin)

**When to use:**
- Diagnostic test accuracy meta-analysis
- Confirmatory tests where false positives are costly`,

          'DOR': `**Diagnostic Odds Ratio (DOR)**

The DOR is a single measure combining sensitivity and specificity.

**Formula:** DOR = (TP × TN) / (FP × FN)

**Interpretation:**
- DOR = 1: Test performs no better than chance
- Higher DOR: Better diagnostic performance

**Limitations:**
- Same DOR can result from different sens/spec combinations
- Bivariate model preferred for diagnostic meta-analysis`
        };
        
        const measure = args.measure || 'OR';
        const explanation = explanations[measure] || `Effect measure "${measure}" not found.`;
        
        return {
          type: 'orchestrator',
          action: 'explain',
          measure,
          explanation,
          message: `Explained ${getEffectMeasureName(measure)}`
        };
      }
    }
  ]
};

/**
 * Auto-map columns from detection results
 */
function autoMapColumnsFromDetection(
  columns: SpreadsheetColumn[],
  detection: DataTypeResult
): ColumnMapping {
  const mapping: ColumnMapping = { study: 'study' };
  const columnKeys = columns.map(c => c.key);
  
  // Find study column
  const studyCol = columnKeys.find(c => 
    c.toLowerCase().includes('study') || 
    c.toLowerCase().includes('author') ||
    c.toLowerCase() === 'id'
  );
  if (studyCol) mapping.study = studyCol;
  
  // Map based on matched columns from detection
  for (const col of detection.matchedColumns) {
    const lowerCol = col.toLowerCase();
    
    // Binary
    if (lowerCol.includes('event') && lowerCol.includes('treat')) mapping.events_treatment = col;
    if (lowerCol.includes('event') && (lowerCol.includes('ctrl') || lowerCol.includes('control'))) mapping.events_control = col;
    
    // Sample sizes
    if ((lowerCol === 'n_treatment' || lowerCol === 'n_treat' || lowerCol === 'n1i') && !mapping.n_treatment) mapping.n_treatment = col;
    if ((lowerCol === 'n_control' || lowerCol === 'n_ctrl' || lowerCol === 'n2i') && !mapping.n_control) mapping.n_control = col;
    
    // Continuous
    if (lowerCol.includes('mean') && lowerCol.includes('treat')) mapping.mean_treatment = col;
    if (lowerCol.includes('mean') && (lowerCol.includes('ctrl') || lowerCol.includes('control'))) mapping.mean_control = col;
    if (lowerCol.includes('sd') && lowerCol.includes('treat')) mapping.sd_treatment = col;
    if (lowerCol.includes('sd') && (lowerCol.includes('ctrl') || lowerCol.includes('control'))) mapping.sd_control = col;
    
    // Diagnostic
    if (lowerCol === 'tp' || lowerCol === 'true_positive') mapping.tp = col;
    if (lowerCol === 'fp' || lowerCol === 'false_positive') mapping.fp = col;
    if (lowerCol === 'fn' || lowerCol === 'false_negative') mapping.fn = col;
    if (lowerCol === 'tn' || lowerCol === 'true_negative') mapping.tn = col;
    
    // Pre-calculated
    if (lowerCol === 'effect_size' || lowerCol === 'yi' || lowerCol === 'es') mapping.effect_size = col;
    if (lowerCol === 'se' || lowerCol === 'sei') mapping.se = col;
    if (lowerCol === 'vi' || lowerCol === 'variance') mapping.variance = col;
    
    // Correlation
    if (lowerCol === 'r' || lowerCol === 'correlation') mapping.r = col;
    if (lowerCol === 'n' || lowerCol === 'sample_size') mapping.n = col;
    
    // Hazard ratio
    if (lowerCol === 'hr' || lowerCol === 'hazard_ratio') mapping.hr = col;
    if (lowerCol === 'ci_lower' || lowerCol === 'lower_ci') mapping.ci_lower = col;
    if (lowerCol === 'ci_upper' || lowerCol === 'upper_ci') mapping.ci_upper = col;
  }
  
  return mapping;
}

export default orchestratorSkill;
