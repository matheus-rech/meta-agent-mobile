# Project TODO

## Core Features

- [x] Terminal screen with CLI-style output display
- [x] Command input bar with send functionality
- [x] ASCII art banner on app startup
- [x] Thinking/loading indicator during AI processing
- [x] Slash commands support (/help, /clear, /history)
- [x] Command history persistence with AsyncStorage
- [x] History screen with command list
- [x] Settings screen with preferences
- [x] Dark terminal theme colors
- [x] Monospace font for terminal output

## Agent SDK Core

- [x] Agent planner for task decomposition
- [x] Agent executor for step-by-step execution
- [x] Memory system for conversation history
- [x] Tool registry for available commands
- [x] Skills system for domain-specific capabilities

## AI Integration

- [x] Server-side AI endpoint via tRPC
- [x] Streaming response support
- [x] Context management for multi-turn conversations
- [x] Error handling for API failures

## UI/UX Polish

- [x] Haptic feedback on interactions
- [x] Smooth scrolling in terminal output
- [x] Auto-scroll to bottom on new output
- [x] Keyboard handling and dismiss
- [x] Status bar with connection indicator

## Branding

- [x] Generate custom app logo
- [x] Update app name in config
- [x] Configure splash screen

## New Features (v1.1)

- [x] Command autocomplete with suggestions dropdown
- [x] Show suggestions as users type slash commands
- [x] Common phrase suggestions
- [x] Markdown rendering for AI responses
- [x] Code blocks with syntax highlighting
- [x] Lists and formatting support
- [x] File and plot visualization
- [x] Open and display generated plots/images
- [x] Visualize handled files (images, charts)
- [x] File preview modal/screen

## R Integration (v1.2)

- [x] R execution service on server
- [x] R code execution endpoint
- [x] Meta-analysis templates (binary, continuous, proportion)
- [x] Forest plot generation
- [x] Funnel plot generation
- [x] PRISMA flowchart generation (template ready)
- [x] R-related skills in agent SDK
- [x] /r command for R code execution
- [x] Plot output visualization
- [x] R session management
- [x] Firejail sandboxing for secure R execution
- [x] Network access control (allow when needed)

## New Features (v1.3)

### CSV File Upload
- [x] Document picker for CSV file selection
- [x] CSV parsing and validation
- [x] Preview data before analysis
- [x] Store uploaded files for session

### R Code Snippets Library
- [x] Pre-built templates for meta-analysis
- [x] Templates for data extraction
- [x] Templates for risk of bias
- [x] Templates for network meta-analysis
- [x] Templates for TSA (Trial Sequential Analysis)
- [x] Templates for manuscript sections
- [x] Insert snippet into terminal

### Export Functionality
- [x] Save plots to photo library
- [x] Export analysis results as CSV
- [x] Share results via system share sheet
- [x] Copy R code to clipboard

### Skills Integration from meta-agent
- [x] Meta-analysis skill (binary, continuous, proportion, survival)
- [x] Data extraction skill with schemas
- [x] Risk of bias skill (RoB2, NOS, ROBINS-I)
- [x] Network meta-analysis skill
- [x] TSA (Trial Sequential Analysis) skill
- [x] Manuscript writing skill (PRISMA-compliant)
- [x] Neurosurgery literature search skill

## E2E Testing (v1.4)

### R Environment
- [x] Verify R packages installed (meta, metafor, ggplot2)
- [x] Test R execution with Firejail sandboxing

### Meta-Analysis Methods
- [x] Binary outcome meta-analysis (OR, RR)
- [x] Continuous outcome meta-analysis (MD, SMD)
- [x] Subgroup analysis
- [x] Sensitivity analysis (leave-one-out)
- [x] Meta-regression
- [x] Cumulative meta-analysis

### Plot Generation
- [x] Forest plot generation and display
- [x] Funnel plot for publication bias
- [x] Risk of bias traffic light plot
- [x] Influence diagnostics plot
- [x] Meta-regression bubble plot
- [x] Cumulative forest plot

### Reports
- [x] Generate comprehensive test report
- [x] Document all test results (E2E_TEST_REPORT.md)


## New Features (v1.5)

### Real-time R Output Streaming
- [x] Server-side streaming endpoint for R execution
- [x] WebSocket or SSE connection for real-time updates
- [x] Line-by-line console output display
- [x] Progress indicators for long-running analyses
- [x] Error highlighting in real-time output

### Project Workspace
- [x] Project creation and management UI
- [x] Persistent storage for study data (AsyncStorage)
- [x] Save/load R scripts per project
- [x] Store generated plots with project
- [x] Project list and selection screen
- [x] Export/import project data

### PRISMA 2020 Flowchart Generator
- [x] Interactive flowchart builder UI
- [x] PRISMA 2020 template with all required boxes
- [x] Editable counts for each stage
- [x] Form-based editing
- [x] Export as PNG image
- [x] Export as SVG for manuscript
- [x] Save flowchart with project

## New Features (v1.6)

### SQLite Study Database
- [x] Install expo-sqlite for local database
- [x] Create database schema for studies, outcomes, and meta-analyses
- [x] Implement CRUD operations for study data
- [x] Add study import from CSV with validation
- [x] Support multiple outcome types (binary, continuous, proportion)
- [x] Implement search and filter functionality
- [x] Add data export to CSV/JSON
- [x] Sync with project workspace

### PROSPERO Integration
- [x] Research PROSPERO API endpoints (web scraping approach)
- [x] Implement protocol search by ID or keywords
- [x] Parse and display protocol metadata
- [x] Import protocol details into project
- [x] Extract PICO elements from protocol
- [x] Link protocol to project for reference
- [x] Handle API errors and rate limiting

## Agent Personality Enhancement (v1.7)

### Pedagogical Features
- [x] Add Socratic questioning to help students think through problems
- [x] Include decision checkpoints for confirming understanding
- [x] Encourage shared decision-making with team members
- [x] Provide scaffolded learning with progressive complexity

### Social Skills
- [x] Add small talk capabilities on related topics
- [x] Ask how the user is doing periodically
- [x] Share anecdotes on history of science and statistics
- [x] Include stories about famous statisticians and discoveries
- [x] Add warmth and encouragement to responses

### Collaborative Features
- [x] Frame responses as team discussions
- [x] Suggest when to involve supervisors or colleagues
- [x] Provide templates for team presentations
- [x] Encourage peer review of decisions

## Knowledge Base & Search Enhancement (v1.8)

### Plot Generation & File Handling
- [ ] Test forest plot generation via R endpoint
- [ ] Test funnel plot generation
- [ ] Verify plot files are returned and displayable
- [ ] Test CSV file upload and parsing
- [ ] Verify file export functionality

### Knowledge Base - Seminal Papers
- [ ] Add DerSimonian & Laird 1986 (random effects)
- [ ] Add Higgins & Thompson 2002 (I² statistic)
- [ ] Add Egger et al 1997 (publication bias)
- [ ] Add Cochrane 1972 (evidence-based medicine origins)
- [ ] Add PRISMA 2009 and PRISMA 2020 guidelines
- [ ] Add GRADE working group papers
- [ ] Add Bradford Hill 1965 (causation criteria)

