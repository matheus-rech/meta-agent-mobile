/**
 * Test Glass Chat Integration
 * 
 * Sends a test query to Glass using MiniMax M2.1 API
 * to validate the RAG system and AgentSkills are working.
 */

import { miniAgentService } from '../lib/glass/mini-agent.service';
import { geminiFileSearchService } from '../lib/glass/gemini-file-search.service';

// API keys
const MINIMAX_API_KEY = 'sk-cp-2UyY_RQ6sHxiAv43y3mVc_y1aiYTm3KkK1V45XyqFXS-jW9Bf2Z2PFNynpsIBqOWiacDMd9H8WocHAxjGSgyqYamXYMRG-cnD8e8GFz1DqdNBZHNASH2Xt0';
const GEMINI_API_KEY = 'AIzaSyAyV5v8S1YRmVV6xwZ3ZJfwk1r1MID9Oco';

async function testGlassChat() {
  console.log('🦊 Testing Glass Chat Integration...\n');

  try {
    // Initialize MiniMax service
    console.log('1. Initializing MiniMax M2.1 service...');
    await miniAgentService.initialize({
      apiKey: MINIMAX_API_KEY,
      baseUrl: 'https://api.minimax.io/anthropic',
      model: 'MiniMax-M2.1',
    });
    console.log('   ✓ MiniMax service initialized\n');

    // Initialize Gemini RAG service
    console.log('2. Initializing Gemini RAG service...');
    await geminiFileSearchService.initialize({
      apiKey: GEMINI_API_KEY,
    });
    console.log('   ✓ Gemini RAG service initialized\n');

    // Test query in Portuguese
    const testQuery = 'O que é heterogeneidade em meta-análise?';
    console.log(`3. Sending test query: "${testQuery}"\n`);

    const response = await miniAgentService.chat(testQuery, {
      useRAG: true,
      language: 'pt-BR',
    });

    console.log('4. Response received:\n');
    console.log('─'.repeat(60));
    console.log(response.content);
    console.log('─'.repeat(60));
    console.log('\n');

    // Display metadata
    if (response.skillsUsed && response.skillsUsed.length > 0) {
      console.log('Skills used:', response.skillsUsed.join(', '));
    }
    if (response.sources && response.sources.length > 0) {
      console.log('Sources:', response.sources.map(s => s.title).join(', '));
    }
    if (response.language) {
      console.log('Language detected:', response.language);
    }
    if (response.confidence) {
      console.log('Confidence:', (response.confidence * 100).toFixed(1) + '%');
    }

    console.log('\n✅ Glass chat test completed successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ Glass chat test failed:', error);
    return false;
  }
}

// Run the test
testGlassChat().then(success => {
  process.exit(success ? 0 : 1);
});
