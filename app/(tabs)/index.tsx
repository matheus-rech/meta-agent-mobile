import { useState, useCallback, useEffect } from "react";
import { KeyboardAvoidingView, Platform, View, TouchableOpacity, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
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
import { PracticeDatasets } from "@/components/tutorial";
import { useAgent } from "@/hooks/use-agent";
import { useColors } from "@/hooks/use-colors";
import { hasCompletedOnboarding } from "@/app/onboarding";
import { useTutorialAction, useTutorial } from "@/hooks/use-tutorial";

/**
 * Terminal Screen
 * Main CLI interface for interacting with the Meta Agent
 */
export default function TerminalScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ teachTopic?: string; teachContext?: string }>();
  const { 
    messages, 
    isThinking, 
    isConnected, 
    sessionId, 
    sendMessage, 
    addSystemMessage,
    navigateHistoryPrevious,
    navigateHistoryNext,
    resetHistoryNavigation,
  } = useAgent();
  const { completeAction, completeSocratic, isInTutorial } = useTutorialAction();
  const { statistics, modules } = useTutorial();
  const tutorialProgress = Math.round((statistics.modulesCompleted / statistics.totalModules) * 100);
  const hasStartedTutorial = statistics.modulesCompleted > 0 || tutorialProgress > 0;

  // Check if onboarding is needed on first launch
  useEffect(() => {
    hasCompletedOnboarding().then((completed) => {
      if (!completed) {
        router.replace('/onboarding' as any);
      }
    });
  }, []);

  // Handle Learn More navigation from knowledge base
  useEffect(() => {
    if (params.teachTopic) {
      // Send a Socratic teaching request
      const teachPrompt = `Please teach me about "${params.teachTopic}" using the Socratic method. Ask me guiding questions to help me understand the concept deeply.${params.teachContext ? `\n\nContext: ${params.teachContext}` : ''}`;
      sendMessage(teachPrompt);
      // Complete Socratic tutorial step if in tutorial
      if (isInTutorial) {
        completeSocratic();
      }
      // Clear the params to prevent re-triggering
      router.setParams({ teachTopic: undefined, teachContext: undefined });
    }
  }, [params.teachTopic, params.teachContext, sendMessage, isInTutorial, completeSocratic]);

  // Modal states
  const [showCSVPicker, setShowCSVPicker] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPracticeData, setShowPracticeData] = useState(false);
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
          {/* Tutorial Button - Prominent for new users */}
          <TouchableOpacity
            onPress={() => router.push('/tutorial' as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: hasStartedTutorial ? colors.terminal : '#0ea5e9',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 14 }}>📚</Text>
            <Text style={{ 
              color: hasStartedTutorial ? colors.foreground : '#ffffff', 
              fontSize: 12, 
              fontWeight: "600" 
            }}>
              {hasStartedTutorial ? `Tutorial ${tutorialProgress}%` : 'Start Tutorial'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPracticeData(true)}
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
            <Text style={{ fontSize: 14 }}>🧪</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              Sample Data
            </Text>
          </TouchableOpacity>

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
              Import
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
          onSubmit={(command: string) => {
            sendMessage(command);
            // Track tutorial actions
            if (isInTutorial) {
              if (command.startsWith('/')) {
                completeAction(`command:${command.split(' ')[0]}`);
              } else {
                completeAction(`message:${command}`);
                // Also check for Socratic completion on AI interactions
                completeSocratic();
              }
            }
          }}
          disabled={isThinking}
          placeholder="Type a command or message..."
          isConnected={isConnected}
          sessionId={sessionId}
          onHistoryPrevious={navigateHistoryPrevious}
          onHistoryNext={navigateHistoryNext}
          onHistoryReset={resetHistoryNavigation}
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

      {/* Practice Datasets Modal */}
      <PracticeDatasets
        visible={showPracticeData}
        onClose={() => setShowPracticeData(false)}
        onLoadDataset={(data) => {
          setShowPracticeData(false);
          const summary = `📊 Loaded: ${data.fileName}\n` +
            `   Columns: ${data.headers.join(", ")}\n` +
            `   Rows: ${data.rows.length} studies`;
          addSystemMessage(summary);
          sendMessage(`/data load ${data.fileName}`, { csvData: data });
        }}
      />
    </ScreenContainer>
  );
}
