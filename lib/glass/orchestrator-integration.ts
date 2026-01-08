/**
 * Glass Orchestrator Integration
 * 
 * Connects the MVP Orchestrator to Glass chat for natural language
 * data analysis recommendations and R code generation.
 */

import {
  detectDataType,
  suggestAnalysis,
  generateRCode,
  getDataTypeLabel,
  getEffectMeasureName,
  DataType,
  DataTypeResult,
  AnalysisSuggestion,
  GeneratedCode,
  ColumnMapping,
  SpreadsheetColumn,
  SpreadsheetRow,
  EffectMeasure
} from './orchestrator';

import {
  explainDataTypeDetection,
  explainAnalysisSuggestion,
  explainRCode,
  explainFullWorkflow,
  generateConversationalResponse
} from '../agent/skills/orchestrator-skill';

/**
 * Orchestrator context for Glass conversations
 */
export interface OrchestratorContext {
  detection: DataTypeResult | null;
  suggestion: AnalysisSuggestion | null;
  code: GeneratedCode | null;
  mapping: ColumnMapping | null;
  lastAction: 'detect' | 'suggest' | 'generate' | 'full' | null;
}

/**
 * Intent detection result
 */
export interface IntentResult {
  intent: 'detect' | 'suggest' | 'generate' | 'explain' | 'full' | 'unknown';
  confidence: number;
  effectMeasure?: EffectMeasure;
  topic?: string;
}

/**
 * Glass orchestrator integration class
 */
class GlassOrchestratorIntegration {
  private context: OrchestratorContext = {
    detection: null,
    suggestion: null,
    code: null,
    mapping: null,
    lastAction: null
  };

  /**
   * Detect user intent from message
   */
  detectIntent(message: string): IntentResult {
    const lowerMessage = message.toLowerCase();
    
    // Full workflow intents
    const fullPatterns = [
      'analyze my data', 'run analysis', 'full analysis',
      'analyze this', 'help me analyze', 'what should i do',
      'analyze spreadsheet', 'run meta-analysis'
    ];
    if (fullPatterns.some(p => lowerMessage.includes(p))) {
      return { intent: 'full', confidence: 0.9 };
    }
    
    // Detection intents
    const detectPatterns = [
      'what type of data', 'detect data', 'identify data',
      'what kind of data', 'data type', 'recognize data',
      'what format', 'check my data'
    ];
    if (detectPatterns.some(p => lowerMessage.includes(p))) {
      return { intent: 'detect', confidence: 0.9 };
    }
    
    // Suggestion intents
    const suggestPatterns = [
      'what analysis', 'which analysis', 'recommend analysis',
      'suggest analysis', 'appropriate analysis', 'best analysis',
      'what should i run', 'which test', 'what method'
    ];
    if (suggestPatterns.some(p => lowerMessage.includes(p))) {
      return { intent: 'suggest', confidence: 0.9 };
    }
    
    // Code generation intents
    const codePatterns = [
      'generate code', 'r code', 'give me code',
      'write code', 'create code', 'show me code',
      'metafor code', 'script'
    ];
    if (codePatterns.some(p => lowerMessage.includes(p))) {
      return { intent: 'generate', confidence: 0.9 };
    }
    
    // Explanation intents
    const explainPatterns = [
      'what is', 'explain', 'tell me about',
      'how does', 'what does', 'why'
    ];
    if (explainPatterns.some(p => lowerMessage.includes(p))) {
      // Check for effect measure explanations
      const measures: EffectMeasure[] = ['OR', 'RR', 'RD', 'SMD', 'MD', 'HR', 'COR', 'ZCOR', 'SENS', 'SPEC', 'DOR'];
      for (const measure of measures) {
        if (lowerMessage.includes(measure.toLowerCase()) || 
            lowerMessage.includes(getEffectMeasureName(measure).toLowerCase())) {
          return { intent: 'explain', confidence: 0.85, effectMeasure: measure };
        }
      }
      
      // Check for topic explanations
      const topics = [
        'heterogeneity', 'publication bias', 'forest plot', 'funnel plot',
        'random effects', 'fixed effect', 'meta-analysis', 'effect size'
      ];
      for (const topic of topics) {
        if (lowerMessage.includes(topic)) {
          return { intent: 'explain', confidence: 0.8, topic };
        }
      }
    }
    
    return { intent: 'unknown', confidence: 0.3 };
  }

