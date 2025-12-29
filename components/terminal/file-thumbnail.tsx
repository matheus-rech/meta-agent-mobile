import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { FileAttachment } from "./terminal-output";

interface FileThumbnailProps {
  file: FileAttachment;
  onPress: () => void;
}

export function FileThumbnail({ file, onPress }: FileThumbnailProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const isImage = file.type === "image" || file.type === "plot";

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {isImage ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: file.uri }}
            style={styles.thumbnail}
            contentFit="cover"
          />
          <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.3)" }]}>
            <MaterialIcons name="zoom-in" size={24} color="#FFFFFF" />
          </View>
        </View>
      ) : (
        <View style={[styles.iconWrapper, { backgroundColor: colors.terminal }]}>
          <MaterialIcons
            name={getFileIcon(file.mimeType)}
            size={32}
            color={colors.primary}
          />
        </View>
      )}
      <View style={styles.info}>
        <Text
          style={[styles.fileName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {file.name}
        </Text>
        <Text style={[styles.fileType, { color: colors.muted }]}>
          {file.type === "plot" ? "Generated Plot" : getFileTypeLabel(file.mimeType)}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
    </TouchableOpacity>
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

function getFileTypeLabel(mimeType?: string): string {
  if (!mimeType) return "File";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("json")) return "JSON";
  return "File";
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  imageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileType: {
    fontSize: 12,
    marginTop: 2,
  },
});
