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
