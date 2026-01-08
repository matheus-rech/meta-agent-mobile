/**
 * DigitizedDataImporter Component
 * 
 * Imports digitized data points into the spreadsheet editor.
 * Supports mapping X/Y values to effect size and standard error.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useColors } from '../../hooks/use-colors';

interface DataPoint {
  x: number;
  y: number;
}

interface MappingConfig {
  xAxis: 'effect_size' | 'se' | 'sample_size' | 'year' | 'ignore';
  yAxis: 'effect_size' | 'se' | 'sample_size' | 'year' | 'ignore';
  effectType: 'OR' | 'RR' | 'HR' | 'SMD' | 'MD' | 'other';
  isLogScale: boolean;
}

interface DigitizedDataImporterProps {
  visible: boolean;
  data: DataPoint[];
  onClose: () => void;
  onImport: (studies: Array<{
    study_id: string;
    effect_size: number;
    se?: number;
    sample_size?: number;
    year?: number;
  }>) => void;
}

const AXIS_OPTIONS = [
  { value: 'effect_size', label: 'Effect Size' },
  { value: 'se', label: 'Standard Error' },
  { value: 'sample_size', label: 'Sample Size' },
  { value: 'year', label: 'Year' },
  { value: 'ignore', label: 'Ignore' },
] as const;

const EFFECT_TYPES = [
  { value: 'OR', label: 'Odds Ratio (OR)' },
  { value: 'RR', label: 'Risk Ratio (RR)' },
  { value: 'HR', label: 'Hazard Ratio (HR)' },
  { value: 'SMD', label: 'Standardized Mean Diff (SMD)' },
  { value: 'MD', label: 'Mean Difference (MD)' },
  { value: 'other', label: 'Other' },
] as const;

export function DigitizedDataImporter({
  visible,
  data,
  onClose,
  onImport,
}: DigitizedDataImporterProps) {
  const colors = useColors();
  
  const [mapping, setMapping] = useState<MappingConfig>({
    xAxis: 'effect_size',
    yAxis: 'se',
    effectType: 'SMD',
    isLogScale: false,
  });
  
  const handleImport = useCallback(() => {
    const studies = data.map((point, index) => {
      const study: {
        study_id: string;
        effect_size: number;
        se?: number;
        sample_size?: number;
        year?: number;
      } = {
        study_id: `Digitized_${index + 1}`,
        effect_size: 0,
      };
      
      // Map X axis
      let xValue = point.x;
      if (mapping.isLogScale && mapping.xAxis === 'effect_size') {
        xValue = Math.exp(xValue);
      }
      
      if (mapping.xAxis === 'effect_size') {
        study.effect_size = xValue;
      } else if (mapping.xAxis === 'se') {
        study.se = xValue;
      } else if (mapping.xAxis === 'sample_size') {
        study.sample_size = Math.round(xValue);
      } else if (mapping.xAxis === 'year') {
        study.year = Math.round(xValue);
      }
      
      // Map Y axis
      let yValue = point.y;
      if (mapping.isLogScale && mapping.yAxis === 'effect_size') {
        yValue = Math.exp(yValue);
      }
      
      if (mapping.yAxis === 'effect_size') {
        study.effect_size = yValue;
      } else if (mapping.yAxis === 'se') {
        study.se = yValue;
      } else if (mapping.yAxis === 'sample_size') {
        study.sample_size = Math.round(yValue);
      } else if (mapping.yAxis === 'year') {
        study.year = Math.round(yValue);
      }
      
      return study;
    });
    
    onImport(studies);
    onClose();
  }, [data, mapping, onImport, onClose]);
  
  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 12,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    optionTextSelected: {
      color: colors.background,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    checkmark: {
      color: colors.background,
      fontSize: 12,
      fontWeight: 'bold',
    },
    previewSection: {
      marginTop: 16,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 8,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    previewTable: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      maxHeight: 200,
    },
    previewHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 8,
      marginBottom: 8,
    },
    previewHeaderCell: {
      flex: 1,
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    previewRow: {
      flexDirection: 'row',
      paddingVertical: 4,
    },
    previewCell: {
      flex: 1,
      fontSize: 11,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.foreground,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    importButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    importButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    dataCount: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 16,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  });
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.container}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>📊 Import Digitized Data</Text>
            <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
              <Text style={dynamicStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={dynamicStyles.content}>
            <Text style={dynamicStyles.dataCount}>
              {data.length} data points to import
            </Text>
            
            {/* X-Axis Mapping */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>X-Axis represents:</Text>
              <View style={dynamicStyles.optionRow}>
                {AXIS_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      dynamicStyles.optionButton,
                      mapping.xAxis === option.value && dynamicStyles.optionButtonSelected,
                    ]}
                    onPress={() => setMapping(prev => ({ ...prev, xAxis: option.value }))}
                  >
                    <Text style={[
                      dynamicStyles.optionText,
                      mapping.xAxis === option.value && dynamicStyles.optionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Y-Axis Mapping */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Y-Axis represents:</Text>
              <View style={dynamicStyles.optionRow}>
                {AXIS_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      dynamicStyles.optionButton,
                      mapping.yAxis === option.value && dynamicStyles.optionButtonSelected,
                    ]}
                    onPress={() => setMapping(prev => ({ ...prev, yAxis: option.value }))}
                  >
                    <Text style={[
                      dynamicStyles.optionText,
                      mapping.yAxis === option.value && dynamicStyles.optionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Effect Type */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Effect Type:</Text>
              <View style={dynamicStyles.optionRow}>
                {EFFECT_TYPES.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      dynamicStyles.optionButton,
                      mapping.effectType === option.value && dynamicStyles.optionButtonSelected,
                    ]}
                    onPress={() => setMapping(prev => ({ ...prev, effectType: option.value }))}
                  >
                    <Text style={[
                      dynamicStyles.optionText,
                      mapping.effectType === option.value && dynamicStyles.optionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Log Scale Checkbox */}
              <TouchableOpacity
                style={dynamicStyles.checkboxRow}
                onPress={() => setMapping(prev => ({ ...prev, isLogScale: !prev.isLogScale }))}
              >
                <View style={[
                  dynamicStyles.checkbox,
                  mapping.isLogScale && dynamicStyles.checkboxChecked,
                ]}>
                  {mapping.isLogScale && <Text style={dynamicStyles.checkmark}>✓</Text>}
                </View>
                <Text style={dynamicStyles.checkboxText}>
                  Effect sizes are on log scale (for OR, RR, HR)
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Data Preview */}
            <View style={dynamicStyles.previewSection}>
              <Text style={dynamicStyles.previewTitle}>Preview (first 5 rows):</Text>
              <ScrollView style={dynamicStyles.previewTable}>
                <View style={dynamicStyles.previewHeader}>
                  <Text style={dynamicStyles.previewHeaderCell}>Study</Text>
                  <Text style={dynamicStyles.previewHeaderCell}>Effect</Text>
                  <Text style={dynamicStyles.previewHeaderCell}>SE</Text>
                </View>
                {data.slice(0, 5).map((point, index) => {
                  let effect = mapping.xAxis === 'effect_size' ? point.x : 
                               mapping.yAxis === 'effect_size' ? point.y : 0;
                  let se = mapping.xAxis === 'se' ? point.x :
                           mapping.yAxis === 'se' ? point.y : undefined;
                  
                  if (mapping.isLogScale && (mapping.xAxis === 'effect_size' || mapping.yAxis === 'effect_size')) {
                    effect = Math.exp(effect);
                  }
                  
                  return (
                    <View key={index} style={dynamicStyles.previewRow}>
                      <Text style={dynamicStyles.previewCell}>Digitized_{index + 1}</Text>
                      <Text style={dynamicStyles.previewCell}>{effect.toFixed(3)}</Text>
                      <Text style={dynamicStyles.previewCell}>{se?.toFixed(3) ?? '-'}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>
          
          {/* Footer */}
          <View style={dynamicStyles.footer}>
            <TouchableOpacity style={dynamicStyles.cancelButton} onPress={onClose}>
              <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.importButton} onPress={handleImport}>
              <Text style={dynamicStyles.importButtonText}>
                Import {data.length} Studies
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default DigitizedDataImporter;
