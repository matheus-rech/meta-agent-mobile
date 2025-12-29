import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { getCommandSuggestions, slashCommands } from "@/lib/agent";

interface AutocompleteSuggestion {
  text: string;
  description: string;
  type: "command" | "phrase";
}

interface AutocompleteProps {
  input: string;
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

// Common phrases for quick suggestions
const COMMON_PHRASES: AutocompleteSuggestion[] = [
  { text: "search for", description: "Search the web", type: "phrase" },
  { text: "analyze", description: "Analyze data or content", type: "phrase" },
  { text: "write a", description: "Generate written content", type: "phrase" },
  { text: "explain", description: "Get an explanation", type: "phrase" },
  { text: "summarize", description: "Summarize content", type: "phrase" },
  { text: "help me with", description: "Get assistance", type: "phrase" },
  { text: "create a", description: "Create something new", type: "phrase" },
  { text: "compare", description: "Compare items", type: "phrase" },
  { text: "list", description: "Get a list", type: "phrase" },
  { text: "how to", description: "Learn how to do something", type: "phrase" },
];

export function Autocomplete({ input, onSelect, visible }: AutocompleteProps) {
  const colors = useColors();
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);

  // Generate suggestions based on input
  const generateSuggestions = useCallback((text: string) => {
    const trimmed = text.trim().toLowerCase();
    const results: AutocompleteSuggestion[] = [];

    if (!trimmed) {
      return [];
    }

    // Slash command suggestions
    if (trimmed.startsWith("/")) {
      const commandSuggestions = getCommandSuggestions(trimmed);
      for (const cmd of commandSuggestions) {
        const cmdName = cmd.slice(1);
        const cmdDef = slashCommands[cmdName];
        if (cmdDef) {
          results.push({
            text: cmd,
            description: cmdDef.description,
            type: "command",
          });
        }
      }
    } else {
      // Phrase suggestions
      for (const phrase of COMMON_PHRASES) {
        if (phrase.text.toLowerCase().startsWith(trimmed)) {
          results.push(phrase);
        }
      }
    }

    return results.slice(0, 6); // Limit to 6 suggestions
  }, []);

  useEffect(() => {
    if (visible && input) {
      setSuggestions(generateSuggestions(input));
    } else {
      setSuggestions([]);
    }
  }, [input, visible, generateSuggestions]);

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(suggestion.text);
  };

  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: AutocompleteSuggestion }) => (
    <TouchableOpacity
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
      style={[
        styles.suggestionItem,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.suggestionContent}>
        <Text
          style={[
            styles.suggestionText,
            {
              color: item.type === "command" ? colors.prompt : colors.foreground,
              fontFamily: item.type === "command"
                ? Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" })
                : undefined,
            },
          ]}
        >
          {item.text}
        </Text>
        <Text style={[styles.suggestionDescription, { color: colors.muted }]}>
          {item.description}
        </Text>
      </View>
      <Text style={[styles.typeIndicator, { color: colors.muted }]}>
        {item.type === "command" ? "CMD" : ""}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.text}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    maxHeight: 240,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  suggestionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  typeIndicator: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 8,
  },
});
