import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface TerminalInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TerminalInput({
  onSubmit,
  disabled = false,
  placeholder = "Type a command...",
}: TerminalInputProps) {
  const colors = useColors();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onSubmit(trimmed);
    setText("");
  };

  const handleKeyPress = (e: any) => {
    // Handle Enter key on web/desktop
    if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
      e.preventDefault?.();
      handleSubmit();
    }
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
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.terminal,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.input,
            },
          ]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          onSubmitEditing={handleSubmit}
          onKeyPress={handleKeyPress}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
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
});
