/**
 * Practice Datasets for Tutorial
 * Sample meta-analysis datasets for hands-on learning
 */

export interface PracticeDataset {
  id: string;
  name: string;
  description: string;
  category: 'medical' | 'psychology' | 'education';
  studyCount: number;
  effectType: 'OR' | 'RR' | 'SMD' | 'MD';
  headers: string[];
  data: string[][];
  source: string;
  citation: string;
  learningObjectives: string[];
  suggestedAnalyses: string[];
}

/**
 * BCG Vaccine Trials Dataset
 * Classic meta-analysis dataset examining BCG vaccine efficacy against tuberculosis
 */
export const bcgVaccineDataset: PracticeDataset = {
  id: 'bcg-vaccine',
  name: 'BCG Vaccine Trials',
  description: 'A classic dataset of 13 randomized controlled trials examining the efficacy of BCG vaccination against tuberculosis. This dataset is widely used in meta-analysis education due to its historical significance and clear heterogeneity patterns.',
  category: 'medical',
  studyCount: 13,
  effectType: 'RR',
  headers: ['study', 'year', 'tpos', 'tneg', 'cpos', 'cneg', 'latitude', 'alloc'],
  data: [
    ['Aronson', '1948', '4', '119', '11', '128', '44', 'random'],
    ['Ferguson & Simes', '1949', '6', '300', '29', '274', '55', 'random'],
    ['Rosenthal et al', '1960', '3', '228', '11', '209', '42', 'random'],
    ['Hart & Sutherland', '1977', '62', '13536', '248', '12619', '52', 'random'],
    ['Frimodt-Moller et al', '1973', '33', '5036', '47', '5761', '13', 'alternate'],
    ['Stein & Aronson', '1953', '180', '1361', '372', '1079', '44', 'alternate'],
    ['Vandiviere et al', '1973', '8', '2537', '10', '619', '19', 'random'],
    ['TPT Madras', '1980', '505', '87886', '499', '87892', '13', 'random'],
    ['Coetzee & Berjak', '1968', '29', '7470', '45', '7232', '27', 'random'],
    ['Rosenthal et al', '1961', '17', '1699', '65', '1600', '42', 'systematic'],
    ['Comstock et al', '1974', '186', '50448', '141', '27197', '18', 'systematic'],
    ['Comstock & Webster', '1969', '5', '2493', '3', '2338', '33', 'systematic'],
    ['Comstock et al', '1976', '27', '16886', '29', '17825', '33', 'systematic'],
  ],
  source: 'Colditz et al. (1994)',
  citation: 'Colditz GA, Brewer TF, Berkey CS, et al. Efficacy of BCG vaccine in the prevention of tuberculosis. JAMA. 1994;271(9):698-702.',
  learningObjectives: [
    'Calculate risk ratios from 2x2 contingency tables',
    'Understand heterogeneity in meta-analysis (I² statistic)',
    'Explore moderator analysis using latitude as a covariate',
    'Create and interpret forest plots',
  ],
  suggestedAnalyses: [
    '/r meta::metabin(tpos, tpos+tneg, cpos, cpos+cneg, data=bcg, studlab=study, sm="RR")',
    '/r forest(meta_result)',
    '/r metareg(meta_result, ~latitude)',
    '/r funnel(meta_result)',
  ],
};

/**
 * Aspirin for Cardiovascular Prevention Dataset
 * Studies examining aspirin's effect on cardiovascular events
 */
