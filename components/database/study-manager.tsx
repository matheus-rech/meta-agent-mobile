/**
 * Study Manager Component
 * UI for managing studies in the SQLite database
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import {
  initDatabase,
  getStudiesByProject,
  createStudy,
  deleteStudy,
  searchStudies,
  getOutcomesByStudy,
  createOutcome,
  Study,
  Outcome,
  CreateStudyInput,
  CreateOutcomeInput,
  OutcomeType,
} from "@/lib/database";
import * as Haptics from "expo-haptics";

interface StudyManagerProps {
  projectId: string;
  visible: boolean;
  onClose: () => void;
}

export function StudyManager({ projectId, visible, onClose }: StudyManagerProps) {
  const colors = useColors();
  const [studies, setStudies] = useState<Study[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [showAddOutcome, setShowAddOutcome] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  // New study form state
  const [newStudy, setNewStudy] = useState<Partial<CreateStudyInput>>({
    study_id: "",
    title: "",
    authors: "",
    year: new Date().getFullYear(),
  });

  // New outcome form state
  const [newOutcome, setNewOutcome] = useState<Partial<CreateOutcomeInput>>({
    outcome_name: "",
    outcome_type: "binary",
  });

  const loadStudies = useCallback(async () => {
    setIsLoading(true);
    try {
      await initDatabase();
      const data = searchQuery
        ? await searchStudies(projectId, searchQuery)
        : await getStudiesByProject(projectId);
      setStudies(data);
    } catch (_error) {
      console.error("Error loading studies:", _error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, searchQuery]);

  useEffect(() => {
    if (visible) {
      loadStudies();
    }
  }, [visible, loadStudies]);

  const handleAddStudy = async () => {
    if (!newStudy.study_id || !newStudy.title || !newStudy.authors || !newStudy.year) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await createStudy({
        project_id: projectId,
        study_id: newStudy.study_id,
        title: newStudy.title,
        authors: newStudy.authors,
        year: newStudy.year,
        journal: newStudy.journal,
        doi: newStudy.doi,
        pmid: newStudy.pmid,
        country: newStudy.country,
        study_design: newStudy.study_design,
        population: newStudy.population,
        intervention: newStudy.intervention,
        comparator: newStudy.comparator,
        sample_size: newStudy.sample_size,
        follow_up: newStudy.follow_up,
        notes: newStudy.notes,
      });

      setNewStudy({
        study_id: "",
        title: "",
        authors: "",
        year: new Date().getFullYear(),
      });
      setShowAddStudy(false);
      loadStudies();
    } catch (_error) {
      Alert.alert("Error", "Failed to add study");
    }
  };

  const handleDeleteStudy = (study: Study) => {
    Alert.alert(
      "Delete Study",
      `Are you sure you want to delete "${study.study_id}"? This will also delete all associated outcomes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteStudy(study.id);
            loadStudies();
          },
        },
      ]
    );
  };

  const handleSelectStudy = async (study: Study) => {
    setSelectedStudy(study);
    const studyOutcomes = await getOutcomesByStudy(study.id);
    setOutcomes(studyOutcomes);
  };

  const handleAddOutcome = async () => {
    if (!selectedStudy || !newOutcome.outcome_name || !newOutcome.outcome_type) {
      Alert.alert("Error", "Please fill in required fields");
      return;
    }

    try {
      await createOutcome({
        study_id: selectedStudy.id,
        outcome_name: newOutcome.outcome_name,
        outcome_type: newOutcome.outcome_type as OutcomeType,
        events_treatment: newOutcome.events_treatment,
        n_treatment: newOutcome.n_treatment,
        events_control: newOutcome.events_control,
        n_control: newOutcome.n_control,
        mean_treatment: newOutcome.mean_treatment,
        sd_treatment: newOutcome.sd_treatment,
        mean_control: newOutcome.mean_control,
        sd_control: newOutcome.sd_control,
      });

      setNewOutcome({ outcome_name: "", outcome_type: "binary" });
      setShowAddOutcome(false);
      const updatedOutcomes = await getOutcomesByStudy(selectedStudy.id);
      setOutcomes(updatedOutcomes);
    } catch (_error) {
      Alert.alert("Error", "Failed to add outcome");
    }
  };

  const renderStudyItem = ({ item }: { item: Study }) => (
    <TouchableOpacity
      onPress={() => handleSelectStudy(item)}
      onLongPress={() => handleDeleteStudy(item)}
      style={{
        backgroundColor: selectedStudy?.id === item.id ? colors.primary + "20" : colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: selectedStudy?.id === item.id ? 2 : 1,
        borderColor: selectedStudy?.id === item.id ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
        {item.study_id}
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
        {item.authors} ({item.year})
      </Text>
      {item.journal && (
        <Text style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>
          {item.journal}
        </Text>
      )}
    </TouchableOpacity>
  );

  const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    multiline = false,
    required = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "numeric" | "email-address";
    multiline?: boolean;
    required?: boolean;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
        {label} {required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
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
            <Text style={{ color: colors.muted, fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Study Database
          </Text>
          <TouchableOpacity onPress={() => setShowAddStudy(true)}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search studies..."
            placeholderTextColor={colors.muted}
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

        {/* Study List */}
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: colors.border }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, padding: 16, paddingBottom: 8 }}>
              Studies ({studies.length})
            </Text>
            <FlatList
              data={studies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderStudyItem}
              contentContainerStyle={{ padding: 16, paddingTop: 0 }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingTop: 40 }}>
                  <Text style={{ fontSize: 16, color: colors.muted }}>
                    {isLoading ? "Loading..." : "No studies yet"}
                  </Text>
                </View>
              }
            />
          </View>

          {/* Outcomes Panel */}
          {selectedStudy && (
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>
                  Outcomes ({outcomes.length})
                </Text>
                <TouchableOpacity onPress={() => setShowAddOutcome(true)}>
                  <Text style={{ color: colors.primary, fontSize: 14 }}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={outcomes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                      marginHorizontal: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                      {item.outcome_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      Type: {item.outcome_type}
                    </Text>
                    {item.outcome_type === "binary" && (
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        Treatment: {item.events_treatment}/{item.n_treatment} | Control: {item.events_control}/{item.n_control}
                      </Text>
                    )}
                    {item.outcome_type === "continuous" && (
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        Treatment: {item.mean_treatment} ± {item.sd_treatment} | Control: {item.mean_control} ± {item.sd_control}
                      </Text>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingTop: 20 }}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>No outcomes</Text>
                  </View>
                }
              />
            </View>
          )}
        </View>

        {/* Add Study Modal */}
        <Modal
          visible={showAddStudy}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddStudy(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: colors.background }}
          >
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
              <TouchableOpacity onPress={() => setShowAddStudy(false)}>
                <Text style={{ color: colors.muted, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                Add Study
              </Text>
              <TouchableOpacity onPress={handleAddStudy}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              <FormInput
                label="Study ID"
                value={newStudy.study_id || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, study_id: text })}
                placeholder="e.g., Smith 2020"
                required
              />
              <FormInput
                label="Title"
                value={newStudy.title || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, title: text })}
                placeholder="Full study title"
                multiline
                required
              />
              <FormInput
                label="Authors"
                value={newStudy.authors || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, authors: text })}
                placeholder="Smith J, Jones M, et al."
                required
              />
              <FormInput
                label="Year"
                value={newStudy.year?.toString() || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, year: parseInt(text) || undefined })}
                placeholder="2020"
                keyboardType="numeric"
                required
              />
              <FormInput
                label="Journal"
                value={newStudy.journal || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, journal: text })}
                placeholder="Journal name"
              />
              <FormInput
                label="DOI"
                value={newStudy.doi || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, doi: text })}
                placeholder="10.1000/xyz123"
              />
              <FormInput
                label="PMID"
                value={newStudy.pmid || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, pmid: text })}
                placeholder="12345678"
                keyboardType="numeric"
              />
              <FormInput
                label="Country"
                value={newStudy.country || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, country: text })}
                placeholder="United States"
              />
              <FormInput
                label="Study Design"
                value={newStudy.study_design || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, study_design: text })}
                placeholder="RCT, Cohort, Case-control"
              />
              <FormInput
                label="Population"
                value={newStudy.population || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, population: text })}
                placeholder="Adults with condition X"
                multiline
              />
              <FormInput
                label="Intervention"
                value={newStudy.intervention || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, intervention: text })}
                placeholder="Treatment description"
                multiline
              />
              <FormInput
                label="Comparator"
                value={newStudy.comparator || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, comparator: text })}
                placeholder="Control/placebo"
              />
              <FormInput
                label="Sample Size"
                value={newStudy.sample_size?.toString() || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, sample_size: parseInt(text) || undefined })}
                placeholder="100"
                keyboardType="numeric"
              />
              <FormInput
                label="Follow-up"
                value={newStudy.follow_up || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, follow_up: text })}
                placeholder="12 months"
              />
              <FormInput
                label="Notes"
                value={newStudy.notes || ""}
                onChangeText={(text) => setNewStudy({ ...newStudy, notes: text })}
                placeholder="Additional notes"
                multiline
              />
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add Outcome Modal */}
        <Modal
          visible={showAddOutcome}
          animationType="fade"
          transparent
          onRequestClose={() => setShowAddOutcome(false)}
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
                maxHeight: "80%",
              }}
            >
              <ScrollView>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
                  Add Outcome
                </Text>

                <FormInput
                  label="Outcome Name"
                  value={newOutcome.outcome_name || ""}
                  onChangeText={(text) => setNewOutcome({ ...newOutcome, outcome_name: text })}
                  placeholder="e.g., Mortality"
                  required
                />

                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 8 }}>
                  Outcome Type
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  {(["binary", "continuous", "proportion"] as OutcomeType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setNewOutcome({ ...newOutcome, outcome_type: type })}
                      style={{
                        flex: 1,
                        backgroundColor: newOutcome.outcome_type === type ? colors.primary : colors.surface,
                        padding: 12,
                        borderRadius: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: newOutcome.outcome_type === type ? colors.background : colors.foreground,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {newOutcome.outcome_type === "binary" && (
                  <>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                      Treatment Group
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="Events"
                          value={newOutcome.events_treatment?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, events_treatment: parseInt(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="Total N"
                          value={newOutcome.n_treatment?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, n_treatment: parseInt(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                      Control Group
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="Events"
                          value={newOutcome.events_control?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, events_control: parseInt(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="Total N"
                          value={newOutcome.n_control?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, n_control: parseInt(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </>
                )}

                {newOutcome.outcome_type === "continuous" && (
                  <>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                      Treatment Group
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="Mean"
                          value={newOutcome.mean_treatment?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, mean_treatment: parseFloat(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="SD"
                          value={newOutcome.sd_treatment?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, sd_treatment: parseFloat(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="N"
                          value={newOutcome.n_treatment?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, n_treatment: parseInt(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                      Control Group
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="Mean"
                          value={newOutcome.mean_control?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, mean_control: parseFloat(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="SD"
                          value={newOutcome.sd_control?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, sd_control: parseFloat(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          label="N"
                          value={newOutcome.n_control?.toString() || ""}
                          onChangeText={(text) => setNewOutcome({ ...newOutcome, n_control: parseInt(text) || undefined })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </>
                )}

                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddOutcome(false);
                      setNewOutcome({ outcome_name: "", outcome_type: "binary" });
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
                    onPress={handleAddOutcome}
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
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
