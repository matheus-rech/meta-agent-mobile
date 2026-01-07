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
