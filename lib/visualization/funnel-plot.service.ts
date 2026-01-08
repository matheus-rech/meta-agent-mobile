/**
 * Funnel Plot Service
 * 
 * Generates funnel plots for publication bias assessment,
 * including Egger's test and trim-and-fill analysis.
 */

export interface StudyData {
  id: string;
  name: string;
  effectSize: number;
  standardError: number;
  weight?: number;
}

export interface FunnelPlotData {
  studies: StudyData[];
  pooledEffect: number;
  pooledSE: number;
  confidenceLines: {
    x95Lower: number[];
    x95Upper: number[];
    x99Lower: number[];
    x99Upper: number[];
    yValues: number[];
  };
  eggerTest: EggerTestResult;
  trimAndFill?: TrimAndFillResult;
}

export interface EggerTestResult {
  intercept: number;
  interceptSE: number;
  tValue: number;
  pValue: number;
  isSignificant: boolean;
  interpretation: string;
}

export interface TrimAndFillResult {
  imputedStudies: StudyData[];
  adjustedEffect: number;
  adjustedSE: number;
  k0: number; // Number of imputed studies
  side: 'left' | 'right';
}

/**
 * Calculate pooled effect size using random-effects model
 */
export function calculatePooledEffect(studies: StudyData[]): { effect: number; se: number } {
  if (studies.length === 0) {
    return { effect: 0, se: 0 };
  }
  
  // Calculate tau² using DerSimonian-Laird estimator
  const weights = studies.map(s => 1 / (s.standardError ** 2));
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  const weightedSum = studies.reduce((sum, s, i) => sum + weights[i] * s.effectSize, 0);
  const fixedEffect = weightedSum / sumWeights;
  
  // Q statistic
  const Q = studies.reduce((sum, s, i) => {
    return sum + weights[i] * ((s.effectSize - fixedEffect) ** 2);
  }, 0);
  
  const df = studies.length - 1;
  const C = sumWeights - (weights.reduce((sum, w) => sum + w ** 2, 0) / sumWeights);
  
  // Tau²
  const tau2 = Math.max(0, (Q - df) / C);
  
  // Random-effects weights
  const reWeights = studies.map(s => 1 / (s.standardError ** 2 + tau2));
  const sumREWeights = reWeights.reduce((a, b) => a + b, 0);
  const reWeightedSum = studies.reduce((sum, s, i) => sum + reWeights[i] * s.effectSize, 0);
  
  const pooledEffect = reWeightedSum / sumREWeights;
  const pooledSE = Math.sqrt(1 / sumREWeights);
  
  return { effect: pooledEffect, se: pooledSE };
}

/**
 * Calculate confidence interval lines for funnel plot
 */
export function calculateConfidenceLines(
  pooledEffect: number,
  maxSE: number,
  steps: number = 100
): FunnelPlotData['confidenceLines'] {
  const yValues: number[] = [];
  const x95Lower: number[] = [];
  const x95Upper: number[] = [];
  const x99Lower: number[] = [];
  const x99Upper: number[] = [];
  
  for (let i = 0; i <= steps; i++) {
    const se = (maxSE * i) / steps;
    yValues.push(se);
    
    // 95% CI (z = 1.96)
    x95Lower.push(pooledEffect - 1.96 * se);
    x95Upper.push(pooledEffect + 1.96 * se);
    
    // 99% CI (z = 2.576)
    x99Lower.push(pooledEffect - 2.576 * se);
    x99Upper.push(pooledEffect + 2.576 * se);
  }
  
  return { yValues, x95Lower, x95Upper, x99Lower, x99Upper };
}

/**
 * Perform Egger's regression test for funnel plot asymmetry
 */
export function performEggerTest(studies: StudyData[]): EggerTestResult {
  if (studies.length < 3) {
    return {
      intercept: 0,
      interceptSE: 0,
      tValue: 0,
      pValue: 1,
      isSignificant: false,
      interpretation: 'Insufficient studies for Egger\'s test (minimum 3 required)',
    };
  }
  
  // Egger's test: regress standardized effect (ES/SE) on precision (1/SE)
  const n = studies.length;
  const x = studies.map(s => 1 / s.standardError); // Precision
  const y = studies.map(s => s.effectSize / s.standardError); // Standardized effect
  
  // Simple linear regression
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi ** 2, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate standard error of intercept
  const yPred = x.map(xi => intercept + slope * xi);
  const residuals = y.map((yi, i) => yi - yPred[i]);
  const sse = residuals.reduce((sum, r) => sum + r ** 2, 0);
  const mse = sse / (n - 2);
  
  const xMean = sumX / n;
  const sxx = sumX2 - (sumX ** 2) / n;
  const interceptSE = Math.sqrt(mse * (1 / n + (xMean ** 2) / sxx));
  
  // T-test for intercept
  const tValue = intercept / interceptSE;
  const df = n - 2;
  
  // Approximate p-value using t-distribution
  const pValue = 2 * (1 - tCDF(Math.abs(tValue), df));
  const isSignificant = pValue < 0.05;
  
  // Interpretation
  let interpretation: string;
  if (pValue < 0.01) {
    interpretation = 'Strong evidence of publication bias (p < 0.01). Funnel plot asymmetry detected.';
  } else if (pValue < 0.05) {
    interpretation = 'Evidence of publication bias (p < 0.05). Consider trim-and-fill analysis.';
  } else if (pValue < 0.10) {
    interpretation = 'Weak evidence of asymmetry (p < 0.10). Results should be interpreted with caution.';
  } else {
    interpretation = 'No significant evidence of publication bias detected.';
  }
  
  return {
    intercept,
    interceptSE,
    tValue,
    pValue,
    isSignificant,
    interpretation,
  };
}

