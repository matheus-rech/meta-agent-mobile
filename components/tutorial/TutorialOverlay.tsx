/**
 * TutorialOverlay Component
 * Provides a semi-transparent overlay that dims the background during tutorials
 */

import React from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialOverlayProps {
  visible: boolean;
  onPress?: () => void;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
  };
  opacity?: number;
}

export function TutorialOverlay({
  visible,
  onPress,
  highlightArea,
  opacity = 0.7,
}: TutorialOverlayProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(visible ? opacity : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      }),
    };
  }, [visible, opacity]);

  if (!visible) return null;

  // If no highlight area, render simple overlay
  if (!highlightArea) {
    return (
      <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="box-none">
        <Pressable style={styles.pressable} onPress={onPress} />
      </Animated.View>
    );
  }

  // Render overlay with cutout for highlight area
  const { x, y, width, height, borderRadius = 8 } = highlightArea;

  return (
    <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="box-none">
      {/* Top section */}
      <Pressable
        style={[styles.section, { top: 0, left: 0, right: 0, height: y }]}
        onPress={onPress}
      />
      
      {/* Left section */}
      <Pressable
        style={[styles.section, { top: y, left: 0, width: x, height: height }]}
        onPress={onPress}
      />
      
      {/* Right section */}
      <Pressable
        style={[
          styles.section,
          { top: y, left: x + width, right: 0, height: height },
        ]}
        onPress={onPress}
      />
      
      {/* Bottom section */}
      <Pressable
        style={[
          styles.section,
          { top: y + height, left: 0, right: 0, bottom: 0 },
        ]}
        onPress={onPress}
      />
      
      {/* Highlight border */}
      <View
        style={[
          styles.highlightBorder,
          {
            top: y - 2,
            left: x - 2,
            width: width + 4,
            height: height + 4,
            borderRadius: borderRadius + 2,
          },
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  pressable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  section: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlightBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    backgroundColor: 'transparent',
  },
});
