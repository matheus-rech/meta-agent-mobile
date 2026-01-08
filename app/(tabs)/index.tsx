import { useState, useCallback, useEffect } from "react";
import { KeyboardAvoidingView, Platform, View, TouchableOpacity, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  TerminalOutput,
  CSVPicker,
  SnippetsLibrary,
  ExportSheet,
} from "@/components/terminal";
import { GlassStatusBarTUI, GlassChatInput, QuickPromptsBar } from "@/components/glass";
import type { CSVData } from "@/components/terminal";
import { PracticeDatasets } from "@/components/tutorial";
import { useAgent } from "@/hooks/use-agent";
import { useGlass } from "@/hooks/use-glass";
import { useColors } from "@/hooks/use-colors";
import { hasCompletedOnboarding } from "@/app/onboarding";
import { useTutorialAction, useTutorial } from "@/hooks/use-tutorial";
import type { TerminalMessage } from "@/components/terminal/terminal-output";

/**
 * Terminal Screen
 * Main CLI interface for interacting with Glass 🦊 AI Agent
 * Now powered by MiniMax M2.1 with RAG knowledge base
 */
export default function TerminalScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ teachTopic?: string; teachContext?: string }>();
  
  // Original agent for slash commands and R execution
  const { 
    messages: agentMessages, 
    isThinking: agentThinking, 
    isConnected, 
    sessionId: agentSessionId, 
    sendMessage: sendAgentMessage, 
    addSystemMessage,
    navigateHistoryPrevious,
    navigateHistoryNext,
    resetHistoryNavigation,
  } = useAgent();

  // Glass AI for natural language chat
  const {
    messages: glassMessages,
    isThinking: glassThinking,
    glassState,
    sessionId: glassSessionId,
    sendMessage: sendGlassMessage,
    isReady: glassReady,
  } = useGlass();

  const { completeAction, completeSocratic, isInTutorial } = useTutorialAction();
  const { statistics, modules, isModuleCompleted } = useTutorial();
  const tutorialProgress = Math.round((statistics.modulesCompleted / statistics.totalModules) * 100);
  const hasStartedTutorial = statistics.modulesCompleted > 0 || tutorialProgress > 0;

  // Combine messages from both sources with skills metadata
  const [combinedMessages, setCombinedMessages] = useState<TerminalMessage[]>([]);
  
  useEffect(() => {
    // Convert Glass messages to terminal format and merge with agent messages
    const glassTerminalMessages: TerminalMessage[] = glassMessages.map(msg => ({
      id: msg.id,
      type: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'agent' : 'system',
      content: msg.content,
      timestamp: msg.timestamp,
      // Include skills and language metadata for display
      skillsUsed: msg.skillsUsed,
      language: msg.language,
    }));

    // Merge and sort by timestamp
    const allMessages = [...agentMessages, ...glassTerminalMessages];
    allMessages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Deduplicate by id
    const seen = new Set<string>();
    const unique = allMessages.filter(msg => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });

    setCombinedMessages(unique);
  }, [agentMessages, glassMessages]);

  // Combined thinking state
  const isThinking = agentThinking || glassThinking;

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
      // Send a Socratic teaching request to Glass
      const teachPrompt = `Please teach me about "${params.teachTopic}" using the Socratic method. Ask me guiding questions to help me understand the concept deeply.${params.teachContext ? `\n\nContext: ${params.teachContext}` : ''}`;
      sendGlassMessage(teachPrompt);
      // Complete Socratic tutorial step if in tutorial
      if (isInTutorial) {
        completeSocratic();
      }
      // Clear the params to prevent re-triggering
      router.setParams({ teachTopic: undefined, teachContext: undefined });
    }
  }, [params.teachTopic, params.teachContext, sendGlassMessage, isInTutorial, completeSocratic]);

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

  // Handle message submission - route to appropriate handler
  const handleSubmit = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Slash commands go to agent
    if (trimmed.startsWith('/')) {
      sendAgentMessage(trimmed);
      if (isInTutorial) {
        completeAction(`command:${trimmed.split(' ')[0]}`);
      }
    } else {
      // Natural language goes to Glass
      sendGlassMessage(trimmed);
      if (isInTutorial) {
        completeAction(`message:${trimmed}`);
        completeSocratic();
      }
    }
  }, [sendAgentMessage, sendGlassMessage, isInTutorial, completeAction, completeSocratic]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((prompt: string) => {
    sendGlassMessage(prompt);
    if (isInTutorial) {
      completeAction(`message:${prompt}`);
      completeSocratic();
    }
  }, [sendGlassMessage, isInTutorial, completeAction, completeSocratic]);

  // Handle CSV file selection
  const handleCSVSelected = useCallback((data: CSVData) => {
    setShowCSVPicker(false);
    
    // Create a summary message for the terminal
    const summary = `📊 Loaded: ${data.fileName}\n` +
      `   Columns: ${data.headers.join(", ")}\n` +
      `   Rows: ${data.rows.length} studies`;
    
    addSystemMessage(summary);
    
    // Store the CSV data for use in R commands
    sendAgentMessage(`/data load ${data.fileName}`, { csvData: data });
  }, [addSystemMessage, sendAgentMessage]);

  // Handle snippet insertion
  const handleSnippetInsert = useCallback((code: string) => {
    // Send the R code to be executed
    sendAgentMessage(`/r ${code}`);
  }, [sendAgentMessage]);

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
        {/* Glass Status Bar with TUI style */}
        <GlassStatusBarTUI
          isConnected={isConnected || glassReady}
          sessionId={glassSessionId || agentSessionId}
          isThinking={isThinking}
          modelName="MiniMax M2.1"
          nextLesson={modules.find(m => !isModuleCompleted(m.id))?.title}
        />

        {/* Terminal Output */}
        <View style={{ flex: 1, backgroundColor: colors.terminal }}>
          <TerminalOutput
            messages={combinedMessages}
            isThinking={isThinking}
          />
        </View>

        {/* Quick Prompts Bar - Show when no messages yet */}
        {combinedMessages.length === 0 && (
          <QuickPromptsBar onSelectPrompt={handleQuickPrompt} />
        )}

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
            <Text style={{ fontSize: 14 }}>{"📚"}</Text>
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
            <Text style={{ fontSize: 14 }}>{"🧪"}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              {"Sample Data"}
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
            <Text style={{ fontSize: 14 }}>{"📁"}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              {"Import"}
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
            <Text style={{ fontSize: 14 }}>{"📝"}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              {"Snippets"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Export last code or result
              const lastCodeMessage = [...combinedMessages].reverse().find(
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
            <Text style={{ fontSize: 14 }}>{"📤"}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "500" }}>
              {"Export"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Glass Chat Input - Direct connection to MiniMax M2.1 */}
        <GlassChatInput
          onSubmit={handleSubmit}
          disabled={!glassReady && !isConnected}
          isThinking={isThinking}
          glassState={glassState}
          placeholder="Ask Glass about meta-analysis..."
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
          sendAgentMessage(`/data load ${data.fileName}`, { csvData: data });
        }}
      />
    </ScreenContainer>
  );
}
