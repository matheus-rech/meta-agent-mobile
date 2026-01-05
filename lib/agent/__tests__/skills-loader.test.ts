import { describe, it, expect, beforeEach } from 'vitest';
import { 
  parseSkillFile, 
  SkillsRegistry, 
  getSkillsRegistry,
  loadBundledSkills,
} from '../skills-loader';

describe('Skills Loader', () => {
  describe('parseSkillFile', () => {
    it('should parse YAML frontmatter correctly', () => {
      const content = `---
name: Test Skill
version: 1.0.0
description: A test skill for unit testing
author: Test Author
tags:
  - test
  - example
priority: 50
---

This is the instruction body.

## Examples

Some examples here.
`;
      
      const skill = parseSkillFile(content, 'test-skill');
      
      expect(skill.id).toBe('test-skill');
      expect(skill.metadata.name).toBe('Test Skill');
      expect(skill.metadata.version).toBe('1.0.0');
      expect(skill.metadata.description).toBe('A test skill for unit testing');
      expect(skill.metadata.author).toBe('Test Author');
      expect(skill.metadata.tags).toEqual(['test', 'example']);
      expect(skill.metadata.priority).toBe(50);
      expect(skill.instructions).toContain('This is the instruction body');
    });
    
    it('should handle content without frontmatter', () => {
      const content = `# Simple Skill

Just some instructions without YAML frontmatter.
`;
      
      const skill = parseSkillFile(content, 'simple-skill');
      
      expect(skill.id).toBe('simple-skill');
      expect(skill.metadata.name).toBe('simple-skill');
      expect(skill.metadata.version).toBe('1.0.0');
      expect(skill.instructions).toContain('Simple Skill');
    });
    
    it('should parse references section', () => {
      const content = `---
name: Skill with References
version: 1.0.0
description: Test
---

Instructions here.

## References

- [Cochrane Handbook](https://training.cochrane.org/handbook) - Primary reference
- [metafor Package](https://www.metafor-project.org/)
`;
      
      const skill = parseSkillFile(content, 'ref-skill');
      
      expect(skill.references).toBeDefined();
      expect(skill.references?.length).toBeGreaterThan(0);
      expect(skill.references?.[0].title).toBe('Cochrane Handbook');
      expect(skill.references?.[0].url).toBe('https://training.cochrane.org/handbook');
    });
    
    it('should handle boolean values in frontmatter', () => {
      const content = `---
name: Disabled Skill
version: 1.0.0
description: A disabled skill
enabled: false
---

Instructions.
`;
      
      const skill = parseSkillFile(content, 'disabled-skill');
      
      expect(skill.metadata.enabled).toBe(false);
    });
  });
  
  describe('SkillsRegistry', () => {
    let registry: SkillsRegistry;
    
    beforeEach(() => {
      registry = new SkillsRegistry();
    });
    
    it('should register and retrieve skills', () => {
      const content = `---
name: Test Skill
version: 1.0.0
description: Test
---

Instructions.
`;
      
      const skill = registry.registerFromContent(content, 'test-skill');
      
      expect(registry.count).toBe(1);
      expect(registry.get('test-skill')).toBe(skill);
    });
    
    it('should get all skills', () => {
      registry.registerFromContent(`---
name: Skill 1
version: 1.0.0
description: First
---
Instructions 1.
`, 'skill-1');
      
      registry.registerFromContent(`---
name: Skill 2
version: 1.0.0
description: Second
---
Instructions 2.
`, 'skill-2');
      
      const all = registry.getAll();
      
      expect(all.length).toBe(2);
    });
    
    it('should filter enabled skills', () => {
      registry.registerFromContent(`---
name: Enabled Skill
version: 1.0.0
description: Enabled
enabled: true
---
Instructions.
`, 'enabled');
      
      registry.registerFromContent(`---
name: Disabled Skill
version: 1.0.0
description: Disabled
enabled: false
---
Instructions.
`, 'disabled');
      
      const enabled = registry.getEnabled();
      
      expect(enabled.length).toBe(1);
      expect(enabled[0].id).toBe('enabled');
    });
    
    it('should search skills by query', () => {
      registry.registerFromContent(`---
name: Meta-Analysis
version: 1.0.0
description: Conduct meta-analyses
tags:
  - statistics
  - evidence-synthesis
---
Instructions.
`, 'meta-analysis');
      
      registry.registerFromContent(`---
name: Data Extraction
version: 1.0.0
description: Extract data from studies
tags:
  - data
  - extraction
---
Instructions.
`, 'data-extraction');
      
      const results = registry.search('meta');
      
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('meta-analysis');
    });
    
    it('should build system prompt from enabled skills', () => {
      registry.registerFromContent(`---
name: High Priority Skill
version: 1.0.0
description: Important skill
priority: 100
---
High priority instructions.
`, 'high-priority');
      
      registry.registerFromContent(`---
name: Low Priority Skill
version: 1.0.0
description: Less important
priority: 10
---
Low priority instructions.
`, 'low-priority');
      
      const prompt = registry.buildSystemPrompt();
      
      expect(prompt).toContain('# Agent Skills');
      expect(prompt).toContain('High Priority Skill');
      expect(prompt).toContain('Low Priority Skill');
      // High priority should come first
      expect(prompt.indexOf('High Priority')).toBeLessThan(prompt.indexOf('Low Priority'));
    });
    
    it('should clear all skills', () => {
      registry.registerFromContent(`---
name: Test
version: 1.0.0
description: Test
---
Test.
`, 'test');
      
      expect(registry.count).toBe(1);
      
      registry.clear();
      
      expect(registry.count).toBe(0);
    });
  });
  
  describe('loadBundledSkills', () => {
    it('should load bundled skills into registry', async () => {
      const registry = new SkillsRegistry();
      
      await loadBundledSkills(registry);
      
      expect(registry.count).toBeGreaterThan(0);
      expect(registry.get('meta-analysis')).toBeDefined();
      expect(registry.get('data-extraction')).toBeDefined();
      expect(registry.get('risk-of-bias')).toBeDefined();
      expect(registry.get('forest-plot')).toBeDefined();
      expect(registry.get('funnel-plot')).toBeDefined();
    });
    
    it('should have valid metadata for bundled skills', async () => {
      const registry = new SkillsRegistry();
      await loadBundledSkills(registry);
      
      const metaAnalysis = registry.get('meta-analysis');
      
      expect(metaAnalysis?.metadata.name).toBe('Meta-Analysis');
      expect(metaAnalysis?.metadata.version).toBe('1.0.0');
      expect(metaAnalysis?.metadata.tags).toContain('meta-analysis');
      expect(metaAnalysis?.rawContent).toContain('metafor');
    });
  });
  
  describe('getSkillsRegistry singleton', () => {
    it('should return the same instance', () => {
      const registry1 = getSkillsRegistry();
      const registry2 = getSkillsRegistry();
      
      expect(registry1).toBe(registry2);
    });
  });
});
