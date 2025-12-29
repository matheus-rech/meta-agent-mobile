/**
 * useAgent Hook
 * Manages agent state and interactions
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { TerminalMessage, FileAttachment } from "@/components/terminal/terminal-output";
import { initializeMemory, getMemory, executeSlashCommand } from "@/lib/agent";

interface UseAgentReturn {
  messages: TerminalMessage[];
  isThinking: boolean;
  isConnected: boolean;
  sessionId: string;
  rStatus: REnvironmentStatus | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  executeRCode: (code: string) => Promise<void>;
  checkRStatus: () => Promise<void>;
}

interface REnvironmentStatus {
  available: boolean;
  version?: string;
  packages: Record<string, boolean>;
}

export function useAgent(): UseAgentReturn {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [rStatus, setRStatus] = useState<REnvironmentStatus | null>(null);
  const memoryRef = useRef(getMemory());

  // tRPC mutations and queries
  const chatMutation = trpc.agent.chat.useMutation();
  const rExecuteMutation = trpc.r.execute.useMutation();
  const rStatusQuery = trpc.r.status.useQuery(undefined, {
    enabled: false, // Only fetch on demand
  });

  // Health check query
  const healthQuery = trpc.agent.health.useQuery(undefined, {
    refetchInterval: 30000,
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

  // Execute R code
  const executeRCode = useCallback(
    async (code: string) => {
      setIsThinking(true);
      
      addMessage({
        type: "system",
        content: `Executing R code...\n\`\`\`r\n${code}\n\`\`\``,
        timestamp: Date.now(),
      });

      try {
        const result = await rExecuteMutation.mutateAsync({ code });

        if (result.success) {
          // Build response with output and files
          let responseContent = "";
          
          if (result.output) {
            responseContent += `**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n\n`;
          }

          // Convert file contents to attachments
          const files: FileAttachment[] = [];
          
          if (result.fileContents) {
            for (const [filename, content] of Object.entries(result.fileContents)) {
              if (content.startsWith("data:image/")) {
                files.push({
                  type: "image",
                  uri: content,
                  name: filename,
                  mimeType: "image/png",
                });
              } else if (filename.endsWith(".json")) {
                try {
                  const parsed = JSON.parse(content);
                  responseContent += `**${filename}:**\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\`\n\n`;
                } catch {
                  responseContent += `**${filename}:**\n\`\`\`\n${content}\n\`\`\`\n\n`;
                }
              } else {
                responseContent += `**${filename}:**\n\`\`\`\n${content}\n\`\`\`\n\n`;
              }
            }
          }

          if (result.files && result.files.length > 0) {
            responseContent += `**Generated files:** ${result.files.join(", ")}\n`;
          }

          responseContent += `\n*Execution time: ${result.executionTime}ms*`;

          addMessage({
            type: "agent",
            content: responseContent || "R code executed successfully.",
            timestamp: Date.now(),
            files: files.length > 0 ? files : undefined,
          });
        } else {
          addMessage({
            type: "error",
            content: `R execution failed: ${result.error || "Unknown error"}`,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        addMessage({
          type: "error",
          content: `R execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: Date.now(),
        });
      } finally {
        setIsThinking(false);
      }
    },
    [addMessage, rExecuteMutation]
  );

  // Check R environment status
  const checkRStatus = useCallback(async () => {
    setIsThinking(true);
    
    try {
      const result = await rStatusQuery.refetch();
      
      if (result.data) {
        setRStatus({
          available: result.data.available,
          version: result.data.version,
          packages: result.data.packages,
        });

        const packageList = Object.entries(result.data.packages)
          .map(([pkg, installed]) => `  ${installed ? "✓" : "✗"} ${pkg}`)
          .join("\n");

        addMessage({
          type: "system",
          content: `
**R Environment Status:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${result.data.available ? "Available ✓" : "Not Available ✗"}
${result.data.version ? `Version: ${result.data.version}` : ""}

**Installed Packages:**
${packageList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim(),
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      addMessage({
        type: "error",
        content: `Failed to check R status: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsThinking(false);
    }
  }, [addMessage, rStatusQuery]);

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

        // Handle R execution command
        if (slashResult.response?.startsWith("__R_EXECUTE__:")) {
          const code = slashResult.response.slice("__R_EXECUTE__:".length);
          await executeRCode(code);
          return;
        }

        // Handle R status command
        if (slashResult.response === "__R_STATUS__") {
          await checkRStatus();
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
          // Check if response contains R code that should be executed
          const rCodeMatch = result.response.match(/```r\n([\s\S]*?)```/);
          
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
    [addMessage, chatMutation, executeRCode, checkRStatus]
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
    rStatus,
    sendMessage,
    clearMessages,
    executeRCode,
    checkRStatus,
  };
}
