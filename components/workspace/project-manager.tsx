/**
 * Project Manager Component
 * UI for creating, selecting, and managing projects
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useWorkspace } from "@/lib/workspace";
import type { Project } from "@/lib/workspace";
import * as Haptics from "expo-haptics";

interface ProjectManagerProps {
  visible: boolean;
  onClose: () => void;
  onProjectSelected?: (project: Project) => void;
}

export function ProjectManager({ visible, onClose, onProjectSelected }: ProjectManagerProps) {
  const colors = useColors();
  const {
    projects,
    currentProject,
    createNewProject,
    selectProject,
    deleteCurrentProject,
  } = useWorkspace();
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert("Error", "Please enter a project name");
      return;
    }
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const project = await createNewProject(newProjectName.trim(), newProjectDescription.trim());
    setNewProjectName("");
    setNewProjectDescription("");
    setShowNewProject(false);
    
    if (onProjectSelected) {
      onProjectSelected(project);
    }
  };
  
  const handleSelectProject = async (project: Project) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    await selectProject(project.id);
    
    if (onProjectSelected) {
      onProjectSelected(project);
    }
    onClose();
  };
  
  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (currentProject?.id === project.id) {
              await deleteCurrentProject();
            }
          },
        },
      ]
    );
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  const renderProjectItem = ({ item }: { item: Project }) => {
    const isSelected = currentProject?.id === item.id;
    
    return (
      <TouchableOpacity
        onPress={() => handleSelectProject(item)}
        onLongPress={() => handleDeleteProject(item)}
        style={{
          backgroundColor: isSelected ? colors.primary + "20" : colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.foreground,
              flex: 1,
            }}
          >
            {item.name}
          </Text>
          {isSelected && (
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: colors.background, fontSize: 10, fontWeight: "600" }}>
                ACTIVE
              </Text>
            </View>
          )}
        </View>
        
        {item.description && (
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginTop: 4,
            }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        
        <View style={{ flexDirection: "row", marginTop: 12, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {item.studies.length} studies
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {item.scripts.length} scripts
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {item.plots.length} plots
            </Text>
          </View>
        </View>
        
        <Text style={{ fontSize: 10, color: colors.muted, marginTop: 8 }}>
          Updated {formatDate(item.updatedAt)}
        </Text>
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
            <Text style={{ color: colors.primary, fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            Projects
          </Text>
          <TouchableOpacity onPress={() => setShowNewProject(true)}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>New</Text>
          </TouchableOpacity>
        </View>
        
        {/* Project List */}
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📁</Text>
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                No Projects Yet
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center" }}>
                Create a project to organize your studies, scripts, and plots
              </Text>
              <TouchableOpacity
                onPress={() => setShowNewProject(true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginTop: 24,
                }}
              >
                <Text style={{ color: colors.background, fontWeight: "600" }}>
                  Create Project
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
        
        {/* New Project Modal */}
        <Modal
          visible={showNewProject}
          animationType="fade"
          transparent
          onRequestClose={() => setShowNewProject(false)}
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
                  fontSize: 20,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 16,
                }}
              >
                New Project
              </Text>
              
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                Project Name
              </Text>
              <TextInput
                value={newProjectName}
                onChangeText={setNewProjectName}
                placeholder="e.g., Stroke Meta-Analysis"
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
                Description (optional)
              </Text>
              <TextInput
                value={newProjectDescription}
                onChangeText={setNewProjectDescription}
                placeholder="Brief description of your project"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 24,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
              
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowNewProject(false);
                    setNewProjectName("");
                    setNewProjectDescription("");
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
                  onPress={handleCreateProject}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.background, fontWeight: "600" }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
