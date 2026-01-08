import React, { useRef, useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { MarkdownRenderer } from "./markdown-renderer";
import { FileThumbnail } from "./file-thumbnail";
import { FileViewer } from "./file-viewer";
import {
  ASCIILogoCompact,
  CommandPrompt,
  ThinkingIndicator as StyledThinkingIndicator,
  SuccessMessage,
  ErrorMessage,
  InfoMessage,
  CodeBlock,
  ROutput,
  SessionBanner,
} from "./ascii-art";
import { SkillBadgesRow, SpeakButton, type SkillId } from "@/components/glass";

export interface FileAttachment {
  type: "image" | "plot" | "file";
  uri: string;
  name: string;
  mimeType?: string;
}

export interface TerminalMessage {
  id: string;
  type: "user" | "agent" | "system" | "error" | "success" | "code" | "r-output" | "r-error";
  content: string;
  timestamp: number;
  files?: FileAttachment[];
  skillsUsed?: string[];
  language?: string;
}

interface TerminalOutputProps {
  messages: TerminalMessage[];
  isThinking?: boolean;
  sessionId?: string;
  isConnected?: boolean;
}

export function TerminalOutput({ 
  messages, 
  isThinking, 
  sessionId = "local",
  isConnected = true,
}: TerminalOutputProps) {
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isThinking]);

  const handleFilePress = (file: FileAttachment) => {
    setSelectedFile(file);
    setViewerVisible(true);
  };

  const handleCloseViewer = () => {
    setViewerVisible(false);
    setTimeout(() => setSelectedFile(null), 300);
  };

  const renderFileAttachments = (files: FileAttachment[]) => {
    return (
      <View style={styles.filesContainer}>
        {files.map((file, index) => (
          <FileThumbnail
            key={`${file.uri}-${index}`}
            file={file}
            onPress={() => handleFilePress(file)}
          />
        ))}
      </View>
    );
  };

  const renderMessage = (message: TerminalMessage) => {
    // User messages - styled with command prompt
    if (message.type === "user") {
      return (
        <View key={message.id} style={styles.userMessageContainer}>
          <View style={styles.userMessageRow}>
            <Text style={[styles.promptSymbol, { color: colors.success }]}>❯</Text>
            <Text style={[styles.userText, { color: colors.foreground }]} selectable>
              {message.content}
            </Text>
          </View>
        </View>
      );
    }

    // Agent messages - use markdown renderer with styled container
    if (message.type === "agent") {
      return (
        <View key={message.id} style={styles.agentMessageContainer}>
          <View style={styles.agentHeader}>
            <Text style={[styles.agentLabel, { color: colors.primary }]}>{"◆ GLASS 🦊"}</Text>
            <View style={styles.agentHeaderActions}>
              <SpeakButton text={message.content} language={message.language} size="small" />
              <Text style={[styles.timestamp, { color: colors.muted }]}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={[styles.agentContent, { borderLeftColor: colors.primary }]}>
            <MarkdownRenderer content={message.content} />
            {message.files && message.files.length > 0 && renderFileAttachments(message.files)}
            {message.skillsUsed && message.skillsUsed.length > 0 && (
              <SkillBadgesRow skills={message.skillsUsed as SkillId[]} size="small" />
            )}
          </View>
        </View>
      );
    }

    // R Output
    if (message.type === "r-output") {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <ROutput output={message.content} isError={false} />
          {message.files && message.files.length > 0 && renderFileAttachments(message.files)}
        </View>
      );
    }

    // R Error
    if (message.type === "r-error") {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <ROutput output={message.content} isError={true} />
        </View>
      );
    }

    // Code blocks - enhanced styling
    if (message.type === "code") {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <CodeBlock code={message.content} language="r" />
        </View>
      );
    }

    // Success messages
    if (message.type === "success") {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <SuccessMessage message={message.content} />
          {message.files && message.files.length > 0 && renderFileAttachments(message.files)}
        </View>
      );
    }

    // Error messages
    if (message.type === "error") {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <ErrorMessage message={message.content} />
        </View>
      );
    }

    // System/info messages
    if (message.type === "system") {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <InfoMessage message={message.content} />
          {message.files && message.files.length > 0 && renderFileAttachments(message.files)}
        </View>
      );
    }

    // Default fallback
    return (
      <View key={message.id} style={styles.messageContainer}>
        <Text style={[styles.terminalText, { color: colors.foreground }]} selectable>
          {message.content}
        </Text>
        {message.files && message.files.length > 0 && renderFileAttachments(message.files)}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.terminal }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Enhanced ASCII Banner */}
        <View style={styles.bannerContainer}>
          <ASCIILogoCompact />
          <Text style={[styles.welcomeText, { color: colors.muted }]}>
            Type a command or message. Use /help for available commands.
          </Text>
        </View>

        {/* Session Banner */}
        <SessionBanner sessionId={sessionId} />

        {/* Messages */}
        {messages.map(renderMessage)}

        {/* Enhanced Thinking Indicator */}
        {isThinking && (
          <View style={styles.thinkingContainer}>
            <StyledThinkingIndicator message="Processing" />
          </View>
        )}
      </ScrollView>

      {/* File Viewer Modal */}
      <FileViewer
        file={selectedFile}
        visible={viewerVisible}
        onClose={handleCloseViewer}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  bannerContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    marginVertical: 8,
    marginTop: 12,
  },
  userMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promptSymbol: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    lineHeight: 20,
  },
  userText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  agentMessageContainer: {
    marginVertical: 8,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  agentLabel: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    fontWeight: 'bold',
  },
  agentHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
  },
  agentContent: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    marginLeft: 2,
  },
  terminalText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 14,
    lineHeight: 20,
  },
  filesContainer: {
    marginTop: 8,
    gap: 4,
  },
  thinkingContainer: {
    marginVertical: 8,
    paddingLeft: 4,
  },
});
