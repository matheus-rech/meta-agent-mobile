/**
 * ASCII Art and Terminal Branding Components
 * 
 * Provides distinctive CLI-style branding elements inspired by Claude Code.
 * Includes ASCII logos, styled boxes, and terminal decorations.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';

/**
 * Main Meta Agent ASCII Logo
 * Displayed at terminal startup
 */
export function ASCIILogo() {
  const colors = useColors();
  
  const logo = `
███╗   ███╗███████╗████████╗ █████╗ 
████╗ ████║██╔════╝╚══██╔══╝██╔══██╗
██╔████╔██║█████╗     ██║   ███████║
██║╚██╔╝██║██╔══╝     ██║   ██╔══██║
██║ ╚═╝ ██║███████╗   ██║   ██║  ██║
╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝
     █████╗  ██████╗ ███████╗███╗   ██╗████████╗
    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   
    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   
    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   
    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   
`.trim();

  return (
    <View style={styles.logoContainer}>
      <Text style={[styles.logoText, { color: colors.primary }]}>
        {logo}
      </Text>
      <Text style={[styles.tagline, { color: colors.muted }]}>
        AI-Powered Meta-Analysis Assistant
      </Text>
    </View>
  );
}

/**
 * Compact ASCII Logo for headers
 */
export function ASCIILogoCompact() {
  const colors = useColors();
  
  const logo = `
╔╦╗╔═╗╔╦╗╔═╗  ╔═╗╔═╗╔═╗╔╗╔╔╦╗
║║║║╣  ║ ╠═╣  ╠═╣║ ╦║╣ ║║║ ║ 
╩ ╩╚═╝ ╩ ╩ ╩  ╩ ╩╚═╝╚═╝╝╚╝ ╩ 
`.trim();

  return (
    <View style={styles.compactLogoContainer}>
      <Text style={[styles.compactLogoText, { color: colors.primary }]}>
        {logo}
      </Text>
    </View>
  );
}

/**
 * Mini logo for status bar
 */
export function ASCIILogoMini() {
  const colors = useColors();
  
  return (
    <Text style={[styles.miniLogo, { color: colors.primary }]}>
      ◆ META
    </Text>
  );
}

/**
 * Styled box for important messages
 */
interface StyledBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function StyledBox({ title, children, variant = 'default' }: StyledBoxProps) {
  const colors = useColors();
  
  const getVariantColor = () => {
    switch (variant) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.primary;
      default: return colors.border;
    }
  };
  
  const borderColor = getVariantColor();
  
  return (
    <View style={styles.styledBoxContainer}>
      {title && (
        <Text style={[styles.boxTitle, { color: borderColor }]}>
          ┌─ {title} {'─'.repeat(Math.max(0, 30 - title.length))}┐
        </Text>
      )}
      <View style={[styles.boxContent, { borderLeftColor: borderColor }]}>
        {typeof children === 'string' ? (
          <Text style={[styles.boxText, { color: colors.foreground }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
      {title && (
        <Text style={[styles.boxBottom, { color: borderColor }]}>
          └{'─'.repeat(34)}┘
        </Text>
      )}
    </View>
  );
}

/**
 * Command prompt prefix
 */
interface CommandPromptProps {
  sessionId?: string;
  isConnected?: boolean;
}

export function CommandPrompt({ sessionId, isConnected = true }: CommandPromptProps) {
  const colors = useColors();
  
  return (
    <View style={styles.promptContainer}>
      <Text style={[styles.promptSymbol, { color: isConnected ? colors.success : colors.error }]}>
        {isConnected ? '●' : '○'}
      </Text>
      <Text style={[styles.promptPath, { color: colors.primary }]}>
        meta
      </Text>
      <Text style={[styles.promptSeparator, { color: colors.muted }]}>
        :
      </Text>
      <Text style={[styles.promptSession, { color: colors.muted }]}>
        {sessionId ? sessionId.slice(0, 8) : 'local'}
      </Text>
      <Text style={[styles.promptArrow, { color: colors.primary }]}>
        {' '}❯{' '}
      </Text>
    </View>
  );
}

/**
 * Thinking/Processing indicator
 */
interface ThinkingIndicatorProps {
  message?: string;
}

export function ThinkingIndicator({ message = 'Thinking' }: ThinkingIndicatorProps) {
  const colors = useColors();
  const [dots, setDots] = React.useState('');
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={styles.thinkingContainer}>
      <Text style={[styles.thinkingSpinner, { color: colors.warning }]}>⟳</Text>
      <Text style={[styles.thinkingText, { color: colors.muted }]}>
        {message}{dots}
      </Text>
    </View>
  );
}

/**
 * Success message with checkmark
 */
interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  const colors = useColors();
  
  return (
    <View style={styles.statusMessage}>
      <Text style={[styles.statusIcon, { color: colors.success }]}>✓</Text>
      <Text style={[styles.statusText, { color: colors.success }]}>{message}</Text>
    </View>
  );
}

/**
 * Error message with X
 */
interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const colors = useColors();
  
  return (
    <View style={styles.statusMessage}>
      <Text style={[styles.statusIcon, { color: colors.error }]}>✗</Text>
      <Text style={[styles.statusText, { color: colors.error }]}>{message}</Text>
    </View>
  );
}

