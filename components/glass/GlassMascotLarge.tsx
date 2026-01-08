/**
 * GlassMascotLarge - Large animated Glass mascot with front/back loop
 * 
 * A bigger version of Glass that runs in intervals, moving front and back
 * in a continuous loop. Perfect for the home screen or loading states.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';
import { ASCII_FOX, ASCII_FOX_BLINK, ASCII_FOX_TALK } from '@/constants/ascii-art';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation states
export type GlassLargeState = 'idle' | 'walking' | 'thinking' | 'talking' | 'celebrating';

interface GlassMascotLargeProps {
  state?: GlassLargeState;
  message?: string;
  showTrail?: boolean;
  loopEnabled?: boolean;
  loopInterval?: number; // ms between loop cycles
  onLoopComplete?: () => void;
}

// Large ASCII fox with more detail
const LARGE_FOX_FRAMES = {
  idle: `
    /\\___/\\
   (  o o  )
   (  =^=  )
    )     (
   (       )
  ( (  |  ) )
   (__|__|)
`,
  walkLeft: `
    /\\___/\\
   (  o o  )
   (  =^=  ) ~
    )     (
   (       )
  ( (  |  ) )
   (__| |__)
`,
  walkRight: `
    /\\___/\\
   (  o o  )
 ~ (  =^=  )
    )     (
   (       )
  ( (  |  ) )
   (__|  __)
`,
  thinking: `
    /\\___/\\
   (  - -  )
   (  =^=  ) ?
    )     (
   (       )
  ( (  |  ) )
   (__|__|)
`,
  talking: `
    /\\___/\\
   (  o o  )
   (  =O=  )
    )     (
   (       )
  ( (  |  ) )
   (__|__|)
`,
  celebrating: `
    /\\___/\\
   (  ^o^  )
   (  =^=  ) ✨
    )     (
   (       )
  ( (  |  ) )
   (__|__|)
`,
};

export function GlassMascotLarge({
  state = 'idle',
  message,
  showTrail = true,
  loopEnabled = true,
  loopInterval = 8000,
  onLoopComplete,
}: GlassMascotLargeProps) {
  const colors = useColors();

  // Animation values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const tailWag = useSharedValue(0);

  // Frame state for ASCII animation
  const [currentFrame, setCurrentFrame] = useState(LARGE_FOX_FRAMES.idle);
  const [isMovingRight, setIsMovingRight] = useState(true);
  const [loopCount, setLoopCount] = useState(0);

  // Trail particles
  const [trailParticles, setTrailParticles] = useState<Array<{ id: number; x: number; opacity: number }>>([]);

  // Walking animation loop
  useEffect(() => {
    if (!loopEnabled || state !== 'idle') return;

    const walkDistance = SCREEN_WIDTH * 0.3; // Walk 30% of screen width

    // Create the walking loop
    const startLoop = () => {
      // Walk right
      setIsMovingRight(true);
      translateX.value = withTiming(walkDistance, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      });

      // After walking right, walk back left
      setTimeout(() => {
        setIsMovingRight(false);
        translateX.value = withTiming(-walkDistance, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        });
      }, 2500);

      // Return to center
      setTimeout(() => {
        setIsMovingRight(true);
        translateX.value = withTiming(0, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        });
        
        setLoopCount(prev => prev + 1);
        onLoopComplete?.();
      }, 5000);
    };

    // Start first loop
    startLoop();

    // Set up interval for continuous loops
    const loopTimer = setInterval(startLoop, loopInterval);

    return () => {
      clearInterval(loopTimer);
      cancelAnimation(translateX);
    };
  }, [loopEnabled, state, loopInterval, onLoopComplete]);

  // Walking frame animation
  useEffect(() => {
    if (state !== 'idle' || !loopEnabled) {
      const stateFrame = state as keyof typeof LARGE_FOX_FRAMES;
      setCurrentFrame(LARGE_FOX_FRAMES[stateFrame] || LARGE_FOX_FRAMES.idle);
      return;
    }

    // Alternate walk frames while moving
    const frameInterval = setInterval(() => {
      setCurrentFrame((_prev: string) => {
        if (Math.abs(translateX.value) > 5) {
          // Walking
          return isMovingRight ? LARGE_FOX_FRAMES.walkRight : LARGE_FOX_FRAMES.walkLeft;
        }
        // Idle
        return LARGE_FOX_FRAMES.idle;
      });
    }, 300);

    return () => clearInterval(frameInterval);
  }, [state, loopEnabled, isMovingRight]);

  // Bounce animation while walking
  useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );

    return () => cancelAnimation(bounceY);
  }, []);

  // Tail wag animation
  useEffect(() => {
    tailWag.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(-1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );

    return () => cancelAnimation(tailWag);
  }, []);

  // Breathing/scale animation
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    return () => cancelAnimation(scale);
  }, []);

  // Trail particle effect
  useEffect(() => {
    if (!showTrail || !loopEnabled) return;

    const trailInterval = setInterval(() => {
      if (Math.abs(translateX.value) > 10) {
        const newParticle = {
          id: Date.now(),
          x: translateX.value,
          opacity: 0.6,
        };
        setTrailParticles(prev => [...prev.slice(-5), newParticle]);
      }
    }, 200);

    // Fade out particles
    const fadeInterval = setInterval(() => {
      setTrailParticles(prev =>
        prev
          .map(p => ({ ...p, opacity: p.opacity - 0.1 }))
          .filter(p => p.opacity > 0)
      );
    }, 100);

    return () => {
      clearInterval(trailInterval);
      clearInterval(fadeInterval);
    };
  }, [showTrail, loopEnabled]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: bounceY.value },
      { scale: scale.value },
    ],
  }));

  const foxStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: isMovingRight ? 1 : -1 },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      {/* Trail particles */}
      {showTrail && trailParticles.map(particle => (
        <View
          key={particle.id}
          style={[
            styles.trailParticle,
            {
              left: `${50 + (particle.x / SCREEN_WIDTH) * 100}%`,
              opacity: particle.opacity,
              backgroundColor: colors.primary + '40',
            },
          ]}
        />
      ))}

      {/* Main mascot */}
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.foxContainer, foxStyle]}>
          <Text
            style={[
              styles.asciiText,
              {
                color: colors.primary,
              },
            ]}
          >
            {currentFrame}
          </Text>
        </Animated.View>

        {/* Status indicator */}
        <View style={[styles.statusBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  state === 'idle' ? colors.success :
                  state === 'thinking' ? colors.warning :
                  state === 'talking' ? colors.primary :
                  colors.success,
              },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.muted }]}>
            {state === 'idle' ? 'Ready' :
             state === 'thinking' ? 'Thinking...' :
             state === 'talking' ? 'Speaking' :
             state === 'celebrating' ? '🎉' :
             'Walking'}
          </Text>
        </View>

        {/* Message bubble */}
        {message && (
          <View style={[styles.messageBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.messageText, { color: colors.foreground }]}>
              {message}
            </Text>
            <View style={[styles.bubbleArrow, { borderTopColor: colors.surface }]} />
          </View>
        )}
      </Animated.View>

      {/* Loop counter (debug/fun) */}
      {loopEnabled && loopCount > 0 && (
        <View style={styles.loopCounter}>
          <Text style={[styles.loopCounterText, { color: colors.muted }]}>
            🦊 × {loopCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  container: {
    alignItems: 'center',
  },
  foxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  asciiText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 14,
    lineHeight: 16,
    textAlign: 'center',
    letterSpacing: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    textTransform: 'uppercase',
  },
  messageBubble: {
    position: 'absolute',
    top: -50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 200,
  },
  messageText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 11,
    textAlign: 'center',
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  trailParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    bottom: '40%',
  },
  loopCounter: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  loopCounterText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
  },
});

export default GlassMascotLarge;
