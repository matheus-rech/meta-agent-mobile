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
/knowledge <query> Search the knowledge base

R/Statistics Commands:
/r <code>          Execute R code
/r-status          Check R environment status
/meta              Show meta-analysis help
/forest            Generate forest plot
/funnel            Generate funnel plot

Tips:
• Type any message to chat with the AI agent
• The agent can help with research, analysis, and tasks
• Use natural language - no special syntax needed
• For meta-analysis, provide CSV data with study results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

const VERSION_TEXT = `
Meta Agent Mobile v1.2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built with:
• React Native + Expo SDK 54
• TypeScript 5.9
• Claude AI (Anthropic)
• R Statistical Computing

Features:
• CLI Terminal Interface
• AI-Powered Chat
• R Code Execution
• Meta-Analysis Tools
• Forest & Funnel Plots

Inspired by NeuroResearch Agent SDK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

const SKILLS_TEXT = `
Available Skills:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 research
   Search and analyze information from various sources

📊 analysis
   Perform data analysis and generate insights

✍️ writing
   Help with writing, editing, and summarization

💻 code
   Assist with coding tasks and explanations

🔧 tools
   Execute various utility functions

📈 r-statistics
   Execute R code for statistical analysis

🔬 meta-analysis
   Run meta-analyses with forest/funnel plots

📋 systematic-review
   Support PRISMA diagrams and risk of bias

📉 visualization
   Create data visualizations using R/ggplot2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

const META_HELP_TEXT = `
Meta-Analysis Guide:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data Format (CSV):
For binary outcomes:
  study,year,events_int,n_int,events_ctrl,n_ctrl
  Smith,2020,15,50,8,50
  Jones,2021,22,60,12,55

For continuous outcomes:
  study,year,n_int,mean_int,sd_int,n_ctrl,mean_ctrl,sd_ctrl
  Smith,2020,50,12.5,3.2,50,10.1,2.8
  Jones,2021,60,14.2,4.1,55,11.8,3.5

Effect Measures:
• OR  - Odds Ratio (binary)
• RR  - Risk Ratio (binary)
• RD  - Risk Difference (binary)
• MD  - Mean Difference (continuous)
• SMD - Standardized Mean Difference (continuous)

Example Usage:
"Run a meta-analysis on this data using odds ratio"
"Generate a forest plot for my systematic review"
"Check for publication bias with a funnel plot"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

const R_STATUS_PENDING = `
R Environment Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: Checking...
Use the server API to check R status in real-time.
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
    description: "Show persistent command history",
    usage: "/history",
    handler: async () => "__HISTORY__", // Handled by useAgent with persistent storage
  },

  "clear-history": {
    name: "clear-history",
    description: "Clear all command history",
    usage: "/clear-history",
    handler: async () => "__CLEAR_HISTORY__", // Handled by useAgent
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
R Integration: Enabled
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

  // R-related commands
  r: {
    name: "r",
    description: "Execute R code",
    usage: "/r <code>",
    handler: async (args) => {
      if (args.length === 0) {
        return `Usage: /r <code>
Example: /r print("Hello from R!")
Example: /r summary(cars)

For complex R code, describe what you want in natural language
and the AI will help generate and execute the code.`;
      }
      // Return a marker that indicates R code should be executed
      const code = args.join(" ");
      return `__R_EXECUTE__:${code}`;
    },
  },

  "r-status": {
    name: "r-status",
    description: "Check R environment status",
    usage: "/r-status",
    handler: async () => {
      // Return marker for R status check
      return "__R_STATUS__";
    },
  },

  meta: {
    name: "meta",
    description: "Show meta-analysis help",
    usage: "/meta",
    handler: async () => META_HELP_TEXT,
  },

  forest: {
    name: "forest",
    description: "Generate forest plot",
    usage: "/forest",
    handler: async () => {
      return `To generate a forest plot, provide your study data in CSV format.

Example data format:
study,year,events_int,n_int,events_ctrl,n_ctrl
Smith,2020,15,50,8,50
Jones,2021,22,60,12,55

You can:
1. Paste your CSV data and ask "generate a forest plot"
2. Describe your data and the AI will help format it
3. Upload a CSV file (coming soon)`;
    },
  },

  funnel: {
    name: "funnel",
    description: "Generate funnel plot",
    usage: "/funnel",
    handler: async () => {
      return `To generate a funnel plot for publication bias assessment, provide your study data.

A funnel plot helps identify:
• Publication bias
• Small-study effects
• Heterogeneity sources

Provide your meta-analysis data and ask "generate a funnel plot"
or "check for publication bias".`;
    },
  },

  knowledge: {
    name: "knowledge",
    description: "Search the knowledge base",
    usage: "/knowledge <query>",
    handler: async (args) => {
      if (args.length === 0) {
        return `__KNOWLEDGE_BROWSE__`; // Open knowledge browser
      }
      const query = args.join(" ");
      return `__KNOWLEDGE_SEARCH__:${query}`;
    },
  },

  kb: {
    name: "kb",
    description: "Alias for /knowledge",
    usage: "/kb <query>",
    handler: async (args) => {
      if (args.length === 0) {
        return `__KNOWLEDGE_BROWSE__`;
      }
      const query = args.join(" ");
      return `__KNOWLEDGE_SEARCH__:${query}`;
    },
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
