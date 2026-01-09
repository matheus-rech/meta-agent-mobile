/**
 * Glass Server Endpoint Tests
 * 
 * Tests for the server-side Glass chat endpoint that proxies to MiniMax M2.1
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE_URL = 'http://localhost:3000';

describe('Glass Server Endpoint', () => {
  describe('glass.chat', () => {
    it('should respond to a simple greeting', async () => {
      const response = await fetch(`${API_BASE_URL}/api/trpc/glass.chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: { message: 'Hello Glass!' }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.result.data.json.success).toBe(true);
      expect(data.result.data.json.content).toBeTruthy();
      expect(data.result.data.json.content.length).toBeGreaterThan(10);
      expect(data.result.data.json.timestamp).toBeTruthy();
    }, 30000); // 30 second timeout for API call

    it('should respond to a meta-analysis question', async () => {
      const response = await fetch(`${API_BASE_URL}/api/trpc/glass.chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: { message: 'What is a forest plot?' }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.result.data.json.success).toBe(true);
      expect(data.result.data.json.content).toBeTruthy();
      // Should mention forest plot concepts
      const content = data.result.data.json.content.toLowerCase();
      expect(
        content.includes('forest') || 
        content.includes('effect') || 
        content.includes('confidence')
      ).toBe(true);
    }, 30000);

    it('should detect skills used in response', async () => {
      const response = await fetch(`${API_BASE_URL}/api/trpc/glass.chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: { message: 'Explain heterogeneity and I-squared' }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.result.data.json.success).toBe(true);
      expect(data.result.data.json.skillsUsed).toBeDefined();
      expect(Array.isArray(data.result.data.json.skillsUsed)).toBe(true);
    }, 30000);

    it('should handle conversation history', async () => {
      const response = await fetch(`${API_BASE_URL}/api/trpc/glass.chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            message: 'Can you give me an example?',
            history: [
              { role: 'user', content: 'What is a random effects model?' },
              { role: 'assistant', content: 'A random effects model assumes that the true effect size varies across studies.' }
            ]
          }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.result.data.json.success).toBe(true);
      expect(data.result.data.json.content).toBeTruthy();
    }, 30000);

    it('should detect language in response', async () => {
      const response = await fetch(`${API_BASE_URL}/api/trpc/glass.chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: { message: 'Hello, how are you?' }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.result.data.json.success).toBe(true);
      expect(data.result.data.json.language).toBeDefined();
      expect(['en', 'pt-BR', 'es']).toContain(data.result.data.json.language);
    }, 30000);
  });

  describe('glass.health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${API_BASE_URL}/api/trpc/glass.health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.result.data.json.status).toBe('ok');
      expect(data.result.data.json.model).toBe('MiniMax-M2.1');
      expect(data.result.data.json.timestamp).toBeTruthy();
    });
  });
});
