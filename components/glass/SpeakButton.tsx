/**
 * SpeakButton - Voice output button for Glass 🦊 responses
 * 
 * Converts text to speech using MiniMax TTS API
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { minimaxTTSService, type VoicePreset } from "@/lib/glass/minimax-tts.service";

interface SpeakButtonProps {
  text: string;
  language?: string;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

export function SpeakButton({
  text,
  language = "en",
  disabled = false,
  size = "small",
}: SpeakButtonProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handleSpeak = useCallback(async () => {
    if (disabled || isLoading) return;

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // If already playing, stop
    if (isPlaying && soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      // Initialize TTS service if needed
      if (!minimaxTTSService.isReady()) {
        await minimaxTTSService.initialize();
      }

      // Detect voice based on language
      const voicePreset = minimaxTTSService.detectVoiceForLanguage(language);

      // Generate speech
      const result = await minimaxTTSService.textToSpeech(text, {
        voicePreset,
        emotion: "happy",
      });

      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: result.audioUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      // Listen for playback completion
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("[SpeakButton] Error:", error);
      // Show error feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [text, language, disabled, isLoading, isPlaying]);

  const getIcon = () => {
    if (isLoading) return null;
    if (isPlaying) return "◼";
    return "🔊";
  };

  const getSizeStyle = () => {
    switch (size) {
      case "large":
        return { width: 44, height: 44, fontSize: 20 };
      case "medium":
        return { width: 36, height: 36, fontSize: 16 };
      default:
        return { width: 28, height: 28, fontSize: 12 };
    }
  };

  const sizeStyle = getSizeStyle();

  return (
    <TouchableOpacity
      onPress={handleSpeak}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        {
          width: sizeStyle.width,
          height: sizeStyle.height,
          backgroundColor: isPlaying ? colors.primary : colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text
          style={[
            styles.icon,
            {
              fontSize: sizeStyle.fontSize,
              color: isPlaying ? colors.background : colors.foreground,
            },
          ]}
        >
          {getIcon()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
  },
});

export default SpeakButton;
