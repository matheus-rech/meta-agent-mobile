/**
 * GlassFoxLarge - Large animated ASCII fox mascot
 * 
 * A giant Glass fox rendered in ASCII art with fox fur orange color,
 * animated to move across the TUI screens.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fox fur colors
const FOX_ORANGE = '#FF8C00';
const FOX_LIGHT = '#FFB347';
const FOX_DARK = '#CC5500';
const FOX_NOSE = '#1A1A1A';
const FOX_EYES = '#00BFFF';
const FOX_WHITE = '#FFFFFF';

// Large ASCII fox art frames for animation
const FOX_FRAMES = {
  // Frame 1: Fox looking forward
  forward: `
                    ╱╲   ╱╲
                   ╱  ╲ ╱  ╲
                  ╱    ╳    ╲
                 ╱   ╱   ╲   ╲
                ╱   ╱     ╲   ╲
               │   │ ◉   ◉ │   │
               │   │       │   │
                ╲  │   ▼   │  ╱
                 ╲ │  ═══  │ ╱
                  ╲│       │╱
            ╱╲     ╲       ╱     ╱╲
           ╱  ╲     ╲     ╱     ╱  ╲
          ╱    ╲     ╲   ╱     ╱    ╲
         ╱      ╲     ╲ ╱     ╱      ╲
        ╱        ╲     │     ╱        ╲
       │          ╲    │    ╱          │
       │           ╲   │   ╱           │
       │            ╲  │  ╱            │
        ╲            ╲ │ ╱            ╱
         ╲            ╲│╱            ╱
          ╲            │            ╱
           ╲           │           ╱
            ╲          │          ╱
             ╲         │         ╱
              ╲        │        ╱
               ╲       │       ╱
                ╲      │      ╱
                 ╲     │     ╱
                  ╲    │    ╱
                   ╲   │   ╱
                    ╲  │  ╱
                     ╲ │ ╱
                      ╲│╱
                       │
                      ╱│╲
                     ╱ │ ╲
                    ╱  │  ╲
  `,
  
  // Frame 2: Fox walking left
  walkLeft: `
                   ╱╲   ╱╲
                  ╱  ╲ ╱  ╲
                 ╱    ╳    ╲
                ╱   ╱   ╲   ╲
               ╱   ╱     ╲   ╲
              │   │ ◉   ◉ │   │
              │   │       │   │
               ╲  │   ▼   │  ╱
                ╲ │  ═══  │ ╱
                 ╲│       │╱
           ╱╲     ╲       ╱     ╱╲
          ╱  ╲     ╲     ╱     ╱  ╲
         ╱    ╲     ╲   ╱     ╱    ╲
        ╱      ╲     ╲ ╱     ╱      ╲
       ╱        ╲     │     ╱        ╲
      │          ╲    │    ╱          │
      │           ╲   │   ╱           │
       ╲           ╲  │  ╱           ╱
        ╲           ╲ │ ╱           ╱
         ╲           ╲│╱           ╱
          ╲           │           ╱
           ╲          │          ╱
            ╲        ╱│╲        ╱
             ╲      ╱ │ ╲      ╱
              ╲    ╱  │  ╲    ╱
               ╲  ╱   │   ╲  ╱
                ╲╱    │    ╲╱
                ╱     │     ╲
               ╱      │      ╲
              ╱       │       ╲
  `,
  
  // Frame 3: Fox walking right
  walkRight: `
                     ╱╲   ╱╲
                    ╱  ╲ ╱  ╲
                   ╱    ╳    ╲
                  ╱   ╱   ╲   ╲
                 ╱   ╱     ╲   ╲
                │   │ ◉   ◉ │   │
                │   │       │   │
                 ╲  │   ▼   │  ╱
                  ╲ │  ═══  │ ╱
                   ╲│       │╱
             ╱╲     ╲       ╱     ╱╲
            ╱  ╲     ╲     ╱     ╱  ╲
           ╱    ╲     ╲   ╱     ╱    ╲
          ╱      ╲     ╲ ╱     ╱      ╲
         ╱        ╲     │     ╱        ╲
        │          ╲    │    ╱          │
        │           ╲   │   ╱           │
         ╲           ╲  │  ╱           ╱
          ╲           ╲ │ ╱           ╱
           ╲           ╲│╱           ╱
            ╲           │           ╱
             ╲          │          ╱
              ╲        ╱│╲        ╱
               ╲      ╱ │ ╲      ╱
                ╲    ╱  │  ╲    ╱
                 ╲  ╱   │   ╲  ╱
                  ╲╱    │    ╲╱
                  ╱     │     ╲
                 ╱      │      ╲
                ╱       │       ╲
  `,
};

// Simplified fox for smaller displays
const FOX_SIMPLE = `
       /\\   /\\
      /  \\ /  \\
     /    Y    \\
    /  (◉   ◉)  \\
   /      ▼      \\
  /    (═══)     \\
 /                \\
/        🦊        \\
`;

// Cute walking fox animation frames
const FOX_WALK_FRAMES = [
  // Frame 1: Standing
  `   /\\     /\\
  (  ◉ _ ◉  )
   \\  ▼  /
    \\___/
    /| |\\
   / | | \\
  _| | | |_`,
  
  // Frame 2: Left paw forward
  `   /\\     /\\
  (  ◉ _ ◉  )
   \\  ▼  /
    \\___/
   _/| |\\
  / | |  \\
    | | |_`,
  
  // Frame 3: Right paw forward
  `   /\\     /\\
  (  ◉ _ ◉  )
   \\  ▼  /
    \\___/
    /| |\\_
   /  | | \\
  _| | |`,
];

// Large detailed fox for main display
const FOX_LARGE_DETAILED = `
            ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
            │                                                 │
            │           /\\             /\\                     │
            │          /  \\           /  \\                    │
            │         /    \\         /    \\                   │
            │        /      \\_______/      \\                  │
            │       /                        \\                 │
            │      /    ◉              ◉     \\                │
            │     /                           \\               │
            │    /            ▼                \\              │
            │   /                               \\             │
            │  /          ╭───────╮              \\            │
            │ /           │ Glass │               \\           │
            │/            ╰───────╯                \\          │
            │                 🦊                    │          │
            │                                       │          │
            │     Your AI Meta-Analysis Guide      │          │
            │                                       │          │
            ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;

interface GlassFoxLargeProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  showName?: boolean;
  style?: object;
}

export function GlassFoxLarge({
  size = 'large',
  animated = true,
  showName = true,
  style,
}: GlassFoxLargeProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  
  // Animation values
  const translateX = useSharedValue(0);
  const bounce = useSharedValue(0);
  const earWiggle = useSharedValue(0);
  const tailWag = useSharedValue(0);
  
  // Walking animation
  useEffect(() => {
    if (!animated) return;
    
    // Horizontal movement
    translateX.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    // Bounce animation
    bounce.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    
    // Ear wiggle
    earWiggle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(-1, { duration: 500 })
      ),
      -1,
      true
    );
    
    // Tail wag
    tailWag.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Frame animation for walking
    const frameInterval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FOX_WALK_FRAMES.length);
    }, 300);
    
    return () => clearInterval(frameInterval);
  }, [animated]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: bounce.value },
    ],
  }));
  
  const getFontSize = () => {
    switch (size) {
      case 'small': return 8;
      case 'medium': return 10;
      case 'large': return 12;
      default: return 12;
    }
  };
  
  const renderColoredFox = () => {
    const foxArt = FOX_WALK_FRAMES[frameIndex];
    
    return (
      <View style={styles.foxContainer}>
        {foxArt.split('\n').map((line, lineIndex) => (
          <View key={lineIndex} style={styles.foxLine}>
            {line.split('').map((char, charIndex) => {
              let color = FOX_ORANGE;
              
              // Color mapping
              if (char === '◉') color = FOX_EYES;
              else if (char === '▼') color = FOX_NOSE;
              else if (char === '_' || char === '|') color = FOX_DARK;
              else if (char === '/' || char === '\\') color = FOX_LIGHT;
              else if (char === '🦊') color = FOX_ORANGE;
              else if (char === ' ') color = 'transparent';
              
              return (
                <Text
                  key={charIndex}
                  style={[
                    styles.foxChar,
                    { color, fontSize: getFontSize() },
                  ]}
                >
                  {char}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {renderColoredFox()}
      {showName && (
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>Glass 🦊</Text>
          <Text style={styles.subtitleText}>Meta-Analysis Guide</Text>
        </View>
      )}
    </Animated.View>
  );
}

// Compact version for inline use
export function GlassFoxInline({ style }: { style?: object }) {
  return (
    <View style={[styles.inlineContainer, style]}>
      <Text style={styles.inlineFox}>
        {'  /\\   /\\\n'}
        {' ( ◉_◉ )\n'}
        {'  > ▼ <'}
      </Text>
    </View>
  );
}

// Walking fox that moves across the screen
export function GlassFoxWalking({ style }: { style?: object }) {
  const translateX = useSharedValue(-100);
  
  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH + 100, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return (
    <Animated.View style={[styles.walkingContainer, animatedStyle, style]}>
      <Text style={styles.walkingFox}>
        {'🦊'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  foxContainer: {
    alignItems: 'center',
  },
  foxLine: {
    flexDirection: 'row',
  },
  foxChar: {
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  nameContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  nameText: {
    color: FOX_ORANGE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  subtitleText: {
    color: '#00BFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  inlineContainer: {
    alignItems: 'center',
  },
  inlineFox: {
    color: FOX_ORANGE,
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 12,
  },
  walkingContainer: {
    position: 'absolute',
    bottom: 20,
  },
  walkingFox: {
    fontSize: 24,
  },
});

export default GlassFoxLarge;
