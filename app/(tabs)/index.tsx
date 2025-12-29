import { KeyboardAvoidingView, Platform, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { TerminalOutput, TerminalInput, TerminalStatusBar } from "@/components/terminal";
import { useAgent } from "@/hooks/use-agent";
import { useColors } from "@/hooks/use-colors";

/**
 * Terminal Screen
 * Main CLI interface for interacting with the Meta Agent
 */
export default function TerminalScreen() {
  const colors = useColors();
  const { messages, isThinking, isConnected, sessionId, sendMessage } = useAgent();

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
          <TerminalOutput messages={messages} isThinking={isThinking} />
        </View>

        {/* Command Input */}
        <TerminalInput
          onSubmit={sendMessage}
          disabled={isThinking}
          placeholder="Type a command or message..."
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
