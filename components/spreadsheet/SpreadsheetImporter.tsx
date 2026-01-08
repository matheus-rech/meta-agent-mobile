/**
 * SpreadsheetImporter - Import spreadsheets from files
 * 
 * Supports CSV and Excel file import for meta-analysis data.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { BOX } from "@/constants/ascii-art";
import type { SpreadsheetData, Column, Row } from "./SpreadsheetEditor";
import { META_ANALYSIS_COLUMNS } from "./SpreadsheetEditor";

interface SpreadsheetImporterProps {
  visible: boolean;
  onClose: () => void;
  onImport: (data: SpreadsheetData) => void;
}

export function SpreadsheetImporter({
  visible,
  onClose,
  onImport,
}: SpreadsheetImporterProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SpreadsheetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = useCallback((content: string, fileName: string): SpreadsheetData => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error("Empty file");
    }

    // Parse header row
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    // Create columns from headers
    const columns: Column[] = headers.map((header, index) => {
      // Try to match with known meta-analysis columns
      const knownCol = META_ANALYSIS_COLUMNS.find(
        c => c.label.toLowerCase() === header.toLowerCase() ||
             c.key.toLowerCase() === header.toLowerCase().replace(/\s+/g, "_")
      );

      return {
        key: knownCol?.key || `col_${index}`,
        label: header,
        type: knownCol?.type || "text",
        width: knownCol?.width || Math.max(80, header.length * 10),
      };
    });

    // Parse data rows
    const rows: Row[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      const row: Row = {
        id: `row_${Date.now()}_${i}`,
      };

      columns.forEach((col, index) => {
        const value = values[index] || "";
        row[col.key] = col.type === "number" ? value : value;
      });

      rows.push(row);
    }

    return {
      columns,
      rows,
      name: fileName.replace(/\.[^/.]+$/, ""),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const handlePickFile = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      const fileName = file.name;
      const fileUri = file.uri;

      // Read file content
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if it's Excel (we only support CSV for now)
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        throw new Error("Excel files are not yet supported. Please export as CSV first.");
      }

      // Parse CSV
      const data = parseCSV(content, fileName);
      setPreviewData(data);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      console.error("[SpreadsheetImporter] Error:", e);
      setError(e.message || "Failed to import file");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV]);

  const handleConfirmImport = useCallback(() => {
    if (!previewData) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onImport(previewData);
    setPreviewData(null);
    onClose();
  }, [previewData, onImport, onClose]);

  const handleCancel = useCallback(() => {
    setPreviewData(null);
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.error }]}>
              {"Cancel"}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: colors.foreground }]}>
            {"Import Spreadsheet"}
          </Text>
          
          <View style={styles.headerButton} />
        </View>

        {/* TUI Title */}
        <Text style={[styles.tuiTitle, { color: colors.border }]}>
          {BOX.topLeft}{BOX.horizontal}{" File Import "}{BOX.horizontal.repeat(20)}{BOX.topRight}
        </Text>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                {"Reading file..."}
              </Text>
            </View>
          ) : previewData ? (
            <View style={styles.previewContainer}>
              <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.previewTitle, { color: colors.foreground }]}>
                  {"📊 "}{previewData.name}
                </Text>
                <Text style={[styles.previewStats, { color: colors.muted }]}>
                  {`${previewData.rows.length} studies • ${previewData.columns.length} columns`}
                </Text>
                
                <View style={styles.previewColumns}>
                  <Text style={[styles.previewLabel, { color: colors.muted }]}>
                    {"Columns detected:"}
                  </Text>
                  <Text style={[styles.previewColumnList, { color: colors.foreground }]}>
                    {previewData.columns.map(c => c.label).join(", ")}
                  </Text>
                </View>

                <View style={styles.previewSample}>
                  <Text style={[styles.previewLabel, { color: colors.muted }]}>
                    {"First row preview:"}
                  </Text>
                  {previewData.rows[0] && (
                    <Text style={[styles.previewSampleText, { color: colors.foreground }]} numberOfLines={3}>
                      {previewData.columns.map(c => `${c.label}: ${previewData.rows[0][c.key] || "—"}`).join("\n")}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleConfirmImport}
                style={[styles.importButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.importButtonText, { color: colors.background }]}>
                  {"✓ Import Data"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadContainer}>
              {error && (
                <View style={[styles.errorCard, { backgroundColor: colors.error + "20", borderColor: colors.error }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {"⚠️ "}{error}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handlePickFile}
                style={[styles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={styles.uploadIcon}>{"📁"}</Text>
                <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
                  {"Select File"}
                </Text>
                <Text style={[styles.uploadSubtitle, { color: colors.muted }]}>
                  {"CSV files supported"}
                </Text>
              </TouchableOpacity>

              <View style={styles.helpContainer}>
                <Text style={[styles.helpTitle, { color: colors.foreground }]}>
                  {"Supported formats:"}
                </Text>
                <Text style={[styles.helpText, { color: colors.muted }]}>
                  {"• CSV (Comma Separated Values)\n• UTF-8 encoded text files"}
                </Text>
                
                <Text style={[styles.helpTitle, { color: colors.foreground, marginTop: 16 }]}>
                  {"Expected columns:"}
                </Text>
                <Text style={[styles.helpText, { color: colors.muted }]}>
                  {"• Study, Year\n• n (Treatment), n (Control)\n• Events or Mean/SD for each group"}
                </Text>
              </View>
            </View>
          )}
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
    width: 60,
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
  title: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 16,
    fontWeight: "bold",
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
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    marginTop: 16,
  },
  uploadContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  uploadButton: {
    width: "100%",
    maxWidth: 300,
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadTitle: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
  },
  errorCard: {
    width: "100%",
    maxWidth: 300,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    textAlign: "center",
  },
  helpContainer: {
    marginTop: 32,
    width: "100%",
    maxWidth: 300,
  },
  helpTitle: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  helpText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 11,
    lineHeight: 18,
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  previewCard: {
    width: "100%",
    maxWidth: 350,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewTitle: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  previewStats: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    marginBottom: 16,
  },
  previewColumns: {
    marginBottom: 16,
  },
  previewLabel: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
    marginBottom: 4,
  },
  previewColumnList: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 11,
    lineHeight: 16,
  },
  previewSample: {
    marginTop: 8,
  },
  previewSampleText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
    lineHeight: 16,
  },
  importButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  importButtonText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default SpreadsheetImporter;
