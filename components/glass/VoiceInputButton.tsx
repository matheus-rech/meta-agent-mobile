/**
 * VoiceInputButton - Speech-to-text input for Glass 🦊
 * 
 * Allows users to ask questions by voice for hands-free interaction.
 * Uses expo-speech-recognition for native speech recognition.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from "react-native-reanimated";

// Import speech recognition (will be mocked on web)
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

// Dynamic import for native platforms
if (Platform.OS !== "web") {
  try {
    const speechModule = require("@jamsch/expo-speech-recognition");
    ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
  } catch (e) {
    console.log("[VoiceInput] Speech recognition not available:", e);
  }
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  language?: string;
}

export function VoiceInputButton({
  onTranscript,
  onPartialTranscript,
  disabled = false,
  size = "medium",
  language = "en-US",
}: VoiceInputButtonProps) {
  const colors = useColors();
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Animation for pulsing effect when listening
  const pulseScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Start pulse animation when listening
  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening, pulseScale]);

  // Register speech recognition events (native only)
  useEffect(() => {
    if (Platform.OS === "web" || !ExpoSpeechRecognitionModule) return;

    const startListener = ExpoSpeechRecognitionModule.addListener("start", () => {
      setIsListening(true);
      setIsLoading(false);
    });

    const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
      setIsListening(false);
    });

    const resultListener = ExpoSpeechRecognitionModule.addListener(
      "result",
      (event: any) => {
        const text = event.results[0]?.transcript || "";
        setTranscript(text);
        
        if (event.isFinal) {
          onTranscript(text);
          setTranscript("");
        } else if (onPartialTranscript) {
          onPartialTranscript(text);
        }
      }
    );

    const errorListener = ExpoSpeechRecognitionModule.addListener(
      "error",
      (event: any) => {
        console.log("[VoiceInput] Error:", event.error, event.message);
        setIsListening(false);
        setIsLoading(false);
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    );

    return () => {
      startListener.remove();
      endListener.remove();
      resultListener.remove();
      errorListener.remove();
    };
  }, [onTranscript, onPartialTranscript]);

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === "web" || !ExpoSpeechRecognitionModule) {
      setHasPermission(false);
      return false;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      setHasPermission(result.granted);
      return result.granted;
    } catch (e) {
      console.log("[VoiceInput] Permission check failed:", e);
      setHasPermission(false);
      return false;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === "web" || !ExpoSpeechRecognitionModule) {
      return false;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setHasPermission(result.granted);
      return result.granted;
    } catch (e) {
      console.log("[VoiceInput] Permission request failed:", e);
      return false;
    }
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled || isLoading) return;

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // If already listening, stop
    if (isListening) {
      if (ExpoSpeechRecognitionModule) {
        ExpoSpeechRecognitionModule.stop();
      }
      return;
    }

    // Web fallback - show not supported message
    if (Platform.OS === "web" || !ExpoSpeechRecognitionModule) {
      // Try Web Speech API as fallback
      if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
        startWebSpeechRecognition();
      } else {
        console.log("[VoiceInput] Speech recognition not supported on web");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
      return;
    }

    setIsLoading(true);

    // Check/request permissions
    let granted = hasPermission;
    if (granted === null) {
      granted = await checkPermissions();
    }
    if (!granted) {
      granted = await requestPermissions();
    }

    if (!granted) {
      setIsLoading(false);
      // @ts-ignore - Platform.OS can be 'web' in Expo web builds
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Start speech recognition
    try {
      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch (e) {
      console.log("[VoiceInput] Start failed:", e);
      setIsLoading(false);
    }
  }, [disabled, isLoading, isListening, hasPermission, language, checkPermissions, requestPermissions]);

  // Web Speech API fallback
  const startWebSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setIsLoading(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      
      if (result.isFinal) {
        onTranscript(text);
        setTranscript("");
      } else if (onPartialTranscript) {
        onPartialTranscript(text);
        setTranscript(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.log("[VoiceInput] Web Speech error:", event.error);
      setIsListening(false);
      setIsLoading(false);
    };

    setIsLoading(true);
    recognition.start();
  }, [language, onTranscript, onPartialTranscript]);

  const getSizeStyle = () => {
    switch (size) {
      case "large":
        return { width: 56, height: 56, fontSize: 24, iconSize: 28 };
      case "medium":
        return { width: 44, height: 44, fontSize: 18, iconSize: 22 };
      default:
        return { width: 36, height: 36, fontSize: 14, iconSize: 18 };
    }
  };

  const sizeStyle = getSizeStyle();

  const getIcon = () => {
    if (isLoading) return null;
    if (isListening) return "⏹";
    return "🎤";
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[pulseStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled || isLoading}
          style={[
            styles.button,
            {
              width: sizeStyle.width,
              height: sizeStyle.height,
              backgroundColor: isListening ? colors.error : colors.primary,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={{ fontSize: sizeStyle.iconSize }}>{getIcon()}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Partial transcript indicator */}
      {isListening && transcript && (
        <View
          style={[
            styles.transcriptBubble,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.transcriptText, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {transcript}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  button: {
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  transcriptBubble: {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: [{ translateX: -100 }],
    width: 200,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  transcriptText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    textAlign: "center",
  },
});

export default VoiceInputButton;
