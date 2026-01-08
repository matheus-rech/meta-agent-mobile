/**
 * TemplatePicker - Select and manage spreadsheet templates
 * 
 * Allows users to choose from built-in templates or their saved templates
 * for different study types (RCT, cohort, case-control, etc.)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { BOX } from "@/constants/ascii-art";
import {
  getAllTemplates,
  saveTemplate,
  deleteTemplate,
  getStudyTypeLabel,
  getStudyTypeEmoji,
  type SpreadsheetTemplate,
  type StudyType,
} from "@/lib/spreadsheet";
import type { Column } from "./SpreadsheetEditor";

interface TemplatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SpreadsheetTemplate) => void;
  currentColumns?: Column[];
  onSaveAsTemplate?: (name: string, description: string, studyType: StudyType) => void;
}

export function TemplatePicker({
  visible,
  onClose,
  onSelectTemplate,
  currentColumns,
  onSaveAsTemplate,
}: TemplatePickerProps) {
  const colors = useColors();
  const [templates, setTemplates] = useState<SpreadsheetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateType, setNewTemplateType] = useState<StudyType>("custom");
  const [selectedFilter, setSelectedFilter] = useState<StudyType | "all">("all");

  // Load templates on mount
  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = useCallback((template: SpreadsheetTemplate) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  const handleDeleteTemplate = useCallback(async (template: SpreadsheetTemplate) => {
    if (template.isBuiltIn) {
      Alert.alert("Cannot Delete", "Built-in templates cannot be deleted.");
      return;
    }

    Alert.alert(
      "Delete Template",
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTemplate(template.id);
              await loadTemplates();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error("Error deleting template:", error);
            }
          },
        },
      ]
    );
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!newTemplateName.trim()) {
      Alert.alert("Name Required", "Please enter a name for your template.");
      return;
    }

    if (onSaveAsTemplate) {
      onSaveAsTemplate(newTemplateName.trim(), newTemplateDescription.trim(), newTemplateType);
    }

    setShowSaveModal(false);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateType("custom");

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Reload templates
    await loadTemplates();
  }, [newTemplateName, newTemplateDescription, newTemplateType, onSaveAsTemplate]);

  const filteredTemplates = selectedFilter === "all"
    ? templates
    : templates.filter(t => t.studyType === selectedFilter);

  const studyTypes: (StudyType | "all")[] = ["all", "rct", "cohort", "case_control", "cross_sectional", "custom"];

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {BOX.vertical} Templates {BOX.vertical}
          </Text>
          {currentColumns && currentColumns.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowSaveModal(true)}
              style={styles.saveButton}
            >
              <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {studyTypes.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedFilter(type)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: selectedFilter === type ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: selectedFilter === type ? colors.background : colors.foreground },
                ]}
              >
                {type === "all" ? "📋 All" : `${getStudyTypeEmoji(type)} ${getStudyTypeLabel(type).split(" ")[0]}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Templates list */}
        <ScrollView style={styles.templatesList} contentContainerStyle={styles.templatesContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading templates...</Text>
            </View>
          ) : filteredTemplates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No templates found for this category.
              </Text>
            </View>
          ) : (
            filteredTemplates.map(template => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleSelectTemplate(template)}
                onLongPress={() => handleDeleteTemplate(template)}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.templateHeader}>
                  <Text style={[styles.templateEmoji]}>
                    {getStudyTypeEmoji(template.studyType)}
                  </Text>
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: colors.foreground }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateType, { color: colors.muted }]}>
                      {getStudyTypeLabel(template.studyType)}
                    </Text>
                  </View>
                  {template.isBuiltIn && (
                    <View style={[styles.builtInBadge, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.builtInText, { color: colors.primary }]}>Built-in</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.templateDescription, { color: colors.muted }]}>
                  {template.description}
                </Text>
                <View style={styles.templateColumns}>
                  <Text style={[styles.columnsLabel, { color: colors.muted }]}>
                    Columns: {template.columns.length}
                  </Text>
                  <Text
                    style={[styles.columnsPreview, { color: colors.muted }]}
                    numberOfLines={1}
                  >
                    {template.columns.slice(0, 4).map(c => c.label).join(", ")}
                    {template.columns.length > 4 ? "..." : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Save Template Modal */}
        <Modal
          visible={showSaveModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowSaveModal(false)}
        >
          <View style={styles.saveModalOverlay}>
            <View style={[styles.saveModalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.saveModalTitle, { color: colors.foreground }]}>
                Save as Template
              </Text>

              <Text style={[styles.inputLabel, { color: colors.muted }]}>Template Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                ]}
                value={newTemplateName}
                onChangeText={setNewTemplateName}
                placeholder="My Custom Template"
                placeholderTextColor={colors.muted}
              />

              <Text style={[styles.inputLabel, { color: colors.muted }]}>Description</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                ]}
                value={newTemplateDescription}
                onChangeText={setNewTemplateDescription}
                placeholder="Describe when to use this template..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { color: colors.muted }]}>Study Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                {(["rct", "cohort", "case_control", "cross_sectional", "custom"] as StudyType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewTemplateType(type)}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: newTemplateType === type ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: newTemplateType === type ? colors.background : colors.foreground }}>
                      {getStudyTypeEmoji(type)} {getStudyTypeLabel(type).split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.saveModalButtons}>
                <TouchableOpacity
                  onPress={() => setShowSaveModal(false)}
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                >
                  <Text style={{ color: colors.foreground }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveTemplate}
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={{ color: colors.background, fontWeight: "600" }}>Save Template</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
  },
  title: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" }),
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "500",
  },
  templatesList: {
    flex: 1,
  },
  templatesContent: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  templateEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  templateType: {
    fontSize: 12,
  },
  builtInBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  builtInText: {
    fontSize: 10,
    fontWeight: "600",
  },
  templateDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  templateColumns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  columnsLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  columnsPreview: {
    fontSize: 11,
    flex: 1,
  },
  saveModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  saveModalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  saveModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  typeSelector: {
    marginTop: 8,
    maxHeight: 40,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  saveModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default TemplatePicker;
