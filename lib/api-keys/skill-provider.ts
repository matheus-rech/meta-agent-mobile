/**
 * Skill-Aware Provider
 * 
 * Wraps LLM providers to inject AgentSkills into system prompts.
 * Ensures all models (cloud and local) have consistent meta-analysis capabilities.
 */

import { 
  buildContextAwarePrompt, 
  buildAvailableSkillsXML,
  matchSkillsToQuery 
} from '../agent/skills/prompt-builder';
import { 
  ChatMessage, 
  GenerateOptions, 
  GenerateResult,
  generateWithBestProvider,
  getProviderClient,
  StreamChunk
} from './providers';
import { LLMProvider } from './api-key-manager';

/**
 * Base system prompt for Meta Agent
 */
const META_AGENT_BASE_PROMPT = `You are Meta Agent, an expert AI assistant specialized in meta-analysis and systematic reviews. You help researchers synthesize evidence from multiple studies, conduct statistical analyses, and create publication-quality visualizations.

Your core capabilities include:
1. Conducting meta-analyses using R and the metafor package
2. Extracting data from primary studies
3. Assessing risk of bias using validated tools (RoB 2, ROBINS-I, Newcastle-Ottawa)
4. Analyzing heterogeneity and exploring sources
5. Assessing publication bias
6. Generating forest plots and funnel plots
7. Teaching meta-analysis concepts

You follow Cochrane methodology and evidence-based medicine principles. You provide clear explanations, reproducible R code, and practical guidance.`;

/**
 * Generate with skills injected into system prompt
 */
export async function generateWithSkills(
  messages: ChatMessage[],
  options: GenerateOptions = {},
  preferredProvider?: LLMProvider
): Promise<GenerateResult> {
  // Get user's query from the last user message
  const userQuery = messages
    .filter(m => m.role === 'user')
    .slice(-1)[0]?.content || '';
  
  // Build skill-aware system prompt
  const skillAwarePrompt = buildContextAwarePrompt(
    options.systemPrompt || META_AGENT_BASE_PROMPT,
    userQuery
  );
  
  // Call provider with enhanced prompt
  return generateWithBestProvider(
    messages,
    { ...options, systemPrompt: skillAwarePrompt },
    preferredProvider
  );
}

/**
 * Generate with streaming and skills injected
 */
export async function generateStreamWithSkills(
  messages: ChatMessage[],
  options: GenerateOptions,
  onChunk: (chunk: StreamChunk) => void,
  preferredProvider?: LLMProvider
): Promise<GenerateResult> {
  // Get user's query from the last user message
  const userQuery = messages
    .filter(m => m.role === 'user')
    .slice(-1)[0]?.content || '';
  
  // Build skill-aware system prompt
  const skillAwarePrompt = buildContextAwarePrompt(
    options.systemPrompt || META_AGENT_BASE_PROMPT,
    userQuery
  );
  
  // Get provider client
  const { apiKeyManager } = await import('./api-key-manager');
  await apiKeyManager.initialize();
  
  const configuredProviders = apiKeyManager.getConfiguredProviders();
  
  if (configuredProviders.length === 0) {
    return {
      success: false,
      error: 'No API keys configured. Add your API keys in Settings → API Keys.',
    };
  }
  
  // Use preferred provider or first configured
  const provider = preferredProvider && configuredProviders.includes(preferredProvider)
    ? preferredProvider
    : configuredProviders[0];
  
  const client = getProviderClient(provider);
  
  return client.generateStream(
    messages,
    { ...options, systemPrompt: skillAwarePrompt },
    onChunk
  );
}

/**
 * Get matched skills for a query (for UI display)
 */
export function getMatchedSkillsForQuery(query: string): Array<{
  name: string;
  description: string;
}> {
  const matched = matchSkillsToQuery(query);
  return matched.slice(0, 3).map(skill => ({
    name: skill.metadata.name,
    description: skill.metadata.description,
  }));
}

/**
 * Get the base system prompt with all available skills
 */
export function getFullSystemPrompt(): string {
  return buildContextAwarePrompt(META_AGENT_BASE_PROMPT, '');
}

/**
 * Get just the available skills XML for display
 */
export function getAvailableSkillsXML(): string {
  return buildAvailableSkillsXML();
}

export { META_AGENT_BASE_PROMPT };
