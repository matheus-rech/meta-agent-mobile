/**
 * CSV File Picker Component
 * Allows users to select and upload CSV files for meta-analysis
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useColors } from "@/hooks/use-colors";

export interface CSVData {
  headers: string[];
  rows: string[][];
  fileName: string;
  filePath: string;
}

interface CSVPickerProps {
  onFileSelected: (data: CSVData) => void;
  onCancel: () => void;
  visible: boolean;
}

/**
 * Parse CSV content into structured data
 */
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split("\n");
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows = lines.slice(1).map((line) => parseCSVLine(line));

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Validate CSV data for meta-analysis
 */
function validateCSVForMetaAnalysis(data: CSVData): {
  valid: boolean;
  type: "binary" | "continuous" | "proportion" | "unknown";
  issues: string[];
} {
  const issues: string[] = [];
  const headers = data.headers.map((h) => h.toLowerCase());

  // Check for binary outcome columns
  const hasBinary =
    headers.includes("events_int") &&
    headers.includes("n_int") &&
    headers.includes("events_ctrl") &&
    headers.includes("n_ctrl");

  // Check for continuous outcome columns
  const hasContinuous =
    headers.includes("mean_int") &&
    headers.includes("sd_int") &&
    headers.includes("n_int") &&
    headers.includes("mean_ctrl") &&
    headers.includes("sd_ctrl") &&
    headers.includes("n_ctrl");

  // Check for proportion columns
  const hasProportion =
    headers.includes("events") && headers.includes("total");

  // Check for study identifier
  const hasStudy =
    headers.includes("study") ||
    headers.includes("study_id") ||
    headers.includes("author");

  if (!hasStudy) {
    issues.push("Missing study identifier column (study, study_id, or author)");
  }

  if (data.rows.length === 0) {
    issues.push("No data rows found");
  }

  let type: "binary" | "continuous" | "proportion" | "unknown" = "unknown";
  if (hasBinary) {
    type = "binary";
  } else if (hasContinuous) {
    type = "continuous";
  } else if (hasProportion) {
    type = "proportion";
  } else {
    issues.push(
      "Could not detect data type. Expected columns for binary (events_int, n_int, events_ctrl, n_ctrl), continuous (mean_int, sd_int, mean_ctrl, sd_ctrl), or proportion (events, total)"
    );
  }

  return {
    valid: issues.length === 0,
    type,
    issues,
  };
}

export function CSVPicker({ onFileSelected, onCancel, visible }: CSVPickerProps) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<CSVData | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    type: string;
    issues: string[];
  } | null>(null);

  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const parsed = parseCSV(content);

      const csvData: CSVData = {
        headers: parsed.headers,
        rows: parsed.rows,
        fileName: file.name,
        filePath: file.uri,
      };

      setPreviewData(csvData);
      setValidation(validateCSVForMetaAnalysis(csvData));
      setLoading(false);
    } catch (_error) {
      setLoading(false);
      Alert.alert("Error", "Failed to read CSV file");
    }
  };

  const handleConfirm = () => {
    if (previewData) {
      onFileSelected(previewData);
      setPreviewData(null);
      setValidation(null);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setValidation(null);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "80%",
            padding: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.foreground,
              }}
            >
              Import CSV Data
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={{ color: colors.error, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.muted, marginTop: 12 }}>
                Reading file...
              </Text>
            </View>
          ) : previewData ? (
            <ScrollView style={{ maxHeight: 400 }}>
              {/* File info */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  {previewData.fileName}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                  {previewData.headers.length} columns, {previewData.rows.length}{" "}
                  rows
                </Text>
              </View>

              {/* Validation */}
              {validation && (
                <View
                  style={{
                    backgroundColor: validation.valid
                      ? colors.success + "20"
                      : colors.warning + "20",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: validation.valid
                      ? colors.success
                      : colors.warning,
                  }}
                >
                  <Text
                    style={{
                      color: validation.valid ? colors.success : colors.warning,
                      fontWeight: "600",
                    }}
                  >
                    {validation.valid
                      ? `Valid ${validation.type} outcome data`
                      : "Validation Issues"}
                  </Text>
                  {validation.issues.map((issue, i) => (
                    <Text
                      key={i}
                      style={{
                        color: colors.foreground,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      • {issue}
                    </Text>
                  ))}
                </View>
              )}

              {/* Data preview */}
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                Preview (first 5 rows):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Headers */}
                  <View style={{ flexDirection: "row" }}>
                    {previewData.headers.map((header, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: colors.primary + "30",
                          padding: 8,
                          minWidth: 80,
                          borderWidth: 0.5,
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontWeight: "600",
                            fontSize: 11,
                          }}
                          numberOfLines={1}
                        >
                          {header}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {/* Rows */}
                  {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                    <View key={rowIndex} style={{ flexDirection: "row" }}>
                      {row.map((cell, cellIndex) => (
                        <View
                          key={cellIndex}
                          style={{
                            backgroundColor: colors.surface,
                            padding: 8,
                            minWidth: 80,
                            borderWidth: 0.5,
                            borderColor: colors.border,
                          }}
                        >
                          <Text
                            style={{ color: colors.foreground, fontSize: 11 }}
                            numberOfLines={1}
                          >
                            {cell}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Confirm button */}
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  backgroundColor: colors.primary,
                  padding: 14,
                  borderRadius: 8,
                  marginTop: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Use This Data
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text
                style={{
                  color: colors.muted,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Select a CSV file containing your study data for meta-analysis.
                {"\n\n"}
                Supported formats:{"\n"}
                • Binary outcomes (events_int, n_int, events_ctrl, n_ctrl){"\n"}
                • Continuous outcomes (mean_int, sd_int, mean_ctrl, sd_ctrl){"\n"}
                • Proportions (events, total)
              </Text>
              <TouchableOpacity
                onPress={pickDocument}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Select CSV File
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export { parseCSV, validateCSVForMetaAnalysis };
