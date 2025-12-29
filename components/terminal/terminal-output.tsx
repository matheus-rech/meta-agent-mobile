import React, { useRef, useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { MarkdownRenderer } from "./markdown-renderer";
import { FileThumbnail } from "./file-thumbnail";
import { FileViewer } from "./file-viewer";

export interface FileAttachment {
  type: "image" | "plot" | "file";
  uri: string;
  name: string;
  mimeType?: string;
}

export interface TerminalMessage {
  id: string;
  type: "user" | "agent" | "system" | "error" | "success" | "code";
  content: string;
  timestamp: number;
  // Optional file attachments for visualization
  files?: FileAttachment[];
}

interface TerminalOutputProps {
  messages: TerminalMessage[];
  isThinking?: boolean;
}

export function TerminalOutput({ messages, isThinking }: TerminalOutputProps) {
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
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

  const getMessageStyle = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "user":
        return { color: colors.prompt };
      case "agent":
        return { color: colors.foreground };
      case "system":
        return { color: colors.muted };
      case "error":
        return { color: colors.error };
      case "success":
        return { color: colors.success };
      case "code":
        return { color: colors.code };
      default:
        return { color: colors.foreground };
    }
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
    const style = getMessageStyle(message.type);

    // User messages - simple text with prompt
    if (message.type === "user") {
      return (
        <View key={message.id} style={styles.messageContainer}>
          <Text style={[styles.terminalText, style]} selectable>
            {">"} {message.content}
          </Text>
        </View>
      );
    }

    // Agent messages - use markdown renderer
    if (message.type === "agent") {
      return (
        <View key={message.id} style={styles.agentMessageContainer}>
          <MarkdownRenderer content={message.content} />
          {message.files && message.files.length > 0 && renderFileAttachments(message.files)}
        </View>
      );
    }

    // Code blocks
    if (message.type === "code") {
      return (
        <View
          key={message.id}
          style={[styles.codeBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.terminalText, style]} selectable>
            {message.content}
          </Text>
        </View>
      );
    }

    // System, error, success messages
    return (
      <View key={message.id} style={styles.messageContainer}>
        <Text style={[styles.terminalText, style]} selectable>
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
        {/* ASCII Banner */}
        <View style={styles.bannerContainer}>
          <Text style={[styles.bannerText, { color: colors.prompt }]}>
{`╔═══════════════════════════════════════════════════╗
║  __  __      _           _                    _   ║
║ |  \\/  | ___| |_ __ _   / \\   __ _  ___ _ __ | |_ ║
║ | |\\/| |/ _ \\ __/ _\` | / _ \\ / _\` |/ _ \\ '_ \\| __|║
║ | |  | |  __/ || (_| |/ ___ \\ (_| |  __/ | | | |_ ║
║ |_|  |_|\\___|\\__\\__,_/_/   \\_\\__, |\\___|_| |_|\\__|║
║                              |___/                ║
║                                                   ║
║  AI-Powered Agent SDK for Mobile                  ║
╚═══════════════════════════════════════════════════╝`}
          </Text>
          <Text style={[styles.welcomeText, { color: colors.muted }]}>
            Type a command or message. Use /help for available commands.
          </Text>
        </View>

        {/* Messages */}
        {messages.map(renderMessage)}

        {/* Thinking Indicator */}
        {isThinking && (
          <View style={styles.messageContainer}>
            <ThinkingIndicator color={colors.muted} />
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

function ThinkingIndicator({ color }: { color: string }) {
  const [dots, setDots] = React.useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={[styles.terminalText, { color }]}>
      Thinking{dots}
    </Text>
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
    marginBottom: 16,
  },
  bannerText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 10,
    lineHeight: 12,
  },
  welcomeText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 12,
    marginTop: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  agentMessageContainer: {
    marginVertical: 8,
    paddingLeft: 4,
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
  codeBlock: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  filesContainer: {
    marginTop: 8,
    gap: 4,
  },
});