  /**
   * Process user message with spreadsheet context
   */
  async processMessage(
    message: string,
    spreadsheetData?: { columns: SpreadsheetColumn[]; rows: SpreadsheetRow[] }
  ): Promise<string> {
    const intent = this.detectIntent(message);
    
    switch (intent.intent) {
      case 'full':
        return this.runFullWorkflow(spreadsheetData);
      
      case 'detect':
        return this.runDetection(spreadsheetData);
      
      case 'suggest':
        return this.runSuggestion();
      
      case 'generate':
        return this.runCodeGeneration();
      
      case 'explain':
        if (intent.effectMeasure) {
          return this.explainEffectMeasure(intent.effectMeasure);
        }
        if (intent.topic) {
          return this.explainTopic(intent.topic);
        }
        return "What would you like me to explain? I can help with effect measures (OR, RR, SMD, etc.) or meta-analysis concepts.";
      
      default:
        return this.getHelpMessage();
    }
  }

  /**
   * Run full analysis workflow
   */
  private runFullWorkflow(
    spreadsheetData?: { columns: SpreadsheetColumn[]; rows: SpreadsheetRow[] }
  ): string {
    if (!spreadsheetData || !spreadsheetData.columns.length || !spreadsheetData.rows.length) {
      return `🦊 I'd love to analyze your data, but I don't see any spreadsheet data loaded.

**To get started:**
1. Open or create a spreadsheet with your study data
2. Make sure you have columns for effect sizes or raw data
3. Come back and ask me to "analyze my data"

**Example column patterns I recognize:**
- Binary: events_treatment, events_control, n_treatment, n_control
- Continuous: mean_treatment, sd_treatment, mean_control, sd_control
- Pre-calculated: effect_size, se (or yi, vi)
- Diagnostic: tp, fp, fn, tn`;
    }

    // Step 1: Detect
    this.context.detection = detectDataType(spreadsheetData.columns, spreadsheetData.rows);
    
    if (this.context.detection.type === DataType.UNKNOWN) {
      this.context.lastAction = 'detect';
      return explainDataTypeDetection(this.context.detection);
    }
    
    // Step 2: Suggest
    this.context.suggestion = suggestAnalysis(this.context.detection, spreadsheetData.rows.length);
    
    // Step 3: Auto-map columns
    this.context.mapping = this.autoMapColumns(spreadsheetData.columns, this.context.detection);
    
    // Step 4: Generate code
    this.context.code = generateRCode(this.context.suggestion, this.context.mapping);
    
    this.context.lastAction = 'full';
    
    return explainFullWorkflow(this.context.detection, this.context.suggestion, this.context.code);
  }

  /**
   * Run data type detection only
   */
  private runDetection(
    spreadsheetData?: { columns: SpreadsheetColumn[]; rows: SpreadsheetRow[] }
  ): string {
    if (!spreadsheetData || !spreadsheetData.columns.length) {
      return "🦊 I need spreadsheet data to detect the data type. Please open a spreadsheet first.";
    }

    this.context.detection = detectDataType(spreadsheetData.columns, spreadsheetData.rows);
    this.context.lastAction = 'detect';
    
    let response = explainDataTypeDetection(this.context.detection);
    
    if (this.context.detection.type !== DataType.UNKNOWN) {
      response += "\n\n**Next step:** Ask me to \"suggest analysis\" to see recommended methods.";
    }
    
    return response;
  }

  /**
   * Run analysis suggestion
   */
  private runSuggestion(): string {
    if (!this.context.detection || this.context.detection.type === DataType.UNKNOWN) {
      return "🦊 I need to detect your data type first. Ask me to \"detect data type\" or provide spreadsheet data.";
    }

    this.context.suggestion = suggestAnalysis(
      this.context.detection, 
      this.context.detection.totalRows
    );
    this.context.lastAction = 'suggest';
    
    let response = explainAnalysisSuggestion(this.context.suggestion);
    response += "\n\n**Next step:** Ask me to \"generate R code\" to get the analysis script.";
    
    return response;
  }

