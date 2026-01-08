/**
 * TUIButton - ASCII-style button components for TUI interface
 * 
 * Buttons rendered with box-drawing characters and glass-blue colors.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// TUI Colors
const GLASS_BLUE = '#00BFFF';
const GLASS_DIM = '#006080';
const FOX_ORANGE = '#FF8C00';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

// ASCII box characters
const BOX = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  // Double line variants
  dTopLeft: '╔',
  dTopRight: '╗',
  dBottomLeft: '╚',
  dBottomRight: '╝',
  dHorizontal: '═',
  dVertical: '║',
};

// ASCII icons for buttons
const ASCII_ICONS = {
  microphone: `
 ╭───╮
 │ ◉ │
 │   │
 ╰─┬─╯
   │
  ╱│╲`,
  
  folder: `
 ╭──────╮
╭┴──────┴╮
│ ▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓ │
╰────────╯`,
  
  play: `
  ╱╲
 ╱  ╲
╱    ╲
╲    ╱
 ╲  ╱
  ╲╱`,
  
  tutorial: `
╭───────╮
│ ? ? ? │
│ ═════ │
│ ═══   │
╰───────╯`,
  
  data: `
╭─────────╮
│ A │ B │ C │
├───┼───┼───┤
│ 1 │ 2 │ 3 │
╰───┴───┴───╯`,
  
  send: `
    ╱
   ╱╱
  ╱╱╱
 ╱╱╱╱
  ╱╱╱
   ╱╱
    ╱`,
  
  settings: `
   ╭─╮
  ╱   ╲
 │  ◉  │
  ╲   ╱
   ╰─╯`,
  
  fox: `
 /\\   /\\
( ◉ _ ◉ )
 > ▼ <`,
};

interface TUIButtonProps {
  label: string;
  icon?: keyof typeof ASCII_ICONS;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'fox';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: object;
}

export function TUIButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}: TUIButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { border: GLASS_BLUE, text: GLASS_BLUE, bg: BLACK };
      case 'secondary':
        return { border: GLASS_DIM, text: GLASS_BLUE, bg: BLACK };
      case 'ghost':
        return { border: 'transparent', text: GLASS_BLUE, bg: 'transparent' };
      case 'fox':
        return { border: FOX_ORANGE, text: FOX_ORANGE, bg: BLACK };
      default:
        return { border: GLASS_BLUE, text: GLASS_BLUE, bg: BLACK };
    }
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small': return { h: 8, v: 4 };
      case 'medium': return { h: 16, v: 8 };
      case 'large': return { h: 24, v: 12 };
      default: return { h: 16, v: 8 };
    }
  };
  
  const colors = getColors();
  const padding = getPadding();
  const labelLength = label.length;
  const horizontalLine = BOX.horizontal.repeat(labelLength + 4);
  
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <View style={[styles.buttonBox, { backgroundColor: colors.bg }]}>
        {/* Top border */}
        <Text style={[styles.borderText, { color: colors.border }]}>
          {BOX.topLeft}{horizontalLine}{BOX.topRight}
        </Text>
        
        {/* Content row */}
        <View style={styles.contentRow}>
          <Text style={[styles.borderText, { color: colors.border }]}>
            {BOX.vertical}
          </Text>
          
          <View style={[styles.content, { paddingHorizontal: padding.h, paddingVertical: padding.v }]}>
            {icon && (
              <Text style={[styles.iconText, { color: colors.text }]}>
                {getIconChar(icon)}
              </Text>
            )}
            <Text style={[styles.labelText, { color: colors.text }]}>
              {label}
            </Text>
          </View>
          
          <Text style={[styles.borderText, { color: colors.border }]}>
            {BOX.vertical}
          </Text>
        </View>
        
        {/* Bottom border */}
        <Text style={[styles.borderText, { color: colors.border }]}>
          {BOX.bottomLeft}{horizontalLine}{BOX.bottomRight}
        </Text>
      </View>
    </Pressable>
  );
}

// Simple icon character mapping
function getIconChar(icon: keyof typeof ASCII_ICONS): string {
  switch (icon) {
    case 'microphone': return '🎤';
    case 'folder': return '📁';
    case 'play': return '▶';
    case 'tutorial': return '📖';
    case 'data': return '📊';
    case 'send': return '➤';
    case 'settings': return '⚙';
    case 'fox': return '🦊';
    default: return '';
  }
}

// Icon-only TUI button
interface TUIIconButtonProps {
  icon: keyof typeof ASCII_ICONS;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'fox';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  tooltip?: string;
  style?: object;
}

export function TUIIconButton({
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  tooltip,
  style,
}: TUIIconButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { border: GLASS_BLUE, icon: GLASS_BLUE };
      case 'secondary':
        return { border: GLASS_DIM, icon: GLASS_BLUE };
      case 'ghost':
        return { border: 'transparent', icon: GLASS_BLUE };
      case 'fox':
        return { border: FOX_ORANGE, icon: FOX_ORANGE };
      default:
        return { border: GLASS_BLUE, icon: GLASS_BLUE };
    }
  };
  
  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'medium': return 44;
      case 'large': return 56;
      default: return 44;
    }
  };
  
  const colors = getColors();
  const buttonSize = getSize();
  
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconContainer,
        {
          width: buttonSize,
          height: buttonSize,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.iconButtonText, { color: colors.icon, fontSize: buttonSize * 0.5 }]}>
        {getIconChar(icon)}
      </Text>
    </Pressable>
  );
}

// TUI Action Bar with multiple buttons
interface TUIActionBarProps {
  actions: Array<{
    icon: keyof typeof ASCII_ICONS;
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'fox';
  }>;
  style?: object;
}

export function TUIActionBar({ actions, style }: TUIActionBarProps) {
  return (
    <View style={[styles.actionBar, style]}>
      <Text style={styles.actionBarBorder}>
        {BOX.topLeft}{BOX.horizontal.repeat(actions.length * 12)}{BOX.topRight}
      </Text>
      
      <View style={styles.actionBarContent}>
        <Text style={styles.actionBarBorder}>{BOX.vertical}</Text>
        
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            <Pressable
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.actionIcon, { color: action.variant === 'fox' ? FOX_ORANGE : GLASS_BLUE }]}>
                {getIconChar(action.icon)}
              </Text>
              <Text style={[styles.actionLabel, { color: action.variant === 'fox' ? FOX_ORANGE : GLASS_BLUE }]}>
                {action.label}
              </Text>
            </Pressable>
            
            {index < actions.length - 1 && (
              <Text style={styles.actionBarBorder}>{BOX.vertical}</Text>
            )}
          </React.Fragment>
        ))}
        
        <Text style={styles.actionBarBorder}>{BOX.vertical}</Text>
      </View>
      
      <Text style={styles.actionBarBorder}>
        {BOX.bottomLeft}{BOX.horizontal.repeat(actions.length * 12)}{BOX.bottomRight}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  buttonBox: {
    alignItems: 'center',
  },
  borderText: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconText: {
    fontSize: 16,
  },
  labelText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLACK,
  },
  iconButtonText: {
    fontFamily: 'monospace',
  },
  actionBar: {
    alignItems: 'center',
    backgroundColor: BLACK,
  },
  actionBarBorder: {
    color: GLASS_BLUE,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  actionBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
});

export default TUIButton;
