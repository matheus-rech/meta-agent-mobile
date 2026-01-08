/**
 * Test Glass API Integration (Standalone)
 * 
 * Sends a test query to Glass using MiniMax M2.1 API
 * without React Native dependencies.
 */

// API keys
const MINIMAX_API_KEY = 'sk-cp-2UyY_RQ6sHxiAv43y3mVc_y1aiYTm3KkK1V45XyqFXS-jW9Bf2Z2PFNynpsIBqOWiacDMd9H8WocHAxjGSgyqYamXYMRG-cnD8e8GFz1DqdNBZHNASH2Xt0';

// Glass system prompt
const GLASS_SYSTEM_PROMPT = `You are Glass 🦊, a friendly and knowledgeable fox who teaches meta-analysis.

## Personality
- Named after Gene Glass, who coined "meta-analysis" in 1976
- Inspired by Zenko (善狐), the benevolent fox from Japanese mythology
- Patient, encouraging, and uses the Socratic method
- Adapts language automatically to match the user

## Teaching Style
- Ask guiding questions rather than giving direct answers
- Celebrate progress with encouragement
- Break complex concepts into digestible steps
- Use practical examples from real meta-analyses
- Reference the Cochrane Handbook when appropriate

## Available Skills
You have access to these AgentSkills for teaching:
1. meta-analysis-fundamentals - Core concepts and terminology
2. forest-plot-creation - Creating and interpreting forest plots
3. heterogeneity-analysis - Understanding I² and tau²
4. publication-bias-detection - Funnel plots and Egger's test
5. data-extraction - Extracting effect sizes from studies
6. grade-assessment - GRADE evidence certainty
7. r-code-generation - metafor package code
8. socratic-teaching - Guided learning methodology

## Response Format
- Keep responses concise but informative
- Use markdown formatting when helpful
- Include R code examples when relevant
- Always cite sources from the knowledge base
- End with a guiding question when teaching`;

async function testGlassAPI() {
  console.log('🦊 Testing Glass API Integration...\n');

  try {
    // Test query in Portuguese
    const testQuery = 'O que é heterogeneidade em meta-análise?';
    console.log(`Sending test query: "${testQuery}"\n`);

    // Call MiniMax API (Anthropic-compatible format)
    const response = await fetch('https://api.minimax.io/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MINIMAX_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        system: GLASS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: testQuery }],
          },
        ],
        max_tokens: 2048,
      }),
    });

    const result = await response.json();

    if (result.content && Array.isArray(result.content)) {
      const textBlock = result.content.find((b: any) => b.type === 'text');
      const assistantMessage = textBlock?.text || '';

      console.log('Response received:\n');
      console.log('─'.repeat(60));
      console.log(assistantMessage);
      console.log('─'.repeat(60));
      console.log('\n');

      // Detect skills used
      const skillKeywords: Record<string, string[]> = {
        'heterogeneity-analysis': ['i²', 'i-squared', 'tau²', 'heterogeneidade', 'heterogeneity', 'q statistic'],
        'meta-analysis-fundamentals': ['effect size', 'pooled estimate', 'tamanho do efeito', 'estimativa combinada'],
        'forest-plot-creation': ['forest plot', 'gráfico de floresta', 'diamond', 'losango'],
      };

      const contentLower = assistantMessage.toLowerCase();
      const skillsUsed: string[] = [];

      for (const [skill, keywords] of Object.entries(skillKeywords)) {
        if (keywords.some(kw => contentLower.includes(kw))) {
          skillsUsed.push(skill);
        }
      }

      if (skillsUsed.length > 0) {
        console.log('Skills detected:', skillsUsed.join(', '));
      }

      // Detect language
      const ptWords = ['você', 'está', 'são', 'não', 'como', 'para', 'isso', 'que', 'uma', 'estudos'];
      const ptCount = ptWords.filter(w => contentLower.includes(w)).length;
      const language = ptCount > 3 ? 'pt-BR' : 'en';
      console.log('Language detected:', language);

      console.log('\n✅ Glass API test completed successfully!');
      return true;
    }

    if (result.error) {
      console.error('API Error:', result.error);
      return false;
    }

    console.log('Unexpected response:', JSON.stringify(result, null, 2));
    return false;
  } catch (error) {
    console.error('\n❌ Glass API test failed:', error);
    return false;
  }
}

// Run the test
testGlassAPI().then(success => {
  process.exit(success ? 0 : 1);
});
