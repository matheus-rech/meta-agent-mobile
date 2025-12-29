/**
 * Slash Commands
 * Built-in commands for the terminal interface
 */

import { SlashCommand } from "./types";
import { getMemory } from "./memory";

const HELP_TEXT = `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/help              Show this help message
/clear             Clear the terminal output
/history           Show command history
/reset             Reset the conversation context
/status            Show agent status
/skills            List available skills
/version           Show version info

Tips:
• Type any message to chat with the AI agent
• The agent can help with research, analysis, and tasks
• Use natural language - no special syntax needed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

const VERSION_TEXT = `
Meta Agent Mobile v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built with:
• React Native + Expo SDK 54
• TypeScript 5.9
• Claude AI (Anthropic)

Inspired by NeuroResearch Agent SDK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

const SKILLS_TEXT = `
Available Skills:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 research
   Search and analyze information from various sources

📊 analysis
   Perform data analysis and generate insights

📝 writing
   Help with writing, editing, and summarization

💻 code
   Assist with coding tasks and explanations

🔧 tools
   Execute various utility functions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

export const slashCommands: Record<string, SlashCommand> = {
  help: {
    name: "help",
    description: "Show available commands",
    usage: "/help",
    handler: async () => HELP_TEXT,
  },

  clear: {
    name: "clear",
    description: "Clear the terminal output",
    usage: "/clear",
    handler: async () => "__CLEAR__", // Special marker handled by terminal
  },

  history: {
    name: "history",
    description: "Show command history",
    usage: "/history [search]",
    handler: async (args) => {
      const memory = getMemory();
      const history = memory.getCommandHistory();

      if (args.length > 0) {
        const query = args.join(" ");
        const filtered = memory.searchHistory(query);
        if (filtered.length === 0) {
          return `No commands found matching "${query}"`;
        }
        return `Search results for "${query}":\n${filtered.slice(-20).map((cmd, i) => `${i + 1}. ${cmd}`).join("\n")}`;
      }

      if (history.length === 0) {
        return "No command history yet.";
      }

      const recent = history.slice(-20);
      return `Recent commands:\n${recent.map((cmd, i) => `${i + 1}. ${cmd}`).join("\n")}`;
    },
  },

  reset: {
    name: "reset",
    description: "Reset conversation context",
    usage: "/reset",
    handler: async () => {
      const memory = getMemory();
      memory.clearMessages();
      return "Conversation context has been reset.";
    },
  },

  status: {
    name: "status",
    description: "Show agent status",
    usage: "/status",
    handler: async () => {
      const memory = getMemory();
      const state = memory.getState();
      const messageCount = state.messages.length;
      const historyCount = memory.getCommandHistory().length;

      return `
Agent Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session ID: ${state.id.slice(0, 16)}...
Messages in context: ${messageCount}
Commands in history: ${historyCount}
Status: Ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    },
  },

  skills: {
    name: "skills",
    description: "List available skills",
    usage: "/skills",
    handler: async () => SKILLS_TEXT,
  },

  version: {
    name: "version",
    description: "Show version information",
    usage: "/version",
    handler: async () => VERSION_TEXT,
  },
};

/**
 * Parse and execute a slash command
 */
export async function executeSlashCommand(
  input: string
): Promise<{ handled: boolean; response?: string }> {
  if (!input.startsWith("/")) {
    return { handled: false };
  }

  const parts = input.slice(1).split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  const command = slashCommands[commandName];

  if (!command) {
    return {
      handled: true,
      response: `Unknown command: /${commandName}\nType /help for available commands.`,
    };
  }

  try {
    const response = await command.handler(args);
    return { handled: true, response };
  } catch (error) {
    return {
      handled: true,
      response: `Error executing /${commandName}: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get command suggestions for autocomplete
 */
export function getCommandSuggestions(partial: string): string[] {
  if (!partial.startsWith("/")) {
    return [];
  }

  const search = partial.slice(1).toLowerCase();
  return Object.keys(slashCommands)
    .filter((name) => name.startsWith(search))
    .map((name) => `/${name}`);
}
