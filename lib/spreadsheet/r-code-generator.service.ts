/**
 * R Code Generator Service
 * 
 * Generates R code from spreadsheet data for meta-analysis.
 * Supports multiple analysis types and output formats.
 */

import type { SpreadsheetData, Column, Row } from '@/components/spreadsheet/SpreadsheetEditor';

export type AnalysisType = 
  | 'binary'      // OR, RR, RD
  | 'continuous'  // MD, SMD
  | 'proportion'  // Single proportion
  | 'correlation' // Correlation coefficients
  | 'pre_calc'    // Pre-calculated effect sizes
  | 'diagnostic'; // Diagnostic accuracy (Se, Sp)

export type EffectMeasure = 
  | 'OR' | 'RR' | 'RD'           // Binary
  | 'MD' | 'SMD' | 'ROM'         // Continuous
  | 'PRAW' | 'PLN' | 'PAS' | 'PFT' // Proportion
  | 'ZCOR' | 'COR'               // Correlation
  | 'GEN';                       // Generic/pre-calculated

export interface RCodeOptions {
  analysisType: AnalysisType;
  effectMeasure: EffectMeasure;
  method?: 'DL' | 'REML' | 'ML' | 'PM' | 'FE'; // Meta-analysis method
  includeForestPlot?: boolean;
  includeFunnelPlot?: boolean;
  includeInfluence?: boolean;
  includeSubgroup?: string; // Column name for subgroup analysis
  dataFrameName?: string;
  studyLabel?: string; // Column name for study labels
}

export interface GeneratedRCode {
  code: string;
  sections: {
    name: string;
    code: string;
    description: string;
  }[];
  packages: string[];
  warnings: string[];
}

/**
 * Detect analysis type from spreadsheet columns
 */
export function detectAnalysisType(columns: Column[]): AnalysisType {
  const columnKeys = columns.map(c => c.key);
  
  // Check for diagnostic accuracy (TP, FP, TN, FN)
  if (columnKeys.includes('tp') && columnKeys.includes('fp') && 
      columnKeys.includes('tn') && columnKeys.includes('fn')) {
    return 'diagnostic';
  }
  
  // Check for binary outcome (events + n for both groups)
  if ((columnKeys.includes('events_treatment') || columnKeys.includes('ai')) &&
      (columnKeys.includes('events_control') || columnKeys.includes('ci'))) {
    return 'binary';
  }
  
  // Check for continuous outcome (mean + sd + n for both groups)
  if ((columnKeys.includes('mean_treatment') || columnKeys.includes('m1e')) &&
      (columnKeys.includes('sd_treatment') || columnKeys.includes('sd1e'))) {
    return 'continuous';
  }
  
  // Check for pre-calculated effect sizes
  if (columnKeys.includes('yi') || columnKeys.includes('effect_size') ||
      columnKeys.includes('te')) {
    return 'pre_calc';
  }
  
  // Check for proportion (single group events + n)
  if (columnKeys.includes('events') && columnKeys.includes('n') &&
      !columnKeys.includes('events_control')) {
    return 'proportion';
  }
  
  // Check for correlation
  if (columnKeys.includes('ri') || columnKeys.includes('correlation')) {
    return 'correlation';
  }
  
  // Default to binary
  return 'binary';
}

/**
 * Get default effect measure for analysis type
 */
export function getDefaultEffectMeasure(analysisType: AnalysisType): EffectMeasure {
  switch (analysisType) {
    case 'binary': return 'OR';
    case 'continuous': return 'SMD';
    case 'proportion': return 'PRAW';
    case 'correlation': return 'ZCOR';
    case 'diagnostic': return 'GEN';
    case 'pre_calc': return 'GEN';
    default: return 'OR';
  }
}

/**
 * Map spreadsheet column keys to R variable names
 */
function mapColumnToRVar(key: string): string {
  const mapping: Record<string, string> = {
    // Study info
    'study': 'study',
    'author': 'author',
    'year': 'year',
    
    // Binary outcome
    'events_treatment': 'ai',
    'n_treatment': 'n1i',
    'events_control': 'ci',
    'n_control': 'n2i',
    'ai': 'ai',
    'bi': 'bi',
    'ci': 'ci',
    'di': 'di',
    'n1i': 'n1i',
    'n2i': 'n2i',
    
    // Continuous outcome
    'mean_treatment': 'm1i',
    'sd_treatment': 'sd1i',
    'mean_control': 'm2i',
    'sd_control': 'sd2i',
    'm1e': 'm1i',
    'sd1e': 'sd1i',
    'm2e': 'm2i',
    'sd2e': 'sd2i',
    
    // Pre-calculated
    'effect_size': 'yi',
    'se': 'sei',
    'variance': 'vi',
    'yi': 'yi',
    'sei': 'sei',
    'vi': 'vi',
    'te': 'yi',
    'sete': 'sei',
    
    // Proportion
    'events': 'xi',
    'n': 'ni',
    
    // Correlation
    'correlation': 'ri',
    'ri': 'ri',
    
    // Diagnostic
    'tp': 'tp',
    'fp': 'fp',
    'tn': 'tn',
    'fn': 'fn',
    
    // Subgroup
    'subgroup': 'subgroup',
    'group': 'subgroup',
  };
  
  return mapping[key] || key;
}