/**
 * Warning message
 */
interface WarningMessageProps {
  message: string;
}

export function WarningMessage({ message }: WarningMessageProps) {
  const colors = useColors();
  
  return (
    <View style={styles.statusMessage}>
      <Text style={[styles.statusIcon, { color: colors.warning }]}>⚠</Text>
      <Text style={[styles.statusText, { color: colors.warning }]}>{message}</Text>
    </View>
  );
}

/**
 * Info message
 */
interface InfoMessageProps {
  message: string;
}

export function InfoMessage({ message }: InfoMessageProps) {
  const colors = useColors();
  
  return (
    <View style={styles.statusMessage}>
      <Text style={[styles.statusIcon, { color: colors.primary }]}>ℹ</Text>
      <Text style={[styles.statusText, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

/**
 * Divider line
 */
export function Divider() {
  const colors = useColors();
  
  return (
    <Text style={[styles.divider, { color: colors.border }]}>
      {'─'.repeat(50)}
    </Text>
  );
}

/**
 * Section header
 */
interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  const colors = useColors();
  const padding = Math.max(0, Math.floor((46 - title.length) / 2));
  
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: colors.muted }]}>
        ──{' '.repeat(padding)}{title}{' '.repeat(padding)}──
      </Text>
    </View>
  );
}

/**
 * Code block with syntax highlighting placeholder
 */
interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'r' }: CodeBlockProps) {
  const colors = useColors();
  
  // Simple R syntax highlighting
  const highlightR = (text: string) => {
    // This is a simplified version - in production you'd use a proper highlighter
    return text;
  };
  
  return (
    <View style={[styles.codeBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.codeHeader}>
        <Text style={[styles.codeLanguage, { color: colors.muted }]}>
          {language.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.codeText, { color: colors.foreground }]}>
        {highlightR(code)}
      </Text>
    </View>
  );
}

/**
 * Help command output
 */
export function HelpOutput() {
  const colors = useColors();
  
  const helpText = `
╔══════════════════════════════════════════════════╗
║                 META AGENT HELP                  ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  COMMANDS                                        ║
║  ────────                                        ║
║  /help          Show this help message           ║
║  /clear         Clear terminal history           ║
║  /data load     Load CSV data file               ║
║  /run           Execute R code                   ║
║  /forest        Generate forest plot             ║
║  /funnel        Generate funnel plot             ║
║  /export        Export results                   ║
║  /model         Manage AI models                 ║
║  /settings      Open settings                    ║
║                                                  ║
║  SHORTCUTS                                       ║
║  ─────────                                       ║
║  ↑/↓            Navigate command history         ║
║  Tab            Autocomplete command             ║
║  Ctrl+C         Cancel current operation         ║
║                                                  ║
║  TIPS                                            ║
║  ────                                            ║
║  • Type naturally to ask questions               ║
║  • Use /run for R code execution                 ║
║  • Upload CSV for meta-analysis data             ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`.trim();

  return (
    <Text style={[styles.helpText, { color: colors.primary }]}>
      {helpText}
    </Text>
  );
}