  /**
   * Run R code generation
   */
  private runCodeGeneration(): string {
    if (!this.context.suggestion) {
      if (this.context.detection && this.context.detection.type !== DataType.UNKNOWN) {
        // Auto-suggest first
        this.context.suggestion = suggestAnalysis(
          this.context.detection,
          this.context.detection.totalRows
        );
      } else {
        return "🦊 I need to know your data type and analysis plan first. Ask me to \"analyze my data\" for the full workflow.";
      }
    }

    if (!this.context.mapping) {
      this.context.mapping = { study: 'study' };
    }

    this.context.code = generateRCode(this.context.suggestion, this.context.mapping);
    this.context.lastAction = 'generate';
    
    return explainRCode(this.context.code);
  }

  /**
   * Explain an effect measure
   */
  private explainEffectMeasure(measure: EffectMeasure): string {
    const explanations: Record<EffectMeasure, string> = {
      'OR': `## Odds Ratio (OR)

The **odds ratio** compares the odds of an event occurring in the treatment group versus the control group.

### Interpretation
| Value | Meaning |
|-------|---------|
| OR = 1 | No difference between groups |
| OR > 1 | Higher odds in treatment group |
| OR < 1 | Lower odds in treatment group |

### When to Use
- Binary outcomes (yes/no, success/failure)
- Case-control studies
- When events are rare (<10% in both groups)

### Example
OR = 2.5 means the odds of the event are **2.5 times higher** in the treatment group.

### R Code
\`\`\`r
library(metafor)
dat <- escalc(measure="OR", 
              ai=events_treat, bi=no_events_treat,
              ci=events_ctrl, di=no_events_ctrl, 
              data=mydata)
\`\`\``,

      'RR': `## Risk Ratio (RR)

The **risk ratio** (relative risk) compares the probability of an event in the treatment group versus control.

### Interpretation
| Value | Meaning |
|-------|---------|
| RR = 1 | No difference between groups |
| RR > 1 | Higher risk in treatment group |
| RR < 1 | Lower risk in treatment group |

### When to Use
- Binary outcomes in cohort studies or RCTs
- When you want to communicate "how many times more likely"
- Preferred over OR when events are common (>10%)

### Example
RR = 0.75 means the risk is **25% lower** in the treatment group.

### R Code
\`\`\`r
library(metafor)
dat <- escalc(measure="RR", 
              ai=events_treat, bi=no_events_treat,
              ci=events_ctrl, di=no_events_ctrl, 
              data=mydata)
\`\`\``,

      'RD': `## Risk Difference (RD)

The **risk difference** (absolute risk reduction) is the absolute difference in event rates.

### Interpretation
| Value | Meaning |
|-------|---------|
| RD = 0 | No difference between groups |
| RD > 0 | Higher risk in treatment group |
| RD < 0 | Lower risk in treatment group |

### When to Use
- When absolute differences matter clinically
- For calculating Number Needed to Treat (NNT = 1/|RD|)
- When communicating results to patients

### Example
RD = -0.10 means **10 fewer events per 100 patients** in the treatment group.`,

      'SMD': `## Standardized Mean Difference (SMD)

The **SMD** (Cohen's d, Hedges' g) expresses the difference between group means in standard deviation units.

### Interpretation
| Value | Effect Size |
|-------|-------------|
| |SMD| ≈ 0.2 | Small |
| |SMD| ≈ 0.5 | Medium |
| |SMD| ≈ 0.8 | Large |

### When to Use
- Continuous outcomes measured on different scales
- Combining studies with different instruments
- When original units are not meaningful

### Example
SMD = 0.6 means the treatment group scored **0.6 standard deviations higher**.

### R Code
\`\`\`r
library(metafor)
dat <- escalc(measure="SMD",
              m1i=mean_treat, sd1i=sd_treat, n1i=n_treat,
              m2i=mean_ctrl, sd2i=sd_ctrl, n2i=n_ctrl,
              data=mydata)
\`\`\``,

      'MD': `## Mean Difference (MD)

The **mean difference** is the raw difference between group means in original units.

### Interpretation
- MD = 0: No difference
- Positive/negative indicates direction of effect

### When to Use
- Continuous outcomes on the same scale
- When original units are clinically meaningful
- When all studies used identical instruments

### Example
MD = -5.2 mmHg means blood pressure was **5.2 mmHg lower** in the treatment group.`,

      'HR': `## Hazard Ratio (HR)

The **hazard ratio** compares the instantaneous risk of an event between groups in survival analysis.

### Interpretation
| Value | Meaning |
|-------|---------|
| HR = 1 | No difference in survival |
| HR > 1 | Higher hazard in treatment (worse) |
| HR < 1 | Lower hazard in treatment (better) |

### When to Use
- Survival/time-to-event outcomes
- When follow-up times vary
- Cancer, cardiovascular, mortality outcomes

### Example
HR = 0.70 means **30% reduction in hazard** at any time point.`,

      'COR': `## Correlation Coefficient (r)

The **Pearson correlation** measures the linear relationship between two continuous variables.

### Interpretation
| Value | Strength |
|-------|----------|
| |r| < 0.3 | Weak |
| 0.3 ≤ |r| < 0.5 | Moderate |
| |r| ≥ 0.5 | Strong |

### When to Use
- Association between two continuous variables
- Reliability or validity studies`,

      'ZCOR': `## Fisher's Z Transformed Correlation

Fisher's Z transformation converts correlations to a scale with better statistical properties.

### Why Transform?
- Correlations are bounded (-1 to 1)
- Distribution becomes skewed near boundaries
- Z transformation normalizes the distribution

Results are back-transformed to correlation scale for reporting.`,

      'SENS': `## Sensitivity

**Sensitivity** (true positive rate) is the proportion of actual positives correctly identified.

Formula: Sensitivity = TP / (TP + FN)

### Interpretation
- 100%: Test catches all cases
- High sensitivity: Good for ruling OUT disease (SnNout)`,

      'SPEC': `## Specificity

**Specificity** (true negative rate) is the proportion of actual negatives correctly identified.

Formula: Specificity = TN / (TN + FP)

### Interpretation
- 100%: No false positives
- High specificity: Good for ruling IN disease (SpPin)`,

      'DOR': `## Diagnostic Odds Ratio (DOR)

The **DOR** is a single measure combining sensitivity and specificity.

Formula: DOR = (TP × TN) / (FP × FN)

### Interpretation
- DOR = 1: Test performs no better than chance
- Higher DOR: Better diagnostic performance

Note: Bivariate model preferred for diagnostic meta-analysis.`
    };

    return explanations[measure] || `I don't have detailed information about ${measure}.`;
  }