/**
 * Perform trim-and-fill analysis
 */
export function performTrimAndFill(studies: StudyData[]): TrimAndFillResult {
  if (studies.length < 3) {
    return {
      imputedStudies: [],
      adjustedEffect: calculatePooledEffect(studies).effect,
      adjustedSE: calculatePooledEffect(studies).se,
      k0: 0,
      side: 'left',
    };
  }
  
  const { effect: pooledEffect } = calculatePooledEffect(studies);
  
  // Calculate ranks based on deviation from pooled effect
  const deviations = studies.map(s => ({
    study: s,
    deviation: s.effectSize - pooledEffect,
  }));
  
  // Sort by absolute deviation
  deviations.sort((a, b) => Math.abs(a.deviation) - Math.abs(b.deviation));
  
  // Assign ranks
  const ranks = deviations.map((d, i) => ({
    ...d,
    rank: i + 1,
    sign: d.deviation >= 0 ? 1 : -1,
  }));
  
  // Calculate L0 estimator (Duval & Tweedie)
  const n = studies.length;
  let positiveRankSum = 0;
  let negativeRankSum = 0;
  
  for (const r of ranks) {
    if (r.sign > 0) {
      positiveRankSum += r.rank;
    } else {
      negativeRankSum += r.rank;
    }
  }
  
  // Determine which side has more extreme studies
  const side: 'left' | 'right' = positiveRankSum > negativeRankSum ? 'right' : 'left';
  
  // Estimate k0 (number of missing studies)
  const T = side === 'right' ? positiveRankSum : negativeRankSum;
  const k0 = Math.max(0, Math.round((4 * T - n * (n + 1)) / (2 * n + 1)));
  
  // Impute missing studies
  const imputedStudies: StudyData[] = [];
  
  if (k0 > 0) {
    // Get the k0 most extreme studies on the asymmetric side
    const extremeStudies = ranks
      .filter(r => (side === 'right' ? r.sign > 0 : r.sign < 0))
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      .slice(0, k0);
    
    // Create mirror images
    for (let i = 0; i < extremeStudies.length; i++) {
      const original = extremeStudies[i].study;
      const mirroredEffect = 2 * pooledEffect - original.effectSize;
      
      imputedStudies.push({
        id: `imputed_${i + 1}`,
        name: `Imputed ${i + 1}`,
        effectSize: mirroredEffect,
        standardError: original.standardError,
      });
    }
  }
  
  // Calculate adjusted effect with imputed studies
  const allStudies = [...studies, ...imputedStudies];
  const { effect: adjustedEffect, se: adjustedSE } = calculatePooledEffect(allStudies);
  
  return {
    imputedStudies,
    adjustedEffect,
    adjustedSE,
    k0,
    side,
  };
}

/**
 * Generate complete funnel plot data
 */
export function generateFunnelPlotData(
  studies: StudyData[],
  includeTrimAndFill: boolean = true
): FunnelPlotData {
  const { effect: pooledEffect, se: pooledSE } = calculatePooledEffect(studies);
  
  // Find max SE for plot bounds
  const maxSE = Math.max(...studies.map(s => s.standardError)) * 1.2;
  
  const confidenceLines = calculateConfidenceLines(pooledEffect, maxSE);
  const eggerTest = performEggerTest(studies);
  
  let trimAndFill: TrimAndFillResult | undefined;
  if (includeTrimAndFill && studies.length >= 3) {
    trimAndFill = performTrimAndFill(studies);
  }
  
  return {
    studies,
    pooledEffect,
    pooledSE,
    confidenceLines,
    eggerTest,
    trimAndFill,
  };
}

/**
 * Generate ASCII funnel plot for TUI display
 */
