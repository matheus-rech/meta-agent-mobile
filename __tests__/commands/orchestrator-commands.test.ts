/**
 * Tests for Orchestrator Slash Commands
 */

import { describe, it, expect } from 'vitest';
import { 
  slashCommands, 
  executeSlashCommand, 
  getCommandSuggestions 
} from '../../lib/agent/commands';

describe('Orchestrator Slash Commands', () => {
  describe('Command Registration', () => {
    it('should have /analyze command registered', () => {
      expect(slashCommands.analyze).toBeDefined();
      expect(slashCommands.analyze.name).toBe('analyze');
      expect(slashCommands.analyze.description).toContain('analysis workflow');
    });

    it('should have /detect command registered', () => {
      expect(slashCommands.detect).toBeDefined();
      expect(slashCommands.detect.name).toBe('detect');
      expect(slashCommands.detect.description).toContain('data type');
    });

    it('should have /suggest command registered', () => {
      expect(slashCommands.suggest).toBeDefined();
      expect(slashCommands.suggest.name).toBe('suggest');
      expect(slashCommands.suggest.description).toContain('analysis suggestions');
    });

    it('should have /generate-code command registered', () => {
      expect(slashCommands['generate-code']).toBeDefined();
      expect(slashCommands['generate-code'].name).toBe('generate-code');
      expect(slashCommands['generate-code'].description).toContain('R code');
    });

    it('should have /explain command registered', () => {
      expect(slashCommands.explain).toBeDefined();
      expect(slashCommands.explain.name).toBe('explain');
      expect(slashCommands.explain.description).toContain('effect measure');
    });
  });

  describe('Command Execution', () => {
    it('should execute /analyze and return orchestrator marker', async () => {
      const result = await executeSlashCommand('/analyze');
      expect(result.handled).toBe(true);
      expect(result.response).toBe('__ORCHESTRATOR_ANALYZE__');
    });

    it('should execute /detect and return orchestrator marker', async () => {
      const result = await executeSlashCommand('/detect');
      expect(result.handled).toBe(true);
      expect(result.response).toBe('__ORCHESTRATOR_DETECT__');
    });

    it('should execute /suggest and return orchestrator marker', async () => {
      const result = await executeSlashCommand('/suggest');
      expect(result.handled).toBe(true);
      expect(result.response).toBe('__ORCHESTRATOR_SUGGEST__');
    });

    it('should execute /generate-code and return orchestrator marker', async () => {
      const result = await executeSlashCommand('/generate-code');
      expect(result.handled).toBe(true);
      expect(result.response).toBe('__ORCHESTRATOR_GENERATE__');
    });

    it('should execute /explain without args and show usage', async () => {
      const result = await executeSlashCommand('/explain');
      expect(result.handled).toBe(true);
      expect(result.response).toContain('Usage:');
      expect(result.response).toContain('/explain OR');
      expect(result.response).toContain('/explain heterogeneity');
    });

    it('should execute /explain with topic and return marker', async () => {
      const result = await executeSlashCommand('/explain OR');
      expect(result.handled).toBe(true);
      expect(result.response).toBe('__ORCHESTRATOR_EXPLAIN__:OR');
    });

    it('should execute /explain with multi-word topic', async () => {
      const result = await executeSlashCommand('/explain publication bias');
      expect(result.handled).toBe(true);
      expect(result.response).toBe('__ORCHESTRATOR_EXPLAIN__:publication bias');
    });
  });

  describe('Command Suggestions', () => {
    it('should suggest /analyze when typing /an', () => {
      const suggestions = getCommandSuggestions('/an');
      expect(suggestions).toContain('/analyze');
    });

    it('should suggest /detect when typing /de', () => {
      const suggestions = getCommandSuggestions('/de');
      expect(suggestions).toContain('/detect');
    });

    it('should suggest /suggest when typing /su', () => {
      const suggestions = getCommandSuggestions('/su');
      expect(suggestions).toContain('/suggest');
    });

    it('should suggest /generate-code when typing /ge', () => {
      const suggestions = getCommandSuggestions('/ge');
      expect(suggestions).toContain('/generate-code');
    });

    it('should suggest /explain when typing /ex', () => {
      const suggestions = getCommandSuggestions('/ex');
      expect(suggestions).toContain('/explain');
    });
  });

  describe('Help Text', () => {
    it('should include orchestrator commands in /help output', async () => {
      const result = await executeSlashCommand('/help');
      expect(result.handled).toBe(true);
      expect(result.response).toContain('/analyze');
      expect(result.response).toContain('/detect');
      expect(result.response).toContain('/suggest');
      expect(result.response).toContain('/generate-code');
      expect(result.response).toContain('Orchestrator Commands');
    });
  });
});
