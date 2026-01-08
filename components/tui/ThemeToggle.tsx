/**
 * ThemeToggle Component
 * 
 * Toggle between dark and light themes with TUI styling.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from '../../lib/theme-provider';
import { useColors } from '@/hooks/use-colors';

interface ThemeToggleProps {
  compact?: boolean;
  showLabel?: boolean;
}

export function ThemeToggle({ compact = false, showLabel = true }: ThemeToggleProps) {
  const { colorScheme, setColorScheme } = useThemeContext();
  const colors = useColors();
  
  const isDark = colorScheme === 'dark';
  
  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setColorScheme(isDark ? 'light' : 'dark');
  };
  
  if (compact) {
    return (
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.compactButton,
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={styles.icon}>{isDark ? '🌙' : '☀️'}</Text>
      </Pressable>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {showLabel && (
        <Text style={[styles.label, { color: colors.foreground }]}>Theme</Text>
      )}
      
      <View style={[styles.toggleContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {/* Light Option */}
        <Pressable
          onPress={() => {
            if (isDark) {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setColorScheme('light');
            }
          }}
          style={[
            styles.option,
            !isDark && [styles.optionActive, { backgroundColor: colors.primary }],
          ]}
        >
          <Text style={styles.optionIcon}>☀️</Text>
          <Text style={[
            styles.optionText,
            { color: !isDark ? '#000' : colors.muted },
          ]}>
            Light
          </Text>
        </Pressable>
        
        {/* Dark Option */}
        <Pressable
          onPress={() => {
            if (!isDark) {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setColorScheme('dark');
            }
          }}
          style={[
            styles.option,
            isDark && [styles.optionActive, { backgroundColor: colors.primary }],
          ]}
        >
          <Text style={styles.optionIcon}>🌙</Text>
          <Text style={[
            styles.optionText,
            { color: isDark ? '#000' : colors.muted },
          ]}>
            Dark
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * TUI-styled theme toggle with ASCII borders
 */
export function TUIThemeToggle() {
  const { colorScheme, setColorScheme } = useThemeContext();
  const colors = useColors();
  
  const isDark = colorScheme === 'dark';
  
  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setColorScheme(isDark ? 'light' : 'dark');
  };
  
  return (
    <Pressable
      onPress={handleToggle}
      style={({ pressed }) => [
        styles.tuiContainer,
        { 
          borderColor: colors.primary,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.tuiLabel, { color: colors.primary }]}>
        ┌─ THEME ─┐
      </Text>
      <View style={styles.tuiContent}>
        <Text style={[styles.tuiIcon, { color: isDark ? colors.primary : colors.muted }]}>
          {isDark ? '🌙' : '☀️'}
        </Text>
        <Text style={[styles.tuiText, { color: colors.primary }]}>
          {isDark ? 'DARK' : 'LIGHT'}
        </Text>
      </View>
      <Text style={[styles.tuiFooter, { color: colors.primary }]}>
        └──────────┘
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 6,
  },
  optionActive: {
    borderRadius: 6,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  compactButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  tuiContainer: {
    borderWidth: 1,
    padding: 4,
  },
  tuiLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  tuiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  tuiIcon: {
    fontSize: 16,
  },
  tuiText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  tuiFooter: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default ThemeToggle;