/**
 * Generate R code for loading packages
 */
function generatePackageCode(packages: string[]): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Load Required Packages',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
  ];
  
  packages.forEach(pkg => {
    lines.push(`if (!require("${pkg}")) install.packages("${pkg}")`);
    lines.push(`library(${pkg})`);
  });
  
  lines.push('');
  return lines.join('\n');
}

/**
 * Generate R code for data frame creation
 */
function generateDataFrameCode(
  data: SpreadsheetData,
  dataFrameName: string,
  studyLabel: string
): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Create Data Frame',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    `${dataFrameName} <- data.frame(`,
  ];
  
  // Generate column data
  const columnLines: string[] = [];
  
  data.columns.forEach((col, colIndex) => {
    const rVar = mapColumnToRVar(col.key);
    const values = data.rows.map(row => {
      const val = row[col.key];
      if (val === undefined || val === null || val === '') {
        return 'NA';
      }
      if (col.type === 'text') {
        return `"${String(val).replace(/"/g, '\\"')}"`;
      }
      return String(val);
    });
    
    const isLast = colIndex === data.columns.length - 1;
    columnLines.push(`  ${rVar} = c(${values.join(', ')})${isLast ? '' : ','}`);
  });
  
  lines.push(...columnLines);
  lines.push(')');
  lines.push('');
  lines.push(`# Preview data`);
  lines.push(`print(${dataFrameName})`);
  lines.push(`str(${dataFrameName})`);
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Generate R code for binary outcome meta-analysis
 */
function generateBinaryAnalysisCode(
  dataFrameName: string,
  effectMeasure: EffectMeasure,
  method: string
): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Binary Outcome Meta-Analysis',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    `# Calculate effect sizes (${effectMeasure})`,
    `${dataFrameName} <- escalc(measure = "${effectMeasure}",`,
    `                    ai = ai, n1i = n1i,`,
    `                    ci = ci, n2i = n2i,`,
    `                    data = ${dataFrameName})`,
    '',
    `# Fit random-effects model (${method})`,
    `res <- rma(yi, vi, data = ${dataFrameName}, method = "${method}")`,
    '',
    '# Summary',
    'summary(res)',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Generate R code for continuous outcome meta-analysis
 */
function generateContinuousAnalysisCode(
  dataFrameName: string,
  effectMeasure: EffectMeasure,
  method: string
): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Continuous Outcome Meta-Analysis',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    `# Calculate effect sizes (${effectMeasure})`,
    `${dataFrameName} <- escalc(measure = "${effectMeasure}",`,
    `                    m1i = m1i, sd1i = sd1i, n1i = n1i,`,
    `                    m2i = m2i, sd2i = sd2i, n2i = n2i,`,
    `                    data = ${dataFrameName})`,
    '',
    `# Fit random-effects model (${method})`,
    `res <- rma(yi, vi, data = ${dataFrameName}, method = "${method}")`,
    '',
    '# Summary',
    'summary(res)',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Generate R code for pre-calculated effect sizes
 */
function generatePreCalcAnalysisCode(
  dataFrameName: string,
  method: string
): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Meta-Analysis with Pre-calculated Effect Sizes',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    `# Fit random-effects model (${method})`,
    `res <- rma(yi, sei = sei, data = ${dataFrameName}, method = "${method}")`,
    '',
    '# Summary',
    'summary(res)',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Generate R code for forest plot
 */
function generateForestPlotCode(dataFrameName: string, studyLabel: string): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Forest Plot',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    '# Generate forest plot',
    `forest(res, slab = ${dataFrameName}$${studyLabel},`,
    '       header = TRUE,',
    '       xlab = "Effect Size",',
    '       mlab = "Random Effects Model",',
    '       col = "steelblue",',
    '       border = "steelblue")',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Generate R code for funnel plot
 */
function generateFunnelPlotCode(): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Funnel Plot (Publication Bias)',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    '# Generate funnel plot',
    'funnel(res, main = "Funnel Plot")',
    '',
    '# Egger\'s test for asymmetry',
    'regtest(res)',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Generate R code for influence diagnostics
 */
function generateInfluenceCode(): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Influence Diagnostics',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    '# Leave-one-out analysis',
    'inf <- influence(res)',
    'print(inf)',
    '',
    '# Influence plot',
    'plot(inf)',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Generate R code for subgroup analysis
 */
