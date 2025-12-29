/**
 * Executor
 * Executes plans step by step
 */

import { Plan, PlanStep, ExecutionResult, StepResult } from "./types";
import { getSkillRegistry } from "./skills";

const MAX_RETRIES = 3;

/**
 * Execute a plan
 */
export async function executePlan(
  plan: Plan,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const stepResults: StepResult[] = [];
  const outputs: Record<string, unknown> = {};
  const errors: string[] = [];

  const completed = new Set<number>();

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];

    // Report progress
    onProgress?.(i + 1, plan.steps.length, step.description);

    // Check dependencies
    const depsComplete = step.dependencies.every((d) => completed.has(d));
    if (!depsComplete) {
      errors.push(`Step ${step.id}: Dependencies not met`);
      stepResults.push({
        stepId: step.id,
        success: false,
        error: "Dependencies not met",
        duration: 0,
      });
      continue;
    }

    // Execute step with retries
    const result = await executeStep(step, outputs);
    stepResults.push(result);

    if (result.success) {
      completed.add(step.id);
      if (result.output !== undefined) {
        outputs[`step_${step.id}`] = result.output;
      }
    } else {
      errors.push(`Step ${step.id}: ${result.error}`);

      // Check if this is a blocking error
      const isBlocking = plan.steps
        .slice(i + 1)
        .some((s) => s.dependencies.includes(step.id));

      if (isBlocking) {
        errors.push("Stopping execution due to blocking error");
        break;
      }
    }
  }

  return {
    success: errors.length === 0,
    stepResults,
    outputs,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Execute a single step with retries
 */
async function executeStep(
  step: PlanStep,
  previousOutputs: Record<string, unknown>
): Promise<StepResult> {
  const startTime = Date.now();
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const output = await runStep(step, previousOutputs);

      return {
        stepId: step.id,
        success: true,
        output,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (attempt < MAX_RETRIES) {
        // Wait before retry with exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    stepId: step.id,
    success: false,
    error: lastError,
    duration: Date.now() - startTime,
  };
}

/**
 * Run a single step
 */
async function runStep(
  step: PlanStep,
  previousOutputs: Record<string, unknown>
): Promise<unknown> {
  // No tool specified - just return the action description
  if (!step.tool) {
    return { action: step.action, description: step.description };
  }

  // Get the skill registry
  const registry = getSkillRegistry();

  // Find the tool in registered skills
  for (const skill of registry.getAll()) {
    const tool = skill.tools?.find((t) => t.name === step.tool);
    if (tool) {
      const args = prepareArgs(step.toolArgs || {}, previousOutputs);
      return tool.handler(args);
    }
  }

  // Tool not found - delegate to AI
  return {
    type: "delegated",
    tool: step.tool,
    args: step.toolArgs,
    message: `Tool ${step.tool} delegated to AI backend`,
  };
}

/**
 * Prepare arguments with variable substitution
 */
function prepareArgs(
  args: Record<string, unknown>,
  outputs: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string") {
      // Substitute variables like {{step_1.output}}
      result[key] = value.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
        const parts = path.split(".");
        let current: unknown = outputs;

        for (const part of parts) {
          if (current && typeof current === "object" && part in current) {
            current = (current as Record<string, unknown>)[part];
          } else {
            return `{{${path}}}`; // Keep original if not found
          }
        }

        return typeof current === "string" ? current : JSON.stringify(current);
      });
    } else if (typeof value === "object" && value !== null) {
      result[key] = prepareArgs(value as Record<string, unknown>, outputs);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Format execution result for display
 */
export function formatExecutionResult(result: ExecutionResult): string {
  const lines: string[] = [];

  lines.push(`Execution ${result.success ? "succeeded" : "failed"}`);
  lines.push(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  lines.push("");

  lines.push("Step Results:");
  for (const step of result.stepResults) {
    const status = step.success ? "✓" : "✗";
    const duration = `(${step.duration}ms)`;
    const error = step.error ? ` - ${step.error}` : "";
    lines.push(`  ${status} Step ${step.stepId} ${duration}${error}`);
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("Errors:");
    for (const error of result.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join("\n");
}
