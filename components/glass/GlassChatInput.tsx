/**
 * GlassChatInput - TUI-style chat input for Glass 🦊
 * 
 * A terminal-aesthetic input component that connects directly to
 * the MiniMax M2.1 backend for AI-powered responses.
 */

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
import { BOX } from "@/constants/ascii-art";

interface GlassChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isThinking?: boolean;
  glassState?: 'idle' | 'thinking' | 'talking' | 'error';
}

export function GlassChatInput({
  onSubmit,
  disabled = false,
  placeholder = "Ask Glass anything about meta-analysis...",
  isThinking = false,
  glassState = 'idle',
}: GlassChatInputProps) {
  const colors = useColors();
  const [text, setText] = useState("");
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
  }, [cursorBlink]);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isThinking) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onSubmit(trimmed);
    setText("");
  }, [text, disabled, isThinking, onSubmit]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleKeyPress = (e: any) => {
    // Handle Enter key on web/desktop
    if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
      e.preventDefault?.();
      handleSubmit();
    }
  };

  // Get status indicator based on Glass state
  const getStatusIndicator = () => {
    switch (glassState) {
      case 'thinking':
        return { color: colors.warning, symbol: '◐', label: 'thinking' };
      case 'talking':
        return { color: colors.success, symbol: '●', label: 'responding' };
      case 'error':
        return { color: colors.error, symbol: '✗', label: 'error' };
      default:
        return { color: colors.success, symbol: '●', label: 'ready' };
    }
  };

  const status = getStatusIndicator();

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
      {/* TUI top border */}
      <Text style={[styles.tuiBorder, { color: colors.border }]}>
        {BOX.teeRight}{BOX.horizontal}{BOX.horizontal}{" Glass Chat "}{BOX.horizontal.repeat(30)}{BOX.teeLeft}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.terminal,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Glass-style prompt */}
        <View style={styles.promptContainer}>
          <Text style={[styles.promptSymbol, { color: status.color }]}>
            {status.symbol}
          </Text>
          <Text style={styles.promptText}>
            {"🦊"}
          </Text>
          <Text style={[styles.promptArrow, { color: colors.primary }]}>
            {BOX.teeRight}
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
          placeholder={isThinking ? "Glass is thinking..." : placeholder}
          placeholderTextColor={colors.muted}
          onSubmitEditing={handleSubmit}
          onKeyPress={handleKeyPress}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled && !isThinking}
          multiline={false}
          blurOnSubmit={false}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={disabled || isThinking || !text.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim() && !isThinking ? colors.primary : colors.muted,
              opacity: disabled || isThinking || !text.trim() ? 0.5 : 1,
            },
          ]}
          activeOpacity={0.7}
        >
          {isThinking ? (
            <Text style={[styles.sendIcon, { color: colors.background }]}>{"◌"}</Text>
          ) : (
            <IconSymbol
              name="paperplane.fill"
              size={18}
              color={colors.background}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Keyboard hints */}
      {Platform.OS === 'web' && (
        <View style={styles.hintsContainer}>
          <Text style={[styles.hintText, { color: colors.muted }]}>
            {"Enter to send • Powered by MiniMax M2.1"}
          </Text>
        </View>
      )}

      {/* TUI bottom border */}
      <Text style={[styles.tuiBorder, { color: colors.border }]}>
        {BOX.bottomLeft}{BOX.horizontal.repeat(48)}{BOX.bottomRight}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderTopWidth: 0,
  },
  tuiBorder: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  promptSymbol: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
    marginRight: 4,
  },
  promptText: {
    fontSize: 14,
    marginRight: 4,
  },
  promptArrow: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 13,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
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
  sendIcon: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 16,
  },
  hintsContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 9,
  },
});

export default GlassChatInput;
