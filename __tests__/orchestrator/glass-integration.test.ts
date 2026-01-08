/**
 * Tests for Glass Orchestrator Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { glassOrchestratorIntegration } from '../../lib/glass/orchestrator-integration';
import {
  explainDataTypeDetection,
  explainAnalysisSuggestion,
  explainRCode,
  orchestratorSkill
} from '../../lib/agent/skills/orchestrator-skill';
import {
  detectDataType,
  suggestAnalysis,
  generateRCode,
  DataType
} from '../../lib/glass/orchestrator';

describe('Glass Orchestrator Integration', () => {
  beforeEach(() => {
    glassOrchestratorIntegration.clearContext();
  });

  describe('Intent Detection', () => {
    it('should detect full workflow intent', () => {
      const result = glassOrchestratorIntegration.detectIntent('analyze my data');
      expect(result.intent).toBe('full');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect data type detection intent', () => {
      const result = glassOrchestratorIntegration.detectIntent('what type of data do I have?');
      expect(result.intent).toBe('detect');
    });

    it('should detect suggestion intent', () => {
      const result = glassOrchestratorIntegration.detectIntent('what analysis should I run?');
      expect(result.intent).toBe('suggest');
    });

    it('should detect code generation intent', () => {
      const result = glassOrchestratorIntegration.detectIntent('generate R code for me');
      expect(result.intent).toBe('generate');
    });

    it('should detect effect measure explanation intent', () => {
      const result = glassOrchestratorIntegration.detectIntent('what is odds ratio?');
      expect(result.intent).toBe('explain');
      expect(result.effectMeasure).toBe('OR');
    });

    it('should detect topic explanation intent', () => {
      const result = glassOrchestratorIntegration.detectIntent('explain heterogeneity');
      expect(result.intent).toBe('explain');
      expect(result.topic).toBe('heterogeneity');
    });

    it('should return unknown for unrelated messages', () => {
      const result = glassOrchestratorIntegration.detectIntent('hello how are you');
      expect(result.intent).toBe('unknown');
    });
  });

  describe('Natural Language Explanations', () => {
    it('should generate explanation for binary data detection', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treatment', label: 'Events Treatment' },
        { key: 'events_control', label: 'Events Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = [
        { study: 'Smith 2020', events_treatment: 10, events_control: 20, n_treatment: 100, n_control: 100 }
      ];
      
      const detection = detectDataType(columns, rows);
      const explanation = explainDataTypeDetection(detection);
      
      expect(explanation).toContain('Binary');
      expect(explanation).toContain('Matched columns');
    });

    it('should generate explanation for unknown data type', () => {
      const columns = [
        { key: 'foo', label: 'Foo' },
        { key: 'bar', label: 'Bar' }
      ];
      const rows = [{ foo: 1, bar: 2 }];
      
      const detection = detectDataType(columns, rows);
      const explanation = explainDataTypeDetection(detection);
      
      expect(explanation).toContain("couldn't automatically detect");
      expect(explanation).toContain('What I need');
    });

    it('should generate analysis suggestion explanation', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treatment', label: 'Events Treatment' },
        { key: 'events_control', label: 'Events Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = Array.from({ length: 10 }, (_, i) => ({
        study: `Study ${i + 1}`,
        events_treatment: 10 + i,
        events_control: 20 + i,
        n_treatment: 100,
        n_control: 100
      }));
      
      const detection = detectDataType(columns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const explanation = explainAnalysisSuggestion(suggestion);
      
      expect(explanation).toContain('Recommended Analysis Plan');
      expect(explanation).toContain('Effect Measure');
      expect(explanation).toContain('Statistical Model');
      expect(explanation).toContain('Required Analyses');
    });

    it('should generate R code explanation', () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treatment', label: 'Events Treatment' },
        { key: 'events_control', label: 'Events Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = [
        { study: 'Smith 2020', events_treatment: 10, events_control: 20, n_treatment: 100, n_control: 100 }
      ];
      
      const detection = detectDataType(columns, rows);
      const suggestion = suggestAnalysis(detection, rows.length);
      const code = generateRCode(suggestion, { study: 'study' });
      const explanation = explainRCode(code);
      
      expect(explanation).toContain('Generated R Code');
      expect(explanation).toContain('Required packages');
      expect(explanation).toContain('metafor');
      expect(explanation).toContain('```r');
    });
  });

  describe('Message Processing', () => {
    it('should process full workflow request with data', async () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treatment', label: 'Events Treatment' },
        { key: 'events_control', label: 'Events Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = Array.from({ length: 5 }, (_, i) => ({
        study: `Study ${i + 1}`,
        events_treatment: 10 + i,
        events_control: 20 + i,
        n_treatment: 100,
        n_control: 100
      }));
      
      const response = await glassOrchestratorIntegration.processMessage(
        'analyze my data',
        { columns, rows }
      );
      
      expect(response).toContain('Meta-Analysis Workflow');
      expect(response).toContain('Data Type Detection');
      expect(response).toContain('Analysis Recommendations');
      expect(response).toContain('R Code');
    });

    it('should handle missing data gracefully', async () => {
      const response = await glassOrchestratorIntegration.processMessage('analyze my data');
      
      expect(response).toContain("don't see any spreadsheet data");
      expect(response).toContain('To get started');
    });

    it('should explain effect measures', async () => {
      const response = await glassOrchestratorIntegration.processMessage('what is SMD?');
      
      expect(response).toContain('Standardized Mean Difference');
      expect(response).toContain('Cohen');
      expect(response).toContain('standard deviation');
    });

    it('should explain topics', async () => {
      const response = await glassOrchestratorIntegration.processMessage('explain publication bias');
      
      expect(response).toContain('Publication Bias');
      expect(response).toContain('Funnel Plot');
      expect(response).toContain("Egger's Test");
    });

    it('should provide help for unknown intents', async () => {
      const response = await glassOrchestratorIntegration.processMessage('hello');
      
      expect(response).toContain('Glass');
      expect(response).toContain('meta-analysis assistant');
      expect(response).toContain('Data Analysis');
    });
  });

  describe('Context Management', () => {
    it('should maintain context across messages', async () => {
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'effect_size', label: 'Effect Size' },
        { key: 'se', label: 'Standard Error' }
      ];
      const rows = [
        { study: 'Smith 2020', effect_size: 0.5, se: 0.15 }
      ];
      
      // First: detect
      await glassOrchestratorIntegration.processMessage(
        'what type of data do I have?',
        { columns, rows }
      );
      
      const context1 = glassOrchestratorIntegration.getContext();
      expect(context1.detection).not.toBeNull();
      expect(context1.lastAction).toBe('detect');
      
      // Second: suggest (should use previous detection)
      await glassOrchestratorIntegration.processMessage('suggest analysis');
      
      const context2 = glassOrchestratorIntegration.getContext();
      expect(context2.suggestion).not.toBeNull();
      expect(context2.lastAction).toBe('suggest');
      
      // Third: generate code (should use previous suggestion)
      await glassOrchestratorIntegration.processMessage('generate R code');
      
      const context3 = glassOrchestratorIntegration.getContext();
      expect(context3.code).not.toBeNull();
      expect(context3.lastAction).toBe('generate');
    });

    it('should clear context when requested', () => {
      glassOrchestratorIntegration.setSpreadsheetData(
        [{ key: 'study', label: 'Study' }],
        [{ study: 'Test' }]
      );
      
      expect(glassOrchestratorIntegration.getContext().detection).not.toBeNull();
      
      glassOrchestratorIntegration.clearContext();
      
      expect(glassOrchestratorIntegration.getContext().detection).toBeNull();
    });
  });

  describe('Orchestrator Skill Definition', () => {
    it('should have correct skill name and description', () => {
      expect(orchestratorSkill.name).toBe('data-orchestrator');
      expect(orchestratorSkill.description).toContain('data types');
      expect(orchestratorSkill.description).toContain('R code');
    });

    it('should have appropriate triggers', () => {
      expect(orchestratorSkill.triggers).toContain('analyze my data');
      expect(orchestratorSkill.triggers).toContain('detect data type');
      expect(orchestratorSkill.triggers).toContain('generate r code');
    });

    it('should have all required tools', () => {
      const toolNames = orchestratorSkill.tools?.map(t => t.name) || [];
      
      expect(toolNames).toContain('detect_data_type');
      expect(toolNames).toContain('suggest_analysis');
      expect(toolNames).toContain('generate_analysis_code');
      expect(toolNames).toContain('full_analysis_workflow');
      expect(toolNames).toContain('explain_effect_measure');
    });

    it('should handle detect_data_type tool call', async () => {
      const tool = orchestratorSkill.tools?.find(t => t.name === 'detect_data_type');
      expect(tool).toBeDefined();
      
      const columns = [
        { key: 'study', label: 'Study' },
        { key: 'events_treatment', label: 'Events Treatment' },
        { key: 'events_control', label: 'Events Control' },
        { key: 'n_treatment', label: 'N Treatment' },
        { key: 'n_control', label: 'N Control' }
      ];
      const rows = [
        { study: 'Smith 2020', events_treatment: 10, events_control: 20, n_treatment: 100, n_control: 100 }
      ];
      
      const result = await tool!.handler({ columns, rows }) as {
        type: string;
        action: string;
        success: boolean;
        detection?: unknown;
        explanation?: string;
      };
      
      expect(result.type).toBe('orchestrator');
      expect(result.action).toBe('detect');
      expect(result.success).toBe(true);
      expect(result.detection).toBeDefined();
      expect(result.explanation).toContain('Binary');
    });

    it('should handle explain_effect_measure tool call', async () => {
      const tool = orchestratorSkill.tools?.find(t => t.name === 'explain_effect_measure');
      expect(tool).toBeDefined();
      
      const result = await tool!.handler({ measure: 'OR' }) as {
        type: string;
        action: string;
        measure: string;
        explanation: string;
      };
      
      expect(result.type).toBe('orchestrator');
      expect(result.action).toBe('explain');
      expect(result.measure).toBe('OR');
      expect(result.explanation).toContain('Odds Ratio');
    });
  });
});
