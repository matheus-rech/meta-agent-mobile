import { useState, useCallback } from "react";
import { KeyboardAvoidingView, Platform, View, TouchableOpacity, Text } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import {
  TerminalOutput,
  TerminalInput,
  TerminalStatusBar,
  CSVPicker,
  SnippetsLibrary,
  ExportSheet,
} from "@/components/terminal";
import type { CSVData } from "@/components/terminal";
import { useAgent } from "@/hooks/use-agent";
import { useColors } from "@/hooks/use-colors";

/**
 * Terminal Screen
 * Main CLI interface for interacting with the Meta Agent
 */
export default function TerminalScreen() {
  const colors = useColors();
  const { messages, isThinking, isConnected, sessionId, sendMessage, addSystemMessage } = useAgent();

  // Modal states
  const [showCSVPicker, setShowCSVPicker] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportContent, setExportContent] = useState<{
    type: "image" | "text" | "code" | "csv";
    data: string;
    filename?: string;
  } | undefined>(undefined);

  // Handle CSV file selection
  const handleCSVSelected = useCallback((data: CSVData) => {
    setShowCSVPicker(false);
    
    // Create a summary message for the terminal
    const summary = `📊 Loaded: ${data.fileName}\n` +
      `   Columns: ${data.headers.join(", ")}\n` +
      `   Rows: ${data.rows.length} studies`;
    
    addSystemMessage(summary);
    
    // Store the CSV data for use in R commands
    // The data will be available via the agent context
    sendMessage(`/data load ${data.fileName}`, { csvData: data });
  }, [addSystemMessage, sendMessage]);

  // Handle snippet insertion
  const handleSnippetInsert = useCallback((code: string) => {
    // Send the R code to be executed
    sendMessage(`/r ${code}`);
  }, [sendMessage]);

  // Handle export request (called from message actions)
  const handleExportRequest = useCallback((content: {
    type: "image" | "text" | "code" | "csv";
    data: string;
    filename?: string;
  }) => {
    setExportContent(content);
    setShowExport(true);
  }, []);

  return (
    <ScreenContainer
      edges={["top", "left", "right"]}
      containerClassName="bg-terminal"
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Status Bar */}
        <TerminalStatusBar
          isConnected={isConnected}
          sessionId={sessionId}
          isThinking={isThinking}
        />

        {/* Terminal Output */}
        <View style={{ flex: 1, backgroundColor: colors.terminal }}>
          <TerminalOutput
            messages={messages}
            isThinking={isThinking}
          />
        </View>

        {/* Quick Actions Bar */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowCSVPicker(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.terminal,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 14 }}>📁</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              Import CSV
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSnippets(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.terminal,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 14 }}>📝</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              Snippets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Export last code or result
              const lastCodeMessage = [...messages].reverse().find(
                (m) => m.type === "agent" && m.content.includes("```")
              );
              if (lastCodeMessage) {
                const codeMatch = lastCodeMessage.content.match(/```[\w]*\n([\s\S]*?)```/);
                if (codeMatch) {
                  handleExportRequest({
                    type: "code",
                    data: codeMatch[1],
                    filename: "code.R",
                  });
                }
              }
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.terminal,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 14 }}>📤</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              Export
            </Text>
          </TouchableOpacity>
        </View>

        {/* Command Input */}
        <TerminalInput
          onSubmit={sendMessage}
          disabled={isThinking}
          placeholder="Type a command or message..."
        />
      </KeyboardAvoidingView>

      {/* CSV Picker Modal */}
      <CSVPicker
        visible={showCSVPicker}
        onFileSelected={handleCSVSelected}
        onCancel={() => setShowCSVPicker(false)}
      />

      {/* Snippets Library Modal */}
      <SnippetsLibrary
        visible={showSnippets}
        onClose={() => setShowSnippets(false)}
        onInsert={handleSnippetInsert}
      />

      {/* Export Sheet Modal */}
      <ExportSheet
        visible={showExport}
        onClose={() => {
          setShowExport(false);
          setExportContent(undefined);
        }}
        content={exportContent}
      />
    </ScreenContainer>
  );
}
