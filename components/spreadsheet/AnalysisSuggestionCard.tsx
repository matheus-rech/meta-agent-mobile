/**
 * AnalysisSuggestionCard
 * 
 * Displays orchestrator detection results and analysis suggestions
 * in a compact, actionable card format within the spreadsheet view.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { 
  DataType,
  type DataTypeResult, 
  type AnalysisSuggestion,
} from '@/lib/glass/orchestrator/types';

interface AnalysisSuggestionCardProps {
  /** Detection result from orchestrator */
  detection: DataTypeResult | null;
  /** Analysis suggestion from orchestrator */
  suggestion: AnalysisSuggestion | null;
  /** Whether detection is in progress */
  isLoading?: boolean;
  /** Callback when user wants to run analysis */
  onRunAnalysis?: () => void;
  /** Callback when user wants to generate R code */
  onGenerateCode?: () => void;
  /** Callback when user wants to see explanation */
  onExplain?: () => void;
  /** Whether the card is collapsed */
  collapsed?: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse?: () => void;
}

const DATA_TYPE_INFO: Record<DataType, { icon: string; label: string; color: string }> = {
  [DataType.BINARY]: { icon: '🎯', label: 'Binary Outcomes', color: '#22C55E' },
  [DataType.CONTINUOUS]: { icon: '📊', label: 'Continuous Outcomes', color: '#3B82F6' },
  [DataType.PRECALCULATED]: { icon: '📈', label: 'Pre-calculated Effects', color: '#8B5CF6' },
  [DataType.DIAGNOSTIC]: { icon: '🔬', label: 'Diagnostic Accuracy', color: '#F59E0B' },
  [DataType.CORRELATION]: { icon: '🔗', label: 'Correlation Data', color: '#EC4899' },
  [DataType.HAZARD_RATIO]: { icon: '⏱️', label: 'Time-to-Event (HR)', color: '#EF4444' },
  [DataType.UNKNOWN]: { icon: '❓', label: 'Unknown Data Type', color: '#6B7280' },
};

export function AnalysisSuggestionCard({
  detection,
  suggestion,
  isLoading = false,
  onRunAnalysis,
  onGenerateCode,
  onExplain,
  collapsed = false,
  onToggleCollapse,
}: AnalysisSuggestionCardProps) {
  const colors = useColors();

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Analyzing your data...
          </Text>
        </View>
      </View>
    );
  }

  // No detection yet
  if (!detection) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyIcon]}>📋</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Add data to get analysis suggestions
          </Text>
        </View>
      </View>
    );
  }

  const typeInfo = DATA_TYPE_INFO[detection.type] || DATA_TYPE_INFO[DataType.UNKNOWN];
  const confidencePercent = Math.round(detection.confidence * 100);

  // Collapsed view
  if (collapsed) {
    return (
      <TouchableOpacity
        style={[styles.containerCollapsed, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onToggleCollapse}
        activeOpacity={0.7}
      >
        <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
        <Text style={[styles.collapsedLabel, { color: colors.foreground }]}>
          {typeInfo.label}
        </Text>
        <View style={[styles.confidenceBadge, { backgroundColor: typeInfo.color + '20' }]}>
          <Text style={[styles.confidenceText, { color: typeInfo.color }]}>
            {confidencePercent}%
          </Text>
        </View>
        <Text style={[styles.expandIcon, { color: colors.muted }]}>▼</Text>
      </TouchableOpacity>
    );
  }

  // Expanded view
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={onToggleCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
          <View>
            <Text style={[styles.typeLabel, { color: colors.foreground }]}>
              {typeInfo.label}
            </Text>
            <Text style={[styles.studyCount, { color: colors.muted }]}>
              {detection.completeRows} of {detection.totalRows} studies
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.confidenceBadge, { backgroundColor: typeInfo.color + '20' }]}>
            <Text style={[styles.confidenceText, { color: typeInfo.color }]}>
              {confidencePercent}% confident
            </Text>
          </View>
          <Text style={[styles.collapseIcon, { color: colors.muted }]}>▲</Text>
        </View>
      </TouchableOpacity>

      {/* Warnings */}
      {detection.warnings && detection.warnings.length > 0 && (
        <View style={[styles.warningsContainer, { backgroundColor: colors.warning + '15' }]}>
          {detection.warnings.map((warning, index) => (
            <Text key={index} style={[styles.warningText, { color: colors.warning }]}>
              ⚠️ {warning}
            </Text>
          ))}
        </View>
      )}

      {/* Suggestion */}
      {suggestion && (
        <View style={styles.suggestionContainer}>
          <Text style={[styles.suggestionTitle, { color: colors.foreground }]}>
            Recommended Analysis
          </Text>
          
          <View style={styles.suggestionRow}>
            <View style={styles.suggestionItem}>
              <Text style={[styles.suggestionLabel, { color: colors.muted }]}>Effect Measure</Text>
              <Text style={[styles.suggestionValue, { color: colors.foreground }]}>
                {suggestion.defaultMeasure}
              </Text>
            </View>
            <View style={styles.suggestionItem}>
              <Text style={[styles.suggestionLabel, { color: colors.muted }]}>Model</Text>
              <Text style={[styles.suggestionValue, { color: colors.foreground }]}>
                {suggestion.model.type === 'random' ? 'Random Effects' : 'Fixed Effect'}
              </Text>
            </View>
          </View>

          {suggestion.analyses && suggestion.analyses.length > 0 && (
            <View style={styles.testsRow}>
              <Text style={[styles.testsLabel, { color: colors.muted }]}>
                Includes: {suggestion.analyses.filter(a => a.required).map(a => a.name).join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onRunAnalysis}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>▶ Run Analysis</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={onGenerateCode}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
            {'<>'} Code
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={onExplain}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
            ? Help
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  containerCollapsed: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  emptyIcon: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  studyCount: {
    fontSize: 12,
    marginTop: 2,
  },
  collapsedLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  collapseIcon: {
    fontSize: 12,
  },
  expandIcon: {
    fontSize: 12,
  },
  warningsContainer: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  warningText: {
    fontSize: 12,
  },
  suggestionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  suggestionItem: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  testsRow: {
    marginTop: 8,
  },
  testsLabel: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  primaryButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default AnalysisSuggestionCard;
