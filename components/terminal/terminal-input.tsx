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
  /** Navigate to previous command in history */
  onHistoryPrevious?: (currentInput: string) => string | null;
  /** Navigate to next command in history */
  onHistoryNext?: () => string | null;
  /** Reset history navigation */
  onHistoryReset?: () => void;
}

export function TerminalInput({
  onSubmit,
  disabled = false,
  placeholder = "Type a command or message...",
  isConnected = true,
  sessionId,
  onHistoryPrevious,
  onHistoryNext,
  onHistoryReset,
}: TerminalInputProps) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
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
    onHistoryReset?.();
    onSubmit(trimmed);
    setText("");
  }, [text, disabled, onSubmit, onHistoryReset]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    onHistoryReset?.();
    setShowAutocomplete(newText.length > 0);
  }, [onHistoryReset]);

  const handleAutocompleteSelect = useCallback((suggestion: string) => {
    setText(suggestion + " ");
    setShowAutocomplete(false);
    inputRef.current?.focus();
  }, []);

  const navigateHistoryUp = useCallback(() => {
    if (!onHistoryPrevious) return;
    const previousCommand = onHistoryPrevious(text);
    if (previousCommand !== null) {
      setText(previousCommand);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [onHistoryPrevious, text]);

  const navigateHistoryDown = useCallback(() => {
    if (!onHistoryNext) return;
    const nextCommand = onHistoryNext();
    if (nextCommand !== null) {
      setText(nextCommand);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [onHistoryNext]);

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
      navigateHistoryUp();
    }
    if (e.nativeEvent.key === "ArrowDown") {
      e.preventDefault?.();
      navigateHistoryDown();
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
