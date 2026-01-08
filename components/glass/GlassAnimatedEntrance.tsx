/**
 * GlassAnimatedEntrance - Animated Glass mascot for app entrance
 * 
 * Features a larger, more prominent Glass fox with entrance animations:
 * - Fade in with scale bounce
 * - Floating/breathing animation
 * - Sparkle effects around the mascot
 * - Typing animation for greeting text
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Large ASCII art fox for entrance
const GLASS_FOX_LARGE = `
    /\\___/\\
   (  o o  )
   (  =^=  )
    )     (
   (       )
  ( ~~~~~~~ )
   )       (
  /    🦊   \\
 /   GLASS   \\
(   ~~~~~~~~  )
 \\           /
  \\_________/
`;

// Smaller version for after animation
const GLASS_FOX_MEDIUM = `
   /\\   /\\
  (  o.o  )
   > ^ <
`;

// Sparkle characters for effects
const SPARKLES = ["✨", "⭐", "💫", "🌟", "✧", "⋆"];

interface GlassAnimatedEntranceProps {
  onAnimationComplete?: () => void;
  greeting?: string;
  showSparkles?: boolean;
  size?: "large" | "medium" | "small";
}

export function GlassAnimatedEntrance({
  onAnimationComplete,
  greeting = "Olá! Sou a Glass 🦊",
  showSparkles = true,
  size = "large",
}: GlassAnimatedEntranceProps) {
  const colors = useColors();
  const [displayedText, setDisplayedText] = useState("");
  const [sparklePositions, setSparklePositions] = useState<Array<{ x: number; y: number; char: string }>>([]);
  const [animationPhase, setAnimationPhase] = useState<"entrance" | "idle">("entrance");

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const rotation = useSharedValue(0);
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Sparkle animations
  const sparkleOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0);

  // Generate random sparkle positions
  useEffect(() => {
    if (showSparkles) {
      const positions = Array.from({ length: 8 }, () => ({
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        char: SPARKLES[Math.floor(Math.random() * SPARKLES.length)],
      }));
      setSparklePositions(positions);
    }
  }, [showSparkles]);

  // Typing animation for greeting
  useEffect(() => {
    if (animationPhase === "idle") {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= greeting.length) {
          setDisplayedText(greeting.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [greeting, animationPhase]);

  // Main entrance animation sequence
  useEffect(() => {
    // Phase 1: Fade in and scale up with bounce
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, {
      damping: 8,
      stiffness: 100,
    });
    translateY.value = withSpring(0, {
      damping: 12,
      stiffness: 80,
    });

    // Phase 2: Slight rotation wiggle
    rotation.value = withDelay(
      400,
      withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(-3, { duration: 100 }),
        withTiming(3, { duration: 100 }),
        withTiming(0, { duration: 100 })
      )
    );

    // Phase 3: Glow effect
    glowOpacity.value = withDelay(
      600,
      withSequence(
        withTiming(0.8, { duration: 300 }),
        withTiming(0.3, { duration: 300 })
      )
    );

    // Phase 4: Start floating animation
    floatY.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Sparkle animations
    if (showSparkles) {
      sparkleOpacity.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.3, { duration: 500 })
          ),
          -1,
          true
        )
      );
      sparkleScale.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(1.2, { duration: 600 }),
            withTiming(0.8, { duration: 600 })
          ),
          -1,
          true
        )
      );
    }

    // Transition to idle phase
    const timer = setTimeout(() => {
      setAnimationPhase("idle");
      onAnimationComplete?.();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const mascotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value + floatY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.1]) }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  const getFoxArt = () => {
    switch (size) {
      case "large":
        return GLASS_FOX_LARGE;
      case "medium":
        return GLASS_FOX_MEDIUM;
      default:
        return GLASS_FOX_MEDIUM;
    }
  };

  return (
    <View style={styles.container}>
      {/* Glow effect behind mascot */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <View
          style={[
            styles.glow,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        />
      </Animated.View>

      {/* Sparkles */}
      {showSparkles && (
        <Animated.View style={[styles.sparklesContainer, sparkleStyle]}>
          {sparklePositions.map((pos, index) => (
            <Text
              key={index}
              style={[
                styles.sparkle,
                {
                  left: SCREEN_WIDTH / 2 + pos.x - 10,
                  top: 100 + pos.y,
                },
              ]}
            >
              {pos.char}
            </Text>
          ))}
        </Animated.View>
      )}

      {/* Main mascot */}
      <Animated.View style={[styles.mascotContainer, mascotStyle]}>
        <Text
          style={[
            styles.foxArt,
            {
              color: colors.primary,
              textShadowColor: colors.primary + "40",
            },
          ]}
        >
          {getFoxArt()}
        </Text>
      </Animated.View>

      {/* Greeting text with typing animation */}
      {animationPhase === "idle" && (
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {displayedText}
            <Text style={[styles.cursor, { color: colors.primary }]}>▌</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

// Compact version for use in headers/status bars
export function GlassAnimatedCompact({
  isThinking = false,
  mood = "happy",
}: {
  isThinking?: boolean;
  mood?: "happy" | "thinking" | "excited" | "sleeping";
}) {
  const colors = useColors();
  const bounce = useSharedValue(0);
  const eyeBlink = useSharedValue(1);

  useEffect(() => {
    // Gentle bounce animation
    bounce.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Eye blink animation
    eyeBlink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const getEyes = () => {
    switch (mood) {
      case "thinking":
        return "◐.◑";
      case "excited":
        return "★.★";
      case "sleeping":
        return "－.－";
      default:
        return "o.o";
    }
  };

  return (
    <Animated.View style={[styles.compactContainer, animatedStyle]}>
      <Text style={[styles.compactFox, { color: colors.primary }]}>
        {`/\\   /\\`}
      </Text>
      <Text style={[styles.compactFox, { color: colors.primary }]}>
        {`( ${getEyes()} )`}
      </Text>
      <Text style={[styles.compactFox, { color: colors.primary }]}>
        {`  > ^ <`}
      </Text>
      {isThinking && (
        <Text style={[styles.thinkingDots, { color: colors.muted }]}>
          {"..."}
        </Text>
      )}
    </Animated.View>
  );
}

// Walking animation for the mascot
export function GlassWalkingAnimation({
  direction = "right",
  speed = 1,
}: {
  direction?: "left" | "right";
  speed?: number;
}) {
  const colors = useColors();
  const walkFrame = useSharedValue(0);
  const positionX = useSharedValue(direction === "right" ? -50 : SCREEN_WIDTH + 50);

  const WALK_FRAMES = [
    `  /\\   /\\
 (  o.o  )
   > ^ <
  /|   |\\
 / |   | \\`,
    `  /\\   /\\
 (  o.o  )
   > ^ <
  /|   |\\
   |   |`,
    `  /\\   /\\
 (  o.o  )
   > ^ <
  /|   |\\
 \\ |   | /`,
  ];

  useEffect(() => {
    // Walking animation frames
    walkFrame.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 200 / speed }),
        withTiming(1, { duration: 200 / speed }),
        withTiming(2, { duration: 200 / speed })
      ),
      -1,
      false
    );

    // Position animation
    positionX.value = withRepeat(
      withTiming(
        direction === "right" ? SCREEN_WIDTH + 50 : -50,
        { duration: 5000 / speed, easing: Easing.linear }
      ),
      -1,
      true
    );
  }, [direction, speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value },
      { scaleX: direction === "left" ? -1 : 1 },
    ],
  }));

  return (
    <Animated.View style={[styles.walkingContainer, animatedStyle]}>
      <Text style={[styles.walkingFox, { color: colors.primary }]}>
        {WALK_FRAMES[0]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
    position: "relative",
  },
  glowContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
  },
  sparklesContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
  },
  mascotContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  foxArt: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    lineHeight: 16,
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  greetingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  greeting: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 18,
    fontWeight: "600",
  },
  cursor: {
    fontWeight: "400",
  },
  compactContainer: {
    alignItems: "center",
  },
  compactFox: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
    lineHeight: 12,
  },
  thinkingDots: {
    fontSize: 12,
    marginTop: 2,
  },
  walkingContainer: {
    position: "absolute",
    bottom: 20,
  },
  walkingFox: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
    lineHeight: 12,
  },
});

export default GlassAnimatedEntrance;
