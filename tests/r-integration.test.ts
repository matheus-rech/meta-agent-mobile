/**
 * R Integration Tests
 * Tests for R execution service, sandboxing, and meta-analysis features
 */

import { describe, it, expect } from "vitest";

// Import the modules we're testing
import { getSkillRegistry, availableSkills } from "../lib/agent/skills";
import { slashCommands, executeSlashCommand, getCommandSuggestions } from "../lib/agent/commands";

describe("R-Related Skills", () => {
  it("should have r-statistics skill registered", () => {
    const registry = getSkillRegistry();
    const skill = registry.get("r-statistics");
    
    expect(skill).toBeDefined();
    expect(skill?.name).toBe("r-statistics");
    expect(skill?.triggers).toContain("r code");
    expect(skill?.triggers).toContain("statistical analysis");
  });

  it("should have meta-analysis skill registered", () => {
    const registry = getSkillRegistry();
    const skill = registry.get("meta-analysis");
    
    expect(skill).toBeDefined();
    expect(skill?.name).toBe("meta-analysis");
    expect(skill?.triggers).toContain("meta-analysis");
    expect(skill?.triggers).toContain("forest plot");
    expect(skill?.triggers).toContain("funnel plot");
  });

  it("should have systematic-review skill registered", () => {
    const registry = getSkillRegistry();
    const skill = registry.get("systematic-review");
    
    expect(skill).toBeDefined();
    expect(skill?.triggers).toContain("prisma");
    expect(skill?.triggers).toContain("grade assessment");
  });

  it("should have risk-of-bias skill registered", () => {
    const registry = getSkillRegistry();
    const skill = registry.get("risk-of-bias");
    
    expect(skill).toBeDefined();
    expect(skill?.triggers).toContain("risk of bias");
    expect(skill?.triggers).toContain("rob2");
  });

  it("should have visualization skill registered", () => {
    const registry = getSkillRegistry();
    const skill = registry.get("visualization");
    
    expect(skill).toBeDefined();
    expect(skill?.triggers).toContain("plot");
    expect(skill?.triggers).toContain("ggplot");
  });

  it("should match meta-analysis triggers correctly", () => {
    const registry = getSkillRegistry();
    
    const matches1 = registry.matchSkills("run a meta-analysis on this data");
    expect(matches1.some(s => s.name === "meta-analysis")).toBe(true);
    
    const matches2 = registry.matchSkills("generate a forest plot");
    expect(matches2.some(s => s.name === "meta-analysis")).toBe(true);
    
    const matches3 = registry.matchSkills("check for publication bias with funnel plot");
    expect(matches3.some(s => s.name === "meta-analysis")).toBe(true);
  });

  it("should get R-related skills", () => {
    const registry = getSkillRegistry();
    const rSkills = registry.getRSkills();
    
    expect(rSkills.length).toBe(8);
    expect(rSkills.map(s => s.name)).toContain("r-statistics");
    expect(rSkills.map(s => s.name)).toContain("meta-analysis");
    expect(rSkills.map(s => s.name)).toContain("systematic-review");
    expect(rSkills.map(s => s.name)).toContain("visualization");
  });

  it("should include all 15 skills in availableSkills", () => {
    expect(availableSkills.length).toBe(15);
    const skillNames = availableSkills.map(s => s.name);
    expect(skillNames).toContain("research");
    expect(skillNames).toContain("analysis");
    expect(skillNames).toContain("writing");
    expect(skillNames).toContain("code");
    expect(skillNames).toContain("tools");
    expect(skillNames).toContain("r-statistics");
    expect(skillNames).toContain("meta-analysis");
    expect(skillNames).toContain("data-extraction");
    expect(skillNames).toContain("risk-of-bias");
    expect(skillNames).toContain("network-meta-analysis");
    expect(skillNames).toContain("trial-sequential-analysis");
    expect(skillNames).toContain("manuscript-writing");
    expect(skillNames).toContain("neurosurgery-literature");
    expect(skillNames).toContain("systematic-review");
    expect(skillNames).toContain("visualization");
  });
});

