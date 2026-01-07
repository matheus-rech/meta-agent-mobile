import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Autocomplete } from "./autocomplete";

interface TerminalInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isConnected?: boolean;
  sessionId?: string;
  commandHistory?: string[];
}

export function TerminalInput({
  onSubmit,
  disabled = false,
  placeholder = "Type a command or message...",
  isConnected = true,
  sessionId,
  commandHistory = [],
}: TerminalInputProps) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorBlink] = useState(new Animated.Value(1));
  const inputRef = useRef<TextInput>(null);

  // Cursor blink animation
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorBlink, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorBlink, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setShowAutocomplete(false);
    setHistoryIndex(-1);
    onSubmit(trimmed);
    setText("");
  }, [text, disabled, onSubmit]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    setHistoryIndex(-1);
    setShowAutocomplete(newText.length > 0);
  }, []);

  const handleAutocompleteSelect = useCallback((suggestion: string) => {
    setText(suggestion + " ");
    setShowAutocomplete(false);
    inputRef.current?.focus();
  }, []);

  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;
    
    let newIndex: number;
    if (direction === 'up') {
      newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
    } else {
      newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
    }
    
    setHistoryIndex(newIndex);
    if (newIndex >= 0 && newIndex < commandHistory.length) {
      setText(commandHistory[commandHistory.length - 1 - newIndex]);
    } else {
      setText("");
    }
  }, [commandHistory, historyIndex]);

  const handleKeyPress = (e: any) => {
    // Handle Enter key on web/desktop
    if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
      e.preventDefault?.();
      handleSubmit();
    }
    // Hide autocomplete on Escape
    if (e.nativeEvent.key === "Escape") {
      setShowAutocomplete(false);
    }
    // Navigate history with arrow keys
    if (e.nativeEvent.key === "ArrowUp") {
      e.preventDefault?.();
      navigateHistory('up');
    }
    if (e.nativeEvent.key === "ArrowDown") {
      e.preventDefault?.();
      navigateHistory('down');
    }
  };

  const handleFocus = () => {
    if (text.length > 0) {
      setShowAutocomplete(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowAutocomplete(false), 200);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {/* Autocomplete dropdown */}
      <Autocomplete
        input={text}
        onSelect={handleAutocompleteSelect}
        visible={showAutocomplete}
      />

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.terminal,
            borderColor: colors.border,
          },
        ]}
      >
        {/* CLI-style prompt */}
        <View style={styles.promptContainer}>
          <Text style={[styles.promptDot, { color: isConnected ? colors.success : colors.error }]}>
            ●
          </Text>
          <Text style={[styles.promptText, { color: colors.primary }]}>
            meta
          </Text>
          <Text style={[styles.promptArrow, { color: colors.primary }]}>
            ❯
          </Text>
        </View>

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.input,
            },
          ]}
          value={text}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          onSubmitEditing={handleSubmit}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          multiline={false}
          blurOnSubmit={false}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={disabled || !text.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim() ? colors.primary : colors.muted,
              opacity: disabled || !text.trim() ? 0.5 : 1,
            },
          ]}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="paperplane.fill"
            size={18}
            color={colors.background}
          />
        </TouchableOpacity>
      </View>

      {/* Keyboard hints */}
      {Platform.OS === 'web' && (
        <View style={styles.hintsContainer}>
          <Text style={[styles.hintText, { color: colors.muted }]}>
            ↑↓ history • Tab autocomplete • Enter send
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    position: "relative",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  promptDot: {
    fontSize: 8,
    marginRight: 6,
  },
  promptText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 13,
    fontWeight: 'bold',
  },
  promptArrow: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 15,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  hintsContainer: {
    marginTop: 6,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
  },
});