### Knowledge Base - Cochrane Handbook
- [ ] Add key chapters and section references
- [ ] Include heterogeneity assessment guidance
- [ ] Include effect measure selection guidance
- [ ] Include risk of bias assessment guidance
- [ ] Include GRADE assessment guidance

### Knowledge Base - R Package Documentation
- [ ] Add metafor package documentation
- [ ] Add meta package documentation
- [ ] Add netmeta package documentation
- [ ] Add robvis package documentation
- [ ] Add dmetar package documentation

### Recent Meta-Analysis Search
- [ ] Implement PubMed search for recent meta-analyses
- [ ] Filter by publication date and study type
- [ ] Return structured results with abstracts
- [ ] Allow importing citations into projects

## Open-Source LLM Fallback Research (v1.9)

### Research Tasks
- [ ] Survey current open-source LLM landscape (Dec 2024)
- [ ] Identify top candidates comparable to Gemini 2.5 Flash
- [ ] Compare benchmarks: reasoning, instruction-following, coding
- [ ] Evaluate medical/scientific domain knowledge
- [ ] Assess context window and multi-turn conversation ability
- [ ] Analyze deployment options (local, cloud, API providers)
- [ ] Consider resource requirements (GPU, RAM, latency)
- [ ] Create comprehensive comparison report
- [ ] Recommend best fallback option(s)

## Offline-First Architecture (v2.0)

### In-App Python Runtime
- [ ] Research Pyodide/WebAssembly for React Native
- [ ] Implement Python runtime integration
- [ ] Bundle pandas, pdfplumber, numpy
- [ ] Test PDF extraction in-app

### In-App R Runtime
- [ ] Research WebR for React Native
- [ ] Implement R runtime integration
- [ ] Bundle meta, metafor, dmetar, robvis packages
- [ ] Test meta-analysis execution in-app

### Local LLM Support
- [ ] Create LLM provider abstraction layer
- [ ] Research llama.cpp React Native bindings
- [ ] Support Qwen 3 / DeepSeek R1 local models
- [ ] Implement tiered fallback (local → cloud)
- [ ] Add model download and management

### Knowledge Base (Bundled)
- [ ] Bundle Cochrane Handbook chapters
- [ ] Bundle R package documentation (meta, metafor)
- [ ] Bundle seminal papers references
- [ ] Implement local vector search for KB
- [ ] Add citation support in agent responses

### Agent Orchestration
- [ ] Implement subagent system (5 specialists)
- [ ] Add task routing to appropriate subagent
- [ ] Improve memory and context management
- [ ] Add skill auto-loading from bundled skills

### CLI-Inspired UI
- [ ] Keep terminal aesthetic
- [ ] Add command history navigation
- [ ] Improve syntax highlighting
- [ ] Add tab completion for commands

## Mobile-Compatible Architecture (v2.1) - Based on Technical Review

### WebR Integration (Priority 1 - Critical PoC)
- [x] Research WebR + React Native integration patterns
- [x] Test WebR initialization in React Native WebView
- [x] Verify metafor package compiles to WASM (confirmed on R-universe)
- [ ] Run simple forest plot generation as proof of concept
- [ ] Benchmark WebR performance vs native R (expect 2-3x slower)
- [x] Document WebR limitations and workarounds (see research/WEBR_INTEGRATION_RESEARCH.md)

### Pyodide Integration (Python in WASM)
- [ ] Research Pyodide + React Native integration
- [ ] Test pandas/numpy in WASM environment
- [ ] Implement data processing with Pyodide
- [ ] Bundle required Python packages

### Mobile SLM (Small Language Model)
- [x] Research Qwen 2.5 Coder 3B for mobile (Q4_K_M at 2.1GB recommended)
- [x] Research Phi-3.5 Mini 3.8B as alternative
- [x] Research Gemma 2 2B as lightweight option
- [x] Create MobileLLMService with tiered fallback (cloud → local → template)
- [ ] Implement MLC-LLM or ONNX Runtime integration
- [ ] Test model loading and inference on mobile
- [ ] Benchmark memory usage (<4GB target)

### TypeScript Skills Loader
- [x] Design SKILL.md file format specification (YAML frontmatter + markdown)
- [x] Implement TypeScript loader for AgentSkills (lib/agent/skills-loader.ts)
- [x] Convert existing skills to SKILL.md format (5 bundled skills)
- [x] Bundle skills with app
- [x] Add skill discovery and loading at runtime
- [x] Create SkillsRegistry with search and filtering
- [x] Implement buildSystemPrompt() for LLM context

### Architecture Corrections Applied
- [x] Confirmed: Docker NOT viable for mobile (iOS/Android restrictions)
- [x] Confirmed: MiniMax-M2 too large for mobile (needs ~100GB RAM)
- [x] Decision: Use WebR/Pyodide for in-app R/Python
- [x] Decision: Use SLM (3-4B params) for on-device inference
- [x] Decision: Adopt AgentSkills format, not Python framework


### New Components Created (v2.1)
- [x] WebR Service (lib/webr/webr-service.ts) - WebView-based R execution
- [x] WebR Runtime Component (components/webr-runtime.tsx) - React Native integration
- [x] Skills Loader (lib/agent/skills-loader.ts) - AgentSkills format parser
- [x] Mobile LLM Service (lib/llm/mobile-llm-service.ts) - Tiered LLM provider
- [x] Research documentation (research/WEBR_INTEGRATION_RESEARCH.md)

### Next Steps (v2.2)
- [ ] Fix "Unexpected text node" error in current UI
- [ ] Integrate WebRRuntime into app layout
- [ ] Create R execution hook (useRExecution)
- [ ] Add offline mode detection and UI indicator
- [ ] Implement model download UI for on-device SLM
- [ ] Test WebR forest plot generation end-to-end
- [ ] Add Pyodide integration for Python execution


## WebR Forest Plot Testing (v2.2)
- [x] Create WebR test component for forest plot generation (app/webr-test.tsx)
- [x] Implement R code execution through WebView bridge (hooks/use-webr-test.ts)
- [x] Generate forest plot with sample BCG vaccine data (BCG_VACCINE_DATA constant)
- [x] Capture plot output as base64 image (via WebView message bridge)
- [x] Display generated plot in React Native (WebRTestScreen)

## MLC-LLM Integration (v2.2)
- [x] Research MLC-LLM React Native bindings (@react-native-ai/mlc from Callstack)
- [x] Create model download manager (lib/llm/mlc-llm-service.ts)
- [x] Implement model loading and initialization (MLCLLMService class)
- [x] Add inference API for text generation (generate, generateStream methods)
- [x] Integrate with MobileLLMService (tiered fallback architecture)
- [x] Create model manager screen (app/model-manager.tsx)