export const aspirinStudiesDataset: PracticeDataset = {
  id: 'aspirin-cvd',
  name: 'Aspirin for CVD Prevention',
  description: 'A collection of major randomized trials examining the effect of aspirin on cardiovascular disease prevention. Includes both primary and secondary prevention studies.',
  category: 'medical',
  studyCount: 9,
  effectType: 'OR',
  headers: ['study', 'year', 'aspirin_events', 'aspirin_n', 'control_events', 'control_n', 'prevention_type'],
  data: [
    ['British Doctors Study', '1988', '148', '3429', '79', '1710', 'primary'],
    ['Physicians Health Study', '1989', '139', '11037', '239', '11034', 'primary'],
    ['ETDRS', '1992', '350', '1856', '379', '1855', 'primary'],
    ['HOT', '1998', '82', '9399', '127', '9391', 'primary'],
    ['PPP', '2001', '20', '2226', '22', '2269', 'primary'],
    ['WHS', '2005', '477', '19934', '522', '19942', 'primary'],
    ['POPADAD', '2008', '116', '638', '117', '638', 'primary'],
    ['JPAD', '2008', '68', '1262', '86', '1277', 'primary'],
    ['AAA', '2010', '176', '1675', '186', '1675', 'primary'],
  ],
  source: 'Antithrombotic Trialists Collaboration',
  citation: 'Antithrombotic Trialists Collaboration. Aspirin in the primary and secondary prevention of vascular disease. Lancet. 2009;373(9678):1849-1860.',
  learningObjectives: [
    'Calculate odds ratios for binary outcomes',
    'Perform fixed-effects vs random-effects meta-analysis',
    'Assess publication bias using funnel plots',
    'Interpret confidence intervals and p-values',
  ],
  suggestedAnalyses: [
    '/r meta::metabin(aspirin_events, aspirin_n, control_events, control_n, data=aspirin, studlab=study, sm="OR")',
    '/r forest(meta_result, sortvar=year)',
    '/r funnel(meta_result)',
    '/r metabias(meta_result, method="linreg")',
  ],
};

/**
 * Cognitive Behavioral Therapy for Depression Dataset
 * Studies examining CBT efficacy for depression treatment
 */
export const cbtDepressionDataset: PracticeDataset = {
  id: 'cbt-depression',
  name: 'CBT for Depression',
  description: 'A collection of randomized controlled trials comparing Cognitive Behavioral Therapy (CBT) to control conditions for treating depression. Uses standardized mean differences.',
  category: 'psychology',
  studyCount: 12,
  effectType: 'SMD',
  headers: ['study', 'year', 'n_cbt', 'mean_cbt', 'sd_cbt', 'n_control', 'mean_control', 'sd_control', 'control_type'],
  data: [
    ['Rush et al', '1977', '19', '6.2', '4.8', '22', '12.4', '5.1', 'waitlist'],
    ['Shaw', '1977', '10', '5.8', '4.2', '11', '14.2', '6.3', 'waitlist'],
    ['Taylor & Marshall', '1977', '12', '7.1', '5.5', '12', '15.8', '6.8', 'waitlist'],
    ['Wilson et al', '1983', '15', '8.4', '6.2', '15', '16.2', '7.1', 'waitlist'],
    ['Comas-Diaz', '1981', '13', '9.2', '5.8', '13', '17.4', '6.4', 'waitlist'],
    ['Thompson et al', '1987', '25', '10.1', '6.8', '26', '15.8', '7.2', 'usual_care'],
    ['Gallagher & Thompson', '1982', '16', '8.8', '5.4', '14', '14.6', '6.1', 'waitlist'],
    ['Steuer et al', '1984', '20', '11.2', '7.1', '18', '16.4', '6.8', 'psychodynamic'],
    ['Beutler et al', '1987', '22', '9.6', '6.4', '21', '15.2', '7.0', 'supportive'],
    ['Jarrett et al', '1999', '36', '7.8', '5.9', '36', '14.8', '6.6', 'pill_placebo'],
    ['DeRubeis et al', '2005', '60', '8.2', '6.1', '60', '13.4', '6.8', 'pill_placebo'],
    ['Dimidjian et al', '2006', '43', '9.4', '6.5', '45', '14.2', '7.2', 'pill_placebo'],
  ],
  source: 'Cuijpers et al. (2013)',
  citation: 'Cuijpers P, Berking M, Andersson G, et al. A meta-analysis of cognitive-behavioural therapy for adult depression. Clin Psychol Rev. 2013;33(8):954-964.',
  learningObjectives: [
    'Calculate standardized mean differences (Cohen\'s d, Hedges\' g)',
    'Understand effect size interpretation guidelines',
    'Perform subgroup analysis by control type',
    'Assess study quality and risk of bias',
  ],
  suggestedAnalyses: [
    '/r meta::metacont(n_cbt, mean_cbt, sd_cbt, n_control, mean_control, sd_control, data=cbt, studlab=study, sm="SMD")',
    '/r forest(meta_result)',
    '/r subgroup_analysis <- update(meta_result, subgroup=control_type)',
    '/r forest(subgroup_analysis)',
  ],
};

