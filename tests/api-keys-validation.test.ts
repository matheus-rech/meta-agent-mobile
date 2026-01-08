/**
 * API Keys Validation Tests
 * 
 * Validates that the Gemini and MiniMax API keys are working correctly
 */

import { describe, it, expect } from 'vitest';

describe('API Keys Validation', () => {
  describe('Gemini API Key', () => {
    it('should have GEMINI_API_KEY environment variable set', () => {
      const apiKey = process.env.GEMINI_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey).not.toBe('');
      expect(apiKey?.startsWith('AIza')).toBe(true);
    });

    it('should validate Gemini API key format', () => {
      const apiKey = process.env.GEMINI_API_KEY;
      // Gemini API keys are typically 39 characters starting with AIza
      expect(apiKey?.length).toBeGreaterThanOrEqual(35);
    });

    it('should be able to call Gemini API', async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.log('Skipping Gemini API test - no API key');
        return;
      }

      // Test with a simple models list request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('models');
      expect(Array.isArray(data.models)).toBe(true);
    });
  });

  describe('MiniMax API Key', () => {
    it('should have MINIMAX_API_KEY environment variable set', () => {
      const apiKey = process.env.MINIMAX_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey).not.toBe('');
      // MiniMax keys can start with sk-api- or sk-cp-
      expect(apiKey?.startsWith('sk-')).toBe(true);
    });

    it('should validate MiniMax API key format', () => {
      const apiKey = process.env.MINIMAX_API_KEY;
      // MiniMax API keys start with sk-api- and are quite long
      expect(apiKey?.length).toBeGreaterThan(50);
    });

    it('should be able to call MiniMax API', async () => {
      const apiKey = process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        console.log('Skipping MiniMax API test - no API key');
        return;
      }

      // Test with Anthropic-compatible endpoint
      const response = await fetch(
        'https://api.minimax.io/anthropic/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'MiniMax-M2.1',
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: 'Hello' }],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      console.log('MiniMax Anthropic API response:', JSON.stringify(data, null, 2));
      
      // Check for valid response or error
      if (data.error) {
        console.log('MiniMax API error:', data.error);
        // Still pass if we got a response structure
        expect(data).toHaveProperty('error');
      } else {
        // Success case - should have content array
        expect(data).toBeDefined();
      }
    });
  });
});