## Offline Mode UI (v2.2)
- [x] Create network status hook (hooks/use-network-status.ts)
- [x] Build offline mode indicator component (components/offline-indicator.tsx)
- [x] Show current LLM tier (cloud/local/template)
- [x] Add visual feedback for model download progress
- [x] Integrate indicator into app header (OfflineIndicatorCompact)


## MLC-LLM Native Module Integration (v2.3)
- [x] Install @react-native-ai/mlc package
- [x] Install Vercel AI SDK (ai package)
- [x] Enable New Architecture in app.config.ts (already enabled)
- [x] Add Increased Memory Limit capability for iOS entitlements
- [x] Update MLC-LLM service to use native module (lib/llm/mlc-llm-service.ts)
- [x] Implement actual model download from MLC (lib/llm/mlc-native.ts)
- [x] Wire up generateText with Vercel AI SDK
- [x] Add streaming support for real-time responses (generateStream)
- [x] Create useMLCChat hook for React components (hooks/use-mlc-chat.ts)
- [x] Test on-device inference with mock (198 tests passing)
- [x] Automatic fallback to mock when native unavailable


## Open Source Model Emphasis (v2.4)
- [x] Add license information to model metadata (Llama 3.2 Community, MIT, Apache 2.0)
- [x] Add detailed capability descriptions for each model
- [x] Add "Open Source" badges to model cards
- [x] Highlight model creators (Meta, Microsoft, Alibaba, Mistral AI)
- [x] Add use case recommendations for each model (bestFor array)
- [x] Emphasize privacy and offline benefits (privacy banner)
- [x] Add expandable "Learn More" section with full details
- [x] Add license links that open in browser
- [x] Add "Why Open Source?" info section


## Onboarding Wizard (v2.5)
- [x] Create device detection utility (RAM, device model) - lib/device/device-info.ts
- [x] Build multi-step onboarding wizard UI - app/onboarding.tsx
- [x] Add use case selection screen (research, quick lookups, code help)
- [x] Implement model recommendation algorithm (getRecommendedModel)
- [x] Add first-launch detection with AsyncStorage
- [x] Create wizard navigation flow (4 steps)
- [x] Add skip option for experienced users
- [x] Show recommended model with explanation


## Terminal UI Enhancement (v2.5)
- [x] Create new ASCII art logo for terminal header (ASCIILogo, ASCIILogoCompact)
- [x] Design CLI-style command output formatting (StyledBox, ROutput)
- [x] Add syntax highlighting for R code blocks (CodeBlock)
- [x] Create styled boxes for different message types
- [x] Add command prompt styling (CommandPrompt with ● meta ❯)
- [x] Implement thinking/processing animations (ThinkingIndicator)
- [x] Add success/error/warning styled outputs (SuccessMessage, ErrorMessage, etc.)
- [x] Create help command with ASCII formatting (HelpOutput)
- [x] Enhanced autocomplete with icons and badges
- [x] Added keyboard hints for web (↑↓ history • Tab autocomplete)


## Command History Persistence (v2.6)
- [x] Create CommandHistoryService with AsyncStorage (lib/history/command-history.ts)
- [x] Implement max history limit (100 commands)
- [x] Add deduplication for consecutive identical commands
- [x] Create useCommandHistory hook (hooks/use-command-history.ts)
- [x] Integrate with terminal input for arrow key navigation
- [x] Add /history command to view recent commands (formatted ASCII box)
- [x] Add /clear-history command to reset history
- [x] Add comprehensive tests (28 tests passing)


## BYOK (Bring Your Own Key) Integration (v2.7)
- [x] Research MiniMax M2.1 API documentation (Anthropic-compatible)
- [x] Create secure API key storage using expo-secure-store
- [x] Implement APIKeyManager service (lib/api-keys/api-key-manager.ts)
- [x] Create OpenAI provider client
- [x] Create Anthropic provider client
- [x] Create Gemini provider client
- [x] Create OpenRouter provider client (100+ models via one key)
- [x] Create MiniMax M2.1 provider client (M2.1, M2.1-lightning, M2)
- [x] Build API Keys settings screen UI (app/api-keys.tsx)
- [x] Add key validation for each provider
- [x] Integrate with MobileLLMService fallback chain (BYOK → cloud → local → template)
- [x] Add provider selection in settings
- [x] Add model selection per provider
- [x] Add comprehensive tests (248 tests passing)


## AgentSkills Integration (v2.8)
- [x] Research AgentSkills specification from agentskills.io
- [x] Review Claude best practices for agent skills
- [x] Analyze existing skills loader implementation
- [x] Create comprehensive meta-analysis skill definitions (8 skills)
- [x] Implement system prompt injection for all providers (generateWithSkills)
- [x] Ensure consistent behavior across OpenAI, Anthropic, Gemini, OpenRouter, MiniMax
- [x] Add teaching/tutorial capabilities to skills (teaching-meta-analysis skill)
- [x] Test skill injection across different models (25 tests passing)
- [x] Create skill matching algorithm (matchSkillsToQuery)
- [x] Build context-aware prompt builder (buildContextAwarePrompt)
- [x] Add response guidelines for Cochrane methodology


## RAG Knowledge Base (v2.9)
- [x] Research mobile-compatible RAG architecture (Gemini File Search)
- [x] Create Gemini File Search service (lib/rag/gemini-file-search.ts)
- [x] Define knowledge base structure (5 stores: Cochrane, Seminal Papers, R Docs, R Errors, Teaching)
- [x] Add seminal papers content structure (DerSimonian & Laird, Higgins I², Egger bias)
- [x] Bundle R package documentation structure (metafor, meta, dmetar, robvis, netmeta)
- [x] Implement teachWithSocraticMethod() for RAG-grounded teaching
- [x] Implement debugRError() for RAG-grounded debugging
- [x] Create semantic search API (semanticSearch function)

## Socratic Teaching Mode (v2.9)
- [x] Design Socratic questioning patterns (8 topic categories)
- [x] Add guiding questions instead of direct answers (SOCRATIC_QUESTIONS)
- [x] Implement topic detection from user input (detectTopic)
- [x] Create progressive complexity scaffolding (SOCRATIC_TEACHING_SKILL)
- [x] Add teaching response patterns (acknowledgment, encouragement, clarification, guidance)
- [x] Include "why" explanations with every recommendation
- [x] Create buildSocraticResponse() function
- [x] Add isSocraticTrigger() for teaching intent detection

## R Debugging Skill (v2.9)
- [x] Create R error pattern recognition (12 patterns in R_ERROR_PATTERNS)
- [x] Build common error database (package, data format, NA, metafor-specific)
- [x] Implement step-by-step debugging guidance (generateDebugResponse)
- [x] Add code fix suggestions with explanations (teaching moments)
- [x] Create analyzeRError() for automatic error classification
- [x] Include R best practices and pitfall warnings
- [x] Add METAFOR_FUNCTIONS reference (rma, escalc, forest, funnel)
- [x] Create containsRError() detection function
- [x] All 296 tests passing