/**
 * Educational Intervention Dataset
 * Studies examining the effect of homework on academic achievement
 */
export const homeworkEffectDataset: PracticeDataset = {
  id: 'homework-effect',
  name: 'Homework and Achievement',
  description: 'A collection of studies examining the relationship between homework and academic achievement across different grade levels.',
  category: 'education',
  studyCount: 10,
  effectType: 'SMD',
  headers: ['study', 'year', 'n_homework', 'mean_hw', 'sd_hw', 'n_control', 'mean_ctrl', 'sd_ctrl', 'grade_level'],
  data: [
    ['Cooper et al', '1998', '45', '78.2', '12.4', '42', '72.1', '11.8', 'elementary'],
    ['Keith & Cool', '1992', '120', '82.4', '10.2', '115', '78.6', '11.1', 'middle'],
    ['Trautwein', '2007', '85', '76.8', '13.5', '80', '71.2', '12.8', 'high'],
    ['Paschal et al', '1984', '32', '74.5', '11.2', '30', '70.8', '10.9', 'elementary'],
    ['Walberg et al', '1985', '55', '80.1', '9.8', '52', '74.3', '10.4', 'middle'],
    ['Keith', '1982', '200', '84.2', '8.6', '195', '79.8', '9.2', 'high'],
    ['Epstein', '1988', '38', '75.6', '12.1', '35', '72.4', '11.5', 'elementary'],
    ['Muhlenbruck et al', '2000', '92', '79.4', '10.8', '88', '74.2', '11.2', 'middle'],
    ['Zimmerman & Kitsantas', '2005', '65', '82.8', '9.4', '62', '76.5', '10.1', 'high'],
    ['Núñez et al', '2015', '78', '77.2', '11.6', '75', '73.8', '10.8', 'middle'],
  ],
  source: 'Cooper et al. (2006)',
  citation: 'Cooper H, Robinson JC, Patall EA. Does homework improve academic achievement? A synthesis of research, 1987-2003. Rev Educ Res. 2006;76(1):1-62.',
  learningObjectives: [
    'Understand effect sizes in educational research',
    'Perform moderator analysis by grade level',
    'Interpret practical significance vs statistical significance',
    'Create publication-quality forest plots',
  ],
  suggestedAnalyses: [
    '/r meta::metacont(n_homework, mean_hw, sd_hw, n_control, mean_ctrl, sd_ctrl, data=homework, studlab=study, sm="SMD")',
    '/r forest(meta_result, sortvar=year)',
    '/r subgroup <- update(meta_result, subgroup=grade_level)',
    '/r forest(subgroup)',
  ],
};

/**
 * All practice datasets
 */
export const practiceDatasets: PracticeDataset[] = [
  bcgVaccineDataset,
  aspirinStudiesDataset,
  cbtDepressionDataset,
  homeworkEffectDataset,
];

/**
 * Get dataset by ID
 */
export function getDatasetById(id: string): PracticeDataset | undefined {
  return practiceDatasets.find((d) => d.id === id);
}

/**
 * Get datasets by category
 */
export function getDatasetsByCategory(category: PracticeDataset['category']): PracticeDataset[] {
  return practiceDatasets.filter((d) => d.category === category);
}

/**
 * Convert dataset to CSV string
 */
export function datasetToCSV(dataset: PracticeDataset): string {
  const headerRow = dataset.headers.join(',');
  const dataRows = dataset.data.map((row) => row.join(','));
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Get dataset as CSVData format for terminal import
 */
export function datasetToCSVData(dataset: PracticeDataset): {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
} {
  return {
    fileName: `${dataset.id}.csv`,
    headers: dataset.headers,
    rows: dataset.data.map((row) => {
      const record: Record<string, string> = {};
      dataset.headers.forEach((header, index) => {
        record[header] = row[index];
      });
      return record;
    }),
  };
}
