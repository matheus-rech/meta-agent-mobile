import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMemory } from "@/lib/agent";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const SETTINGS_KEY = "agent_settings";

interface Settings {
  hapticFeedback: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  hapticFeedback: true,
  autoScroll: true,
  showTimestamps: false,
};

/**
 * Settings Screen
 * Configure agent and app preferences
 */
export default function SettingsScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const updateSetting = (key: keyof Settings, value: boolean) => {
    if (Platform.OS !== "web" && settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    saveSettings({ ...settings, [key]: value });
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will clear all conversation history, command history, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            const memory = getMemory();
            await memory.clearAll();
            await AsyncStorage.removeItem(SETTINGS_KEY);
            setSettings(DEFAULT_SETTINGS);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Done", "All data has been cleared.");
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <MaterialIcons name={icon as any} size={22} color={colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.foreground }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={Platform.OS === "android" ? colors.background : undefined}
      />
    </View>
  );

  const ActionRow = ({
    icon,
    title,
    subtitle,
    onPress,
    destructive,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
    >
      <View style={styles.settingLeft}>
        <MaterialIcons
          name={icon as any}
          size={22}
          color={destructive ? colors.error : colors.primary}
        />
        <View style={styles.settingText}>
          <Text
            style={[
              styles.settingTitle,
              { color: destructive ? colors.error : colors.foreground },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Settings
          </Text>
        </View>

        {/* Terminal Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            TERMINAL
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingRow
              icon="vibration"
              title="Haptic Feedback"
              subtitle="Vibrate on interactions"
              value={settings.hapticFeedback}
              onValueChange={(v) => updateSetting("hapticFeedback", v)}
            />
            <SettingRow
              icon="vertical-align-bottom"
              title="Auto Scroll"
              subtitle="Scroll to new messages"
              value={settings.autoScroll}
              onValueChange={(v) => updateSetting("autoScroll", v)}
            />
            <SettingRow
              icon="schedule"
              title="Show Timestamps"
              subtitle="Display message times"
              value={settings.showTimestamps}
              onValueChange={(v) => updateSetting("showTimestamps", v)}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            ABOUT
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Version</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>1.0.0</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Platform</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{Platform.OS}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>SDK</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>Meta Agent v1.0</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>
            DANGER ZONE
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActionRow
              icon="delete-forever"
              title="Clear All Data"
              subtitle="Remove all history and settings"
              onPress={handleClearAllData}
              destructive
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Meta Agent Mobile
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.muted }]}>
            AI-Powered Agent SDK
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    marginTop: 48,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});
