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

  const renderCell = (row: Row, col: Column, rowIndex: number, colIndex: number) => {
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
    const value = row[col.key];

    return (
      <TouchableOpacity
        key={`${row.id}-${col.key}`}
        onPress={() => handleCellPress(rowIndex, colIndex)}
        style={[
          styles.cell,
          {
            width: col.width,
            backgroundColor: isSelected ? colors.primary + "20" : colors.terminal,
            borderColor: isSelected ? colors.primary : colors.border,
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
          <Text
            style={[
              styles.cellText,
              { color: value ? colors.foreground : colors.muted },
            ]}
            numberOfLines={1}
          >
            {value || "—"}
          </Text>
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
            onPress={handleExportCSV}
            style={[styles.footerButton, { backgroundColor: colors.terminal, borderColor: colors.border, borderWidth: 1 }]}
          >
            <Text style={[styles.footerButtonText, { color: colors.foreground }]}>
              {"📤 Export CSV"}
            </Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: colors.muted }]}>
              {`${rows.length} studies • ${columns.length} columns`}
            </Text>
          </View>
        </View>
      </View>
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
});

export default SpreadsheetEditor;