## Knowledge Base Setup Script (v2.10)
- [x] Research Gemini File Search upload API requirements
- [x] Research Gemini Embeddings API (gemini-embedding-001, task types, dimensions)
- [x] Create setup-knowledge-base.ts for File Search stores
- [x] Create generate-embeddings.ts for local vector store
- [x] Add Cochrane Handbook content (Chapters 6, 8, 10, 13)
- [x] Add seminal papers (DerSimonian-Laird, Higgins I², Egger)
- [x] Add R documentation (metafor, meta packages, error patterns)
- [x] Create LocalVectorStore for offline semantic search
- [x] Create HybridRAGService (online embeddings + offline fallback)
- [x] Add keyword-based fallback search when embeddings unavailable
- [x] Create README-knowledge-base.md documentation
- [x] All 296 tests passing


## Knowledge Base Features (v2.11)
- [x] Run embeddings generation script with Gemini API
- [x] Generate local embeddings.json file (454 KB, 19 chunks)
- [x] Add /knowledge command to terminal
- [x] Add /kb alias for /knowledge
- [x] Implement knowledge base search functionality (useKnowledgeSearch hook)
- [x] Create knowledge base browser screen (app/knowledge.tsx)
- [x] Add category navigation (Cochrane, Seminal Papers, R Docs)
- [x] Display content with proper formatting
- [x] Add search within knowledge base
- [x] Add formatKnowledgeResults for terminal display
- [x] All 296 tests passing


## Knowledge Base Expansion (v2.12)
- [x] Add more Cochrane Handbook chapters (5, 7, 9, 11, 12, 14)
- [x] Add GRADE methodology content (certainty of evidence)
- [x] Add PRISMA 2020 guidelines content
- [x] Add Bradford Hill causation criteria
- [x] Add network meta-analysis guidance
- [x] Regenerate embeddings with expanded content (36 chunks, 1.1MB)
- [x] Wire knowledge results to AI context injection (rag-provider.ts)
- [x] Create RAG-enhanced prompt builder (generateWithRAG)
- [x] Add Learn More button to knowledge search results
- [x] Integrate Socratic teaching mode with Learn More
- [x] Test end-to-end knowledge-to-AI flow
- [x] All 296 tests passing


## Production Readiness (v3.0)

### Bug Fixes
- [x] Fix "Unexpected text node" error (removed debug console.log in theme-provider)
- [x] Audit all components for text outside Text elements
- [x] Fix any conditional rendering issues

### Error Handling
- [x] Add error boundaries for graceful crash recovery (ErrorBoundary component)
- [x] Add proper loading states for all async operations (LoadingSpinner, SkeletonLoader)
- [x] Improve error messages for user-facing errors
- [x] Add retry logic for network failures

### Performance Optimization
- [x] Audit and optimize re-renders
- [x] Optimize image assets (reduced from 19MB to 1.8MB)
- [x] TypeScript clean (0 errors)
- [x] All 296 tests passing
- [ ] Optimize FlatList rendering in terminal output
- [ ] Review and optimize bundle size

### Code Quality
- [ ] Fix all TypeScript errors and warnings
- [ ] Remove unused imports and dead code
- [ ] Add missing type annotations
- [ ] Ensure consistent code style

### Testing
- [ ] Verify all slash commands work
- [ ] Test knowledge base search end-to-end
- [ ] Test BYOK API key flow
- [ ] Test offline mode indicator
- [ ] Test onboarding wizard flow

## In-App Tutorial System (v3.1)

### Tutorial Infrastructure
- [x] Design tutorial structure with learning modules (6 modules, 40+ steps)
- [x] Create TutorialService for state management
- [x] Define TutorialStep and TutorialModule types
- [x] Implement tutorial progress persistence with AsyncStorage

### Tutorial UI Components
- [x] Create TutorialTooltip component with arrow positioning
- [x] Create TutorialHighlight component for element focus
- [x] Create TutorialProgress indicator (steps completed)
- [x] Create TutorialOverlay for dimming background
- [x] Create TutorialCard for step content display

### Tutorial Content Modules
- [x] Module 1: Welcome & App Overview (6 steps)
- [x] Module 2: Understanding Meta-Analysis Basics (8 steps with quizzes)
- [x] Module 3: Your First Forest Plot (6 steps with R code)
- [x] Module 4: Working with Study Data (6 steps)
- [x] Module 5: Interpreting Results (7 steps with quizzes)
- [x] Module 6: Using AI Assistant & Socratic Mode (8 steps)

### Tutorial Screens
- [x] Create tutorial hub screen with module selection
- [x] Implement step-by-step walkthrough navigation
- [x] Add skip/resume tutorial functionality
- [x] Integrate with terminal for action tracking

### Integration & Testing
- [x] Connect tutorial to Socratic teaching mode
- [x] Add tutorial trigger points in terminal
- [x] Write unit tests for tutorial service (40 tests)
- [x] All 336 tests passing

## Tutorial Enhancements (v3.2)

### Start Tutorial Button
- [x] Add prominent "Start Tutorial" button to home screen
- [x] Show tutorial progress indicator for returning users
- [x] Add Sample Data button to quick actions bar

### Practice Datasets
- [x] Create BCG vaccine trials sample dataset (13 studies)
- [x] Create aspirin CVD prevention dataset (9 studies)
- [x] Create CBT for depression dataset (12 studies)
- [x] Create homework effect dataset (10 studies)
- [x] Add dataset loading integration with terminal
- [x] Create PracticeDatasets modal with category filtering

### Completion Certificates
- [x] Design certificate HTML template with user name and date
- [x] Generate HTML certificates on tutorial completion
- [x] Add share functionality for certificates
- [x] Store certificates in app for later access
- [x] Add CertificateModal to tutorial hub

### Testing
- [x] Write tests for practice datasets (20 tests)
- [x] Write tests for certificate data structure (4 tests)
- [x] All 360 tests passing

## AgentSkills Conversion & Website (v3.3)

### AgentSkills Format Conversion
- [x] Analyze AgentSkills repository structure
- [x] Convert 8 core skills to AgentSkills Markdown format
- [x] Create skill dependencies and prerequisites
- [x] Add assessment questions and teaching frameworks
- [x] Package as standalone skills repository

### Skills Created
- [x] meta-analysis-fundamentals (beginner, 15 min)
- [x] forest-plot-creation (intermediate, 10 min)
- [x] heterogeneity-analysis (intermediate, 12 min)
- [x] publication-bias-detection (intermediate, 12 min)
- [x] data-extraction (intermediate, 15 min)
- [x] grade-assessment (advanced, 20 min)
- [x] r-code-generation (intermediate, 15 min)
- [x] socratic-teaching (beginner, varies)

### Landing Page Website
- [x] Design responsive landing page for low-profile launch
- [x] Showcase 8 available skills with difficulty badges
- [x] Add 3 learning paths (Quick Start, Comprehensive, Teaching)
- [x] Include mission statement (democratizing meta-analysis education)
- [x] Add "How It Works" section with 3 steps
- [x] Create "Help Us Grow" contribution section

### Distribution
- [x] Prepare repository structure with README
- [x] Write installation and usage instructions
- [x] Create CONTRIBUTING.md guidelines
- [x] Add Apache 2.0 LICENSE

