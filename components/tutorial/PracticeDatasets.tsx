/**
 * PracticeDatasets Component
 * Browse and load practice datasets for tutorial exercises
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import {
  practiceDatasets,
  PracticeDataset,
  datasetToCSVData,
} from '@/lib/tutorial/practice-datasets';

interface PracticeDatasetsProps {
  visible: boolean;
  onClose: () => void;
  onLoadDataset: (data: {
    fileName: string;
    headers: string[];
    rows: Record<string, string>[];
  }) => void;
}

export function PracticeDatasets({
  visible,
  onClose,
  onLoadDataset,
}: PracticeDatasetsProps) {
  const [selectedDataset, setSelectedDataset] = useState<PracticeDataset | null>(null);

  const handleLoadDataset = (dataset: PracticeDataset) => {
    const csvData = datasetToCSVData(dataset);
    onLoadDataset(csvData);
    onClose();
  };

  const getCategoryColor = (category: PracticeDataset['category']) => {
    switch (category) {
      case 'medical':
        return '#ef4444';
      case 'psychology':
        return '#8b5cf6';
      case 'education':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  const getCategoryIcon = (category: PracticeDataset['category']) => {
    switch (category) {
      case 'medical':
        return '🏥';
      case 'psychology':
        return '🧠';
      case 'education':
        return '📚';
      default:
        return '📊';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice Datasets</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Load sample datasets to practice meta-analysis techniques
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dataset List */}
          {practiceDatasets.map((dataset) => (
            <Pressable
              key={dataset.id}
              onPress={() => setSelectedDataset(dataset)}
              style={({ pressed }) => [
                styles.datasetCard,
                pressed && styles.datasetCardPressed,
              ]}
            >
              <View style={styles.datasetHeader}>
                <Text style={styles.datasetIcon}>
                  {getCategoryIcon(dataset.category)}
                </Text>
                <View style={styles.datasetInfo}>
                  <Text style={styles.datasetName}>{dataset.name}</Text>
                  <View style={styles.datasetMeta}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(dataset.category) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: getCategoryColor(dataset.category) },
                        ]}
                      >
                        {dataset.category}
                      </Text>
                    </View>
                    <Text style={styles.studyCount}>
                      {dataset.studyCount} studies
                    </Text>
                    <Text style={styles.effectType}>
                      {dataset.effectType}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.datasetDescription} numberOfLines={2}>
                {dataset.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Dataset Detail Modal */}
        {selectedDataset && (
          <Modal
            visible={!!selectedDataset}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedDataset(null)}
          >
            <View style={styles.detailContainer}>
              <View style={styles.detailHeader}>
                <Pressable
                  onPress={() => setSelectedDataset(null)}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>
                <Text style={styles.detailTitle} numberOfLines={1}>
                  {selectedDataset.name}
                </Text>
                <View style={styles.headerSpacer} />
              </View>

              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailContent}
              >
                {/* Category Badge */}
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryIcon}>
                    {getCategoryIcon(selectedDataset.category)}
                  </Text>
                  <View
                    style={[
                      styles.categoryBadgeLarge,
                      { backgroundColor: getCategoryColor(selectedDataset.category) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTextLarge,
                        { color: getCategoryColor(selectedDataset.category) },
                      ]}
                    >
                      {selectedDataset.category}
                    </Text>
                  </View>
                  <Text style={styles.effectTypeLarge}>
                    Effect: {selectedDataset.effectType}
                  </Text>
                </View>

                {/* Description */}
                <Text style={styles.detailDescription}>
                  {selectedDataset.description}
                </Text>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{selectedDataset.studyCount}</Text>
                    <Text style={styles.statLabel}>Studies</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{selectedDataset.headers.length}</Text>
                    <Text style={styles.statLabel}>Variables</Text>
                  </View>
                </View>

                {/* Learning Objectives */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Learning Objectives</Text>
                  {selectedDataset.learningObjectives.map((objective, index) => (
                    <View key={index} style={styles.objectiveRow}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.objectiveText}>{objective}</Text>
                    </View>
                  ))}
                </View>

                {/* Data Preview */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Data Preview</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.tableContainer}>
                      {/* Header Row */}
                      <View style={styles.tableRow}>
                        {selectedDataset.headers.map((header, index) => (
                          <View key={index} style={styles.tableHeaderCell}>
                            <Text style={styles.tableHeaderText}>{header}</Text>
                          </View>
                        ))}
                      </View>
                      {/* Data Rows (first 3) */}
                      {selectedDataset.data.slice(0, 3).map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.tableRow}>
                          {row.map((cell, cellIndex) => (
                            <View key={cellIndex} style={styles.tableCell}>
                              <Text style={styles.tableCellText}>{cell}</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                      {selectedDataset.data.length > 3 && (
                        <View style={styles.tableRow}>
                          <View style={styles.moreRowsCell}>
                            <Text style={styles.moreRowsText}>
                              ... {selectedDataset.data.length - 3} more rows
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>

                {/* Citation */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Citation</Text>
                  <Text style={styles.citationText}>{selectedDataset.citation}</Text>
                </View>

                {/* Suggested Analyses */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Suggested Analyses</Text>
                  {selectedDataset.suggestedAnalyses.map((analysis, index) => (
                    <View key={index} style={styles.codeBlock}>
                      <Text style={styles.codeText}>{analysis}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Load Button */}
              <View style={styles.loadButtonContainer}>
                <Pressable
                  onPress={() => handleLoadDataset(selectedDataset)}
                  style={({ pressed }) => [
                    styles.loadButton,
                    pressed && styles.loadButtonPressed,
                  ]}
                >
                  <Text style={styles.loadButtonText}>Load Dataset</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#94a3b8',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  datasetCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  datasetCardPressed: {
    opacity: 0.8,
  },
  datasetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  datasetIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  datasetInfo: {
    flex: 1,
  },
  datasetName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  datasetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  studyCount: {
    fontSize: 12,
    color: '#64748b',
  },
  effectType: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  datasetDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
  // Detail Modal Styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    padding: 20,
    paddingBottom: 100,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTextLarge: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  effectTypeLarge: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#cbd5e1',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  objectiveRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#0ea5e9',
    marginRight: 8,
    width: 16,
  },
  objectiveText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
  tableContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tableCellText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  moreRowsCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreRowsText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  citationText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94a3b8',
    fontStyle: 'italic',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
  },
  codeBlock: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#22c55e',
  },
  loadButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  loadButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadButtonPressed: {
    opacity: 0.8,
  },
  loadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
