/**
 * R Debugging Skill
 * 
 * Analyzes R errors in meta-analysis code and provides educational fixes.
 * Focuses on metafor, meta, and related packages.
 */

/**
 * Common R error patterns in meta-analysis
 */
export const R_ERROR_PATTERNS = {
  // Package errors
  packageNotFound: {
    pattern: /there is no package called ['"](\w+)['"]/i,
    cause: 'The required R package is not installed',
    fix: (match: RegExpMatchArray) => `Install the package with: install.packages("${match[1]}")`,
    teaching: 'R packages need to be installed once before they can be used. Think of it like downloading an app before you can use it.',
  },
  
  packageNotLoaded: {
    pattern: /could not find function ['"](\w+)['"]/i,
    cause: 'The function exists but its package is not loaded',
    fix: (match: RegExpMatchArray) => `Load the package with library() at the start of your script. For metafor functions, use: library(metafor)`,
    teaching: 'Even after installing a package, you need to load it in each R session with library(). This is like opening an app after installing it.',
  },
  
  // Data format errors
  numericRequired: {
    pattern: /argument ['"]?(\w+)['"]? must be (a )?numeric/i,
    cause: 'The function expects numbers but received text or another type',
    fix: (match: RegExpMatchArray) => `Convert to numeric: as.numeric(${match[1]}) or check for non-numeric values in your data`,
    teaching: 'R is strict about data types. Effect sizes and variances must be numbers, not text. Check if your data was imported correctly.',
  },
  
  vectorLength: {
    pattern: /arguments imply differing number of rows|longer object length/i,
    cause: 'Vectors or columns have different lengths',
    fix: () => `Check that all your data columns have the same number of rows. Use length() or nrow() to verify.`,
    teaching: 'In a meta-analysis, each study needs all its data. If one column has 10 values and another has 8, R cannot match them up.',
  },
  
  // NA handling
  naValues: {
    pattern: /NA|NaN|missing values|na\.rm/i,
    cause: 'Missing values (NA) in the data are causing problems',
    fix: () => `Either remove rows with NA using na.omit() or complete.cases(), or investigate why values are missing`,
    teaching: 'Missing data is common in meta-analysis. You need to decide: exclude studies with missing data, or impute the values? This is a methodological decision.',
  },
  
  // metafor specific errors
  metaforYiMissing: {
    pattern: /argument ['"]?yi['"]? is missing/i,
    cause: 'The effect size vector (yi) was not provided to rma()',
    fix: () => `Provide effect sizes: rma(yi = effect_sizes, vi = variances, data = mydata)`,
    teaching: 'In metafor, "yi" represents your effect sizes (like log odds ratios or standardized mean differences). "vi" is the variance of each effect size.',
  },
  
  metaforViMissing: {
    pattern: /argument ['"]?vi['"]? is missing|must specify.*variance/i,
    cause: 'The variance vector (vi) was not provided',
    fix: () => `Calculate variances from standard errors: vi = sei^2, or use escalc() to compute both yi and vi`,
    teaching: 'Every effect size needs a measure of its precision. Variance (vi) or standard error (sei) tells us how certain we are about each study\'s result.',
  },
  
  metaforConvergence: {
    pattern: /optimizer did not achieve convergence|iteration limit/i,
    cause: 'The model failed to converge, often due to extreme values or too few studies',
    fix: () => `Try: 1) Check for outliers, 2) Use method="DL" instead of "REML", 3) Increase iterations with control=list(maxiter=1000)`,
    teaching: 'Convergence problems often signal issues with your data. With very few studies or extreme heterogeneity, the model struggles to find stable estimates.',
  },
  
  // Plot errors
  forestPlotError: {
    pattern: /error in forest|cannot coerce|plot\.new/i,
    cause: 'Problem generating the forest plot',
    fix: () => `Check that your rma() model ran successfully first. Use: forest(model_result)`,
    teaching: 'Forest plots visualize your meta-analysis results. The plot function needs a valid model object to work with.',
  },
  
  // Effect size calculation
  escalcError: {
    pattern: /error in escalc|measure.*not recognized/i,
    cause: 'Invalid effect size measure or missing required arguments',
    fix: () => `Check the measure argument. Common options: "OR" (odds ratio), "RR" (risk ratio), "SMD" (standardized mean difference), "MD" (mean difference)`,
    teaching: 'Different types of outcomes need different effect size measures. Binary outcomes use OR or RR; continuous outcomes use SMD or MD.',
  },
  
  // Subgroup analysis
  subgroupError: {
    pattern: /mods.*factor|moderator/i,
    cause: 'Problem with moderator/subgroup variable',
    fix: () => `Ensure your moderator is a factor: mods = ~ factor(subgroup_variable)`,
    teaching: 'Subgroup analysis examines whether effects differ across categories. The moderator variable must be properly formatted as a factor.',
  },
};

/**
 * R Debugging Skill Configuration
 */
export const R_DEBUGGING_SKILL = {
  id: 'r-debugging',
  name: 'R Code Debugging',
  version: '1.0.0',
  description: 'Analyzes R errors in meta-analysis code and provides educational fixes',
  category: 'debugging',
  tags: ['r', 'debugging', 'metafor', 'meta', 'errors'],
  
  triggers: [
    'error',
    'not working',
    'failed',
    'debug',
    'fix',
    'help with r',
    'r code',
    'metafor error',
  ],
  
  systemPrompt: `You are an R debugging expert specializing in meta-analysis packages (metafor, meta, dmetar, robvis, netmeta).

DEBUGGING APPROACH:
1. IDENTIFY: Parse the error message to understand what went wrong
2. EXPLAIN: Teach WHY this error occurred (not just how to fix it)
3. FIX: Provide corrected code with comments
4. PREVENT: Suggest practices to avoid this error in the future

COMMON ERROR CATEGORIES:
- Package errors: Not installed or not loaded
- Data format: Wrong types, missing values, mismatched lengths
- Function arguments: Missing required parameters
- Model issues: Convergence failures, insufficient data
- Plot errors: Invalid model objects, graphics device issues

TEACHING MOMENTS:
- Explain the underlying concept when relevant
- Reference metafor documentation
- Suggest debugging strategies (print statements, str(), head())
- Encourage understanding over copy-pasting fixes

RESPONSE FORMAT:
1. "I see the error..." (acknowledge)
2. "This happens because..." (explain)
3. "Here's the fix..." (corrected code)
4. "To prevent this..." (best practices)
5. "Would you like me to explain..." (offer deeper learning)`,

  examples: [
    {
      input: "Error: there is no package called 'metafor'",
      output: `I see you're getting a package not found error. This happens because R packages need to be installed before you can use them.

**The Fix:**
\`\`\`r
# Install metafor (only need to do this once)
install.packages("metafor")

# Then load it in your script
library(metafor)
\`\`\`

**Why this happens:**
Think of R packages like apps on your phone - you need to download them once (install.packages), then open them when you want to use them (library).

**Pro tip:** Put all your library() calls at the top of your script so you can see all dependencies at a glance.`
    },
    {
      input: "Error in rma(): argument 'yi' is missing",
      output: `I see metafor's rma() function is complaining about missing effect sizes. Let me explain what's happening.

**The Problem:**
The rma() function needs two key pieces of information:
- \`yi\`: Your effect sizes (e.g., log odds ratios)
- \`vi\`: The variance of each effect size

**The Fix:**
\`\`\`r
# If you have effect sizes and standard errors:
result <- rma(yi = effect_size, sei = standard_error, data = mydata)

# Or if you have raw data, calculate effect sizes first:
dat <- escalc(measure = "OR", ai = events_treat, bi = nonevents_treat,
              ci = events_control, di = nonevents_control, data = mydata)
result <- rma(yi, vi, data = dat)
\`\`\`

**Teaching moment:**
In meta-analysis, we need both the effect size AND a measure of its precision. The variance tells us how much uncertainty there is around each study's estimate.

Would you like me to explain how to calculate effect sizes from your raw data?`
    }
  ],
};

/**
 * Analyze an R error and provide debugging information
 */
export interface DebugResult {
  errorType: string;
  cause: string;
  fix: string;
  teaching: string;
  confidence: number;
}

export function analyzeRError(errorMessage: string): DebugResult | null {
  for (const [errorType, pattern] of Object.entries(R_ERROR_PATTERNS)) {
    const match = errorMessage.match(pattern.pattern);
    if (match) {
      return {
        errorType,
        cause: pattern.cause,
        fix: typeof pattern.fix === 'function' ? pattern.fix(match) : pattern.fix,
        teaching: pattern.teaching,
        confidence: 0.9,
      };
    }
  }
  
  return null;
}

/**
 * Generate a debugging response for an R error
 */
export function generateDebugResponse(errorMessage: string, rCode?: string): string {
  const analysis = analyzeRError(errorMessage);
  
  if (!analysis) {
    return `I don't recognize this specific error, but let me help you debug it.

**General debugging steps:**
1. Check the exact line where the error occurs
2. Use \`str(your_data)\` to inspect your data structure
3. Use \`head(your_data)\` to see the first few rows
4. Make sure all required packages are loaded

Can you share more context about what you were trying to do?`;
  }
  
  return `**Error identified:** ${analysis.cause}

**The fix:**
${analysis.fix}

**Why this happens:**
${analysis.teaching}

**Debugging tip:** When you encounter errors, read the message carefully - R is usually telling you exactly what's wrong, just in technical language.`;
}

/**
 * Common metafor function signatures for reference
 */
export const METAFOR_FUNCTIONS = {
  rma: {
    description: 'Fit random-effects or fixed-effect meta-analysis model',
    required: ['yi (effect sizes)', 'vi or sei (variance or standard error)'],
    optional: ['data', 'method', 'mods', 'subset', 'weights'],
    example: 'rma(yi, vi, data = dat, method = "REML")',
  },
  escalc: {
    description: 'Calculate effect sizes and variances from raw data',
    required: ['measure (e.g., "OR", "SMD")'],
    optional: ['ai, bi, ci, di (for 2x2 tables)', 'm1i, m2i, sd1i, sd2i, n1i, n2i (for means)'],
    example: 'escalc(measure = "OR", ai = tpos, bi = tneg, ci = cpos, di = cneg, data = dat)',
  },
  forest: {
    description: 'Create a forest plot',
    required: ['x (rma model object)'],
    optional: ['showweights', 'header', 'xlim', 'refline'],
    example: 'forest(res, showweights = TRUE, header = "Study")',
  },
  funnel: {
    description: 'Create a funnel plot for publication bias',
    required: ['x (rma model object)'],
    optional: ['level', 'refline', 'legend'],
    example: 'funnel(res, level = c(90, 95, 99))',
  },
};

/**
 * Check if input contains an R error
 */
export function containsRError(input: string): boolean {
  const errorIndicators = [
    /error in/i,
    /error:/i,
    /cannot/i,
    /failed/i,
    /not found/i,
    /missing/i,
    /invalid/i,
    /unexpected/i,
  ];
  
  return errorIndicators.some(pattern => pattern.test(input));
}