export function generateASCIIFunnelPlot(data: FunnelPlotData, width: number = 60, height: number = 20): string {
  const { studies, pooledEffect, confidenceLines, trimAndFill } = data;
  
  if (studies.length === 0) {
    return 'No studies to display';
  }
  
  // Calculate bounds
  const allEffects = studies.map(s => s.effectSize);
  const allSEs = studies.map(s => s.standardError);
  
  if (trimAndFill?.imputedStudies) {
    allEffects.push(...trimAndFill.imputedStudies.map(s => s.effectSize));
    allSEs.push(...trimAndFill.imputedStudies.map(s => s.standardError));
  }
  
  const minEffect = Math.min(...allEffects, ...confidenceLines.x99Lower) - 0.1;
  const maxEffect = Math.max(...allEffects, ...confidenceLines.x99Upper) + 0.1;
  const maxSE = Math.max(...allSEs) * 1.1;
  
  // Create grid
  const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));
  
  // Helper to convert coordinates
  const toX = (effect: number) => Math.round(((effect - minEffect) / (maxEffect - minEffect)) * (width - 1));
  const toY = (se: number) => Math.round((se / maxSE) * (height - 1));
  
  // Draw confidence lines (99% CI)
  for (let i = 0; i < confidenceLines.yValues.length; i++) {
    const y = toY(confidenceLines.yValues[i]);
    if (y >= 0 && y < height) {
      const x99L = toX(confidenceLines.x99Lower[i]);
      const x99U = toX(confidenceLines.x99Upper[i]);
      if (x99L >= 0 && x99L < width) grid[y][x99L] = '·';
      if (x99U >= 0 && x99U < width) grid[y][x99U] = '·';
    }
  }
  
  // Draw confidence lines (95% CI)
  for (let i = 0; i < confidenceLines.yValues.length; i++) {
    const y = toY(confidenceLines.yValues[i]);
    if (y >= 0 && y < height) {
      const x95L = toX(confidenceLines.x95Lower[i]);
      const x95U = toX(confidenceLines.x95Upper[i]);
      if (x95L >= 0 && x95L < width) grid[y][x95L] = ':';
      if (x95U >= 0 && x95U < width) grid[y][x95U] = ':';
    }
  }
  
  // Draw vertical line at pooled effect
  const pooledX = toX(pooledEffect);
  for (let y = 0; y < height; y++) {
    if (pooledX >= 0 && pooledX < width) {
      grid[y][pooledX] = '│';
    }
  }
  
  // Draw imputed studies (if any)
  if (trimAndFill?.imputedStudies) {
    for (const study of trimAndFill.imputedStudies) {
      const x = toX(study.effectSize);
      const y = toY(study.standardError);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y][x] = '○';
      }
    }
  }
  
  // Draw actual studies
  for (const study of studies) {
    const x = toX(study.effectSize);
    const y = toY(study.standardError);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = '●';
    }
  }
  
  // Build output
  const lines: string[] = [];
  lines.push('┌' + '─'.repeat(width) + '┐');
  lines.push('│' + ' '.repeat(Math.floor((width - 11) / 2)) + 'FUNNEL PLOT' + ' '.repeat(Math.ceil((width - 11) / 2)) + '│');
  lines.push('├' + '─'.repeat(width) + '┤');
  
  // Y-axis label
  lines.push('│SE↑' + ' '.repeat(width - 3) + '│');
  
  for (let y = 0; y < height; y++) {
    lines.push('│' + grid[y].join('') + '│');
  }
  
  lines.push('├' + '─'.repeat(width) + '┤');
  lines.push('│' + ' '.repeat(Math.floor((width - 12) / 2)) + 'Effect Size→' + ' '.repeat(Math.ceil((width - 12) / 2)) + '│');
  lines.push('└' + '─'.repeat(width) + '┘');
  
  // Legend
  lines.push('');
  lines.push('Legend: ● Study  ○ Imputed  │ Pooled  : 95% CI  · 99% CI');
  lines.push(`Pooled effect: ${pooledEffect.toFixed(3)} (SE: ${data.pooledSE.toFixed(3)})`);
  
  if (trimAndFill && trimAndFill.k0 > 0) {
    lines.push(`Trim-and-fill: ${trimAndFill.k0} studies imputed (${trimAndFill.side} side)`);
    lines.push(`Adjusted effect: ${trimAndFill.adjustedEffect.toFixed(3)} (SE: ${trimAndFill.adjustedSE.toFixed(3)})`);
  }
  
  return lines.join('\n');
}

/**
 * Approximate t-distribution CDF
 */
function tCDF(t: number, df: number): number {
  // Use normal approximation for large df
  if (df > 100) {
    return normalCDF(t);
  }
  
  // Beta function approximation
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  
  // Incomplete beta function approximation
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betacf(a, b, x) / a / 2;
  } else {
    return 1 - bt * betacf(b, a, 1 - x) / b / 2;
  }
}

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

function lgamma(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  
  for (let j = 0; j < 6; j++) {
    ser += cof[j] / ++y;
  }
  
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betacf(a: number, b: number, x: number): number {
  const maxIterations = 100;
  const eps = 3.0e-7;
  
  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  
  let c = 1.0;
  let d = 1.0 - qab * x / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1.0 / d;
  let h = d;
  
  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1.0 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1.0 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1.0 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < eps) break;
  }
  
  return h;
}

export const funnelPlotService = {
  generateData: generateFunnelPlotData,
  generateASCII: generateASCIIFunnelPlot,
  calculatePooledEffect,
  performEggerTest,
  performTrimAndFill,
};

export default funnelPlotService;