## Meta Branding & Agent Experience (v3.4)

### ASCII Art Branding
- [ ] Create ASCII "Meta" logo for home screen
- [ ] Design TUI-inspired visual identity throughout app
- [ ] Add ASCII art to terminal interface
- [ ] Create consistent retro-tech aesthetic

### Meta Agent Onboarding
- [ ] Design Meta as the primary AI guide
- [ ] Create interactive onboarding flow with Meta
- [ ] Implement shared memory system for agents
- [ ] Add personalized welcome experience
- [ ] Meta presents app capabilities interactively

### Advanced Skills
- [ ] Create Network Meta-Analysis skill
- [ ] Create Bayesian Meta-Analysis skill
- [ ] Create IPD (Individual Patient Data) skill

### Portuguese Translation
- [ ] Translate meta-analysis-fundamentals to Portuguese
- [ ] Translate forest-plot-creation to Portuguese
- [ ] Translate heterogeneity-analysis to Portuguese
- [ ] Translate publication-bias-detection to Portuguese
- [ ] Translate data-extraction to Portuguese
- [ ] Translate grade-assessment to Portuguese
- [ ] Translate r-code-generation to Portuguese
- [ ] Translate socratic-teaching to Portuguese

## Glass Agent & RAG System (v3.4)

### Glass Identity & Branding
- [x] Rename Meta agent to Glass (Gene Glass tribute)
- [x] Design raposa (fox) mascot identity
- [x] Create ASCII art for Glass branding
- [x] Update onboarding with Glass introduction

### Knowledge Base RAG (Gemini File Search)
- [x] Design RAG architecture documentation
- [x] Create KnowledgeBaseService for Glass
- [x] Define document categories (Cochrane, seminal, guidelines, software)
- [x] Implement language detection (PT/EN/ES/ZH)
- [x] Create Glass system prompt with Socratic method
- [ ] Upload Cochrane Handbook chapters to FileSearchStore
- [ ] Upload seminal articles (Glass 1976, DerSimonian, Higgins)
- [ ] Upload PRISMA/GRADE/QUADAS guidelines
- [ ] Upload metafor/netmeta documentation
- [ ] Test RAG retrieval accuracy

### Advanced AgentSkills Created
- [x] Network Meta-Analysis skill
- [x] Bayesian Meta-Analysis skill
- [x] IPD Meta-Analysis skill
- [x] Trial Sequential Analysis (TSA) skill
- [x] Diagnostic Meta-Analysis skill
- [x] Add Adaptation Guidelines to all 13 skills

### AgentSkills Documentation
- [x] Update README with 13 total skills
- [x] Add advanced learning path (2.5 hours)
- [x] Update skill dependency diagram


## RAG Knowledge Base Upload (v3.5)

### Document Collection
- [x] Download Cochrane Handbook Chapter 10 (Meta-analyses)
- [x] Download Cochrane Handbook Chapter 11 (Network Meta-analysis)
- [x] Download Cochrane Handbook Chapter 14 (GRADE)
- [x] Download Cochrane Handbook Chapter 26 (IPD)
- [x] Create seminal articles reference document (Glass 1976, DerSimonian-Laird 1986, Higgins I²)
- [x] Create metafor R package guide
- [ ] Compile PRISMA/GRADE guidelines

### Knowledge Base Contents (7 files, 4599 lines)
- cochrane-chapter-10-meta-analysis.md (968 lines)
- cochrane-chapter-11-network-meta-analysis.md (1475 lines)
- cochrane-chapter-14-grade.md (1267 lines)
- cochrane-chapter-26-ipd.md (459 lines)
- seminal-articles-references.md (123 lines)
- metafor-package-guide.md (249 lines)
- cochrane-handbook-structure.md (58 lines)

### Gemini File Search Setup
- [ ] Create FileSearchStore in Gemini
- [ ] Upload knowledge base documents
- [ ] Configure retrieval parameters

### Testing
- [ ] Test RAG retrieval with sample queries
- [ ] Verify citation accuracy
- [ ] Test multilingual queries


## Glass Mascot & Integration (v3.6)

### Gemini FileSearchStore
- [x] Configure Gemini File Search API (gemini-file-search.service.ts)
- [x] Define 7 knowledge base documents structure
- [ ] Upload documents to Gemini (requires API key)
- [x] Integrate with Glass service

### Glass Fox Mascot
- [x] Generate fox illustration for light mode (glass-fox-light.png)
- [x] Generate fox illustration for dark mode (glass-fox-dark.png)
- [x] Add toggle between light/dark mascot
- [x] Keep ASCII art alongside illustration (6 animation frames)

### Animated TUI Interface
- [x] Create animated fox component with react-native-reanimated (GlassMascot.tsx)
- [x] Add idle animation (blinking, breathing)
- [x] Add talking animation for responses
- [x] Add thinking animation for processing
- [x] Add happy and sleep states

### Contextual Information Display
- [x] Show current date/time (GlassStatusBar.tsx)
- [x] Display next lessons from tutorial
- [x] Show active AI model name
- [x] Add theme toggle button

### Mini-Agent Integration
- [x] Create Mini-Agent service (mini-agent.service.ts)
- [x] Configure 13 skills loading
- [x] Implement chat interface with history
- [x] Add multilingual response detection

### Testing
- [x] Glass integration tests (25 tests)
- [x] All 385 tests passing

## API Configuration (v3.7)

### API Keys Setup
- [x] Configure GEMINI_API_KEY
- [x] Configure MINIMAX_API_KEY
- [x] Validate Gemini API key (working)
- [ ] Validate MiniMax API key (invalid - needs user verification)

### Gemini RAG Integration
- [ ] Upload knowledge base documents to Gemini
- [ ] Test RAG queries
- [ ] Integrate with Glass chat

### Home Screen Integration
- [ ] Add GlassStatusBar to terminal screen
- [ ] Show Glass mascot with animations
- [ ] Display contextual information

## Glass Home Screen Integration (v3.7)

### GlassStatusBar Integration
- [x] Replace current status bar with GlassStatusBarTUI
- [x] Maintain TUI aesthetic and ASCII art style (box borders, monospace font)
- [x] Add animated Glass fox mascot with blink/think states
- [x] Show contextual info (date/time, Mistral 7B model, next lesson)
- [x] Add session ID display
- [x] All 391 tests passing

## Gemini RAG Upload (v3.8)

### Document Upload
- [ ] Create upload script for Gemini File Search API
- [ ] Upload cochrane-chapter-10-meta-analysis.md
- [ ] Upload cochrane-chapter-11-network-meta-analysis.md
- [ ] Upload cochrane-chapter-14-grade.md
- [ ] Upload cochrane-chapter-26-ipd.md
- [ ] Upload seminal-articles-references.md
- [ ] Upload metafor-package-guide.md
- [ ] Upload cochrane-handbook-structure.md

### RAG Testing
- [ ] Test retrieval with meta-analysis query
- [ ] Test retrieval with forest plot query
- [ ] Test retrieval with heterogeneity query

