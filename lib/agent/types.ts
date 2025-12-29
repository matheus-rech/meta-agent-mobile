/**
 * Agent SDK Types
 * Core type definitions for the agent system
 */

// Message types for conversation
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

// Plan types for task decomposition
export interface Plan {
  goal: string;
  steps: PlanStep[];
  requiredTools: string[];
  estimatedTime: string;
  context: Record<string, unknown>;
}

export interface PlanStep {
  id: number;
  action: string;
  tool?: string;
  toolArgs?: Record<string, unknown>;
  dependencies: number[];
  description: string;
  expectedOutput?: string;
}

// Execution types
export interface ExecutionResult {
  success: boolean;
  stepResults: StepResult[];
  outputs: Record<string, unknown>;
  errors: string[];
  duration: number;
}

export interface StepResult {
  stepId: number;
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

// Skill types
export interface Skill {
  name: string;
  description: string;
  triggers: string[];
  tools?: SkillTool[];
}

export interface SkillTool {
  name: string;
  description: string;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

// Agent configuration
export interface AgentConfig {
  model: string;
  maxRetries: number;
  timeout: number;
  skills: string[];
}

// Session state
export interface SessionState {
  id: string;
  messages: Message[];
  currentPlan?: Plan;
  isThinking: boolean;
  lastActivity: number;
}

// Command types
export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[]) => Promise<string>;
}
