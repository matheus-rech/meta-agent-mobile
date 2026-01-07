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
  type: "command" | "phrase" | "meta-analysis";
  icon?: string;
}

interface AutocompleteProps {
  input: string;
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

// Meta-analysis specific phrases
const META_ANALYSIS_PHRASES: AutocompleteSuggestion[] = [
  { text: "run meta-analysis", description: "Execute meta-analysis on loaded data", type: "meta-analysis", icon: "📊" },
  { text: "generate forest plot", description: "Create forest plot visualization", type: "meta-analysis", icon: "🌲" },
  { text: "check heterogeneity", description: "Analyze I² and Q statistics", type: "meta-analysis", icon: "📈" },
  { text: "funnel plot", description: "Generate funnel plot for bias", type: "meta-analysis", icon: "📉" },
  { text: "subgroup analysis", description: "Perform subgroup analysis", type: "meta-analysis", icon: "🔍" },
  { text: "sensitivity analysis", description: "Run sensitivity analysis", type: "meta-analysis", icon: "⚖️" },
];

// Common phrases for quick suggestions
const COMMON_PHRASES: AutocompleteSuggestion[] = [
  { text: "explain", description: "Get an explanation", type: "phrase", icon: "💡" },
  { text: "help me with", description: "Get assistance", type: "phrase", icon: "🤝" },
  { text: "how to", description: "Learn how to do something", type: "phrase", icon: "📖" },
  { text: "what is", description: "Get a definition", type: "phrase", icon: "❓" },
  { text: "interpret", description: "Interpret results", type: "phrase", icon: "🔬" },
  { text: "calculate", description: "Perform calculation", type: "phrase", icon: "🧮" },
];

export function Autocomplete({ input, onSelect, visible }: AutocompleteProps) {
  const colors = useColors();
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
            icon: getCommandIcon(cmdName),
          });
        }
      }
    } else {
      // Meta-analysis phrases first
      for (const phrase of META_ANALYSIS_PHRASES) {
        if (phrase.text.toLowerCase().includes(trimmed)) {
          results.push(phrase);
        }
      }
      // Then common phrases
      for (const phrase of COMMON_PHRASES) {
        if (phrase.text.toLowerCase().startsWith(trimmed)) {
          results.push(phrase);
        }
      }
    }

    return results.slice(0, 8); // Limit to 8 suggestions
  }, []);

  useEffect(() => {
    if (visible && input) {
      setSuggestions(generateSuggestions(input));
      setSelectedIndex(0);
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

  const renderItem = ({ item, index }: { item: AutocompleteSuggestion; index: number }) => {
    const isSelected = index === selectedIndex;
    
    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
        style={[
          styles.suggestionItem,
          { 
            backgroundColor: isSelected ? colors.primary + '15' : colors.surface, 
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Icon */}
        <Text style={styles.suggestionIcon}>
          {item.icon || (item.type === "command" ? "⌘" : "›")}
        </Text>
        
        {/* Content */}
        <View style={styles.suggestionContent}>
          <Text
            style={[
              styles.suggestionText,
              {
                color: item.type === "command" ? colors.primary : colors.foreground,
                fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" }),
              },
            ]}
          >
            {item.text}
          </Text>
          <Text style={[styles.suggestionDescription, { color: colors.muted }]} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: getTypeBadgeColor(item.type, colors) }]}>
          <Text style={styles.typeBadgeText}>
            {getTypeBadgeLabel(item.type)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerText, { color: colors.muted }]}>
          ⌨ Suggestions
        </Text>
        <Text style={[styles.headerHint, { color: colors.muted }]}>
          Tab to select
        </Text>
      </View>
      
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

function getCommandIcon(command: string): string {
  const icons: Record<string, string> = {
    help: "❓",
    clear: "🧹",
    data: "📁",
    run: "▶️",
    forest: "🌲",
    funnel: "📉",
    export: "💾",
    model: "🤖",
    settings: "⚙️",
    history: "📜",
  };
  return icons[command] || "⌘";
}

function getTypeBadgeColor(type: AutocompleteSuggestion["type"], colors: any): string {
  switch (type) {
    case "command":
      return colors.primary;
    case "meta-analysis":
      return colors.success;
    case "phrase":
      return colors.muted;
    default:
      return colors.muted;
  }
}

function getTypeBadgeLabel(type: AutocompleteSuggestion["type"]): string {
  switch (type) {
    case "command":
      return "CMD";
    case "meta-analysis":
      return "META";
    case "phrase":
      return "";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    maxHeight: 320,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" }),
    fontSize: 11,
    fontWeight: "600",
  },
  headerHint: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" }),
    fontSize: 10,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: "center",
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" }),
  },
});