describe("R-Related Slash Commands", () => {
  it("should have /r command", () => {
    expect(slashCommands.r).toBeDefined();
    expect(slashCommands.r.name).toBe("r");
    expect(slashCommands.r.description).toContain("Execute R code");
  });

  it("should have /r-status command", () => {
    expect(slashCommands["r-status"]).toBeDefined();
    expect(slashCommands["r-status"].name).toBe("r-status");
  });

  it("should have /meta command", () => {
    expect(slashCommands.meta).toBeDefined();
    expect(slashCommands.meta.name).toBe("meta");
  });

  it("should have /forest command", () => {
    expect(slashCommands.forest).toBeDefined();
    expect(slashCommands.forest.name).toBe("forest");
  });

  it("should have /funnel command", () => {
    expect(slashCommands.funnel).toBeDefined();
    expect(slashCommands.funnel.name).toBe("funnel");
  });

  it("should execute /r command with code", async () => {
    const result = await executeSlashCommand("/r print(1+1)");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("__R_EXECUTE__:");
    expect(result.response).toContain("print(1+1)");
  });

  it("should execute /r command without code shows usage", async () => {
    const result = await executeSlashCommand("/r");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("Usage:");
    expect(result.response).toContain("/r <code>");
  });

  it("should execute /r-status command", async () => {
    const result = await executeSlashCommand("/r-status");
    expect(result.handled).toBe(true);
    expect(result.response).toBe("__R_STATUS__");
  });

  it("should execute /meta command", async () => {
    const result = await executeSlashCommand("/meta");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("Meta-Analysis Guide");
    expect(result.response).toContain("Data Format");
    expect(result.response).toContain("Effect Measures");
  });

  it("should execute /forest command", async () => {
    const result = await executeSlashCommand("/forest");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("forest plot");
    expect(result.response).toContain("CSV");
  });

  it("should execute /funnel command", async () => {
    const result = await executeSlashCommand("/funnel");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("funnel plot");
    expect(result.response).toContain("publication bias");
  });

  it("should suggest R commands in autocomplete", () => {
    const suggestions = getCommandSuggestions("/r");
    expect(suggestions).toContain("/r");
    expect(suggestions).toContain("/r-status");
    expect(suggestions).toContain("/reset");
  });

  it("should suggest /meta command", () => {
    const suggestions = getCommandSuggestions("/me");
    expect(suggestions).toContain("/meta");
  });

  it("should suggest /forest command", () => {
    const suggestions = getCommandSuggestions("/fo");
    expect(suggestions).toContain("/forest");
  });

  it("should suggest /funnel command", () => {
    const suggestions = getCommandSuggestions("/fu");
    expect(suggestions).toContain("/funnel");
  });
});

describe("Updated Help and Version Commands", () => {
  it("should include R commands in /help output", async () => {
    const result = await executeSlashCommand("/help");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("/r");
    expect(result.response).toContain("/r-status");
    expect(result.response).toContain("/meta");
    expect(result.response).toContain("/forest");
    expect(result.response).toContain("/funnel");
    expect(result.response).toContain("R/Statistics Commands");
  });

  it("should show R in /version output", async () => {
    const result = await executeSlashCommand("/version");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("R Statistical Computing");
    expect(result.response).toContain("Meta-Analysis Tools");
    expect(result.response).toContain("Forest & Funnel Plots");
  });

  it("should show R skills in /skills output", async () => {
    const result = await executeSlashCommand("/skills");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("r-statistics");
    expect(result.response).toContain("meta-analysis");
    expect(result.response).toContain("systematic-review");
    expect(result.response).toContain("visualization");
  });

  it("should show R integration in /status output", async () => {
    const result = await executeSlashCommand("/status");
    expect(result.handled).toBe(true);
    expect(result.response).toContain("R Integration: Enabled");
  });
});
