/**
 * PRISMA 2020 Flowchart Builder
 * Interactive flowchart generator following PRISMA 2020 guidelines
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { PRISMAFlowchart } from "@/lib/workspace";
import * as Haptics from "expo-haptics";

interface PRISMAFlowchartBuilderProps {
  visible: boolean;
  onClose: () => void;
  initialData?: PRISMAFlowchart;
  onSave: (flowchart: Omit<PRISMAFlowchart, "updatedAt">) => void;
  onExport?: (format: "png" | "svg") => void;
}

// Default empty flowchart
const DEFAULT_FLOWCHART: Omit<PRISMAFlowchart, "updatedAt"> = {
  identification: {
    databaseRecords: 0,
    registerRecords: 0,
    otherRecords: 0,
  },
  screening: {
    duplicatesRemoved: 0,
    recordsScreened: 0,
    recordsExcluded: 0,
  },
  eligibility: {
    reportsRetrieved: 0,
    reportsNotRetrieved: 0,
    reportsAssessed: 0,
    reportsExcluded: 0,
    exclusionReasons: [],
  },
  included: {
    studiesIncluded: 0,
    reportsIncluded: 0,
  },
};

export function PRISMAFlowchartBuilder({
  visible,
  onClose,
  initialData,
  onSave,
  onExport,
}: PRISMAFlowchartBuilderProps) {
  const colors = useColors();
  const [flowchart, setFlowchart] = useState<Omit<PRISMAFlowchart, "updatedAt">>(
    initialData ? { ...initialData } : { ...DEFAULT_FLOWCHART }
  );
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [newReason, setNewReason] = useState("");
  const [newReasonCount, setNewReasonCount] = useState("");
  
  const updateField = (
    section: keyof Omit<PRISMAFlowchart, "updatedAt">,
    field: string,
    value: number
  ) => {
    setFlowchart((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };
  
  const addExclusionReason = () => {
    if (!newReason.trim()) return;
    
    const count = parseInt(newReasonCount) || 0;
    setFlowchart((prev) => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        exclusionReasons: [
          ...prev.eligibility.exclusionReasons,
          { reason: newReason.trim(), count },
        ],
      },
    }));
    setNewReason("");
    setNewReasonCount("");
    setShowExclusionModal(false);
  };
  
  const removeExclusionReason = (index: number) => {
    setFlowchart((prev) => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        exclusionReasons: prev.eligibility.exclusionReasons.filter((_, i) => i !== index),
      },
    }));
  };
  
  const handleSave = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSave(flowchart);
    onClose();
  };
  
  const handleExport = (format: "png" | "svg") => {
    if (onExport) {
      onExport(format);
    } else {
      Alert.alert("Export", `Flowchart would be exported as ${format.toUpperCase()}`);
    }
  };
  
  const NumberInput = ({
    label,
    value,
    onChange,
    hint,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    hint?: string;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
        {label}
      </Text>
      {hint && (
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
          {hint}
        </Text>
      )}
      <TextInput
        value={value.toString()}
        onChangeText={(t) => onChange(parseInt(t) || 0)}
        keyboardType="number-pad"
        style={{
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />
    </View>
  );
  
  const SectionHeader = ({ title, color }: { title: string; color: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        marginTop: 24,
      }}
    >
      <View
        style={{
          width: 4,
          height: 24,
          backgroundColor: color,
          borderRadius: 2,
          marginRight: 12,
        }}
      />
      <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
        {title}
      </Text>
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            paddingTop: Platform.OS === "ios" ? 60 : 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            PRISMA 2020
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Identification */}
          <SectionHeader title="Identification" color={colors.primary} />
          <NumberInput
            label="Records from databases"
            value={flowchart.identification.databaseRecords}
            onChange={(v) => updateField("identification", "databaseRecords", v)}
            hint="e.g., PubMed, Embase, Cochrane"
          />
          <NumberInput
            label="Records from registers"
            value={flowchart.identification.registerRecords}
            onChange={(v) => updateField("identification", "registerRecords", v)}
            hint="e.g., ClinicalTrials.gov, PROSPERO"
          />
          <NumberInput
            label="Records from other sources"
            value={flowchart.identification.otherRecords}
            onChange={(v) => updateField("identification", "otherRecords", v)}
            hint="e.g., citation searching, grey literature"
          />
          
          {/* Screening */}
          <SectionHeader title="Screening" color={colors.warning} />
          <NumberInput
            label="Duplicates removed"
            value={flowchart.screening.duplicatesRemoved}
            onChange={(v) => updateField("screening", "duplicatesRemoved", v)}
          />
          <NumberInput
            label="Records screened"
            value={flowchart.screening.recordsScreened}
            onChange={(v) => updateField("screening", "recordsScreened", v)}
            hint="After duplicate removal"
          />
          <NumberInput
            label="Records excluded"
            value={flowchart.screening.recordsExcluded}
            onChange={(v) => updateField("screening", "recordsExcluded", v)}
            hint="Based on title/abstract screening"
          />
          
          {/* Eligibility */}
          <SectionHeader title="Eligibility" color={colors.error} />
          <NumberInput
            label="Reports retrieved"
            value={flowchart.eligibility.reportsRetrieved}
            onChange={(v) => updateField("eligibility", "reportsRetrieved", v)}
            hint="Full-text articles retrieved"
          />
          <NumberInput
            label="Reports not retrieved"
            value={flowchart.eligibility.reportsNotRetrieved}
            onChange={(v) => updateField("eligibility", "reportsNotRetrieved", v)}
            hint="Full-text not available"
          />
          <NumberInput
            label="Reports assessed"
            value={flowchart.eligibility.reportsAssessed}
            onChange={(v) => updateField("eligibility", "reportsAssessed", v)}
            hint="Full-text eligibility assessment"
          />
          <NumberInput
            label="Reports excluded"
            value={flowchart.eligibility.reportsExcluded}
            onChange={(v) => updateField("eligibility", "reportsExcluded", v)}
          />
          
          {/* Exclusion Reasons */}
          <View style={{ marginTop: 8, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.foreground }}>
                Exclusion Reasons
              </Text>
              <TouchableOpacity
                onPress={() => setShowExclusionModal(true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: colors.background, fontSize: 12, fontWeight: "600" }}>
                  + Add Reason
                </Text>
              </TouchableOpacity>
            </View>
            
            {flowchart.eligibility.exclusionReasons.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                {flowchart.eligibility.exclusionReasons.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: colors.surface,
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground }}>{item.reason}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>n = {item.count}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeExclusionReason(index)}>
                      <Text style={{ color: colors.error, fontSize: 14 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
                No exclusion reasons added yet
              </Text>
            )}
          </View>
          
          {/* Included */}
          <SectionHeader title="Included" color={colors.success} />
          <NumberInput
            label="Studies included in review"
            value={flowchart.included.studiesIncluded}
            onChange={(v) => updateField("included", "studiesIncluded", v)}
          />
          <NumberInput
            label="Reports of included studies"
            value={flowchart.included.reportsIncluded}
            onChange={(v) => updateField("included", "reportsIncluded", v)}
          />
          
          {/* Export Options */}
          <View style={{ marginTop: 32, marginBottom: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
              Export Flowchart
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleExport("png")}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Export PNG</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>For presentations</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleExport("svg")}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Export SVG</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>For manuscripts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Exclusion Reason Modal */}
        <Modal
          visible={showExclusionModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowExclusionModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 16,
                padding: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 16,
                }}
              >
                Add Exclusion Reason
              </Text>
              
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                Reason
              </Text>
              <TextInput
                value={newReason}
                onChangeText={setNewReason}
                placeholder="e.g., Wrong study design"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 16,
                }}
              />
              
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                Count
              </Text>
              <TextInput
                value={newReasonCount}
                onChangeText={setNewReasonCount}
                placeholder="Number of studies"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 24,
                }}
              />
              
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowExclusionModal(false);
                    setNewReason("");
                    setNewReasonCount("");
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addExclusionReason}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.background, fontWeight: "600" }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