function generateSubgroupCode(dataFrameName: string, subgroupCol: string): string {
  const lines = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    '# Subgroup Analysis',
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    `# Subgroup analysis by ${subgroupCol}`,
    `res_sub <- rma(yi, vi, data = ${dataFrameName},`,
    `               mods = ~ factor(${subgroupCol}) - 1,`,
    '               method = "REML")',
    '',
    'summary(res_sub)',
    '',
    '# Forest plot by subgroup',
    `forest(res, slab = ${dataFrameName}$study,`,
    `       order = ${dataFrameName}$${subgroupCol},`,
    '       header = TRUE)',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Generate complete R code from spreadsheet data
 */
export function generateRCode(
  data: SpreadsheetData,
  options: Partial<RCodeOptions> = {}
): GeneratedRCode {
  const {
    analysisType = detectAnalysisType(data.columns),
    effectMeasure = getDefaultEffectMeasure(analysisType),
    method = 'REML',
    includeForestPlot = true,
    includeFunnelPlot = true,
    includeInfluence = false,
    includeSubgroup,
    dataFrameName = 'dat',
    studyLabel = 'study',
  } = options;
  
  const packages = ['metafor'];
  const warnings: string[] = [];
  const sections: GeneratedRCode['sections'] = [];
  
  // Check for required columns
  const columnKeys = data.columns.map(c => c.key);
  if (!columnKeys.includes(studyLabel) && !columnKeys.includes('study')) {
    warnings.push('No study label column found. Using row numbers as labels.');
  }
  
  // Generate package loading code
  const packageCode = generatePackageCode(packages);
  sections.push({
    name: 'packages',
    code: packageCode,
    description: 'Load required R packages',
  });
  
  // Generate data frame code
  const dataFrameCode = generateDataFrameCode(data, dataFrameName, studyLabel);
  sections.push({
    name: 'data',
    code: dataFrameCode,
    description: 'Create data frame from spreadsheet',
  });
  
  // Generate analysis code based on type
  let analysisCode = '';
  switch (analysisType) {
    case 'binary':
      analysisCode = generateBinaryAnalysisCode(dataFrameName, effectMeasure, method);
      break;
    case 'continuous':
      analysisCode = generateContinuousAnalysisCode(dataFrameName, effectMeasure, method);
      break;
    case 'pre_calc':
      analysisCode = generatePreCalcAnalysisCode(dataFrameName, method);
      break;
    default:
      analysisCode = generateBinaryAnalysisCode(dataFrameName, effectMeasure, method);
  }
  sections.push({
    name: 'analysis',
    code: analysisCode,
    description: `Run ${analysisType} meta-analysis`,
  });
  
  // Generate forest plot code
  if (includeForestPlot) {
    const forestCode = generateForestPlotCode(dataFrameName, studyLabel);
    sections.push({
      name: 'forest',
      code: forestCode,
      description: 'Generate forest plot',
    });
  }
  
  // Generate funnel plot code
  if (includeFunnelPlot) {
    const funnelCode = generateFunnelPlotCode();
    sections.push({
      name: 'funnel',
      code: funnelCode,
      description: 'Generate funnel plot and test for publication bias',
    });
  }
  
  // Generate influence diagnostics code
  if (includeInfluence) {
    const influenceCode = generateInfluenceCode();
    sections.push({
      name: 'influence',
      code: influenceCode,
      description: 'Run influence diagnostics',
    });
  }
  
  // Generate subgroup analysis code
  if (includeSubgroup && columnKeys.includes(includeSubgroup)) {
    const subgroupCode = generateSubgroupCode(dataFrameName, includeSubgroup);
    sections.push({
      name: 'subgroup',
      code: subgroupCode,
      description: `Subgroup analysis by ${includeSubgroup}`,
    });
  }
  
  // Combine all sections
  const fullCode = [
    '# ═══════════════════════════════════════════════════════════════════════════',
    `# Meta-Analysis R Code`,
    `# Generated by Glass 🦊 - ${new Date().toISOString()}`,
    `# Data: ${data.name || 'Untitled'}`,
    `# Analysis: ${analysisType} (${effectMeasure})`,
    '# ═══════════════════════════════════════════════════════════════════════════',
    '',
    ...sections.map(s => s.code),
  ].join('\n');
  
  return {
    code: fullCode,
    sections,
    packages,
    warnings,
  };
}

/**
 * Generate R code snippet for specific operation
 */
export function generateRCodeSnippet(
  operation: 'escalc' | 'rma' | 'forest' | 'funnel' | 'influence',
  options: Record<string, string | number | boolean>
): string {
  switch (operation) {
    case 'escalc':
      return `escalc(measure = "${options.measure || 'OR'}", ai = ai, n1i = n1i, ci = ci, n2i = n2i, data = dat)`;
    case 'rma':
      return `rma(yi, vi, data = dat, method = "${options.method || 'REML'}")`;
    case 'forest':
      return `forest(res, slab = dat$study, header = TRUE)`;
    case 'funnel':
      return `funnel(res, main = "Funnel Plot")`;
    case 'influence':
      return `influence(res)`;
    default:
      return '';
  }
}

export default {
  generateRCode,
  generateRCodeSnippet,
  detectAnalysisType,
  getDefaultEffectMeasure,
};
