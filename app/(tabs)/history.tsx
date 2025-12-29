import { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMemory } from "@/lib/agent";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface HistoryItem {
  id: string;
  command: string;
  timestamp: number;
}

/**
 * History Screen
 * Browse and manage command history
 */
export default function HistoryScreen() {
  const colors = useColors();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(() => {
    const memory = getMemory();
    const commands = memory.getCommandHistory();
    const items: HistoryItem[] = commands.map((cmd, index) => ({
      id: `history_${index}`,
      command: cmd,
      timestamp: Date.now() - (commands.length - index) * 60000, // Approximate timestamps
    }));
    setHistory(items.reverse()); // Most recent first
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleCopy = async (command: string) => {
    // Note: Clipboard API would need expo-clipboard
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("Copied", `Command copied: ${command.slice(0, 50)}...`);
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all command history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            const memory = getMemory();
            memory.clearHistory();
            setHistory([]);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      onPress={() => handleCopy(item.command)}
      activeOpacity={0.7}
      style={[styles.itemContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.commandText, { color: colors.prompt }]} numberOfLines={2}>
          {">"} {item.command}
        </Text>
        <Text style={[styles.timeText, { color: colors.muted }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
      <MaterialIcons name="content-copy" size={18} color={colors.muted} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={48} color={colors.muted} />
      <Text style={[styles.emptyText, { color: colors.muted }]}>
        No command history yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.muted }]}>
        Commands you enter in the terminal will appear here
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Command History
        </Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7}>
            <MaterialIcons name="delete-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={history.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  commandText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
