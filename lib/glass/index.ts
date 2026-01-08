/**
 * Glass - The Meta-Analysis Teaching Agent 🦊
 * 
 * Named after Gene Glass, who coined "meta-analysis" in 1976.
 * Inspired by Zenko (善狐), the benevolent fox from Japanese mythology.
 */

export {
  getKnowledgeBase,
  KnowledgeBaseService,
  KB_CATEGORIES,
  type KBDocument,
  type RAGResult,
  type Citation,
  type SupportedLanguage,
} from './knowledge-base.service';

// Re-export Meta agent service (Glass is the new name)
export {
  getMetaAgent,
  MetaAgentService,
  type MetaUserProfile,
  type MemoryEntry,
  type MetaContext,
} from '../meta-agent/meta-agent.service';

// Gemini File Search for RAG
export {
  geminiFileSearchService,
  KNOWLEDGE_BASE_DOCUMENTS,
  type KnowledgeDocument,
} from './gemini-file-search.service';

// Mini-Agent integration for Glass backend
export {
  miniAgentService,
  type MiniAgentConfig,
  type ChatMessage,
  type MiniAgentResponse,
  type SkillReference,
} from './mini-agent.service';

// Glass System Prompt with AgentSkills integration
export {
  generateGlassSystemPrompt,
  loadSkillContent,
  getAvailableSkills,
  AVAILABLE_SKILLS_XML,
  GLASS_IDENTITY,
} from './glass-system-prompt';