## Mini-Agent Installation (v3.8)

### Repository Setup
- [x] Clone Mini-Agent repository from MiniMax
- [x] Analyze repository structure and requirements
- [x] Install Mini-Agent via uv tool (56 packages)

### Configuration
- [x] Create config.yaml with MiniMax M2.1 model
- [x] Create Glass system prompt (system_prompt.md)
- [x] Configure AgentSkills directory (/home/ubuntu/meta-agent-mobile/agentskills)
- [x] Configure knowledge base directory (/home/ubuntu/meta-agent-mobile/knowledge-base)

### Integration
- [x] Update mini-agent.service.ts for Anthropic-compatible API
- [x] Integrate with Gemini File Search for RAG
- [x] All 391 tests passing

### Notes
- MiniMax API key needs verification (returned 'invalid api key')
- Gemini API key working (7 documents uploaded)
- Mini-Agent CLI installed at /home/ubuntu/.local/bin/mini-agent


## MiniMax Anthropic API Integration (v3.9)

### API Configuration
- [x] Configure MiniMax API key (sk-cp-...)
- [x] Update mini-agent.service.ts for Anthropic-compatible endpoint
- [x] Use correct endpoint: https://api.minimax.io/anthropic/v1/messages
- [x] Use x-api-key header (Anthropic format)
- [x] Model: MiniMax-M2.1

### Testing
- [x] API key validation test passing
- [x] All 391 tests passing
- [x] MiniMax M2.1 responding with "thinking" blocks


## Glass Chat Integration (v3.10)

### Chat Input on Home Screen
- [ ] Create GlassChatInput component with text field
- [ ] Integrate with MiniMax M2.1 backend
- [ ] Show Glass responses in terminal output
- [ ] Add typing indicator while Glass is thinking

### Glass Testing
- [ ] Test Glass with heterogeneity question
- [ ] Validate RAG retrieval from knowledge base
- [ ] Verify skills are being used in responses

### Presentation Narration
- [ ] Generate remaining Portuguese audio segments
- [ ] Generate English audio segments
- [ ] Compile all audio files for presentation


## Glass Chat Integration (v3.8)

### Chat Input Component
- [x] Create GlassChatInput component with TUI styling
- [x] Add fox emoji prompt indicator
- [x] Add Glass state indicators (idle, thinking, talking, error)
- [x] Add TUI box drawing borders
- [x] Add MiniMax M2.1 attribution in hints

### useGlass Hook
- [x] Create useGlass hook for MiniMax M2.1 integration
- [x] Initialize MiniMax service with API key
- [x] Initialize Gemini RAG service
- [x] Manage conversation history with AsyncStorage
- [x] Support language detection (PT-BR, ES, EN)
- [x] Detect skills used in responses
- [x] Handle errors gracefully

### Home Screen Integration
- [x] Replace TerminalInput with GlassChatInput
- [x] Route slash commands to agent, natural language to Glass
- [x] Combine messages from both sources
- [x] Update status bar to show MiniMax M2.1 model
- [x] Display Glass state in status bar

### Testing
- [x] Create use-glass.test.ts with 30+ tests
- [x] Create glass-chat-input.test.ts with 20+ tests
- [x] Test Glass API with Portuguese meta-analysis question
- [x] Verify skills detection and language detection
- [x] All 437 tests passing


## Glass UX Enhancements (v3.9)

### Voice Features with MiniMax TTS
- [ ] Create MiniMax TTS service for text-to-speech
- [ ] Add speak button to Glass responses
- [ ] Implement audio playback for responses
- [ ] Add voice selection (250+ voices available)
- [ ] Support multilingual voices (PT-BR, EN, ES)

### Skills Badges Display
- [ ] Create SkillBadge component with TUI styling
- [ ] Display skills used below each Glass response
- [ ] Add skill icons/colors for visual distinction
- [ ] Show skill descriptions on tap

### Quick Prompts
- [ ] Create QuickPrompts component with preset questions
- [ ] Add common meta-analysis questions
- [ ] Add R code example prompts
- [ ] Style as TUI-themed buttons
- [ ] Integrate with GlassChatInput


## Glass UX Enhancements (v3.1)
- [x] Voice output with MiniMax TTS API (SpeakButton component)
- [x] Skills badges display (SkillBadge, SkillBadgesRow components)
- [x] Quick prompts for common questions (QuickPrompts, QuickPromptsBar)
- [x] Integration with home screen terminal output
- [x] Tests for all new features (455 tests passing)


## Voice Input & Spreadsheet Support (v3.2) - COMPLETED
- [x] Voice input with speech-to-text for hands-free interaction (VoiceInputButton)
- [x] Spreadsheet editor component for in-app data entry (SpreadsheetEditor)
- [x] Spreadsheet upload and import CSV (SpreadsheetImporter)
- [x] Larger animated Glass mascot with front/back loop animation (GlassMascotLarge)
- [x] Integration with meta-analysis workflow (home screen integration)
- [x] 468 tests passing


## Data Validation & Templates (v3.3)
- [ ] Data validation with cell highlighting for invalid values
- [ ] Glass prompts to help users fix validation errors
- [ ] Spreadsheet template system with save/load functionality
- [ ] Pre-built templates for RCT, cohort, case-control studies
- [ ] Voice output for data entry verification (read back values)
- [ ] Accessibility improvements for data entry


## Data Validation & Templates (v3.3) - COMPLETED
- [x] Data validation with cell highlighting (error/warning colors)
- [x] Glass prompts for fixing errors (long-press cells for help)
- [x] Spreadsheet templates for study types (RCT, cohort, case-control, cross-sectional, diagnostic)
- [x] Save/load custom templates (TemplatePicker component)
- [x] Voice output for data entry verification (DataEntryVoice component)
- [x] Validation summary bar showing error/warning counts
- [x] 503 tests passing


## Spreadsheet Data Management (v3.4)
- [ ] R code generation from spreadsheet data
- [ ] Export R code for RStudio or in-app console
- [ ] Auto-save every 30 seconds
- [ ] Undo/redo history stack for edits
- [ ] R code preview UI component
- [ ] Enhanced Glass mascot entrance animation
- [ ] Clarify pre-loaded model in device/model selection screen


## Spreadsheet Data Management (v3.4) - COMPLETED
- [x] R code generation from spreadsheet data (r-code-generator.service.ts)
- [x] Export R code for RStudio or in-app console (RCodePreview component)
- [x] Auto-save every 30 seconds (useAutoSave hook)
- [x] Undo/redo history stack for edits (useHistory, useSpreadsheetHistory hooks)
- [x] R code preview UI component with syntax highlighting
- [x] Enhanced Glass mascot entrance animation (GlassAnimatedEntrance)
- [x] Clarify pre-loaded model in device/model selection screen
- [x] 538 tests passing


