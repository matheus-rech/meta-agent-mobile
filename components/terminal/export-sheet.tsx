/**
 * Export Sheet Component
 * Allows users to export plots, results, and code
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/use-colors";

interface ExportOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => Promise<void>;
}

interface ExportSheetProps {
  visible: boolean;
  onClose: () => void;
  content?: {
    type: "image" | "text" | "code" | "csv";
    data: string; // File path for images, content for text/code/csv
    filename?: string;
  };
}

export function ExportSheet({ visible, onClose, content }: ExportSheetProps) {
  const colors = useColors();

  const saveToPhotos = async () => {
    if (!content || content.type !== "image") return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to save images."
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(content.data);
      Alert.alert("Success", "Image saved to photo library");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save image");
    }
  };

  const shareContent = async () => {
    if (!content) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }

      if (content.type === "image") {
        await Sharing.shareAsync(content.data, {
          mimeType: "image/png",
          dialogTitle: "Share Plot",
        });
      } else {
        // For text/code/csv, create a temporary file
        const filename = content.filename || `export.${content.type === "csv" ? "csv" : "txt"}`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, content.data);
        await Sharing.shareAsync(fileUri, {
          mimeType: content.type === "csv" ? "text/csv" : "text/plain",
          dialogTitle: `Share ${content.type.toUpperCase()}`,
        });
      }
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to share content");
    }
  };

  const copyToClipboard = async () => {
    if (!content) return;

    try {
      if (content.type === "image") {
        Alert.alert("Info", "Cannot copy images to clipboard. Use Share instead.");
        return;
      }

      await Clipboard.setStringAsync(content.data);
      Alert.alert("Success", "Copied to clipboard");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const saveAsFile = async () => {
    if (!content) return;

    try {
      const filename = content.filename || `export_${Date.now()}.${
        content.type === "image" ? "png" : content.type === "csv" ? "csv" : "txt"
      }`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      if (content.type === "image") {
        await FileSystem.copyAsync({
          from: content.data,
          to: fileUri,
        });
      } else {
        await FileSystem.writeAsStringAsync(fileUri, content.data);
      }

      Alert.alert("Success", `Saved as ${filename}`);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save file");
    }
  };

  const getExportOptions = (): ExportOption[] => {
    if (!content) return [];

    const options: ExportOption[] = [];

    if (content.type === "image") {
      options.push({
        id: "photos",
        title: "Save to Photos",
        subtitle: "Save image to your photo library",
        icon: "📷",
        action: saveToPhotos,
      });
    }

    options.push({
      id: "share",
      title: "Share",
      subtitle: "Share via other apps",
      icon: "📤",
      action: shareContent,
    });

    if (content.type !== "image") {
      options.push({
        id: "copy",
        title: "Copy to Clipboard",
        subtitle: "Copy content to clipboard",
        icon: "📋",
        action: copyToClipboard,
      });
    }

    options.push({
      id: "save",
      title: "Save as File",
      subtitle: "Save to app documents",
      icon: "💾",
      action: saveAsFile,
    });

    return options;
  };

  const options = getExportOptions();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: Platform.OS === "ios" ? 40 : 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.foreground,
              }}
            >
              Export
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Content type indicator */}
          {content && (
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Content Type
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                {content.type === "image"
                  ? "Image / Plot"
                  : content.type === "code"
                  ? "R Code"
                  : content.type === "csv"
                  ? "CSV Data"
                  : "Text"}
              </Text>
            </View>
          )}

          {/* Export options */}
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={option.action}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                backgroundColor: colors.surface,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 14 }}>{option.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  {option.title}
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {option.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {!content && (
            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                padding: 20,
              }}
            >
              No content to export
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
