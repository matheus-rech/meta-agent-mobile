/**
 * GlassMascot - Animated fox mascot component for Glass 🦊
 * 
 * Features:
 * - Toggle between image and ASCII art
 * - Light/dark mode support
 * - Idle animations (blinking, breathing, tail wag)
 * - Talking animation for responses
 * - Thinking animation for processing
 * - Contextual info display
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useColors } from '@/hooks/use-colors';
import { ASCII_FOX, ASCII_FOX_BLINK, ASCII_FOX_TALK } from '@/constants/ascii-art';

// Animation states
export type GlassState = 'idle' | 'thinking' | 'talking' | 'happy' | 'sleeping';

// Display mode
export type DisplayMode = 'ascii' | 'image' | 'both';

interface GlassMascotProps {
  state?: GlassState;
  displayMode?: DisplayMode;
  showInfo?: boolean;
  modelName?: string;
  nextLesson?: string;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

// ASCII art frames for animation
const ASCII_FRAMES = {
  idle: ASCII_FOX,
  blink: ASCII_FOX_BLINK,
  talk: ASCII_FOX_TALK,
};

export function GlassMascot({
  state = 'idle',
  displayMode = 'both',
  showInfo = true,
  modelName = 'Mistral 7B',
  nextLesson,
  onPress,
  size = 'medium',
}: GlassMascotProps) {
  const colorScheme = useColorScheme();
  const colors = useColors();
  const isDark = colorScheme === 'dark';

  // Animation values
  const breatheScale = useSharedValue(1);
  const tailRotation = useSharedValue(0);
  const eyeOpacity = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const thinkingDots = useSharedValue(0);

  // ASCII frame state
  const [currentFrame, setCurrentFrame] = useState<string>(ASCII_FRAMES.idle);
  const [blinkCount, setBlinkCount] = useState(0);

  // Get current date/time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Format date for display
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Breathing animation
  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(breatheScale);
    };
  }, []);

  // Tail wag animation
  useEffect(() => {
    tailRotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(tailRotation);
    };
  }, []);

  // Blinking animation (random intervals)
  const doBlink = useCallback(() => {
    setCurrentFrame(ASCII_FRAMES.blink);
    setTimeout(() => {
      setCurrentFrame(ASCII_FRAMES.idle);
    }, 150);
  }, []);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (state === 'idle' && Math.random() > 0.7) {
        doBlink();
      }
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, [state, doBlink]);

  // State-based animations
  useEffect(() => {
    switch (state) {
      case 'thinking':
        // Bouncing dots animation
        thinkingDots.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(2, { duration: 300 }),
            withTiming(3, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          false
        );
        break;

      case 'talking':
        // Alternate between talk frames
        const talkInterval = setInterval(() => {
          setCurrentFrame(prev => 
            prev === ASCII_FRAMES.idle ? ASCII_FRAMES.talk : ASCII_FRAMES.idle
          );
        }, 200);
        return () => clearInterval(talkInterval);

      case 'happy':
        // Bounce animation
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          3,
          false
        );
        break;

      case 'sleeping':
        // Slow breathing
        breatheScale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        break;

      default:
        setCurrentFrame(ASCII_FRAMES.idle);
    }
  }, [state]);

  // Animated styles
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  // Size configurations
  const sizeConfig = {
    small: { image: 60, ascii: 8, container: 80 },
    medium: { image: 100, ascii: 10, container: 140 },
    large: { image: 150, ascii: 12, container: 200 },
  };

  const config = sizeConfig[size];

  // Render thinking dots
  const renderThinkingDots = () => {
    if (state !== 'thinking') return null;
    return (
      <View style={styles.thinkingContainer}>
        <Text style={[styles.thinkingDots, { color: colors.primary }]}>
          {'...'.substring(0, Math.floor(thinkingDots.value) + 1)}
        </Text>
      </View>
    );
  };

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Animated.View style={[styles.container, bounceStyle]}>
        {/* Main mascot display */}
        <Animated.View style={[styles.mascotContainer, breatheStyle]}>
          {(displayMode === 'image' || displayMode === 'both') && (
            <Image
              source={
                isDark
                  ? require('@/assets/images/glass-fox-dark.png')
                  : require('@/assets/images/glass-fox-light.png')
              }
              style={[styles.image, { width: config.image, height: config.image }]}
              contentFit="contain"
            />
          )}

          {(displayMode === 'ascii' || displayMode === 'both') && (
            <View style={[
              styles.asciiContainer,
              displayMode === 'both' && styles.asciiOverlay
            ]}>
              <Text
                style={[
                  styles.asciiText,
                  {
                    color: colors.primary,
                    fontSize: config.ascii,
                  },
                ]}
              >
                {currentFrame}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Thinking indicator */}
        {renderThinkingDots()}

        {/* Contextual info */}
        {showInfo && (
          <View style={[styles.infoContainer, { borderColor: colors.border }]}>
            {/* Date/Time */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                {formatDate()}
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatTime()}
              </Text>
            </View>

            {/* Model */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Model:
              </Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                {modelName}
              </Text>
            </View>

            {/* Next lesson */}
            {nextLesson && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>
                  Next:
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {nextLesson}
                </Text>
              </View>
            )}

            {/* Status indicator */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      state === 'idle'
                        ? colors.success
                        : state === 'thinking'
                        ? colors.warning
                        : colors.primary,
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.muted }]}>
                {state === 'idle'
                  ? 'Ready'
                  : state === 'thinking'
                  ? 'Thinking...'
                  : state === 'talking'
                  ? 'Speaking'
                  : state === 'happy'
                  ? 'Happy!'
                  : 'Zzz...'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 8,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    borderRadius: 12,
  },
  asciiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  asciiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  asciiText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 12,
    textAlign: 'center',
  },
  thinkingContainer: {
    height: 20,
    justifyContent: 'center',
  },
  thinkingDots: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minWidth: 140,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoValue: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    maxWidth: 80,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textTransform: 'uppercase',
  },
});

export default GlassMascot;
