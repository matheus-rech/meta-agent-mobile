/**
 * SpreadsheetEditor - In-app spreadsheet for meta-analysis data entry
 * 
 * Allows users to create and edit study data directly in the app,
 * reducing procrastination by making data entry accessible.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { BOX } from "@/constants/ascii-art";
import {
  validateSpreadsheet,
  validateCell,
  getValidationColor,
  type ValidationResult,
  type ValidationError,
} from "@/lib/spreadsheet";
import { PlotDigitizer, DigitizedDataImporter } from "@/components/digitizer";

// Default columns for meta-analysis data
export const META_ANALYSIS_COLUMNS = [
  { key: "study", label: "Study", type: "text" as const, width: 120 },
  { key: "year", label: "Year", type: "number" as const, width: 60 },
  { key: "n_treatment", label: "n (Tx)", type: "number" as const, width: 60 },
  { key: "n_control", label: "n (Ctrl)", type: "number" as const, width: 60 },
  { key: "events_treatment", label: "Events (Tx)", type: "number" as const, width: 80 },
  { key: "events_control", label: "Events (Ctrl)", type: "number" as const, width: 80 },
  { key: "mean_treatment", label: "Mean (Tx)", type: "number" as const, width: 80 },
  { key: "mean_control", label: "Mean (Ctrl)", type: "number" as const, width: 80 },
  { key: "sd_treatment", label: "SD (Tx)", type: "number" as const, width: 70 },
  { key: "sd_control", label: "SD (Ctrl)", type: "number" as const, width: 70 },
];

export interface Column {
  key: string;
  label: string;
  type: "text" | "number";
  width: number;
  required?: boolean;
}

export interface Row {
  id: string;
  [key: string]: string | number;
}

export interface SpreadsheetData {
  columns: Column[];
  rows: Row[];
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface SpreadsheetEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: SpreadsheetData) => void;
  initialData?: SpreadsheetData;
  templateType?: "binary" | "continuous" | "custom";
}

export function SpreadsheetEditor({
  visible,
  onClose,
  onSave,
  initialData,
  templateType = "binary",
}: SpreadsheetEditorProps) {
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const horizontalScrollRef = useRef<ScrollView>(null);

  // Initialize columns based on template type
  const getInitialColumns = (): Column[] => {
    switch (templateType) {
      case "binary":
        return META_ANALYSIS_COLUMNS.filter(c => 
          ["study", "year", "n_treatment", "n_control", "events_treatment", "events_control"].includes(c.key)
        );
      case "continuous":
        return META_ANALYSIS_COLUMNS.filter(c => 
          ["study", "year", "n_treatment", "n_control", "mean_treatment", "mean_control", "sd_treatment", "sd_control"].includes(c.key)
        );
      default:
        return META_ANALYSIS_COLUMNS.slice(0, 6);
    }
  };

  const [columns, setColumns] = useState<Column[]>(
    initialData?.columns || getInitialColumns()
  );
  const [rows, setRows] = useState<Row[]>(
    initialData?.rows || [createEmptyRow()]
  );
  const [name, setName] = useState(initialData?.name || "New Study Data");
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [cellErrors, setCellErrors] = useState<Map<string, ValidationError>>(new Map());
  const [showGlassPrompt, setShowGlassPrompt] = useState<string | null>(null);
  const [showDigitizer, setShowDigitizer] = useState(false);
  const [showDataImporter, setShowDataImporter] = useState(false);
  const [digitizedData, setDigitizedData] = useState<{ x: number; y: number }[]>([]);

  // Validate data whenever rows change
  useEffect(() => {
    const data: SpreadsheetData = { columns, rows, name, createdAt: Date.now(), updatedAt: Date.now() };
    const result = validateSpreadsheet(data);
    setValidationResult(result);

    // Build cell error map for quick lookup
    const errorMap = new Map<string, ValidationError>();
    [...result.errors, ...result.warnings, ...result.infos].forEach(error => {
      const key = `${error.rowIndex}-${error.columnKey}`;
      // Only keep the most severe error per cell
      if (!errorMap.has(key) || error.severity === 'error') {
        errorMap.set(key, error);
      }
    });
    setCellErrors(errorMap);
  }, [rows, columns, name]);

  // Get validation error for a specific cell
  const getCellError = useCallback((rowIndex: number, colKey: string): ValidationError | null => {
    return cellErrors.get(`${rowIndex}-${colKey}`) || null;
  }, [cellErrors]);

  function createEmptyRow(): Row {
    const row: Row = { id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    columns.forEach(col => {
      row[col.key] = col.type === "number" ? "" : "";
    });
    return row;
  }

  const addRow = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRows(prev => [...prev, createEmptyRow()]);
  }, [columns]);

  const deleteRow = useCallback((index: number) => {
    if (rows.length <= 1) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  }, [rows.length]);

  const updateCell = useCallback((rowIndex: number, colKey: string, value: string) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: value };
      return newRows;
    });
  }, []);

  const handleCellPress = useCallback((rowIndex: number, colIndex: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCell({ row: rowIndex, col: colIndex });
    setEditingCell({ row: rowIndex, col: colIndex });
  }, []);

  const handleSave = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    const data: SpreadsheetData = {
      columns,
      rows,
      name,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    
    onSave(data);
    onClose();
  }, [columns, rows, name, initialData, onSave, onClose]);

  const handleExportCSV = useCallback(() => {
    // Generate CSV string
    const headers = columns.map(c => c.label).join(",");
    const dataRows = rows.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape quotes and wrap in quotes if contains comma
        const strValue = String(value || "");
        if (strValue.includes(",") || strValue.includes('"')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(",")
    ).join("\n");
    
    const csv = `${headers}\n${dataRows}`;
    
    // For now, just log it - in production would use share sheet
    console.log("[SpreadsheetEditor] CSV Export:\n", csv);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert("Export Ready", "CSV data has been prepared. Use the share function to export.");
  }, [columns, rows]);

  // Handle digitized data export from PlotDigitizer
  const handleDigitizerExport = useCallback((data: { x: number; y: number }[]) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setDigitizedData(data);
    setShowDigitizer(false);
    setShowDataImporter(true);
  }, []);

  // Handle import of digitized data into spreadsheet rows
  const handleDigitizedDataImport = useCallback((studies: Array<{
    study_id: string;
    effect_size: number;
    se?: number;
    sample_size?: number;
    year?: number;
  }>) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Create new rows from imported studies
    const newRows: Row[] = studies.map((study, index) => {
      const row: Row = { id: `row_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}` };
      
      // Map study data to columns
      columns.forEach(col => {
        if (col.key === 'study') {
          row[col.key] = study.study_id;
        } else if (col.key === 'year' && study.year) {
          row[col.key] = String(study.year);
        } else if (col.key === 'effect_size' || col.key === 'mean_treatment') {
          row[col.key] = study.effect_size.toFixed(4);
        } else if ((col.key === 'se' || col.key === 'sd_treatment') && study.se) {
          row[col.key] = study.se.toFixed(4);
        } else if ((col.key === 'n_treatment' || col.key === 'n_control') && study.sample_size) {
          row[col.key] = String(Math.round(study.sample_size / 2));
        } else {
          row[col.key] = '';
        }
      });
      
      return row;
    });
    
    // Append new rows to existing data
    setRows(prev => [...prev, ...newRows]);
    setShowDataImporter(false);
    setDigitizedData([]);
    
    Alert.alert(
      "Data Imported",
      `Successfully imported ${studies.length} studies from digitized plot.`
    );
  }, [columns]);

  const renderCell = (row: Row, col: Column, rowIndex: number, colIndex: number) => {
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
    const value = row[col.key];
    const cellError = getCellError(rowIndex, col.key);
    
    // Get validation-based background color
    const validationBg = cellError 
      ? getValidationColor(cellError, { error: colors.error, warning: colors.warning, success: colors.success })
      : undefined;
    
    const baseBg = isSelected ? colors.primary + "20" : (validationBg || colors.terminal);
    const borderColor = cellError?.severity === 'error' 
      ? colors.error 
      : cellError?.severity === 'warning' 
      ? colors.warning 
      : isSelected 
      ? colors.primary 
      : colors.border;

    return (
      <TouchableOpacity
        key={`${row.id}-${col.key}`}
        onPress={() => handleCellPress(rowIndex, colIndex)}
        onLongPress={() => {
          if (cellError?.glassPrompt) {
            setShowGlassPrompt(cellError.glassPrompt);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          }
        }}
        style={[
          styles.cell,
          {
            width: col.width,
            backgroundColor: baseBg,
            borderColor: borderColor,
            borderWidth: cellError ? 1.5 : 1,
          },
        ]}
        activeOpacity={0.7}
      >
        {isEditing ? (
          <TextInput
            style={[styles.cellInput, { color: colors.foreground }]}
            value={String(value || "")}
            onChangeText={(text) => updateCell(rowIndex, col.key, text)}
            onBlur={() => setEditingCell(null)}
            autoFocus
            keyboardType={col.type === "number" ? "numeric" : "default"}
            returnKeyType="next"
            selectTextOnFocus
          />
        ) : (
          <View style={styles.cellContent}>
            <Text
              style={[
                styles.cellText,
                { color: value ? colors.foreground : colors.muted },
              ]}
              numberOfLines={1}
            >
              {value || "—"}
            </Text>
            {cellError && (
              <Text style={styles.errorIndicator}>
                {cellError.severity === 'error' ? '❌' : cellError.severity === 'warning' ? '⚠️' : 'ℹ️'}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
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
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.error }]}>
              {"Cancel"}
            </Text>
          </TouchableOpacity>
          
          <TextInput
            style={[styles.titleInput, { color: colors.foreground }]}
            value={name}
            onChangeText={setName}
            placeholder="Spreadsheet Name"
            placeholderTextColor={colors.muted}
          />
          
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.primary }]}>
              {"Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TUI Title */}
        <Text style={[styles.tuiTitle, { color: colors.border }]}>
          {BOX.topLeft}{BOX.horizontal}{" Study Data Entry "}{BOX.horizontal.repeat(15)}{BOX.topRight}
        </Text>

        {/* Validation Summary */}
        {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <View style={[styles.validationSummary, { backgroundColor: validationResult.errors.length > 0 ? colors.error + "15" : colors.warning + "15" }]}>
            <Text style={styles.validationSummaryText}>
              {validationResult.errors.length > 0 ? `❌ ${validationResult.errors.length} error${validationResult.errors.length > 1 ? "s" : ""}` : ""}
              {validationResult.errors.length > 0 && validationResult.warnings.length > 0 ? " • " : ""}
              {validationResult.warnings.length > 0 ? `⚠️ ${validationResult.warnings.length} warning${validationResult.warnings.length > 1 ? "s" : ""}` : ""}
            </Text>
            <Text style={[styles.validationSummaryText, { color: colors.muted, textAlign: "right" }]}>
              {"Long-press cell for help"}
            </Text>
          </View>
        )}

        {/* Column Headers */}
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.headerRow}
        >
          <View style={styles.rowContainer}>
            <View style={[styles.rowNumberCell, { backgroundColor: colors.surface }]}>
              <Text style={[styles.rowNumberText, { color: colors.muted }]}>{"#"}</Text>
            </View>
            {columns.map((col) => (
              <View
                key={col.key}
                style={[
                  styles.headerCell,
                  { width: col.width, backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                  {col.label}
                </Text>
              </View>
            ))}
            <View style={[styles.actionCell, { backgroundColor: colors.surface }]} />
          </View>
        </ScrollView>

        {/* Data Rows */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.dataContainer}
          showsVerticalScrollIndicator={true}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            <View>
              {rows.map((row, rowIndex) => (
                <View key={row.id} style={styles.rowContainer}>
                  {/* Row number */}
                  <View style={[styles.rowNumberCell, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.rowNumberText, { color: colors.muted }]}>
                      {rowIndex + 1}
                    </Text>
                  </View>
                  
                  {/* Data cells */}
                  {columns.map((col, colIndex) => renderCell(row, col, rowIndex, colIndex))}
                  
                  {/* Delete button */}
                  <TouchableOpacity
                    onPress={() => deleteRow(rowIndex)}
                    style={[styles.deleteButton, { backgroundColor: colors.error + "20" }]}
                    disabled={rows.length <= 1}
                  >
                    <Text style={{ color: rows.length <= 1 ? colors.muted : colors.error }}>
                      {"✕"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={addRow}
            style={[styles.footerButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.footerButtonText, { color: colors.background }]}>
              {"+ Add Row"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDigitizer(true)}
            style={[styles.footerButton, { backgroundColor: colors.warning + "20", borderColor: colors.warning, borderWidth: 1 }]}
          >
            <Text style={[styles.footerButtonText, { color: colors.warning }]}>
              {"📊 Digitize"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportCSV}
            style={[styles.footerButton, { backgroundColor: colors.terminal, borderColor: colors.border, borderWidth: 1 }]}
          >
            <Text style={[styles.footerButtonText, { color: colors.foreground }]}>
              {"📤 Export"}
            </Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: colors.muted }]}>
              {`${rows.length} studies • ${columns.length} columns`}
            </Text>
          </View>
        </View>
      </View>

      {/* Glass Prompt Modal */}
      <Modal
        visible={showGlassPrompt !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setShowGlassPrompt(null)}
      >
        <View style={styles.glassPromptOverlay}>
          <View style={[styles.glassPromptContent, { backgroundColor: colors.background }]}>
            <View style={styles.glassPromptHeader}>
              <Text style={styles.glassPromptEmoji}>{"\uD83E\uDD8A"}</Text>
              <Text style={[styles.glassPromptTitle, { color: colors.foreground }]}>
                {"Glass says..."}
              </Text>
            </View>
            <Text style={[styles.glassPromptText, { color: colors.foreground }]}>
              {showGlassPrompt}
            </Text>
            <TouchableOpacity
              onPress={() => setShowGlassPrompt(null)}
              style={[styles.glassPromptButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.glassPromptButtonText, { color: colors.background }]}>
                {"Got it!"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PlotDigitizer Modal */}
      <PlotDigitizer
        visible={showDigitizer}
        onClose={() => setShowDigitizer(false)}
        onExport={handleDigitizerExport}
      />

      {/* Digitized Data Importer Modal */}
      <DigitizedDataImporter
        visible={showDataImporter}
        data={digitizedData}
        onClose={() => {
          setShowDataImporter(false);
          setDigitizedData([]);
        }}
        onImport={handleDigitizedDataImport}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    fontWeight: "600",
  },
  titleInput: {
    flex: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 16,
  },
  tuiTitle: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
    textAlign: "center",
    paddingVertical: 8,
  },
  headerRow: {
    flexGrow: 0,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowNumberCell: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  rowNumberText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
  },
  headerCell: {
    height: 40,
    paddingHorizontal: 8,
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  headerText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 11,
    fontWeight: "bold",
  },
  actionCell: {
    width: 40,
    height: 40,
  },
  dataContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  cell: {
    height: 40,
    paddingHorizontal: 8,
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  cellText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
  },
  cellInput: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    padding: 0,
    margin: 0,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footerButtonText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  statsText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 11,
  },
  cellContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  errorIndicator: {
    fontSize: 10,
    marginLeft: 4,
  },
  glassPromptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  glassPromptContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  glassPromptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  glassPromptEmoji: {
    fontSize: 32,
  },
  glassPromptTitle: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 16,
    fontWeight: "600",
  },
  glassPromptText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  glassPromptButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  glassPromptButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  validationSummary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  validationSummaryText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 11,
    flex: 1,
  },
});

export default SpreadsheetEditor;
