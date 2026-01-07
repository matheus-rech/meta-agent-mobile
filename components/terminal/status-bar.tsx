import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { GLASS_LOGO_MINI, STATUS_ACTIVE, STATUS_PENDING } from "@/constants/ascii-art";

interface StatusBarProps {
  isConnected: boolean;
  sessionId?: string;
  isThinking?: boolean;
}

export function TerminalStatusBar({
  isConnected,
  sessionId,
  isThinking,
}: StatusBarProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {/* Glass ASCII Logo */}
        <Text style={[styles.metaLogo, { color: colors.primary }]}>
          {GLASS_LOGO_MINI}
        </Text>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isConnected ? colors.success : colors.error,
            },
          ]}
        />
        <Text style={[styles.statusText, { color: colors.muted }]}>
          {isConnected ? STATUS_ACTIVE : STATUS_PENDING} {isConnected ? "Online" : "Offline"}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {isThinking && (
          <Text style={[styles.thinkingText, { color: colors.warning }]}>
            ▶ Processing...
          </Text>
        )}
        {sessionId && (
          <Text style={[styles.sessionText, { color: colors.muted }]}>
            #{sessionId.slice(0, 8)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaLogo: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    fontWeight: "700",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
  },
  thinkingText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
  },
  sessionText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
  },
});
