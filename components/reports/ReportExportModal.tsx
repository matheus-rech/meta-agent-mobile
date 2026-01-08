/**
 * ReportExportModal Component
 * 
 * Modal for configuring and exporting meta-analysis reports as PDF.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useColors } from '../../hooks/use-colors';
import type { MetaAnalysisResult, ForestPlotData } from '../../lib/webr';
import { generateReport, type ReportOptions, type ReportData } from '../../lib/reports';

interface ReportExportModalProps {
  visible: boolean;
  onClose: () => void;
  analysisResult: MetaAnalysisResult | null;
  forestPlotData?: ForestPlotData;
  spreadsheetName?: string;
}

type Language = 'pt' | 'en' | 'es';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

export function ReportExportModal({
  visible,
  onClose,
  analysisResult,
  forestPlotData,
  spreadsheetName,
}: ReportExportModalProps) {
  const colors = useColors();
  
  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState<Language>('pt');
  const [includeForestPlot, setIncludeForestPlot] = useState(true);
  const [includeHeterogeneity, setIncludeHeterogeneity] = useState(true);
  const [includeStudyTable, setIncludeStudyTable] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  const handleExport = useCallback(async () => {
    if (!analysisResult) {
      setExportError('No analysis results to export');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      const reportData: ReportData = {
        analysis: analysisResult,
        forestPlot: forestPlotData,
        spreadsheetName,
      };
      
      const options: ReportOptions = {
        title: title || (language === 'pt' ? 'Relatório de Meta-Análise' : 
                        language === 'es' ? 'Informe de Meta-Análisis' : 
                        'Meta-Analysis Report'),
        author: author || undefined,
        language,
        includeForestPlot,
        includeHeterogeneity,
        includeStudyTable,
        includeSummary,
        customNotes: customNotes || undefined,
      };
      
      await generateReport(reportData, options);
      onClose();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [
    analysisResult,
    forestPlotData,
    spreadsheetName,
    title,
    author,
    language,
    includeForestPlot,
    includeHeterogeneity,
    includeStudyTable,
    includeSummary,
    customNotes,
    onClose,
  ]);
  
  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      width: Platform.OS === 'web' ? 500 : '90%',
      maxHeight: '85%',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: colors.muted,
      fontSize: 20,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 10,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.foreground,
      fontSize: 14,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    languageRow: {
      flexDirection: 'row',
      gap: 8,
    },
    languageButton: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    languageButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    languageButtonInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    languageButtonText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    languageButtonTextActive: {
      color: colors.background,
    },
    languageButtonTextInactive: {
      color: colors.foreground,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    switchLabel: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    exportButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    exportButtonDisabled: {
      opacity: 0.6,
    },
    exportButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    noDataText: {
      color: colors.muted,
      fontSize: 14,
      textAlign: 'center',
      padding: 20,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  });
  
  const translations = {
    pt: {
      title: '📄 Exportar Relatório',
      reportTitle: 'Título do Relatório',
      author: 'Autor (opcional)',
      language: 'Idioma',
      sections: 'Seções do Relatório',
      summary: 'Resumo dos Resultados',
      forestPlot: 'Forest Plot',
      heterogeneity: 'Estatísticas de Heterogeneidade',
      studyTable: 'Tabela de Estudos',
      notes: 'Notas Adicionais',
      notesPlaceholder: 'Adicione observações ou interpretações...',
      export: 'Exportar PDF',
      exporting: 'Exportando...',
      noData: 'Nenhum resultado de análise disponível para exportar.',
    },
    en: {
      title: '📄 Export Report',
      reportTitle: 'Report Title',
      author: 'Author (optional)',
      language: 'Language',
      sections: 'Report Sections',
      summary: 'Results Summary',
      forestPlot: 'Forest Plot',
      heterogeneity: 'Heterogeneity Statistics',
      studyTable: 'Study Table',
      notes: 'Additional Notes',
      notesPlaceholder: 'Add observations or interpretations...',
      export: 'Export PDF',
      exporting: 'Exporting...',
      noData: 'No analysis results available to export.',
    },
    es: {
      title: '📄 Exportar Informe',
      reportTitle: 'Título del Informe',
      author: 'Autor (opcional)',
      language: 'Idioma',
      sections: 'Secciones del Informe',
      summary: 'Resumen de Resultados',
      forestPlot: 'Forest Plot',
      heterogeneity: 'Estadísticas de Heterogeneidad',
      studyTable: 'Tabla de Estudios',
      notes: 'Notas Adicionales',
      notesPlaceholder: 'Agregue observaciones o interpretaciones...',
      export: 'Exportar PDF',
      exporting: 'Exportando...',
      noData: 'No hay resultados de análisis disponibles para exportar.',
    },
  };
  
  const t = translations[language];
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.modalContent}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>{t.title}</Text>
            <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
              <Text style={dynamicStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {!analysisResult ? (
            <Text style={dynamicStyles.noDataText}>{t.noData}</Text>
          ) : (
            <>
              <ScrollView style={dynamicStyles.scrollContent}>
                {/* Title Input */}
                <View style={dynamicStyles.section}>
                  <Text style={dynamicStyles.sectionTitle}>{t.reportTitle}</Text>
                  <TextInput
                    style={dynamicStyles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={language === 'pt' ? 'Relatório de Meta-Análise' : 
                                language === 'es' ? 'Informe de Meta-Análisis' : 
                                'Meta-Analysis Report'}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                {/* Author Input */}
                <View style={dynamicStyles.section}>
                  <Text style={dynamicStyles.sectionTitle}>{t.author}</Text>
                  <TextInput
                    style={dynamicStyles.input}
                    value={author}
                    onChangeText={setAuthor}
                    placeholder="John Doe"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                
                {/* Language Selection */}
                <View style={dynamicStyles.section}>
                  <Text style={dynamicStyles.sectionTitle}>{t.language}</Text>
                  <View style={dynamicStyles.languageRow}>
                    {LANGUAGE_OPTIONS.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          dynamicStyles.languageButton,
                          language === option.value
                            ? dynamicStyles.languageButtonActive
                            : dynamicStyles.languageButtonInactive,
                        ]}
                        onPress={() => setLanguage(option.value)}
                      >
                        <Text
                          style={[
                            dynamicStyles.languageButtonText,
                            language === option.value
                              ? dynamicStyles.languageButtonTextActive
                              : dynamicStyles.languageButtonTextInactive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Section Toggles */}
                <View style={dynamicStyles.section}>
                  <Text style={dynamicStyles.sectionTitle}>{t.sections}</Text>
                  
                  <View style={dynamicStyles.switchRow}>
                    <Text style={dynamicStyles.switchLabel}>{t.summary}</Text>
                    <Switch
                      value={includeSummary}
                      onValueChange={setIncludeSummary}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.background}
                    />
                  </View>
                  
                  <View style={dynamicStyles.switchRow}>
                    <Text style={dynamicStyles.switchLabel}>{t.forestPlot}</Text>
                    <Switch
                      value={includeForestPlot}
                      onValueChange={setIncludeForestPlot}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.background}
                    />
                  </View>
                  
                  <View style={dynamicStyles.switchRow}>
                    <Text style={dynamicStyles.switchLabel}>{t.heterogeneity}</Text>
                    <Switch
                      value={includeHeterogeneity}
                      onValueChange={setIncludeHeterogeneity}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.background}
                    />
                  </View>
                  
                  <View style={dynamicStyles.switchRow}>
                    <Text style={dynamicStyles.switchLabel}>{t.studyTable}</Text>
                    <Switch
                      value={includeStudyTable}
                      onValueChange={setIncludeStudyTable}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.background}
                    />
                  </View>
                </View>
                
                {/* Custom Notes */}
                <View style={dynamicStyles.section}>
                  <Text style={dynamicStyles.sectionTitle}>{t.notes}</Text>
                  <TextInput
                    style={[dynamicStyles.input, dynamicStyles.textArea]}
                    value={customNotes}
                    onChangeText={setCustomNotes}
                    placeholder={t.notesPlaceholder}
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </ScrollView>
              
              {/* Footer */}
              <View style={dynamicStyles.footer}>
                {exportError && (
                  <Text style={dynamicStyles.errorText}>{exportError}</Text>
                )}
                
                <TouchableOpacity
                  style={[
                    dynamicStyles.exportButton,
                    isExporting && dynamicStyles.exportButtonDisabled,
                  ]}
                  onPress={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <ActivityIndicator size="small" color={colors.background} />
                      <Text style={dynamicStyles.exportButtonText}>{t.exporting}</Text>
                    </>
                  ) : (
                    <Text style={dynamicStyles.exportButtonText}>{t.export}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default ReportExportModal;
