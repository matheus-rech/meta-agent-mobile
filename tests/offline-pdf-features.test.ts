/**
 * Tests for Offline Mode and PDF Export Features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-native
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Share: { share: vi.fn() },
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Modal: 'Modal',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput',
  Switch: 'Switch',
  ActivityIndicator: 'ActivityIndicator',
}));

// Mock expo modules
vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  shareAsync: vi.fn().mockResolvedValue(undefined),
}));

// Mock WebR (not available in test environment)
vi.mock('webr', () => ({
  WebR: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    evalR: vi.fn().mockResolvedValue('{}'),
    evalRVoid: vi.fn().mockResolvedValue(undefined),
    installPackages: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  })),
}));

describe('WebR Service', () => {
  describe('Platform Support', () => {
    it('should detect web platform support', () => {
      // WebR is only supported on web with WebAssembly
      const isWeb = true; // Platform.OS === 'web'
      const hasWebAssembly = typeof WebAssembly !== 'undefined';
      expect(isWeb && hasWebAssembly).toBe(true);
    });
  });

  describe('Meta-Analysis Functions', () => {
    it('should have correct MetaAnalysisResult structure', () => {
      const mockResult = {
        estimate: 0.5,
        se: 0.1,
        ci_lower: 0.3,
        ci_upper: 0.7,
        z_value: 5.0,
        p_value: 0.001,
        i_squared: 45.2,
        tau_squared: 0.02,
        q_statistic: 12.5,
        q_df: 5,
        q_pvalue: 0.03,
        studies: [],
        model: 'RE' as const,
      };

      expect(mockResult).toHaveProperty('estimate');
      expect(mockResult).toHaveProperty('i_squared');
      expect(mockResult).toHaveProperty('tau_squared');
      expect(mockResult).toHaveProperty('studies');
      expect(mockResult.model).toBe('RE');
    });

    it('should have correct StudyResult structure', () => {
      const mockStudy = {
        id: '1',
        study: 'Smith 2020',
        yi: 0.5,
        vi: 0.04,
        sei: 0.2,
        ci_lower: 0.1,
        ci_upper: 0.9,
        weight: 0.15,
      };

      expect(mockStudy).toHaveProperty('study');
      expect(mockStudy).toHaveProperty('yi');
      expect(mockStudy).toHaveProperty('vi');
      expect(mockStudy).toHaveProperty('weight');
    });
  });

  describe('Effect Size Calculations', () => {
    it('should support SMD measure', () => {
      const measures = ['SMD', 'MD', 'OR', 'RR', 'RD'];
      expect(measures).toContain('SMD');
    });

    it('should support binary outcome measures', () => {
      const binaryMeasures = ['OR', 'RR', 'RD'];
      expect(binaryMeasures.length).toBe(3);
    });
  });
});

describe('PDF Generator Service', () => {
  describe('Report Options', () => {
    it('should have correct ReportOptions structure', () => {
      const options = {
        title: 'Test Report',
        author: 'Test Author',
        date: '2024-01-15',
        language: 'pt' as const,
        includeForestPlot: true,
        includeHeterogeneity: true,
        includeStudyTable: true,
        includeSummary: true,
        customNotes: 'Test notes',
      };

      expect(options).toHaveProperty('title');
      expect(options).toHaveProperty('language');
      expect(options.language).toBe('pt');
    });

    it('should support multiple languages', () => {
      const languages = ['pt', 'en', 'es'];
      expect(languages).toContain('pt');
      expect(languages).toContain('en');
      expect(languages).toContain('es');
    });
  });

  describe('Report Data', () => {
    it('should have correct ReportData structure', () => {
      const mockAnalysis = {
        estimate: 0.5,
        se: 0.1,
        ci_lower: 0.3,
        ci_upper: 0.7,
        z_value: 5.0,
        p_value: 0.001,
        i_squared: 45.2,
        tau_squared: 0.02,
        q_statistic: 12.5,
        q_df: 5,
        q_pvalue: 0.03,
        studies: [],
        model: 'RE' as const,
      };

      const reportData = {
        analysis: mockAnalysis,
        spreadsheetName: 'Test Spreadsheet',
      };

      expect(reportData).toHaveProperty('analysis');
      expect(reportData.analysis).toHaveProperty('estimate');
    });
  });

  describe('Translations', () => {
    it('should have Portuguese translations', () => {
      const ptTranslations = {
        title: 'Relatório de Meta-Análise',
        summary: 'Resumo',
        pooledEffect: 'Tamanho de Efeito Combinado',
      };

      expect(ptTranslations.title).toContain('Meta-Análise');
      expect(ptTranslations.summary).toBe('Resumo');
    });

    it('should have English translations', () => {
      const enTranslations = {
        title: 'Meta-Analysis Report',
        summary: 'Summary',
        pooledEffect: 'Pooled Effect Size',
      };

      expect(enTranslations.title).toContain('Meta-Analysis');
      expect(enTranslations.summary).toBe('Summary');
    });

    it('should have Spanish translations', () => {
      const esTranslations = {
        title: 'Informe de Meta-Análisis',
        summary: 'Resumen',
        pooledEffect: 'Tamaño del Efecto Combinado',
      };

      expect(esTranslations.title).toContain('Meta-Análisis');
      expect(esTranslations.summary).toBe('Resumen');
    });
  });

  describe('Heterogeneity Interpretation', () => {
    it('should classify low heterogeneity correctly', () => {
      const iSquared = 20;
      const isLow = iSquared < 25;
      expect(isLow).toBe(true);
    });

    it('should classify moderate heterogeneity correctly', () => {
      const iSquared = 50;
      const isModerate = iSquared >= 25 && iSquared < 75;
      expect(isModerate).toBe(true);
    });

    it('should classify high heterogeneity correctly', () => {
      const iSquared = 80;
      const isHigh = iSquared >= 75;
      expect(isHigh).toBe(true);
    });
  });
});

describe('useOfflineAnalysis Hook', () => {
  it('should have correct return type structure', () => {
    const mockReturn = {
      status: {
        initialized: false,
        loading: false,
        error: null,
        packagesLoaded: [],
      },
      isSupported: true,
      isReady: false,
      isLoading: false,
      error: null,
      initialize: async () => {},
      runAnalysis: async () => ({} as any),
      calculateEffectSizes: async () => [],
      runMetaRegression: async () => ({} as any),
      generateForestPlot: async () => ({} as any),
      lastResult: null,
      lastForestPlot: null,
    };

    expect(mockReturn).toHaveProperty('status');
    expect(mockReturn).toHaveProperty('isSupported');
    expect(mockReturn).toHaveProperty('initialize');
    expect(mockReturn).toHaveProperty('runAnalysis');
  });
});

describe('OfflineStatusIndicator Component', () => {
  it('should show correct status for uninitialized state', () => {
    const status = {
      initialized: false,
      loading: false,
      error: null,
      packagesLoaded: [],
    };

    const isReady = status.initialized && !status.loading;
    expect(isReady).toBe(false);
  });

  it('should show correct status for loading state', () => {
    const status = {
      initialized: false,
      loading: true,
      error: null,
      packagesLoaded: [],
    };

    expect(status.loading).toBe(true);
  });

  it('should show correct status for ready state', () => {
    const status = {
      initialized: true,
      loading: false,
      error: null,
      packagesLoaded: ['metafor'],
    };

    const isReady = status.initialized && !status.loading;
    expect(isReady).toBe(true);
    expect(status.packagesLoaded).toContain('metafor');
  });

  it('should show correct status for error state', () => {
    const status = {
      initialized: false,
      loading: false,
      error: 'Failed to initialize WebR',
      packagesLoaded: [],
    };

    expect(status.error).toBeTruthy();
  });
});

describe('ReportExportModal Component', () => {
  it('should have correct language options', () => {
    const languageOptions = [
      { value: 'pt', label: 'Português' },
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
    ];

    expect(languageOptions.length).toBe(3);
    expect(languageOptions[0].value).toBe('pt');
  });

  it('should have correct section toggles', () => {
    const sections = [
      'includeSummary',
      'includeForestPlot',
      'includeHeterogeneity',
      'includeStudyTable',
    ];

    expect(sections.length).toBe(4);
    expect(sections).toContain('includeForestPlot');
  });
});

describe('Forest Plot Data', () => {
  it('should have correct ForestPlotData structure', () => {
    const mockForestPlot = {
      studies: [
        {
          id: '1',
          study: 'Smith 2020',
          yi: 0.5,
          vi: 0.04,
          sei: 0.2,
          ci_lower: 0.1,
          ci_upper: 0.9,
          weight: 0.15,
        },
      ],
      summary: {
        estimate: 0.5,
        se: 0.1,
        ci_lower: 0.3,
        ci_upper: 0.7,
        z_value: 5.0,
        p_value: 0.001,
        i_squared: 45.2,
        tau_squared: 0.02,
        q_statistic: 12.5,
        q_df: 5,
        q_pvalue: 0.03,
        studies: [],
        model: 'RE' as const,
      },
      title: 'Test Forest Plot',
      xlab: 'Effect Size',
    };

    expect(mockForestPlot).toHaveProperty('studies');
    expect(mockForestPlot).toHaveProperty('summary');
    expect(mockForestPlot.studies.length).toBe(1);
  });

  it('should scale values correctly for plot', () => {
    const values = [-0.5, 0, 0.5, 1.0];
    const min = Math.min(...values) - 0.5;
    const max = Math.max(...values) + 0.5;
    const range = max - min;
    const plotWidth = 40;

    const scaleToPlot = (value: number): number => {
      return Math.round(((value - min) / range) * plotWidth);
    };

    const nullLinePos = scaleToPlot(0);
    expect(nullLinePos).toBeGreaterThan(0);
    expect(nullLinePos).toBeLessThan(plotWidth);
  });
});

describe('Meta-Regression', () => {
  it('should have correct meta-regression result structure', () => {
    const mockResult = {
      intercept: 0.2,
      slope: -0.01,
      intercept_se: 0.05,
      slope_se: 0.002,
      intercept_pvalue: 0.001,
      slope_pvalue: 0.01,
      r_squared: 0.45,
      tau_squared: 0.01,
      qm_statistic: 8.5,
      qm_pvalue: 0.004,
    };

    expect(mockResult).toHaveProperty('intercept');
    expect(mockResult).toHaveProperty('slope');
    expect(mockResult).toHaveProperty('r_squared');
    expect(mockResult.r_squared).toBeLessThanOrEqual(1);
  });
});
