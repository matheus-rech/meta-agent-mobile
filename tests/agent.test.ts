import { describe, it, expect } from "vitest";

// Import the actual modules - these are pure TypeScript that don't need React Native
import { executeSlashCommand, getCommandSuggestions, slashCommands } from "../lib/agent/commands";
import { SkillRegistry, availableSkills } from "../lib/agent/skills";
import { createSimplePlan, validatePlan, formatPlan } from "../lib/agent/planner";
import type { Plan, PlanStep } from "../lib/agent/types";

describe("Slash Commands", () => {
  it("should have required commands defined", () => {
    expect(slashCommands.help).toBeDefined();
    expect(slashCommands.clear).toBeDefined();
    expect(slashCommands.history).toBeDefined();
    expect(slashCommands.reset).toBeDefined();
    expect(slashCommands.status).toBeDefined();
    expect(slashCommands.skills).toBeDefined();
    expect(slashCommands.version).toBeDefined();
  });

  it("should execute /help command", async () => {
    const result = await executeSlashCommand("/help");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("Available Commands");
    expect(result.response).toContain("/help");
    expect(result.response).toContain("/clear");
  });

  it("should execute /version command", async () => {
    const result = await executeSlashCommand("/version");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("Meta Agent Mobile");
    expect(result.response).toContain("v1.2.0");
  });

  it("should execute /skills command", async () => {
    const result = await executeSlashCommand("/skills");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("Available Skills");
    expect(result.response).toContain("research");
    expect(result.response).toContain("analysis");
  });

  it("should return special marker for /clear", async () => {
    const result = await executeSlashCommand("/clear");
    expect(result.handled).toBe(true);
    expect(result.response).toBe("__CLEAR__");
  });

  it("should not handle non-slash messages", async () => {
    const result = await executeSlashCommand("hello world");
    expect(result.handled).toBe(false);
    expect(result.response).toBeUndefined();
  });

  it("should handle unknown commands", async () => {
    const result = await executeSlashCommand("/unknown");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("Unknown command");
    expect(result.response).toContain("/unknown");
  });

  it("should get command suggestions for partial input", () => {
    const suggestions = getCommandSuggestions("/he");
    expect(suggestions).toContain("/help");
    // /history starts with /hi not /he, so test /hi separately
    const histSuggestions = getCommandSuggestions("/hi");
    expect(histSuggestions).toContain("/history");
  });

  it("should return empty suggestions for non-slash input", () => {
    const suggestions = getCommandSuggestions("hello");
    expect(suggestions).toHaveLength(0);
  });

  it("should get all suggestions for just slash", () => {
    const suggestions = getCommandSuggestions("/");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain("/help");
    expect(suggestions).toContain("/clear");
  });
});

describe("Skills System", () => {
  it("should have default skills registered", () => {
    expect(availableSkills.length).toBeGreaterThan(0);
    const skillNames = availableSkills.map((s) => s.name);
    expect(skillNames).toContain("research");
    expect(skillNames).toContain("analysis");
    expect(skillNames).toContain("writing");
    expect(skillNames).toContain("code");
    expect(skillNames).toContain("tools");
  });

  it("should create a new skill registry", () => {
    const registry = new SkillRegistry();
    const skills = registry.getAll();
    expect(skills.length).toBe(availableSkills.length);
  });

  it("should get skill by name", () => {
    const registry = new SkillRegistry();
    const research = registry.get("research");
    expect(research).toBeDefined();
    expect(research?.name).toBe("research");
    expect(research?.triggers.length).toBeGreaterThan(0);
  });

  it("should return undefined for non-existent skill", () => {
    const registry = new SkillRegistry();
    const skill = registry.get("nonexistent");
    expect(skill).toBeUndefined();
  });

  it("should match research skill based on message", () => {
    const registry = new SkillRegistry();
    const matches = registry.matchSkills("search for AI papers");
    expect(matches.some((s) => s.name === "research")).toBe(true);
  });

  it("should match analysis skill based on message", () => {
    const registry = new SkillRegistry();
    const matches = registry.matchSkills("analyze this data");
    expect(matches.some((s) => s.name === "analysis")).toBe(true);
  });

  it("should match writing skill based on message", () => {
    const registry = new SkillRegistry();
    const matches = registry.matchSkills("write a summary");
    expect(matches.some((s) => s.name === "writing")).toBe(true);
  });

  it("should match code skill based on message", () => {
    const registry = new SkillRegistry();
    const matches = registry.matchSkills("debug this code");
    expect(matches.some((s) => s.name === "code")).toBe(true);
  });

  it("should check if skill exists", () => {
    const registry = new SkillRegistry();
    expect(registry.has("research")).toBe(true);
    expect(registry.has("nonexistent")).toBe(false);
  });

  it("should get skill descriptions", () => {
    const registry = new SkillRegistry();
    const descriptions = registry.getSkillDescriptions();
    expect(descriptions).toContain("research");
    expect(descriptions).toContain("analysis");
  });

  it("should register a custom skill", () => {
    const registry = new SkillRegistry();
    const customSkill = {
      name: "custom",
      description: "A custom skill",
      triggers: ["custom", "special"],
    };
    registry.register(customSkill);
    expect(registry.has("custom")).toBe(true);
    expect(registry.get("custom")?.description).toBe("A custom skill");
  });
});