  /**
   * Explain a meta-analysis topic
   */
  private explainTopic(topic: string): string {
    const topics: Record<string, string> = {
      'heterogeneity': `## Heterogeneity in Meta-Analysis

**Heterogeneity** refers to variability in study results beyond what we'd expect from sampling error alone.

### Key Statistics
| Statistic | Interpretation |
|-----------|----------------|
| **I²** | % of variability due to true heterogeneity (not chance) |
| **τ²** | Between-study variance |
| **Q** | Test statistic for heterogeneity |
| **H²** | Ratio of total to sampling variance |

### I² Interpretation
- I² < 25%: Low heterogeneity
- I² 25-75%: Moderate heterogeneity
- I² > 75%: High heterogeneity

### What to Do About It
1. Explore sources with subgroup analysis
2. Use meta-regression for continuous moderators
3. Consider random-effects model
4. Report prediction interval`,

      'publication bias': `## Publication Bias

**Publication bias** occurs when studies with significant results are more likely to be published.

### Detection Methods
1. **Funnel Plot** - Visual inspection for asymmetry
2. **Egger's Test** - Statistical test for small-study effects
3. **Begg's Test** - Rank correlation test
4. **Trim-and-Fill** - Estimates missing studies

### Funnel Plot Interpretation
- Symmetric: No evidence of bias
- Asymmetric: Possible publication bias or other small-study effects

### Limitations
- Need ≥10 studies for reliable assessment
- Asymmetry can have other causes (true heterogeneity, methodological differences)`,

      'forest plot': `## Forest Plot

A **forest plot** displays individual study effects and the pooled estimate.

### Components
- **Squares**: Individual study effects (size = weight)
- **Horizontal lines**: 95% confidence intervals
- **Diamond**: Pooled effect estimate
- **Vertical line**: Line of no effect (OR=1, SMD=0)

### Reading the Plot
- Studies to the left favor control
- Studies to the right favor treatment
- Non-overlapping CIs indicate significant difference
- Diamond width shows CI of pooled effect`,

      'funnel plot': `## Funnel Plot

A **funnel plot** assesses publication bias by plotting effect size against precision.

### Interpretation
- **Symmetric funnel**: No evidence of bias
- **Asymmetric**: Possible publication bias
- **Gap in bottom corner**: Missing small negative studies

### Limitations
- Subjective interpretation
- Need ≥10 studies
- Asymmetry can have other causes`,

      'random effects': `## Random-Effects Model

The **random-effects model** assumes true effects vary between studies.

### When to Use
- Studies from different populations
- Different interventions/comparators
- Heterogeneity expected (I² > 0)

### Key Features
- Weights studies more equally
- Wider confidence intervals
- Estimates average effect across populations
- Includes between-study variance (τ²)`,

      'fixed effect': `## Fixed-Effect Model

The **fixed-effect model** assumes one true effect underlying all studies.

### When to Use
- Studies are functionally identical
- Same population, intervention, outcome
- Low heterogeneity expected

### Key Features
- Weights by inverse variance only
- Narrower confidence intervals
- Estimates the common effect
- Ignores between-study variance`,

      'meta-analysis': `## What is Meta-Analysis?

**Meta-analysis** is a statistical method for combining results from multiple studies.

### Benefits
- Increases statistical power
- Improves precision of effect estimates
- Resolves conflicting results
- Identifies patterns across studies

### Key Steps
1. Define research question (PICO)
2. Systematic literature search
3. Study selection and quality assessment
4. Data extraction
5. Statistical synthesis
6. Interpretation and reporting`,

      'effect size': `## Effect Sizes

An **effect size** quantifies the magnitude of a treatment effect or relationship.

### Types
| Type | Measures | Use Case |
|------|----------|----------|
| Binary | OR, RR, RD | Events/proportions |
| Continuous | MD, SMD | Means |
| Correlation | r, Z | Associations |
| Survival | HR | Time-to-event |

### Why Use Effect Sizes?
- Standardized comparison across studies
- Meaningful interpretation of magnitude
- Required for meta-analysis pooling`
    };

    return topics[topic] || `I can explain: heterogeneity, publication bias, forest plot, funnel plot, random effects, fixed effect, meta-analysis, or effect size. Which would you like to know about?`;
  }

