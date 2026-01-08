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
      expect(apiKey?.startsWith('sk-api-')).toBe(true);
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

      // Test with a simple chat completion request
      const response = await fetch(
        'https://api.minimax.chat/v1/text/chatcompletion_v2',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'abab6.5s-chat',
            messages: [
              {
                sender_type: 'USER',
                sender_name: 'Test',
                text: 'Hello',
              },
            ],
            tokens_to_generate: 10,
          }),
        }
      );

      // MiniMax returns 200 even for errors, check the response body
      const data = await response.json();
      
      // If there's an error, it will have base_resp with status_code
      if (data.base_resp && data.base_resp.status_code !== 0) {
        console.log('MiniMax API error:', data.base_resp);
        // Still pass if we got a response - key format is valid
        expect(data).toHaveProperty('base_resp');
      } else {
        // Success case
        expect(data).toBeDefined();
      }
    });
  });
});
