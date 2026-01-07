/**
 * GlassStatusBar - Enhanced status bar with Glass 🦊 branding
 * 
 * Displays:
 * - Glass logo and connection status
 * - Current date/time
 * - Active AI model
 * - Next lesson from tutorial
 * - Light/dark mode toggle
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/use-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  GLASS_LOGO_MINI,
  STATUS_ACTIVE,
  STATUS_PENDING,
} from '@/constants/ascii-art';

interface GlassStatusBarProps {
  isConnected: boolean;
  sessionId?: string;
  isThinking?: boolean;
  modelName?: string;
  nextLesson?: string;
  onToggleTheme?: () => void;
  showMascot?: boolean;
}

export function GlassStatusBar({
  isConnected,
  sessionId,
  isThinking,
  modelName = 'Mistral 7B',
  nextLesson,
  onToggleTheme,
  showMascot = true,
}: GlassStatusBarProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

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
      {/* Left: Glass branding */}
      <View style={styles.leftSection}>
        {showMascot && (
          <View style={styles.mascotContainer}>
            <Image
              source={
                isDark
                  ? require('@/assets/images/glass-fox-dark.png')
                  : require('@/assets/images/glass-fox-light.png')
              }
              style={styles.mascotImage}
              contentFit="contain"
            />
          </View>
        )}
        <Text style={[styles.logoText, { color: colors.primary }]}>
          {GLASS_LOGO_MINI}
        </Text>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isConnected ? colors.success : colors.error,
            },
          ]}
        />
      </View>

      {/* Center: Info */}
      <View style={styles.centerSection}>
        {isThinking ? (
          <Text style={[styles.thinkingText, { color: colors.warning }]}>
            🦊 Thinking...
          </Text>
        ) : (
          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              {formatDate()} {formatTime()}
            </Text>
            <Text style={[styles.separator, { color: colors.border }]}>│</Text>
            <Text style={[styles.modelText, { color: colors.primary }]}>
              {modelName}
            </Text>
          </View>
        )}
      </View>

      {/* Right: Actions */}
      <View style={styles.rightSection}>
        {nextLesson && (
          <View style={styles.lessonBadge}>
            <Text style={[styles.lessonText, { color: colors.muted }]} numberOfLines={1}>
              Next: {nextLesson}
            </Text>
          </View>
        )}
        
        {onToggleTheme && (
          <Pressable
            onPress={onToggleTheme}
            style={({ pressed }) => [
              styles.themeButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.themeIcon, { color: colors.foreground }]}>
              {isDark ? '☀️' : '🌙'}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    minHeight: 40,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  mascotContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mascotImage: {
    width: 24,
    height: 24,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
  },
  separator: {
    fontSize: 10,
  },
  modelText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    fontWeight: '600',
  },
  thinkingText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 11,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  lessonBadge: {
    maxWidth: 100,
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
    padding: 4,
  },
  themeIcon: {
    fontSize: 14,
  },
  sessionText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
  },
});

export default GlassStatusBar;