## Interactive Tutorial System (v3.5) - COMPLETED
- [x] Tutorial system architecture with step definitions (TutorialStepConfig)
- [x] Tutorial overlay component with spotlight highlighting (TutorialOverlay)
- [x] Glass guidance bubbles with animations (GlassTutorialGuide)
- [x] Forest plot tutorial (12 steps: intro → components → quiz → BCG data → create plot → interpret → heterogeneity → celebration)
- [x] Progress tracking with step indicators and dots
- [x] Tutorial completion rewards and badges (TutorialCompletionBadge with confetti)
- [x] Tutorial launcher from home screen (green "Forest Plot Tutorial" button)
- [x] Skip and resume tutorial functionality
- [x] Quiz system with feedback and auto-advance
- [x] 552 tests passing


## Advanced Tutorials & Progress System (v3.6) - COMPLETED
- [x] Heterogeneity analysis tutorial (I²/Q statistics, tau², prediction intervals) - 12 steps
- [x] Subgroup analysis tutorial (moderator variables, BCG latitude example) - 12 steps
- [x] Tutorial bookmarks system (save progress at any step)
- [x] My Progress dashboard screen (completed tutorials, badges, statistics, streaks)
- [x] Voice narration with MiniMax TTS for accessibility
- [x] Resume from bookmark functionality
- [x] Quiz score tracking and statistics
- [x] 572 tests passing


## TUI Redesign & New Features (v3.7)

