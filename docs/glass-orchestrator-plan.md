# Glass Orchestrator Development Plan

**Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2026  

---

## Executive Summary

The Glass Orchestrator is an intelligent workflow engine that automates the complete meta-analysis pipeline. It detects data types, selects appropriate analyses, assesses risk of bias, chooses reporting guidelines, handles edge cases, and generates PRISMA-compliant methods and results sections. This document provides the complete architectural design and implementation roadmap.

---

## 1. Architecture Overview

### 1.1 System Components

The Glass Orchestrator consists of five core modules that work together to provide end-to-end automation:

| Module | Responsibility | Input | Output |
|--------|----------------|-------|--------|
| **DataTypeDetector** | Analyze spreadsheet columns to determine outcome type | Spreadsheet data | `DataType` enum |
| **AnalysisOrchestrator** | Select and execute appropriate analyses | DataType + data | Analysis results |
| **ROBAnalyzer** | Assess risk of bias from study characteristics | Study metadata | ROB assessments |
| **GuidelineSelector** | Choose appropriate reporting guideline | Analysis type | Guideline + checklist |
| **OutputGenerator** | Generate PRISMA-compliant manuscript sections | All results | Methods + Results text |

### 1.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER SPREADSHEET DATA                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DataTypeDetector                                │
│  • Column pattern matching                                              │
│  • Outcome type inference                                               │
│  • Network structure detection                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │  Binary  │   │Continuous│   │Diagnostic│
              │ Outcomes │   │ Outcomes │   │ Accuracy │
              └──────────┘   └──────────┘   └──────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       AnalysisOrchestrator                              │
