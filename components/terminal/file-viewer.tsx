import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { FileAttachment } from "./terminal-output";

interface FileViewerProps {
  file: FileAttachment | null;
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function FileViewer({ file, visible, onClose }: FileViewerProps) {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const renderContent = () => {
    if (!file) return null;

    if (file.type === "image" || file.type === "plot") {
      return (
        <View style={styles.imageContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                Loading...
              </Text>
            </View>
          )}
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: file.uri }}
              style={styles.image}
              contentFit="contain"
              onLoadStart={() => {
                setLoading(true);
                setError(null);
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("Failed to load image");
              }}
            />
          )}
        </View>
      );
    }

    // Generic file preview
    return (
      <View style={styles.fileInfoContainer}>
        <MaterialIcons
          name={getFileIcon(file.mimeType)}
          size={64}
          color={colors.primary}
        />
        <Text style={[styles.fileName, { color: colors.foreground }]}>
          {file.name}
        </Text>
        {file.mimeType && (
          <Text style={[styles.fileType, { color: colors.muted }]}>
            {file.mimeType}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.9)" }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <MaterialIcons
              name={file?.type === "plot" ? "show-chart" : "image"}
              size={20}
              color={colors.primary}
            />
            <Text
              style={[styles.headerTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {file?.name || "File Preview"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.terminal }]}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        {/* Footer with file info */}
        {file && (
          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              {file.type === "plot" ? "Generated Plot" : "Image File"}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

function getFileIcon(mimeType?: string): any {
  if (!mimeType) return "insert-drive-file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "videocam";
  if (mimeType.startsWith("audio/")) return "audiotrack";
  if (mimeType.includes("pdf")) return "picture-as-pdf";
  if (mimeType.includes("json")) return "code";
  if (mimeType.includes("text")) return "description";
  return "insert-drive-file";
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 56 : 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    position: "absolute",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
  },
  fileInfoContainer: {
    alignItems: "center",
    padding: 32,
  },
  fileName: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  fileType: {
    fontSize: 14,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
  },
});
