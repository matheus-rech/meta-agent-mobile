/**
 * AnalysisSuggester Module
 * 
 * Generates analysis recommendations based on detected data type,
 * including effect measures, model selection, and required analyses.
 */

import {
  DataType,
  DataTypeResult,
  AnalysisSuggestion,
  AnalysisRecommendation,
  EffectMeasure
} from './types';

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
    analyses.push({
      name: 'Trim-and-Fill',
      description: 'Estimate adjusted effect accounting for publication bias',
      required: false,
      rFunction: 'trimfill(res)',
      rationale: 'Sensitivity analysis for publication bias'
    });
  }
  
  analyses.push({
    name: 'Leave-One-Out Analysis',
    description: 'Check influence of individual studies',
    required: false,
    rFunction: 'leave1out(res)',
    rationale: 'Identifies influential studies'
  });
  
  analyses.push({
    name: 'Influence Diagnostics',
    description: 'Detailed influence measures for each study',
    required: false,
    rFunction: 'influence(res)',
    rationale: 'Comprehensive influence assessment'
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
      },
      {
        name: 'Summary Operating Point',
        description: 'Pooled sensitivity and specificity with CIs',
        required: true,
        rFunction: 'summary(fit)',
        rationale: 'Key summary statistics for diagnostic tests'
      }
    ],
    explanation: generateDiagnosticExplanation(studyCount),
    confidence: detection.confidence
  };
}

function suggestPrecalculatedAnalysis(
  detection: DataTypeResult,
  studyCount: number
): AnalysisSuggestion {
  const analyses: AnalysisRecommendation[] = [
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
  
  return {
    dataType: DataType.PRECALCULATED,
    effectMeasures: ['OR', 'RR', 'SMD', 'MD', 'HR'],
    defaultMeasure: 'SMD',
    model: {
      type: 'random',
      method: 'REML',
      rationale: 'Pre-calculated effect sizes can be directly pooled'
    },
    analyses,
    explanation: `I detected **pre-calculated effect sizes** with standard errors from ${studyCount} studies. These can be directly pooled using a random-effects model. Please specify the effect measure type if transformation is needed for interpretation.`,
    confidence: detection.confidence
  };
}

function suggestCorrelationAnalysis(
  detection: DataTypeResult,
  studyCount: number
): AnalysisSuggestion {
  const analyses: AnalysisRecommendation[] = [
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
  
  return {
    dataType: DataType.CORRELATION,
    effectMeasures: ['COR', 'ZCOR'],
    defaultMeasure: 'ZCOR',
    model: {
      type: 'random',
      method: 'REML',
      rationale: "Fisher's Z transformation normalizes the distribution"
    },
    analyses,
    explanation: `I detected **correlation data** from ${studyCount} studies. I recommend using Fisher's Z transformation for pooling, then back-transforming for interpretation. This approach handles the bounded nature of correlations.`,
    confidence: detection.confidence
  };
}

function suggestHazardRatioAnalysis(
  detection: DataTypeResult,
  studyCount: number
): AnalysisSuggestion {
  const analyses: AnalysisRecommendation[] = [
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
  
  return {
    dataType: DataType.HAZARD_RATIO,
    effectMeasures: ['HR'],
    defaultMeasure: 'HR',
    model: {
      type: 'random',
      method: 'REML',
      rationale: 'Log(HR) is pooled, then exponentiated'
    },
    analyses,
    explanation: `I detected **time-to-event data** (hazard ratios) from ${studyCount} studies. HRs will be pooled on the log scale and back-transformed for interpretation. HR > 1 indicates increased hazard in the treatment group.`,
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
    explanation: 'I could not automatically detect your data type. Please check that your column names match expected patterns (e.g., events_treatment, mean_control, tp, fp, etc.) or manually specify the data type and column mappings.',
    confidence: 0
  };
}

// Helper functions for generating explanations
function generateBinaryExplanation(studyCount: number): string {
  let explanation = `I detected **binary outcome data** (events in treatment and control groups) from ${studyCount} studies. `;
  explanation += `I recommend using the **Odds Ratio (OR)** as the effect measure with a **random-effects model** (REML estimation). `;
  explanation += `OR > 1 indicates higher odds in the treatment group. `;
  
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
  explanation += `A **random-effects model** with REML estimation is recommended. `;
  explanation += `SMD of 0.2 is small, 0.5 is medium, and 0.8 is large (Cohen's guidelines).`;
  
  return explanation;
}

function generateDiagnosticExplanation(studyCount: number): string {
  return `I detected **diagnostic accuracy data** (2×2 tables with TP, FP, FN, TN) from ${studyCount} studies. ` +
    `For diagnostic meta-analysis, I recommend the **bivariate model** which jointly estimates sensitivity and specificity ` +
    `while accounting for their negative correlation (threshold effect). The **SROC curve** will visualize the trade-off between sensitivity and specificity across studies.`;
}

/**
 * Get effect measure display name
 */
export function getEffectMeasureName(measure: EffectMeasure): string {
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
