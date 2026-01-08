/**
 * RCodePreview Component
 * 
 * Displays generated R code with syntax highlighting and export options.
 * Features:
 * - Syntax highlighting for R code
 * - Copy to clipboard
 * - Export to file
 * - Section navigation
 * - Analysis type selection
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useColors } from '@/hooks/use-colors';
import {
  generateRCode,
  detectAnalysisType,
  getDefaultEffectMeasure,
  type AnalysisType,
  type EffectMeasure,
  type RCodeOptions,
  type GeneratedRCode,
} from '@/lib/spreadsheet';
import type { SpreadsheetData } from './SpreadsheetEditor';

interface RCodePreviewProps {
  visible: boolean;
  onClose: () => void;
  data: SpreadsheetData;
  onInsertToTerminal?: (code: string) => void;
}

// Analysis type options
const ANALYSIS_TYPES: { id: AnalysisType; label: string; icon: string }[] = [
  { id: 'binary', label: 'Binary (OR/RR)', icon: '🎯' },
  { id: 'continuous', label: 'Continuous (MD/SMD)', icon: '📊' },
  { id: 'proportion', label: 'Proportion', icon: '📈' },
  { id: 'pre_calc', label: 'Pre-calculated', icon: '🔢' },
  { id: 'diagnostic', label: 'Diagnostic', icon: '🔬' },
];

// Effect measure options by analysis type
const EFFECT_MEASURES: Record<AnalysisType, { id: EffectMeasure; label: string }[]> = {
  binary: [
    { id: 'OR', label: 'Odds Ratio (OR)' },
    { id: 'RR', label: 'Risk Ratio (RR)' },
    { id: 'RD', label: 'Risk Difference (RD)' },
  ],
  continuous: [
    { id: 'SMD', label: 'Standardized Mean Difference (SMD)' },
    { id: 'MD', label: 'Mean Difference (MD)' },
    { id: 'ROM', label: 'Ratio of Means (ROM)' },
  ],
  proportion: [
    { id: 'PRAW', label: 'Raw Proportion' },
    { id: 'PLN', label: 'Log Proportion' },
    { id: 'PAS', label: 'Arcsine Proportion' },
  ],
  correlation: [
    { id: 'ZCOR', label: 'Fisher\'s z' },
    { id: 'COR', label: 'Raw Correlation' },
  ],
  pre_calc: [
    { id: 'GEN', label: 'Generic' },
  ],
  diagnostic: [
    { id: 'GEN', label: 'Generic' },
  ],
};

// Method options
const METHODS = [
  { id: 'REML', label: 'REML (Recommended)' },
  { id: 'DL', label: 'DerSimonian-Laird' },
  { id: 'ML', label: 'Maximum Likelihood' },
  { id: 'PM', label: 'Paule-Mandel' },
  { id: 'FE', label: 'Fixed Effect' },
];

export function RCodePreview({
  visible,
  onClose,
  data,
  onInsertToTerminal,
}: RCodePreviewProps) {
  const colors = useColors();
  
  // Detect analysis type from data
  const detectedType = useMemo(() => detectAnalysisType(data.columns), [data.columns]);
  
  // State for options
  const [analysisType, setAnalysisType] = useState<AnalysisType>(detectedType);
  const [effectMeasure, setEffectMeasure] = useState<EffectMeasure>(getDefaultEffectMeasure(detectedType));
  const [method, setMethod] = useState<RCodeOptions['method']>('REML');
  const [includeForestPlot, setIncludeForestPlot] = useState(true);
  const [includeFunnelPlot, setIncludeFunnelPlot] = useState(true);
  const [includeInfluence, setIncludeInfluence] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  // Generate R code
  const generatedCode = useMemo<GeneratedRCode>(() => {
    return generateRCode(data, {
      analysisType,
      effectMeasure,
      method,
      includeForestPlot,
      includeFunnelPlot,
      includeInfluence,
    });
  }, [data, analysisType, effectMeasure, method, includeForestPlot, includeFunnelPlot, includeInfluence]);

  // Copy to clipboard
  const handleCopy = useCallback(async (code?: string) => {
    const textToCopy = code || generatedCode.code;
    await Clipboard.setStringAsync(textToCopy);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  }, [generatedCode.code]);

  // Export to file
  const handleExport = useCallback(async () => {
    try {
      const fileName = `meta_analysis_${Date.now()}.R`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, generatedCode.code);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/plain',
          dialogTitle: 'Export R Code',
        });
      }
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [generatedCode.code]);

  // Insert to terminal
  const handleInsertToTerminal = useCallback(() => {
    onInsertToTerminal?.(generatedCode.code);
    onClose();
  }, [generatedCode.code, onInsertToTerminal, onClose]);

  // Render code with basic syntax highlighting
  const renderCode = (code: string) => {
    const lines = code.split('\n');
    
    return lines.map((line, index) => {
      let style = styles.codeLine;
      let textColor = colors.foreground;
      
      // Comments
      if (line.trim().startsWith('#')) {
        textColor = colors.muted;
      }
      // Strings
      else if (line.includes('"') || line.includes("'")) {
        textColor = colors.success;
      }
      // Functions
      else if (line.includes('(') && !line.trim().startsWith('#')) {
        textColor = colors.primary;
      }
      
      return (
        <Text key={index} style={[style, { color: textColor }]}>
          {line || ' '}
        </Text>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              R Code Generator
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {data.name || 'Untitled'} • {data.rows.length} studies
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>
              Done
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Options Section */}
          <View style={styles.optionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Analysis Options
            </Text>
            
            {/* Analysis Type */}
            <View style={styles.optionGroup}>
              <Text style={[styles.optionLabel, { color: colors.muted }]}>
                Analysis Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionButtons}>
                  {ANALYSIS_TYPES.map((type) => (
                    <Pressable
                      key={type.id}
                      onPress={() => {
                        setAnalysisType(type.id);
                        setEffectMeasure(getDefaultEffectMeasure(type.id));
                      }}
                      style={({ pressed }) => [
                        styles.optionButton,
                        {
                          backgroundColor: analysisType === type.id ? colors.primary : colors.surface,
                          borderColor: analysisType === type.id ? colors.primary : colors.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.optionIcon}>{type.icon}</Text>
                      <Text
                        style={[
                          styles.optionButtonText,
                          { color: analysisType === type.id ? '#fff' : colors.foreground },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Effect Measure */}
            <View style={styles.optionGroup}>
              <Text style={[styles.optionLabel, { color: colors.muted }]}>
                Effect Measure
              </Text>
              <View style={styles.optionButtons}>
                {EFFECT_MEASURES[analysisType]?.map((measure) => (
                  <Pressable
                    key={measure.id}
                    onPress={() => setEffectMeasure(measure.id)}
                    style={({ pressed }) => [
                      styles.smallOptionButton,
                      {
                        backgroundColor: effectMeasure === measure.id ? colors.primary : colors.surface,
                        borderColor: effectMeasure === measure.id ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallOptionButtonText,
                        { color: effectMeasure === measure.id ? '#fff' : colors.foreground },
                      ]}
                    >
                      {measure.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Method */}
            <View style={styles.optionGroup}>
              <Text style={[styles.optionLabel, { color: colors.muted }]}>
                Method
              </Text>
              <View style={styles.optionButtons}>
                {METHODS.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setMethod(m.id as RCodeOptions['method'])}
                    style={({ pressed }) => [
                      styles.smallOptionButton,
                      {
                        backgroundColor: method === m.id ? colors.primary : colors.surface,
                        borderColor: method === m.id ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallOptionButtonText,
                        { color: method === m.id ? '#fff' : colors.foreground },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Include Options */}
            <View style={styles.toggleGroup}>
              <Pressable
                onPress={() => setIncludeForestPlot(!includeForestPlot)}
                style={styles.toggleOption}
              >
                <Text style={[styles.toggleText, { color: colors.foreground }]}>
                  Forest Plot
                </Text>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: includeForestPlot ? colors.success : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      {
                        transform: [{ translateX: includeForestPlot ? 16 : 0 }],
                      },
                    ]}
                  />
                </View>
              </Pressable>

              <Pressable
                onPress={() => setIncludeFunnelPlot(!includeFunnelPlot)}
                style={styles.toggleOption}
              >
                <Text style={[styles.toggleText, { color: colors.foreground }]}>
                  Funnel Plot
                </Text>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: includeFunnelPlot ? colors.success : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      {
                        transform: [{ translateX: includeFunnelPlot ? 16 : 0 }],
                      },
                    ]}
                  />
                </View>
              </Pressable>

              <Pressable
                onPress={() => setIncludeInfluence(!includeInfluence)}
                style={styles.toggleOption}
              >
                <Text style={[styles.toggleText, { color: colors.foreground }]}>
                  Influence Analysis
                </Text>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: includeInfluence ? colors.success : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      {
                        transform: [{ translateX: includeInfluence ? 16 : 0 }],
                      },
                    ]}
                  />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Section Navigation */}
          <View style={styles.sectionsNav}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sectionTabs}>
                <Pressable
                  onPress={() => setActiveSection(null)}
                  style={({ pressed }) => [
                    styles.sectionTab,
                    {
                      backgroundColor: activeSection === null ? colors.primary : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTabText,
                      { color: activeSection === null ? '#fff' : colors.foreground },
                    ]}
                  >
                    Full Code
                  </Text>
                </Pressable>
                {generatedCode.sections.map((section) => (
                  <Pressable
                    key={section.name}
                    onPress={() => setActiveSection(section.name)}
                    style={({ pressed }) => [
                      styles.sectionTab,
                      {
                        backgroundColor: activeSection === section.name ? colors.primary : colors.surface,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTabText,
                        { color: activeSection === section.name ? '#fff' : colors.foreground },
                      ]}
                    >
                      {section.name.charAt(0).toUpperCase() + section.name.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Code Preview */}
          <View style={[styles.codeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.codeTitle, { color: colors.muted }]}>
                {activeSection
                  ? generatedCode.sections.find((s) => s.name === activeSection)?.description
                  : 'Complete R Script'}
              </Text>
              <Pressable
                onPress={() => {
                  const code = activeSection
                    ? generatedCode.sections.find((s) => s.name === activeSection)?.code
                    : undefined;
                  handleCopy(code);
                }}
                style={({ pressed }) => [
                  styles.copyButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.copyButtonText}>
                  {copyStatus === 'copied' ? '✓ Copied' : 'Copy'}
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.codeScroll}
            >
              <View style={styles.codeContent}>
                {renderCode(
                  activeSection
                    ? generatedCode.sections.find((s) => s.name === activeSection)?.code || ''
                    : generatedCode.code
                )}
              </View>
            </ScrollView>
          </View>

          {/* Warnings */}
          {generatedCode.warnings.length > 0 && (
            <View style={[styles.warningsContainer, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Text style={[styles.warningsTitle, { color: colors.warning }]}>
                ⚠️ Warnings
              </Text>
              {generatedCode.warnings.map((warning, index) => (
                <Text key={index} style={[styles.warningText, { color: colors.foreground }]}>
                  • {warning}
                </Text>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => handleCopy()}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Copy All
              </Text>
            </Pressable>

            <Pressable
              onPress={handleExport}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Export .R
              </Text>
            </Pressable>

            {onInsertToTerminal && (
              <Pressable
                onPress={handleInsertToTerminal}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.actionIcon}>⌨️</Text>
                <Text style={[styles.actionText, { color: '#fff' }]}>
                  Run in Terminal
                </Text>
              </Pressable>
            )}
          </View>

          {/* Glass Tip */}
          <View style={[styles.tipContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.tipIcon}>🦊</Text>
            <Text style={[styles.tipText, { color: colors.muted }]}>
              Tip: You can copy individual sections or the full script. The code is ready to run in RStudio or any R environment with the metafor package installed.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  optionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionGroup: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  smallOptionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  smallOptionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  toggleGroup: {
    gap: 12,
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  sectionsNav: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  codeContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  codeTitle: {
    fontSize: 12,
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  codeScroll: {
    maxHeight: 300,
  },
  codeContent: {
    padding: 12,
    minWidth: '100%',
  },
  codeLine: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 12,
    lineHeight: 18,
  },
  warningsContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default RCodePreview;