│  • Primary meta-analysis (RE model)                                     │
│  • Heterogeneity assessment (I², τ², Q)                                 │
│  • Publication bias (funnel, Egger's, trim-fill)                        │
│  • Sensitivity analyses (leave-one-out, influence)                      │
│  • Subgroup analyses (if moderators present)                            │
│  • Advanced analyses (TSA, Bayesian, NMA if applicable)                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│        ROBAnalyzer          │   │     GuidelineSelector       │
│  • Tool selection           │   │  • PRISMA 2020              │
│  • Domain assessment        │   │  • PRISMA-DTA               │
│  • Summary judgment         │   │  • PRISMA-NMA               │
│  • Traffic light viz        │   │  • MOOSE                    │
└─────────────────────────────┘   └─────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         OutputGenerator                                 │
│  • Methods section (PRISMA items 5-16)                                  │
│  • Results section (PRISMA items 17-23)                                 │
│  • Tables and figures                                                   │
│  • Supplementary materials                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRISMA-COMPLIANT MANUSCRIPT                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DataTypeDetector Module

### 2.1 Supported Data Types

The detector identifies the following outcome types based on column patterns:

| Data Type | Key Columns | Effect Measures | Example |
|-----------|-------------|-----------------|---------|
| **Binary** | events_treatment, events_control, n_treatment, n_control | OR, RR, RD | Drug efficacy trials |
| **Continuous** | mean_treatment, mean_control, sd_treatment, sd_control, n_treatment, n_control | SMD, MD | Quality of life scores |
| **Pre-calculated** | effect_size, se (or ci_lower, ci_upper) | Any | Published effect sizes |
| **Diagnostic** | tp, fp, fn, tn | Sens, Spec, LR+, LR-, DOR | Diagnostic test accuracy |
| **Correlation** | r, n | COR, ZCOR | Association studies |
| **Time-to-event** | hr, ci_lower, ci_upper (or log_hr, se) | HR | Survival analyses |
| **Network** | treatment1, treatment2 (multiple treatments) | Varies | Multi-arm trials |
| **IPD** | patient_id, treatment, outcome, covariates | Varies | Individual patient data |

### 2.2 Detection Algorithm

```typescript
interface DataTypeResult {
  primaryType: DataType;
  confidence: number; // 0-1
  alternativeTypes: DataType[];
  missingColumns: string[];
  warnings: string[];
}

enum DataType {
  BINARY = 'binary',
  CONTINUOUS = 'continuous',
  PRECALCULATED = 'precalculated',
  DIAGNOSTIC = 'diagnostic',
  CORRELATION = 'correlation',
  TIME_TO_EVENT = 'time_to_event',
  NETWORK = 'network',
  IPD = 'ipd',
  UNKNOWN = 'unknown'
}

function detectDataType(columns: Column[], rows: Row[]): DataTypeResult {
  const columnKeys = columns.map(c => c.key.toLowerCase());
  
  // Priority-ordered detection rules
  const rules: DetectionRule[] = [
    {
      type: DataType.DIAGNOSTIC,
      required: ['tp', 'fp', 'fn', 'tn'],
      confidence: 0.95
    },
    {
      type: DataType.BINARY,
      required: ['events_treatment', 'events_control', 'n_treatment', 'n_control'],
      confidence: 0.95
    },
    {
      type: DataType.CONTINUOUS,
      required: ['mean_treatment', 'mean_control', 'sd_treatment', 'sd_control'],
      confidence: 0.95
    },
    {
      type: DataType.NETWORK,
      required: ['treatment1', 'treatment2'],
      additionalCheck: (rows) => countUniqueTreatments(rows) > 2,
      confidence: 0.90
    },
    {
      type: DataType.TIME_TO_EVENT,
      required: ['hr'],
      alternatives: [['log_hr', 'se']],
      confidence: 0.90
    },
    {
      type: DataType.CORRELATION,
      required: ['r', 'n'],
      confidence: 0.90
    },
    {
      type: DataType.PRECALCULATED,
      required: ['effect_size', 'se'],
      alternatives: [['effect_size', 'ci_lower', 'ci_upper']],
      confidence: 0.85
    },
    {
      type: DataType.IPD,
      required: ['patient_id', 'treatment', 'outcome'],
      confidence: 0.90
    }
  ];
  
  // Apply rules in order
  for (const rule of rules) {
    if (matchesRule(columnKeys, rule)) {
      return {
        primaryType: rule.type,
        confidence: rule.confidence,
        alternativeTypes: findAlternatives(columnKeys, rules, rule.type),
        missingColumns: findMissingOptional(columnKeys, rule),
        warnings: generateWarnings(columnKeys, rows, rule)
      };
    }
  }
  
  return {
    primaryType: DataType.UNKNOWN,
    confidence: 0,
    alternativeTypes: [],
    missingColumns: [],
    warnings: ['Could not determine data type. Please specify column mappings.']
  };
}
```

### 2.3 Network Structure Detection

For network meta-analysis, additional detection is required:

```typescript
interface NetworkStructure {
  treatments: string[];
  comparisons: Comparison[];
  isConnected: boolean;
  hasClosedLoops: boolean;
  geometry: 'star' | 'connected' | 'disconnected';
}

function analyzeNetworkStructure(rows: Row[]): NetworkStructure {
  const treatments = new Set<string>();
  const comparisons: Comparison[] = [];
  
  for (const row of rows) {
    treatments.add(row.treatment1);
    treatments.add(row.treatment2);
    comparisons.push({
      t1: row.treatment1,
      t2: row.treatment2,
      studies: 1 // Count later
    });
  }
  
  // Build adjacency graph and check connectivity
  const graph = buildGraph(comparisons);
  const isConnected = checkConnectivity(graph);
  const hasClosedLoops = detectClosedLoops(graph);
  
  return {
    treatments: Array.from(treatments),
    comparisons: aggregateComparisons(comparisons),
    isConnected,
    hasClosedLoops,
    geometry: determineGeometry(graph)
  };
}
```

---

## 3. AnalysisOrchestrator Module

### 3.1 Analysis Selection Matrix

Based on the detected data type, the orchestrator selects appropriate analyses:

| Data Type | Primary Analysis | Heterogeneity | Pub Bias | Sensitivity | Advanced |
|-----------|------------------|---------------|----------|-------------|----------|
| **Binary** | RE model (OR/RR) | I², τ², Q, PI | Funnel, Egger, T&F | LOO, Influence | TSA, Bayesian |
| **Continuous** | RE model (SMD/MD) | I², τ², Q, PI | Funnel, Egger, T&F | LOO, Influence | TSA, Bayesian |
| **Diagnostic** | Bivariate/HSROC | Visual + stats | Deeks' test | Sensitivity analysis | - |
| **Network** | NMA (netmeta) | Global I², τ² | Comparison-adjusted | Node-splitting | Ranking (SUCRA) |
| **Time-to-event** | RE model (HR) | I², τ², Q | Funnel, Egger | LOO, Influence | TSA |
| **Correlation** | RE model (ZCOR) | I², τ², Q | Funnel, Egger | LOO | - |
| **IPD** | One/two-stage | I², τ² | - | Cross-validation | Bayesian |

### 3.2 Analysis Workflow

```typescript
interface AnalysisResult {
  primary: PrimaryAnalysisResult;
  heterogeneity: HeterogeneityResult;
  publicationBias: PublicationBiasResult;
  sensitivity: SensitivityResult;
  advanced?: AdvancedAnalysisResult;
  plots: GeneratedPlot[];
  rCode: string;
}

async function orchestrateAnalysis(
  dataType: DataType,
  data: SpreadsheetData,
  options: AnalysisOptions
): Promise<AnalysisResult> {
  
  const rCode: string[] = [];
  
  // 1. Primary Analysis
  const primaryCode = generatePrimaryAnalysisCode(dataType, data);
  rCode.push(primaryCode);
  const primary = await executeRCode(primaryCode);
  
  // 2. Heterogeneity Assessment
  const hetCode = generateHeterogeneityCode(dataType);
  rCode.push(hetCode);
  const heterogeneity = await executeRCode(hetCode);
  
  // 3. Publication Bias (if applicable)
  let publicationBias: PublicationBiasResult | null = null;
  if (dataType !== DataType.DIAGNOSTIC && data.rows.length >= 10) {
    const pubBiasCode = generatePublicationBiasCode(dataType);
    rCode.push(pubBiasCode);
    publicationBias = await executeRCode(pubBiasCode);
  }
  
  // 4. Sensitivity Analyses
  const sensitivityCode = generateSensitivityCode(dataType);
  rCode.push(sensitivityCode);
  const sensitivity = await executeRCode(sensitivityCode);
  
  // 5. Advanced Analyses (conditional)
  let advanced: AdvancedAnalysisResult | null = null;
  if (options.runTSA && dataType !== DataType.DIAGNOSTIC) {
    const tsaCode = generateTSACode(dataType, primary);
    rCode.push(tsaCode);
    advanced = await executeRCode(tsaCode);
  }
  
  // 6. Generate Plots
  const plots = await generateAllPlots(dataType, primary, heterogeneity, publicationBias);
  
  return {
    primary,
    heterogeneity,
    publicationBias: publicationBias || { skipped: true, reason: 'Insufficient studies (<10)' },
    sensitivity,
    advanced,
    plots,
    rCode: rCode.join('\n\n')
  };
}
```

### 3.3 R Code Generation Templates

The orchestrator generates complete, reproducible R code:

```typescript
function generatePrimaryAnalysisCode(dataType: DataType, data: SpreadsheetData): string {
  switch (dataType) {
    case DataType.BINARY:
      return `
# Binary Outcome Meta-Analysis
library(metafor)

# Calculate log odds ratios
dat <- escalc(measure = "OR",
              ai = events_treatment, bi = n_treatment - events_treatment,
              ci = events_control, di = n_control - events_control,
              data = mydata)

# Fit random-effects model
res <- rma(yi, vi, data = dat, method = "REML")

# Summary
summary(res)

# Back-transform to OR scale
predict(res, transf = exp, digits = 3)
`;

    case DataType.CONTINUOUS:
      return `
# Continuous Outcome Meta-Analysis
library(metafor)

# Calculate standardized mean differences
dat <- escalc(measure = "SMD",
              m1i = mean_treatment, sd1i = sd_treatment, n1i = n_treatment,
              m2i = mean_control, sd2i = sd_control, n2i = n_control,
              data = mydata)

# Fit random-effects model
res <- rma(yi, vi, data = dat, method = "REML")

# Summary with prediction interval
summary(res)
predict(res, digits = 3)
`;

    case DataType.DIAGNOSTIC:
      return `
# Diagnostic Test Accuracy Meta-Analysis
library(mada)

# Bivariate model
fit <- reitsma(data, 
               formula = cbind(tsens, tfpr) ~ 1)

# Summary operating point
summary(fit)

# SROC curve
plot(fit, sroclwd = 2, main = "SROC Curve")
points(fpr(data), sens(data), pch = 19)
`;

    case DataType.NETWORK:
      return `
# Network Meta-Analysis
library(netmeta)

# Create network
nma <- netmeta(TE = effect_size,
               seTE = se,
               treat1 = treatment1,
               treat2 = treatment2,
               studlab = study,
               data = mydata,
               sm = "OR",
               random = TRUE)

# Network plot
netgraph(nma, plastic = TRUE, multiarm = TRUE)

# League table
netleague(nma)

# Rankings
netrank(nma, small.values = "bad")
`;

    // ... additional cases
  }
}
```

---

## 4. ROBAnalyzer Module

### 4.1 Tool Selection Logic

The ROB analyzer automatically selects the appropriate assessment tool:

| Study Design | Assessment Tool | Domains | Judgment Scale |
|--------------|-----------------|---------|----------------|
| Randomized Controlled Trial | RoB 2 | 5 | Low / Some concerns / High |
| Non-randomized Intervention | ROBINS-I | 7 | Low / Moderate / Serious / Critical |
| Cohort Study | Newcastle-Ottawa Scale | 3 categories | Stars (0-9) |
| Case-Control Study | Newcastle-Ottawa Scale | 3 categories | Stars (0-9) |
| Diagnostic Accuracy | QUADAS-2 | 4 | Low / High / Unclear |
| Prognostic Study | QUIPS | 6 | Low / Moderate / High |

### 4.2 ROB Assessment Interface

```typescript
interface ROBAssessment {
  studyId: string;
  tool: ROBTool;
  domains: DomainAssessment[];
  overallJudgment: ROBJudgment;
  supportingText: string;
}

interface DomainAssessment {
  domain: string;
  signalingQuestions: SignalingQuestion[];
  judgment: ROBJudgment;
  support: string;
}

interface SignalingQuestion {
  question: string;
  answer: 'yes' | 'probably_yes' | 'probably_no' | 'no' | 'no_information' | 'not_applicable';
  notes?: string;
}

enum ROBTool {
  ROB2 = 'RoB 2',
  ROBINS_I = 'ROBINS-I',
  NOS = 'Newcastle-Ottawa Scale',
  QUADAS2 = 'QUADAS-2',
  QUIPS = 'QUIPS'
}

enum ROBJudgment {
  LOW = 'Low risk',
  SOME_CONCERNS = 'Some concerns',
  MODERATE = 'Moderate risk',
  HIGH = 'High risk',
  SERIOUS = 'Serious risk',
  CRITICAL = 'Critical risk'
}
```

### 4.3 Automated ROB Extraction

For studies with sufficient metadata, Glass can suggest initial ROB assessments:

```typescript
interface ROBExtractionHints {
  studyId: string;
  suggestedTool: ROBTool;
  extractedInfo: ExtractedROBInfo;
  confidence: number;
  requiresManualReview: boolean;
}

interface ExtractedROBInfo {
  randomization?: {
    mentioned: boolean;
    method?: string;
    allocationConcealment?: boolean;
  };
  blinding?: {
    participants: boolean;
    personnel: boolean;
    outcomeAssessors: boolean;
  };
  attrition?: {
    dropoutRate?: number;
    reasonsReported: boolean;
    ittAnalysis: boolean;
  };
  selectiveReporting?: {
    protocolAvailable: boolean;
    allOutcomesReported: boolean;
  };
}

async function extractROBHints(
  studyMetadata: StudyMetadata,
  fullText?: string
): Promise<ROBExtractionHints> {
  // Use LLM to extract ROB-relevant information
  const prompt = buildROBExtractionPrompt(studyMetadata, fullText);
  const response = await callLLM(prompt);
  
  return parseROBResponse(response);
}
```

### 4.4 Traffic Light Visualization

```typescript
function generateROBVisualization(assessments: ROBAssessment[]): ROBVisualization {
  return {
    summaryPlot: generateSummaryPlot(assessments),
    trafficLightPlot: generateTrafficLightPlot(assessments),
    rCode: `
library(robvis)

# Traffic light plot
rob_traffic_light(data, tool = "${assessments[0].tool}")

# Summary plot
rob_summary(data, tool = "${assessments[0].tool}")
`
  };
}
```

---

## 5. GuidelineSelector Module

### 5.1 Reporting Guideline Decision Tree

```
                    ┌─────────────────────────────┐
                    │   What type of review?      │
                    └─────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │  Intervention │   │  Diagnostic   │   │  Observational│
    │    Review     │   │   Accuracy    │   │    Studies    │
    └───────────────┘   └───────────────┘   └───────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │   Network?    │   │  PRISMA-DTA   │   │    MOOSE      │
    └───────────────┘   └───────────────┘   └───────────────┘
            │
      ┌─────┴─────┐
      ▼           ▼
┌──────────┐ ┌──────────┐
│   Yes    │ │    No    │
│PRISMA-NMA│ │PRISMA2020│
└──────────┘ └──────────┘
```

### 5.2 Guideline Selection Logic

```typescript
interface GuidelineRecommendation {
  primary: ReportingGuideline;
  extensions: ReportingGuideline[];
  checklist: ChecklistItem[];
  registrationRequired: boolean;
}

enum ReportingGuideline {
  PRISMA_2020 = 'PRISMA 2020',
  PRISMA_DTA = 'PRISMA-DTA',
  PRISMA_NMA = 'PRISMA-NMA',
  PRISMA_IPD = 'PRISMA-IPD',
  PRISMA_S = 'PRISMA-S (Search)',
  PRISMA_P = 'PRISMA-P (Protocol)',
  MOOSE = 'MOOSE',
  COSMOS_E = 'COSMOS-E'
}

function selectReportingGuideline(
  dataType: DataType,
  analysisType: AnalysisType,
  studyDesigns: StudyDesign[]
): GuidelineRecommendation {
  
  let primary: ReportingGuideline;
  const extensions: ReportingGuideline[] = [];
  
  // Primary guideline selection
  if (dataType === DataType.DIAGNOSTIC) {
    primary = ReportingGuideline.PRISMA_DTA;
  } else if (analysisType === AnalysisType.NETWORK) {
    primary = ReportingGuideline.PRISMA_NMA;
  } else if (analysisType === AnalysisType.IPD) {
    primary = ReportingGuideline.PRISMA_IPD;
  } else if (studyDesigns.every(d => d === StudyDesign.OBSERVATIONAL)) {
    primary = ReportingGuideline.MOOSE;
  } else {
    primary = ReportingGuideline.PRISMA_2020;
  }
  
  // Add extensions
  extensions.push(ReportingGuideline.PRISMA_S); // Search extension always relevant
  
  return {
    primary,
    extensions,
    checklist: getChecklist(primary),
    registrationRequired: true // PROSPERO registration recommended
  };
}
```

### 5.3 Checklist Items

```typescript
interface ChecklistItem {
  section: string;
  item: number;
  description: string;
  location: string; // Page/paragraph reference
  completed: boolean;
  notes?: string;
}

function getChecklist(guideline: ReportingGuideline): ChecklistItem[] {
  switch (guideline) {
    case ReportingGuideline.PRISMA_2020:
      return [
        { section: 'Title', item: 1, description: 'Identify the report as a systematic review', location: '', completed: false },
        { section: 'Abstract', item: 2, description: 'Structured summary including background, objectives, data sources, study eligibility criteria, participants, interventions, study appraisal and synthesis methods, results, limitations, conclusions, and implications', location: '', completed: false },
        // ... 27 items total
      ];
    
    case ReportingGuideline.PRISMA_DTA:
      return [
        { section: 'Title', item: 1, description: 'Identify the report as a systematic review of diagnostic test accuracy studies', location: '', completed: false },
        // ... DTA-specific items
      ];
    
    // ... other guidelines
  }
}
```

---

## 6. OutputGenerator Module

### 6.1 Methods Section Generation

The output generator creates PRISMA-compliant methods text:

```typescript
interface MethodsSection {
  eligibilityCriteria: string;
  informationSources: string;
  searchStrategy: string;
  selectionProcess: string;
  dataCollection: string;
  dataItems: string;
  riskOfBiasAssessment: string;
  effectMeasures: string;
  synthesisMethods: string;
  reportingBiasAssessment: string;
  certaintyAssessment: string;
}

function generateMethodsSection(
  analysisResult: AnalysisResult,
  robAssessments: ROBAssessment[],
  guideline: ReportingGuideline
): MethodsSection {
  
  return {
    eligibilityCriteria: generateEligibilityCriteria(analysisResult),
    
    informationSources: `We searched the following databases from inception to ${formatDate(new Date())}: PubMed/MEDLINE, Embase, Cochrane Central Register of Controlled Trials (CENTRAL), and Web of Science. We also searched trial registries (ClinicalTrials.gov, WHO ICTRP) and reference lists of included studies.`,
    
    searchStrategy: `The search strategy was developed in consultation with a medical librarian and is provided in Supplementary Material 1. No language restrictions were applied.`,
    
    selectionProcess: `Two reviewers independently screened titles and abstracts, followed by full-text review of potentially eligible studies. Disagreements were resolved by discussion or consultation with a third reviewer.`,
    
    dataCollection: `Data were extracted independently by two reviewers using a standardized form. We extracted study characteristics, participant demographics, intervention details, and outcome data.`,
    
    dataItems: generateDataItemsText(analysisResult.dataType),
    
    riskOfBiasAssessment: generateROBMethodsText(robAssessments),
    
    effectMeasures: generateEffectMeasuresText(analysisResult),
    
    synthesisMethods: generateSynthesisMethodsText(analysisResult),
    
    reportingBiasAssessment: generateReportingBiasMethodsText(analysisResult),
    
    certaintyAssessment: `We assessed the certainty of evidence using the GRADE approach, considering risk of bias, inconsistency, indirectness, imprecision, and publication bias.`
  };
}
```

### 6.2 Results Section Generation

```typescript
interface ResultsSection {
  studySelection: string;
  studyCharacteristics: string;
  riskOfBiasResults: string;
  synthesisResults: string;
  heterogeneityResults: string;
  publicationBiasResults: string;
  sensitivityResults: string;
  certaintyOfEvidence: string;
}

function generateResultsSection(
  analysisResult: AnalysisResult,
  robAssessments: ROBAssessment[],
  studyCount: number
): ResultsSection {
  
  const { primary, heterogeneity, publicationBias, sensitivity } = analysisResult;
  
  return {
    studySelection: `The search identified ${primary.totalRecords} records. After removing duplicates and screening, ${studyCount} studies met the inclusion criteria (Figure 1).`,
    
    studyCharacteristics: generateStudyCharacteristicsText(analysisResult),
    
    riskOfBiasResults: generateROBResultsText(robAssessments),
    
    synthesisResults: generateSynthesisResultsText(primary),
    
    heterogeneityResults: generateHeterogeneityResultsText(heterogeneity),
    
    publicationBiasResults: generatePublicationBiasResultsText(publicationBias),
    
    sensitivityResults: generateSensitivityResultsText(sensitivity),
    
    certaintyOfEvidence: `The certainty of evidence was rated as ${primary.gradeRating} due to ${primary.gradeDowngrades.join(', ')}.`
  };
}

function generateSynthesisResultsText(primary: PrimaryAnalysisResult): string {
  const { effectSize, ci, pValue, nStudies, nParticipants, effectMeasure } = primary;
  
  if (effectMeasure === 'OR' || effectMeasure === 'RR' || effectMeasure === 'HR') {
    return `The pooled ${effectMeasure} was ${effectSize.toFixed(2)} (95% CI: ${ci.lower.toFixed(2)}-${ci.upper.toFixed(2)}; p ${pValue < 0.001 ? '< 0.001' : `= ${pValue.toFixed(3)}`}), based on ${nStudies} studies with ${nParticipants} participants. This indicates a ${effectSize > 1 ? 'statistically significant increase' : effectSize < 1 ? 'statistically significant decrease' : 'no significant difference'} in the odds of the outcome.`;
  } else {
    return `The pooled ${effectMeasure} was ${effectSize.toFixed(2)} (95% CI: ${ci.lower.toFixed(2)}-${ci.upper.toFixed(2)}; p ${pValue < 0.001 ? '< 0.001' : `= ${pValue.toFixed(3)}`}), based on ${nStudies} studies with ${nParticipants} participants. This represents a ${Math.abs(effectSize) < 0.2 ? 'small' : Math.abs(effectSize) < 0.5 ? 'medium' : 'large'} effect.`;
  }
}
```

### 6.3 Table and Figure Generation

```typescript
interface GeneratedTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
  footnotes: string[];
}

interface GeneratedFigure {
  id: string;
  title: string;
  type: 'forest' | 'funnel' | 'sroc' | 'network' | 'rob_summary' | 'prisma_flow';
  imagePath: string;
  caption: string;
}

function generateTablesAndFigures(
  analysisResult: AnalysisResult,
  robAssessments: ROBAssessment[]
): { tables: GeneratedTable[]; figures: GeneratedFigure[] } {
  
  const tables: GeneratedTable[] = [
    generateStudyCharacteristicsTable(analysisResult),
    generateMainResultsTable(analysisResult),
    generateSubgroupAnalysisTable(analysisResult),
    generateSensitivityAnalysisTable(analysisResult),
    generateGRADETable(analysisResult)
  ];
  
  const figures: GeneratedFigure[] = [
    { id: 'fig1', title: 'PRISMA Flow Diagram', type: 'prisma_flow', imagePath: '', caption: 'PRISMA 2020 flow diagram showing study selection process.' },
    { id: 'fig2', title: 'Forest Plot', type: 'forest', imagePath: analysisResult.plots.forest, caption: 'Forest plot showing individual study effects and pooled estimate.' },
    { id: 'fig3', title: 'Funnel Plot', type: 'funnel', imagePath: analysisResult.plots.funnel, caption: 'Funnel plot for assessment of publication bias.' },
    { id: 'fig4', title: 'Risk of Bias Summary', type: 'rob_summary', imagePath: '', caption: 'Risk of bias summary across included studies.' }
  ];
  
  return { tables, figures };
}
```

---

## 7. Missing Data Handler

### 7.1 Missing Data Detection

```typescript
interface MissingDataReport {
  studyId: string;
  missingFields: MissingField[];
  severity: 'minor' | 'moderate' | 'critical';
  recommendations: string[];
}

interface MissingField {
  field: string;
  required: boolean;
  canBeCalculated: boolean;
  calculationMethod?: string;
  alternativeFields?: string[];
}

function detectMissingData(rows: Row[], columns: Column[]): MissingDataReport[] {
  const reports: MissingDataReport[] = [];
  
  for (const row of rows) {
    const missingFields: MissingField[] = [];
    
    for (const col of columns) {
      if (col.required && !row[col.key]) {
        missingFields.push({
          field: col.key,
          required: true,
          canBeCalculated: checkIfCalculable(col.key, row),
          calculationMethod: getCalculationMethod(col.key, row),
          alternativeFields: getAlternativeFields(col.key)
        });
      }
    }
    
    if (missingFields.length > 0) {
      reports.push({
        studyId: row.study || row.id,
        missingFields,
        severity: determineSeverity(missingFields),
        recommendations: generateRecommendations(missingFields)
      });
    }
  }
  
  return reports;
}
```

### 7.2 Imputation Strategies

```typescript
interface ImputationStrategy {
  field: string;
  method: ImputationMethod;
  formula?: string;
  assumptions: string[];
  sensitivityAnalysisRequired: boolean;
}

enum ImputationMethod {
  CALCULATE_FROM_CI = 'calculate_from_ci',
  CALCULATE_FROM_P = 'calculate_from_p',
  CALCULATE_FROM_T = 'calculate_from_t',
  MEDIAN_IMPUTATION = 'median_imputation',
  CORRELATION_BASED = 'correlation_based',
  AUTHOR_CONTACT = 'author_contact',
  EXCLUDE = 'exclude'
}

const IMPUTATION_FORMULAS: Record<string, ImputationStrategy> = {
  'se_from_ci': {
    field: 'se',
    method: ImputationMethod.CALCULATE_FROM_CI,
    formula: 'SE = (CI_upper - CI_lower) / (2 * 1.96)',
    assumptions: ['95% CI reported', 'Normal distribution assumed'],
    sensitivityAnalysisRequired: false
  },
  'se_from_p': {
    field: 'se',
    method: ImputationMethod.CALCULATE_FROM_P,
    formula: 'SE = effect_size / Z_p',
    assumptions: ['Two-tailed p-value', 'Normal distribution'],
    sensitivityAnalysisRequired: true
  },
  'sd_from_iqr': {
    field: 'sd',
    method: ImputationMethod.CALCULATE_FROM_CI,
    formula: 'SD ≈ IQR / 1.35',
    assumptions: ['Normal distribution', 'IQR available'],
    sensitivityAnalysisRequired: true
  },
  'sd_from_range': {
    field: 'sd',
    method: ImputationMethod.CALCULATE_FROM_CI,
    formula: 'SD ≈ Range / 4 (for n<70) or Range / 6 (for n≥70)',
    assumptions: ['Normal distribution', 'Range available'],
    sensitivityAnalysisRequired: true
  }
};
```

### 7.3 Edge Case Handling

```typescript
interface EdgeCase {
  type: EdgeCaseType;
  description: string;
  affectedStudies: string[];
  handlingStrategy: string;
  sensitivityAnalysis: boolean;
}

enum EdgeCaseType {
  ZERO_EVENTS = 'zero_events',
  SINGLE_ARM = 'single_arm',
  MULTI_ARM = 'multi_arm',
  CLUSTER_RANDOMIZED = 'cluster_randomized',
  CROSSOVER = 'crossover',
  BEFORE_AFTER = 'before_after',
  EXTREME_OUTLIER = 'extreme_outlier',
  DUPLICATE_PUBLICATION = 'duplicate_publication'
}

const EDGE_CASE_HANDLERS: Record<EdgeCaseType, EdgeCaseHandler> = {
  [EdgeCaseType.ZERO_EVENTS]: {
    detect: (row) => row.events_treatment === 0 || row.events_control === 0,
    handle: (row) => ({
      strategy: 'Add 0.5 continuity correction',
      rCode: 'escalc(..., add = 0.5, to = "only0")',
      sensitivityAnalysis: true,
      alternatives: ['Peto OR', 'Exact methods', 'Exclude study']
    })
  },
  
  [EdgeCaseType.MULTI_ARM]: {
    detect: (rows) => hasMultiArmTrials(rows),
    handle: (rows) => ({
      strategy: 'Account for correlation between arms',
      rCode: 'Use rma.mv() with random = ~ 1 | study/arm',
      sensitivityAnalysis: false,
      notes: 'Split shared control group or use multivariate model'
    })
  },
  
  [EdgeCaseType.EXTREME_OUTLIER]: {
    detect: (row, allRows) => isOutlier(row, allRows),
    handle: (row) => ({
      strategy: 'Investigate and consider sensitivity analysis',
      rCode: 'influence(res); leave1out(res)',
      sensitivityAnalysis: true,
      notes: 'Check for data extraction errors or genuine heterogeneity'
    })
  }
};
```

---

## 8. Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)

| Task | Estimated Hours | Priority |
|------|-----------------|----------|
| DataTypeDetector implementation | 4 | High |
| Column pattern matching | 2 | High |
| Network structure detection | 2 | Medium |
| Unit tests for detection | 2 | High |

### Phase 2: Analysis Orchestration (Week 1-2)

| Task | Estimated Hours | Priority |
|------|-----------------|----------|
| AnalysisOrchestrator core | 4 | High |
| R code generation templates | 4 | High |
| Analysis execution pipeline | 3 | High |
| Plot generation integration | 2 | Medium |
| Unit tests for orchestration | 3 | High |

### Phase 3: ROB and Guidelines (Week 2)

| Task | Estimated Hours | Priority |
|------|-----------------|----------|
| ROBAnalyzer implementation | 3 | High |
| Tool selection logic | 2 | High |
| GuidelineSelector implementation | 2 | High |
| Checklist generation | 2 | Medium |
| Unit tests | 2 | High |

### Phase 4: Output Generation (Week 2-3)

| Task | Estimated Hours | Priority |
|------|-----------------|----------|
| Methods section generator | 4 | High |
| Results section generator | 4 | High |
| Table generation | 3 | Medium |
| Figure integration | 2 | Medium |
| Unit tests | 2 | High |

### Phase 5: Missing Data & Edge Cases (Week 3)

| Task | Estimated Hours | Priority |
|------|-----------------|----------|
| Missing data detector | 2 | High |
| Imputation strategies | 3 | Medium |
| Edge case handlers | 3 | Medium |
| Integration tests | 2 | High |

### Phase 6: Integration & Testing (Week 3-4)

| Task | Estimated Hours | Priority |
|------|-----------------|----------|
| End-to-end integration | 4 | High |
| UI integration | 4 | High |
| Comprehensive testing | 4 | High |
| Documentation | 2 | Medium |

**Total Estimated Time: 70-80 hours (3-4 weeks)**

---

## 9. File Structure

```
lib/
├── glass/
│   ├── orchestrator/
│   │   ├── index.ts                    # Main orchestrator exports
│   │   ├── data-type-detector.ts       # DataTypeDetector module
│   │   ├── analysis-orchestrator.ts    # AnalysisOrchestrator module
│   │   ├── rob-analyzer.ts             # ROBAnalyzer module
│   │   ├── guideline-selector.ts       # GuidelineSelector module
│   │   ├── output-generator.ts         # OutputGenerator module
│   │   ├── missing-data-handler.ts     # Missing data handling
│   │   ├── edge-case-handler.ts        # Edge case handling
│   │   └── types.ts                    # Shared type definitions
│   │
│   ├── templates/
│   │   ├── r-code/
│   │   │   ├── binary.ts               # Binary outcome R templates
│   │   │   ├── continuous.ts           # Continuous outcome R templates
│   │   │   ├── diagnostic.ts           # Diagnostic accuracy R templates
│   │   │   ├── network.ts              # Network MA R templates
│   │   │   └── common.ts               # Shared R code utilities
│   │   │
│   │   └── manuscript/
│   │       ├── methods.ts              # Methods section templates
│   │       ├── results.ts              # Results section templates
│   │       └── tables.ts               # Table templates
│   │
│   └── checklists/
│       ├── prisma-2020.ts              # PRISMA 2020 checklist
│       ├── prisma-dta.ts               # PRISMA-DTA checklist
│       ├── prisma-nma.ts               # PRISMA-NMA checklist
│       └── moose.ts                    # MOOSE checklist

__tests__/
├── orchestrator/
│   ├── data-type-detector.test.ts
│   ├── analysis-orchestrator.test.ts
│   ├── rob-analyzer.test.ts
│   ├── guideline-selector.test.ts
│   ├── output-generator.test.ts
│   └── integration.test.ts
```

---

## 10. Success Criteria

The Glass Orchestrator will be considered complete when:

1. **Data Type Detection** achieves >95% accuracy on test datasets
2. **Analysis Selection** correctly identifies appropriate analyses for all supported data types
3. **R Code Generation** produces valid, executable code for all analysis types
4. **ROB Assessment** supports RoB 2, ROBINS-I, NOS, and QUADAS-2
5. **Guideline Selection** correctly recommends PRISMA variants based on review type
6. **Output Generation** produces PRISMA-compliant methods and results sections
7. **Missing Data Handling** identifies gaps and suggests appropriate strategies
8. **Edge Cases** are detected and handled with appropriate sensitivity analyses
9. **All tests pass** with >90% code coverage
10. **Documentation** is complete and accurate

---

## References

1. Page MJ, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ 2021;372:n71.
2. Sterne JAC, et al. RoB 2: a revised tool for assessing risk of bias in randomised trials. BMJ 2019;366:l4898.
3. Sterne JA, et al. ROBINS-I: a tool for assessing risk of bias in non-randomised studies of interventions. BMJ 2016;355:i4919.
4. Whiting PF, et al. QUADAS-2: a revised tool for the quality assessment of diagnostic accuracy studies. Ann Intern Med 2011;155:529-36.
5. Higgins JPT, et al. Cochrane Handbook for Systematic Reviews of Interventions. 2nd ed. Chichester: Wiley; 2019.
6. Viechtbauer W. Conducting meta-analyses in R with the metafor package. J Stat Softw 2010;36:1-48.
