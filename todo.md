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