/**
 * Welcome message for new sessions
 */
export function WelcomeMessage() {
  const colors = useColors();
  
  return (
    <View style={styles.welcomeContainer}>
      <ASCIILogoCompact />
      <Text style={[styles.welcomeText, { color: colors.muted }]}>
        Type a command or message. Use /help for available commands.
      </Text>
    </View>
  );
}

/**
 * Session start banner
 */
interface SessionBannerProps {
  sessionId: string;
  timestamp?: Date;
}

export function SessionBanner({ sessionId, timestamp = new Date() }: SessionBannerProps) {
  const colors = useColors();
  const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
  
  return (
    <View style={styles.sessionBanner}>
      <Text style={[styles.sessionBannerText, { color: colors.muted }]}>
        ┌─────────────────────────────────────────┐
      </Text>
      <Text style={[styles.sessionBannerText, { color: colors.muted }]}>
        │  Session: {sessionId.slice(0, 8).padEnd(10)} {dateStr} {timeStr}  │
      </Text>
      <Text style={[styles.sessionBannerText, { color: colors.muted }]}>
        └─────────────────────────────────────────┘
      </Text>
    </View>
  );
}

/**
 * R Output block
 */
interface ROutputProps {
  output: string;
  isError?: boolean;
}

export function ROutput({ output, isError = false }: ROutputProps) {
  const colors = useColors();
  
  return (
    <View style={[styles.rOutput, { borderLeftColor: isError ? colors.error : colors.success }]}>
      <Text style={[styles.rOutputLabel, { color: isError ? colors.error : colors.success }]}>
        {isError ? '[R Error]' : '[R Output]'}
      </Text>
      <Text style={[styles.rOutputText, { color: colors.foreground }]}>
        {output}
      </Text>
    </View>
  );
}

/**
 * Progress bar for operations
 */
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  const colors = useColors();
  const filled = Math.floor(progress / 5);
  const empty = 20 - filled;
  
  return (
    <View style={styles.progressBarContainer}>
      <Text style={[styles.progressBarText, { color: colors.muted }]}>
        {label && `${label} `}[{'█'.repeat(filled)}{'░'.repeat(empty)}] {progress}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoText: {
    fontFamily: 'monospace',
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 8,
  },
  compactLogoContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  compactLogoText: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -0.3,
  },
  miniLogo: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  styledBoxContainer: {
    marginVertical: 8,
  },
  boxTitle: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  boxContent: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 8,
    marginLeft: 2,
  },
  boxText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
  },
  boxBottom: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptSymbol: {
    fontSize: 10,
    marginRight: 6,
  },
  promptPath: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
  promptSeparator: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  promptSession: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  promptArrow: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  thinkingSpinner: {
    fontSize: 14,
    marginRight: 8,
  },
  thinkingText: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: 'bold',
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  divider: {
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 8,
  },
  sectionHeader: {
    marginVertical: 12,
  },
  sectionHeaderText: {
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
  },
  codeBlock: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
    overflow: 'hidden',
  },
  codeHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  codeLanguage: {
    fontFamily: 'monospace',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    padding: 12,
  },
  helpText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 14,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  welcomeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  sessionBanner: {
    alignItems: 'center',
    marginVertical: 8,
  },
  sessionBannerText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 14,
  },
  rOutput: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginVertical: 8,
  },
  rOutputLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 4,
  },
  rOutputText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  progressBarContainer: {
    paddingVertical: 4,
  },
  progressBarText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