describe("Planner", () => {
  it("should create a simple plan from message", () => {
    const plan = createSimplePlan("search for AI papers");
    expect(plan.goal).toBe("search for AI papers");
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.estimatedTime).toBeDefined();
  });

  it("should identify search action", () => {
    const plan = createSimplePlan("search for machine learning");
    expect(plan.steps[0].action).toBe("search");
    expect(plan.steps[0].tool).toBe("web_search");
  });

  it("should identify analyze action", () => {
    const plan = createSimplePlan("analyze this dataset");
    expect(plan.steps[0].action).toBe("analyze");
    expect(plan.steps[0].tool).toBe("data_analysis");
  });

  it("should identify write action", () => {
    const plan = createSimplePlan("write a summary");
    expect(plan.steps[0].action).toBe("write");
    expect(plan.steps[0].tool).toBe("text_generation");
  });

  it("should identify code action", () => {
    const plan = createSimplePlan("help me code a function");
    expect(plan.steps[0].action).toBe("code");
    expect(plan.steps[0].tool).toBe("code_assistance");
  });

  it("should use process action for generic messages", () => {
    const plan = createSimplePlan("hello world");
    expect(plan.steps[0].action).toBe("process");
  });

  it("should include matched skills in context", () => {
    const plan = createSimplePlan("search for papers");
    expect(plan.context.matchedSkills).toBeDefined();
    expect(Array.isArray(plan.context.matchedSkills)).toBe(true);
  });

  it("should validate a valid plan", () => {
    const plan = createSimplePlan("test task");
    const validation = validatePlan(plan);
    expect(validation.valid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });

  it("should detect missing goal", () => {
    const plan: Plan = {
      goal: "",
      steps: [{ id: 1, action: "test", dependencies: [], description: "test" }],
      requiredTools: [],
      estimatedTime: "1m",
      context: {},
    };
    const validation = validatePlan(plan);
    expect(validation.valid).toBe(false);
    expect(validation.issues).toContain("Plan has no goal");
  });

  it("should detect empty steps", () => {
    const plan: Plan = {
      goal: "test",
      steps: [],
      requiredTools: [],
      estimatedTime: "1m",
      context: {},
    };
    const validation = validatePlan(plan);
    expect(validation.valid).toBe(false);
    expect(validation.issues).toContain("Plan has no steps");
  });

  it("should detect invalid dependencies", () => {
    const plan: Plan = {
      goal: "test",
      steps: [{ id: 1, action: "test", dependencies: [99], description: "test" }],
      requiredTools: [],
      estimatedTime: "1m",
      context: {},
    };
    const validation = validatePlan(plan);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((i) => i.includes("invalid dependency"))).toBe(true);
  });

  it("should detect forward dependencies", () => {
    const plan: Plan = {
      goal: "test",
      steps: [
        { id: 1, action: "first", dependencies: [2], description: "first step" },
        { id: 2, action: "second", dependencies: [], description: "second step" },
      ],
      requiredTools: [],
      estimatedTime: "1m",
      context: {},
    };
    const validation = validatePlan(plan);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((i) => i.includes("forward dependency"))).toBe(true);
  });

  it("should format plan for display", () => {
    const plan = createSimplePlan("search for AI");
    const formatted = formatPlan(plan);
    expect(formatted).toContain("Goal:");
    expect(formatted).toContain("Steps:");
    expect(formatted).toContain("Estimated time:");
  });

  it("should include required tools in formatted output", () => {
    const plan = createSimplePlan("search for AI");
    const formatted = formatPlan(plan);
    if (plan.requiredTools.length > 0) {
      expect(formatted).toContain("Required tools:");
    }
  });
});

describe("Agent Types", () => {
  it("should have correct PlanStep structure", () => {
    const step: PlanStep = {
      id: 1,
      action: "test",
      dependencies: [],
      description: "A test step",
    };
    expect(step.id).toBe(1);
    expect(step.action).toBe("test");
    expect(step.dependencies).toEqual([]);
    expect(step.description).toBe("A test step");
  });

  it("should allow optional tool in PlanStep", () => {
    const step: PlanStep = {
      id: 1,
      action: "search",
      tool: "web_search",
      dependencies: [],
      description: "Search step",
    };
    expect(step.tool).toBe("web_search");
  });

  it("should allow optional toolArgs in PlanStep", () => {
    const step: PlanStep = {
      id: 1,
      action: "search",
      tool: "web_search",
      toolArgs: { query: "AI papers" },
      dependencies: [],
      description: "Search step",
    };
    expect(step.toolArgs?.query).toBe("AI papers");
  });
});
