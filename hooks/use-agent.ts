/**
 * useAgent Hook
 * Manages agent state and interactions
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { TerminalMessage } from "@/components/terminal/terminal-output";
import { initializeMemory, getMemory, executeSlashCommand } from "@/lib/agent";

interface UseAgentReturn {
  messages: TerminalMessage[];
  isThinking: boolean;
  isConnected: boolean;
  sessionId: string;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAgent(): UseAgentReturn {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const memoryRef = useRef(getMemory());

  // tRPC mutation for chat
  const chatMutation = trpc.agent.chat.useMutation();

  // Health check query
  const healthQuery = trpc.agent.health.useQuery(undefined, {
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });

  // Initialize memory on mount
  useEffect(() => {
    const init = async () => {
      const memory = await initializeMemory();
      memoryRef.current = memory;
      setSessionId(memory.getSessionId());
    };
    init();
  }, []);

  // Update connection status based on health check
  useEffect(() => {
    setIsConnected(healthQuery.isSuccess && healthQuery.data?.status === "ok");
  }, [healthQuery.isSuccess, healthQuery.data]);

  // Generate unique message ID
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Add a message to the display
  const addMessage = useCallback((message: Omit<TerminalMessage, "id">) => {
    const fullMessage: TerminalMessage = {
      ...message,
      id: generateId(),
    };
    setMessages((prev) => [...prev, fullMessage]);
    return fullMessage;
  }, []);

  // Send a message to the agent
  const sendMessage = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Add to command history
      memoryRef.current.addToHistory(trimmed);

      // Check for slash commands
      const slashResult = await executeSlashCommand(trimmed);
      if (slashResult.handled) {
        // Add user message
        addMessage({
          type: "user",
          content: trimmed,
          timestamp: Date.now(),
        });

        // Handle special clear command
        if (slashResult.response === "__CLEAR__") {
          setMessages([]);
          return;
        }

        // Add system response
        if (slashResult.response) {
          addMessage({
            type: "system",
            content: slashResult.response,
            timestamp: Date.now(),
          });
        }
        return;
      }

      // Regular message - add user message
      addMessage({
        type: "user",
        content: trimmed,
        timestamp: Date.now(),
      });

      // Add to memory
      memoryRef.current.addMessage({
        role: "user",
        content: trimmed,
      });

      // Start thinking
      setIsThinking(true);

      try {
        // Get conversation history for context
        const history = memoryRef.current.getFormattedHistory(10);

        // Call agent API
        const result = await chatMutation.mutateAsync({
          message: trimmed,
          history,
        });

        if (result.success && result.response) {
          // Add agent response
          addMessage({
            type: "agent",
            content: result.response,
            timestamp: result.timestamp,
          });

          // Add to memory
          memoryRef.current.addMessage({
            role: "assistant",
            content: result.response,
          });
        } else {
          // Add error message
          addMessage({
            type: "error",
            content: result.response || "Failed to get response from agent.",
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error("Agent error:", error);
        addMessage({
          type: "error",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
          timestamp: Date.now(),
        });
      } finally {
        setIsThinking(false);
      }
    },
    [addMessage, chatMutation]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    memoryRef.current.clearMessages();
  }, []);

  return {
    messages,
    isThinking,
    isConnected,
    sessionId,
    sendMessage,
    clearMessages,
  };
}
