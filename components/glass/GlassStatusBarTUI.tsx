/**
 * GlassStatusBarTUI - Enhanced TUI-style status bar with Glass 🦊 branding
 * 
 * Maintains the terminal aesthetic while adding:
 * - Animated ASCII fox mascot
 * - Current date/time
 * - Active AI model
 * - Next lesson from tutorial
 * - Light/dark mode toggle
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  GLASS_LOGO_MINI,
  STATUS_ACTIVE,
  STATUS_PENDING,
  ASCII_FOX,
  ASCII_FOX_BLINK,
  ASCII_FOX_TALK,
  ASCII_FOX_THINK,
  ASCII_FOX_HAPPY,
  BOX,
} from '@/constants/ascii-art';

type FoxState = 'idle' | 'blink' | 'talk' | 'think' | 'happy';

interface GlassStatusBarTUIProps {
  isConnected: boolean;
  sessionId?: string;
  isThinking?: boolean;
  modelName?: string;
  nextLesson?: string;
  onToggleTheme?: () => void;
}

// Get ASCII fox based on state
function getFoxAscii(state: FoxState): string {
  switch (state) {
    case 'blink':
      return ASCII_FOX_BLINK;
    case 'talk':
      return ASCII_FOX_TALK;
    case 'think':
      return ASCII_FOX_THINK;
    case 'happy':
      return ASCII_FOX_HAPPY;
    default:
      return ASCII_FOX;
  }
}

export function GlassStatusBarTUI({
  isConnected,
  sessionId,
  isThinking,
  modelName = 'Mistral 7B',
  nextLesson,
  onToggleTheme,
}: GlassStatusBarTUIProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fox animation state
  const [foxState, setFoxState] = useState<FoxState>('idle');
  const blinkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fox blink animation
  useEffect(() => {
    if (isThinking) {
      setFoxState('think');
      return;
    }

    // Random blink every 3-6 seconds
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 3000;
      blinkInterval.current = setTimeout(() => {
        setFoxState('blink');
        setTimeout(() => {
          setFoxState('idle');
          scheduleBlink();
        }, 150);
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkInterval.current) {
        clearTimeout(blinkInterval.current);
      }
    };
  }, [isThinking]);

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const foxAscii = getFoxAscii(foxState);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Top border with TUI style */}
      <Text style={[styles.tuiBorder, { color: colors.border }]}>
        {BOX.topLeft}{BOX.horizontal.repeat(50)}{BOX.topRight}
      </Text>

      <View style={styles.contentRow}>
        {/* Left: Fox mascot + Glass logo */}
        <View style={styles.leftSection}>
          <View style={styles.foxContainer}>
            <Text style={[styles.foxAscii, { color: colors.primary }]}>
              {foxAscii}
            </Text>
          </View>
          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, { color: colors.primary }]}>
              {GLASS_LOGO_MINI}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isConnected ? colors.success : colors.error,
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.muted }]}>
                {isConnected ? STATUS_ACTIVE : STATUS_PENDING}
              </Text>
            </View>
          </View>
        </View>

        {/* Center: Info */}
        <View style={styles.centerSection}>
          {isThinking ? (
            <View style={styles.thinkingContainer}>
              <Text style={[styles.thinkingText, { color: colors.warning }]}>
                {BOX.vertical} 🦊 Processing... {BOX.vertical}
              </Text>
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <Text style={[styles.dateText, { color: colors.muted }]}>
                {formatDate()}
              </Text>
              <Text style={[styles.timeText, { color: colors.foreground }]}>
                {formatTime()}
              </Text>
              <Text style={[styles.modelText, { color: colors.primary }]}>
                {BOX.teeRight}{BOX.horizontal} {modelName}
              </Text>
            </View>
          )}
        </View>

        {/* Right: Actions */}
        <View style={styles.rightSection}>
          {nextLesson && (
            <View style={styles.lessonContainer}>
              <Text style={[styles.lessonLabel, { color: colors.muted }]}>
                Next:
              </Text>
              <Text 
                style={[styles.lessonText, { color: colors.foreground }]} 
                numberOfLines={1}
              >
                {nextLesson}
              </Text>
            </View>
          )}
          
          {onToggleTheme && (
            <Pressable
              onPress={onToggleTheme}
              style={({ pressed }) => [
                styles.themeButton,
                { 
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: colors.terminal,
                },
              ]}
            >
              <Text style={[styles.themeIcon, { color: colors.foreground }]}>
                {isDark ? '☀' : '☾'}
              </Text>
            </Pressable>
          )}

          {sessionId && (
            <Text style={[styles.sessionText, { color: colors.muted }]}>
              #{sessionId.slice(0, 6)}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom border with TUI style */}
      <Text style={[styles.tuiBorder, { color: colors.border }]}>
        {BOX.bottomLeft}{BOX.horizontal.repeat(50)}{BOX.bottomRight}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderBottomWidth: 0,
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 48,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  foxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  foxAscii: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 8,
    lineHeight: 9,
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 11,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
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
    fontSize: 9,
  },
  centerSection: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingContainer: {
    alignItems: 'center',
  },
  thinkingText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 11,
  },
  infoContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 9,
  },
  timeText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 14,
    fontWeight: '600',
  },
  modelText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 9,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  lessonContainer: {
    alignItems: 'flex-end',
    maxWidth: 80,
  },
  lessonLabel: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 8,
  },
  lessonText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 9,
  },
  themeButton: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeIcon: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 14,
  },
  sessionText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 9,
  },
});

export default GlassStatusBarTUI;