### TUI Visual Overhaul
- [ ] Black background theme for entire app
- [ ] Glass-blue ASCII color scheme (#00BFFF cyan/glass blue)
- [ ] Large animated Glass fox mascot in ASCII (fox fur orange color)
- [ ] Fox animation moving across TUI screens
- [ ] TUI-style ASCII buttons (microphone, folder, start tutorial, new data)
- [ ] Box-drawing characters for all UI elements

### Meta-Regression Tutorial
- [ ] Tutorial structure and steps (12+ steps)
- [ ] Continuous moderators explanation (year, dose, baseline risk)
- [ ] Mixed-effects models explanation (random slopes)
- [ ] R code examples with metafor package
- [ ] Quiz questions for key concepts
- [ ] BCG vaccine latitude example as case study
- [ ] Bubble plot visualization explanation

### Badge Sharing
- [ ] Share badges to social media (Twitter, LinkedIn, WhatsApp)
- [ ] Generate shareable badge images
- [ ] Progress summary cards for sharing

### Spaced Repetition Quizzes
- [ ] Quiz scheduling based on forgetting curve
- [ ] Review notifications for due quizzes
- [ ] Quiz history and performance tracking
- [ ] Adaptive difficulty based on performance


## TUI Redesign & New Features (v3.7) - COMPLETED

### TUI Visual Overhaul - COMPLETED
- [x] Black background theme for entire app (theme.config.js updated)
- [x] Glass-blue ASCII color scheme (#00BFFF cyan/glass blue)
- [x] Large animated Glass fox mascot in ASCII (GlassFoxLarge component)
- [x] Fox animation moving across TUI screens (GlassFoxWalking)
- [x] TUI-style ASCII buttons (TUIButton, TUIIconButton, TUIActionBar)
- [x] Box-drawing characters for all UI elements

### Meta-Regression Tutorial - COMPLETED
- [x] Tutorial structure and steps (18 steps)
- [x] Continuous moderators explanation (year, dose, baseline risk)
- [x] Mixed-effects models explanation (random slopes)
- [x] R code examples with metafor package
- [x] Quiz questions for key concepts (4 quizzes)
- [x] BCG vaccine latitude example as case study
- [x] Bubble plot visualization explanation

### Badge Sharing - COMPLETED
- [x] Share badges to social media (Twitter, LinkedIn, WhatsApp)
- [x] Generate shareable badge content (ASCII cards)
- [x] Progress summary cards for sharing (ShareBadgeModal)

### Spaced Repetition Quizzes - COMPLETED
- [x] Quiz scheduling based on SM-2 algorithm (forgetting curve)
- [x] Due cards tracking and review sessions
- [x] Quiz history and performance tracking
- [x] Adaptive difficulty based on response time and correctness
- [x] SpacedRepetitionQuiz component
- [x] 599 tests passing


## Community & Engagement Features (v3.8)

### Achievement Notifications
- [ ] Toast notification system for achievements
- [ ] Glass celebrating animation on badge earned
- [ ] Streak milestone notifications (7 days, 30 days, etc.)
- [ ] Sound effects for achievements (optional)

### Community Discovery System
- [ ] Conference discovery feed (meta-analysis, systematic review conferences)
- [ ] Call for papers aggregator
- [ ] Research opportunity alerts
- [ ] Connect with researchers with similar interests
- [ ] Interest-based matching algorithm
- [ ] Event calendar integration

### Quiz Leaderboard
- [ ] Local leaderboard for personal progress
- [ ] Public leaderboard for competitive learning
- [ ] Weekly/monthly rankings
- [ ] Anonymous username system for privacy
- [ ] Score calculation based on accuracy and speed

### Dark/Light Theme Toggle
- [ ] Theme toggle in settings
- [ ] Light theme color scheme
- [ ] Persist theme preference
- [ ] Smooth transition animation

### AI-Powered Personalized Feedback
- [ ] Analyze quiz performance patterns
- [ ] Suggest weak areas to review
- [ ] Personalized study recommendations
- [ ] Adaptive difficulty suggestions

### Community Tutorial Sharing
- [ ] Create custom tutorials
- [ ] Share tutorials with community
- [ ] Browse community tutorials
- [ ] Rate and review tutorials


## Community & Engagement Features (v3.8) - COMPLETED

### Achievement Notifications - COMPLETED
- [x] Toast notification system for achievements (AchievementToast component)
- [x] Glass celebrating animation on badge earned
- [x] Achievement service with 10+ achievement types
- [x] Haptic feedback on achievement unlock

### Community Discovery System - COMPLETED
- [x] Conference discovery feed (CommunityDiscoveryScreen)
- [x] Call for papers aggregator with deadlines
- [x] Research grants and opportunities
- [x] Interest-based filtering (meta-analysis, systematic review, etc.)
- [x] TUI-styled community interface

### Quiz Leaderboard - COMPLETED
- [x] Local leaderboard for personal progress (LeaderboardScreen)
- [x] Public leaderboard with rankings
- [x] Weekly/monthly/all-time views
- [x] Anonymous username system
- [x] Score calculation with accuracy and speed

### Dark/Light Theme Toggle - COMPLETED
- [x] Theme toggle components (ThemeToggle, TUIThemeToggle)
- [x] Light theme color scheme in theme.config.js
- [x] Persist theme preference via ThemeProvider
- [x] Smooth transition with Appearance API

### AI-Powered Personalized Feedback - COMPLETED
- [x] AI feedback service (ai-feedback.service.ts)
- [x] Quiz performance analysis
- [x] Personalized study recommendations
- [x] Motivational messages based on activity
- [x] Contextual tips for incorrect answers

### All Tests Passing
- [x] 599 tests passing
- [x] 0 TypeScript errors
- [x] Ready for deploy


## Offline Mode & PDF Export (v3.9)

### WebR Offline Mode
- [ ] Set up WebR integration for browser-based R execution
- [ ] Create WebR service wrapper for meta-analysis functions
- [ ] Implement offline forest plot generation
- [ ] Implement offline heterogeneity analysis (I², Q, tau²)
- [ ] Implement offline meta-regression
- [ ] Cache metafor package for offline use
- [ ] Add offline status indicator in UI
- [ ] Handle WebR initialization and loading states

### PDF Report Export
- [ ] Create PDF report generator service
- [ ] Design report template with forest plot visualization
- [ ] Include heterogeneity statistics in report
- [ ] Include study table with effect sizes
- [ ] Add meta-analysis summary section
- [ ] Support multiple languages (PT, EN, ES)
- [ ] Add export button to spreadsheet editor
- [ ] Generate downloadable PDF file
- [ ] Add report customization options (title, author, date)


## Offline Mode & PDF Export (v3.9) - COMPLETED

### WebR Offline Mode - COMPLETED
- [x] Set up WebR integration for browser-based R execution
- [x] Create WebR service wrapper for meta-analysis functions
- [x] Implement offline forest plot generation
- [x] Implement offline heterogeneity analysis (I², Q, tau²)
- [x] Implement offline meta-regression
- [x] Cache metafor package for offline use
- [x] Add offline status indicator in UI (OfflineStatusIndicator)

### PDF Report Export - COMPLETED
- [x] Create PDF report generator service
- [x] Design report template with forest plot visualization
- [x] Include heterogeneity statistics in report
- [x] Include study table with effect sizes
- [x] Add meta-analysis summary section
- [x] Support multiple languages (PT, EN, ES)
- [x] ReportExportModal component with customization options
- [x] Generate downloadable PDF/HTML file
- [x] 642 tests passing


## Research Integration & Collaboration (v4.0)

### PubMed & CrossRef Integration
- [ ] Create PubMed API service for PMID search
- [ ] Create CrossRef API service for DOI search
- [ ] Auto-fill study metadata (authors, year, journal, sample size)
- [ ] Batch import multiple PMIDs/DOIs
- [ ] Search by title/author keywords
- [ ] Add search UI to spreadsheet editor

### Funnel Plots & Publication Bias
- [x] Add funnel plot generation as standard output
- [x] Implement Egger's test for asymmetry
- [x] Add trim-and-fill analysis
- [x] Create interactive SVG funnel plot component

### WebPlotDigitizer-Style Tool
- [x] Create image upload and canvas component
- [x] Implement axis calibration (set X/Y scale)
- [x] Add point extraction with click/tap
- [x] Support curve tracing for continuous data
- [x] Export extracted data to spreadsheet
- [x] Save/load digitization sessions

### Cloud Backup & Sync
- [x] Create cloud storage service for spreadsheets
- [x] Implement automatic backup on changes
- [x] Add sync status indicator
- [x] Handle offline/online transitions
- [x] Conflict resolution for concurrent edits
- [x] Database schema for spreadsheets, collaborators, history, progress
- [x] tRPC API routes for sync operations
- [x] useCloudSync hook for client-side sync

### Real-Time Collaborative Editing
- [x] Create polling-based service for real-time sync
- [x] Implement session management for concurrent edits
- [x] Show collaborator cursors/selections
- [x] Add share link generation (shareId)
- [x] Permission management (viewer/editor/admin)
- [x] Presence indicators (who's online)
- [x] CollaboratorPresence component
- [x] useCollaboration hook

### PubMed/CrossRef Integration
- [x] PubMed E-utilities API integration
- [x] CrossRef REST API integration
- [x] Search by PMID, DOI, or keywords
- [x] Parse and display study metadata
- [x] Auto-fill spreadsheet rows from search results
- [x] PubMedSearch component with modal UI
- [x] APA citation formatting

### PlotDigitizer Integration (v2.4)
- [x] Add PlotDigitizer toolbar button to SpreadsheetEditor
- [x] Create modal wrapper for PlotDigitizer in spreadsheet context
- [x] Implement data import flow from digitizer to spreadsheet rows
- [x] Map extracted points to appropriate columns
- [x] Add confirmation dialog before importing data
- [x] Test integration end-to-end


### Glass Orchestrator Development Plan
- [ ] Design Glass Orchestrator architecture document
- [ ] Define data type detection logic (binary, continuous, diagnostic, network, IPD)
- [ ] Create analysis selection matrix based on data type
- [ ] Design ROB article analyzer component
- [ ] Design reporting guideline selector (PRISMA variants)
- [ ] Design missing data handler module
- [ ] Design PRISMA-compliant methods/results generator
- [ ] Define edge case handling strategies
- [ ] Create implementation timeline and phases


### MVP Orchestrator Implementation Plan
- [x] Create orchestrator types (types.ts)
- [x] Create DataTypeDetector module with column pattern matching
- [x] Implement AnalysisSuggester for recommending appropriate analyses
- [x] Build R code generator for primary analyses
- [x] Create useOrchestrator hook for state management
- [ ] Create Glass integration for orchestrator suggestions
- [ ] Add UI component for displaying analysis recommendations
- [x] Write comprehensive tests for MVP Orchestrator (26 tests passing)

### Glass Orchestrator Integration
- [x] Review Glass agent architecture and skill definitions
- [x] Create analyze-data skill for orchestrator integration (orchestrator-skill.ts)
- [x] Add natural language explanation generation
- [x] Connect orchestrator to Glass conversation context (orchestrator-integration.ts)
- [x] Enable Glass to trigger R code generation
- [x] Test Glass orchestrator integration end-to-end (49 tests passing)


### /analyze Slash Command
- [x] Review existing slash command system in lib/agent/commands.ts
- [x] Add /analyze command to command registry
- [x] Add /detect, /suggest, /generate-code, /explain commands
- [x] Connect commands to orchestrator integration via markers
- [x] Add command suggestions for all orchestrator commands
- [x] Test /analyze command end-to-end (18 tests passing)
- [x] Update /help text with Orchestrator Commands section


### Demo Polish
- [x] Create AnalysisSuggestionCard component
- [x] Show detected data type with icon and confidence
- [x] Display suggested effect measure and model
- [x] Add "Run Analysis" and "Generate Code" buttons
- [x] Integrate card into SpreadsheetEditor header
- [x] Create onboarding tutorial (3-step walkthrough)
- [x] Existing onboarding already triggers on first app launch
- [ ] Test demo flow end-to-end


### E2E Test Scenarios
- [x] Create E2E test structure and utilities (test-utils.ts)
- [x] Test onboarding flow (welcome → device detection → model selection → completion)
- [x] Test data entry workflow (create spreadsheet → enter data → validation)
- [x] Test orchestrator detection (binary, continuous, diagnostic data types)
- [x] Test analysis suggestion flow (detect → suggest → user confirmation)
- [x] Test R code generation (generate → preview → copy)
- [x] Test full workflow integration (onboarding → data → analysis → results)
- [x] Test edge cases (empty data, invalid data, missing columns)
- [x] Test error handling and recovery
- [x] All 90 E2E tests passing, 901 total tests passing