  /**
   * Get help message
   */
  private getHelpMessage(): string {
    return `🦊 I'm Glass, your meta-analysis assistant! Here's what I can help with:

## Data Analysis
- **"Analyze my data"** - Full workflow: detect type → suggest analysis → generate R code
- **"What type of data do I have?"** - Identify your data format
- **"Suggest analysis"** - Get recommendations based on your data
- **"Generate R code"** - Get executable metafor code

## Learning
- **"What is [effect measure]?"** - Explain OR, RR, SMD, etc.
- **"Explain [topic]"** - Learn about heterogeneity, publication bias, etc.

## Current Context
${this.context.detection ? `- Data type: ${getDataTypeLabel(this.context.detection.type)}` : '- No data loaded'}
${this.context.suggestion ? `- Suggested measure: ${this.context.suggestion.defaultMeasure}` : ''}
${this.context.code ? `- R code ready (${this.context.code.sections.length} sections)` : ''}

What would you like to do?`;
  }

  /**
   * Auto-map columns from detection
   */
  private autoMapColumns(
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
    
    // Map based on matched columns
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
    }
    
    return mapping;
  }

  /**
   * Get current context
   */
  getContext(): OrchestratorContext {
    return { ...this.context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {
      detection: null,
      suggestion: null,
      code: null,
      mapping: null,
      lastAction: null
    };
  }

  /**
   * Set spreadsheet data and run detection
   */
  setSpreadsheetData(columns: SpreadsheetColumn[], rows: SpreadsheetRow[]): DataTypeResult {
    this.context.detection = detectDataType(columns, rows);
    this.context.lastAction = 'detect';
    return this.context.detection;
  }
}

// Export singleton
export const glassOrchestratorIntegration = new GlassOrchestratorIntegration();
export default glassOrchestratorIntegration;
