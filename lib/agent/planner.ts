/**
 * Planner
 * Decomposes user requests into executable plans
 */

import { Plan, PlanStep } from "./types";
import { getSkillRegistry } from "./skills";

/**
 * Create a simple plan for a user request
 * Complex planning is handled by the AI backend
 */
export function createSimplePlan(message: string): Plan {
  const lowerMessage = message.toLowerCase();
  const registry = getSkillRegistry();
  const matchedSkills = registry.matchSkills(message);

  // Determine the primary action
  let action = "process";
  let tool: string | undefined;

  if (lowerMessage.includes("search") || lowerMessage.includes("find")) {
    action = "search";
    tool = "web_search";
  } else if (lowerMessage.includes("analyze") || lowerMessage.includes("analysis")) {
    action = "analyze";
    tool = "data_analysis";
  } else if (lowerMessage.includes("write") || lowerMessage.includes("draft")) {
    action = "write";
    tool = "text_generation";
  } else if (lowerMessage.includes("code") || lowerMessage.includes("program")) {
    action = "code";
    tool = "code_assistance";
  }

  const steps: PlanStep[] = [
    {
      id: 1,
      action: action,
      tool: tool,
      dependencies: [],
      description: message,
    },
  ];

  return {
    goal: message,
    steps,
    requiredTools: tool ? [tool] : [],
    estimatedTime: "1-2 minutes",
    context: {
      originalMessage: message,
      matchedSkills: matchedSkills.map((s) => s.name),
    },
  };
}

/**
 * Validate a plan
 */
export function validatePlan(plan: Plan): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!plan.goal) {
    issues.push("Plan has no goal");
  }

  if (!plan.steps || plan.steps.length === 0) {
    issues.push("Plan has no steps");
  }

  // Check for circular dependencies
  const stepIds = new Set(plan.steps.map((s) => s.id));
  for (const step of plan.steps) {
    for (const dep of step.dependencies) {
      if (!stepIds.has(dep)) {
        issues.push(`Step ${step.id} has invalid dependency: ${dep}`);
      }
      if (dep >= step.id) {
        issues.push(`Step ${step.id} has forward dependency: ${dep}`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Format a plan for display
 */
export function formatPlan(plan: Plan): string {
  const lines: string[] = [
    `Goal: ${plan.goal}`,
    `Estimated time: ${plan.estimatedTime}`,
    "",
    "Steps:",
  ];

  for (const step of plan.steps) {
    const deps = step.dependencies.length > 0 
      ? ` (depends on: ${step.dependencies.join(", ")})`
      : "";
    lines.push(`  ${step.id}. ${step.description}${deps}`);
  }

  if (plan.requiredTools.length > 0) {
    lines.push("");
    lines.push(`Required tools: ${plan.requiredTools.join(", ")}`);
  }

  return lines.join("\n");
}
