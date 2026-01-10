# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meta Agent Mobile is a comprehensive mobile meta-analysis platform built with Expo/React Native. It features a Glass AI assistant with 13+ specialized skills for conducting systematic reviews and meta-analyses, R integration for statistical analysis, and collaborative features for research teams.

**Key Features:**
- Mobile-first CLI terminal interface for AI-assisted meta-analysis
- MVP Orchestrator for automatic data type detection and analysis suggestions
- R code generation using metafor, mada, and netmeta packages
- PlotDigitizer for extracting data from published figures
- PubMed/CrossRef literature search integration
- Real-time collaboration and cloud sync
- Offline support with WebR

## Development Commands

```bash
# Development
pnpm dev                  # Start server + metro concurrently
pnpm dev:server           # Server only (tsx watch on port 3000)
pnpm dev:metro            # Metro bundler only (expo start --web on port 8081)

# Quality
pnpm check                # TypeScript type check
pnpm lint                 # ESLint via expo lint
pnpm format               # Prettier formatting

# Testing
pnpm test                 # Run all tests with Vitest
pnpm test -- --watch      # Watch mode
pnpm test -- --coverage   # With coverage report
pnpm test -- __tests__/e2e/  # Run specific test suite

# Database
pnpm db:push              # Generate and run Drizzle migrations

# Build
pnpm build                # Bundle server with esbuild
pnpm start                # Run production server

# Mobile
pnpm ios                  # Run on iOS simulator
pnpm android              # Run on Android emulator
pnpm qr                   # Generate Expo Go QR code
```

## Architecture

### Directory Structure
```
meta-agent-mobile/
├── app/                    # Expo Router screens and navigation
├── components/             # React Native UI components (87 files)
├── lib/                    # Core library code (95 files)
├── hooks/                  # React custom hooks (17 hooks)
├── server/                 # Backend API implementation (29 files)
├── drizzle/                # Database schema and migrations
├── agentskills/            # SKILL.md definitions for Glass AI
├── __tests__/              # Test suites (8 directories)
├── deploy/                 # Docker and deployment configs
├── shared/                 # Shared utilities and types
├── constants/              # Application constants
├── assets/                 # Images, audio, and media
├── knowledge-base/         # Knowledge base content for Glass
└── research/               # Research documents and notes
```

### App Structure (Expo Router)
```
app/
├── _layout.tsx             # Root layout with providers (tRPC, QueryClient, Workspace)
├── (tabs)/                 # Tab navigator
│   ├── _layout.tsx         # Tab navigator definition
│   ├── index.tsx           # Terminal screen (main CLI interface with Glass chat)
│   ├── history.tsx         # Command history browser
│   └── settings.tsx        # App settings
├── onboarding.tsx          # First-launch onboarding flow
├── tutorial.tsx            # Interactive tutorial system
├── tutorial-step.tsx       # Single tutorial step
├── api-keys.tsx            # API key management
├── knowledge.tsx           # Knowledge base browser
├── leaderboard.tsx         # User leaderboard/progress
├── my-progress.tsx         # Personal learning progress
├── community.tsx           # Community features
├── model-manager.tsx       # LLM model selection
├── webr-test.tsx           # WebR testing interface
├── oauth/callback.tsx      # OAuth deep link handler
└── dev/theme-lab.tsx       # Theme development
```

### Agent SDK (`lib/agent/`)
The core agent system for task planning and execution:
- **types.ts** - Message, Plan, Skill, SessionState types
- **planner.ts** - Task decomposition and step planning
- **executor.ts** - Step-by-step execution with tool calls
- **memory.ts** - Conversation history and context management
- **commands.ts** - Slash command registry (/help, /clear, /analyze, /detect, etc.)
- **skills.ts** - Domain-specific capabilities definitions
- **skills-loader.ts** - Dynamic skills loading from SKILL.md files

#### Agent Skills (`lib/agent/skills/`)
- **definitions.ts** - Detailed skill configurations
- **orchestrator-skill.ts** - MVP Orchestrator integration
- **r-debugging.ts** - R code debugging assistance
- **socratic-teaching.ts** - Socratic method teaching
- **prompt-builder.ts** - Dynamic prompt generation

### Glass AI Integration (`lib/glass/`)
Glass AI assistant system:
- **orchestrator-integration.ts** - MVP Orchestrator integration
- **mini-agent.service.ts** - Glass mini-agent system
- **knowledge-base.service.ts** - Knowledge base retrieval
- **glass-system-prompt.ts** - Glass AI system prompts
- **gemini-file-search.service.ts** - Gemini file search integration
- **minimax-tts.service.ts** - Text-to-speech service
- **available-skills.xml** - Skills availability metadata

#### MVP Orchestrator (`lib/glass/orchestrator/`)
Automatic analysis detection and suggestion system:
- **use-orchestrator.ts** - React hook for orchestrator
- **r-code-generator.ts** - R code generation
- **analysis-suggester.ts** - Analysis recommendations
- **data-type-detector.ts** - Data type detection
- **types.ts** - Type definitions

### Server (`server/`)
tRPC backend with specialized services:
- **routers.ts** - Main tRPC router with all API endpoints
- **r-execute.ts** - R code execution with Firejail sandboxing
- **r-streaming.ts** - Real-time R output streaming
- **db.ts** - Database query helpers and services
- **storage.ts** - S3 storage via Manus API

#### Glass API (`server/glass-api/`)
REST API for the orchestrator:
- **index.ts** - Express server setup
- **routes/chat.ts** - Chat endpoint
- **routes/execute.ts** - Code execution endpoint
- **routes/orchestrator.ts** - Analysis suggestions
- **routes/skills.ts** - Skill availability endpoint
- **routes/literature.ts** - Literature search endpoint
- **middleware/auth.ts** - API key verification
- **middleware/error.ts** - Error handling
- **middleware/logger.ts** - Request logging

#### Framework Code (`server/_core/`) - DO NOT MODIFY
- **context.ts** - tRPC context setup
- **trpc.ts** - tRPC router definition
- **llm.ts** - LLM API client for Claude/Gemini
- **oauth.ts** - OAuth authentication flow
- **voiceTranscription.ts** - Speech-to-text service
- **imageGeneration.ts** - Image generation service
- **dataApi.ts** - External data API integration
- **sdk.ts** - Manus SDK integration
- **systemRouter.ts** - System health endpoints
- **env.ts** - Environment configuration
- **notification.ts** - Push notifications
- **cookies.ts** - Cookie management

### Terminal Components (`components/terminal/`)
CLI-style UI components:
- **terminal-output.tsx** - Scrollable output display
- **terminal-input.tsx** - Command input with send button
- **streaming-output.tsx** - Real-time R execution display
- **autocomplete.tsx** - Slash command suggestions
- **markdown-renderer.tsx** - Agent response rendering
- **csv-picker.tsx** - Data file upload component
- **snippets-library.tsx** - R code templates
- **status-bar.tsx** - Terminal status indicator
- **ascii-art.tsx** - ASCII art display
- **export-sheet.tsx** - Data export functionality
- **file-viewer.tsx** - File viewing component

### Glass Components (`components/glass/`)
Glass AI mascot and animations:
- **GlassAnimatedEntrance.tsx** - Entrance animation
- **GlassMascot.tsx** - Main mascot component
- **GlassFoxLarge.tsx** - Fox mascot variant
- **GlassChatInput.tsx** - Chat input interface
- **GlassStatusBar.tsx** - Status display
- **VoiceInputButton.tsx** - Voice recording
- **SpeakButton.tsx** - Speech output
- **QuickPrompts.tsx** - Quick prompt suggestions
- **SkillBadge.tsx** - Skill display badges

### Database (`drizzle/`)
PostgreSQL/MySQL via Drizzle ORM:
- **schema.ts** - Table definitions
- **relations.ts** - Table relationships
- **migrations/** - Auto-generated migrations

**Tables:**
- `users` - User accounts with OAuth integration
- `spreadsheets` - Meta-analysis data with versioning
- `spreadsheet_collaborators` - Shared access control
- `spreadsheet_history` - Edit history and undo
- `user_progress` - Learning progress tracking
- `active_sessions` - Real-time collaboration sessions

### Custom Hooks (`hooks/`)
- **use-agent.ts** - Agent SDK integration
- **use-auth.ts** - Authentication state
- **use-glass.ts** - Glass AI integration
- **use-mlc-chat.ts** - MLC Chat local AI
- **use-webr-test.ts** - WebR testing
- **useCloudSync.ts** - Cloud synchronization
- **useCollaboration.ts** - Real-time collaboration
- **use-command-history.ts** - Command history
- **use-history.ts** - Session history
- **use-knowledge-search.ts** - Knowledge search
- **use-auto-save.ts** - Auto-save functionality
- **use-network-status.ts** - Network connectivity
- **use-offline-analysis.ts** - Offline mode
- **use-tutorial.ts** - Tutorial tracking
- **use-color-scheme.ts** - Theme color handling

### Framework Code - DO NOT MODIFY
Files in `_core/` directories are framework-level infrastructure:
- `lib/_core/` - Auth, API, NativeWind setup
- `server/_core/` - tRPC context, LLM helpers, env config
- `shared/_core/` - Shared framework types

## Key Patterns

### tRPC Usage
```typescript
// Server (server/routers.ts)
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
  feature: router({
    getData: protectedProcedure.query(({ ctx }) => {
      // ctx.user available in protected procedures
    }),
  }),
});

// Client (components)
import { trpc } from "@/lib/trpc";
const { data } = trpc.feature.getData.useQuery();
```

### Agent Message Flow
1. User input → Terminal Input component
2. Parse slash commands or send to agent
3. Agent plans task decomposition
4. Executor runs steps with tool calls
5. Response streamed to Terminal Output
6. History persisted to AsyncStorage

### MVP Orchestrator Flow
1. User uploads data → CSV Picker
2. Data type detector analyzes columns
3. Analysis suggester recommends methods
4. R code generator produces executable code
5. R worker executes with Firejail sandboxing
6. Results (plots, statistics) returned to client

### R Integration
R code runs server-side with Firejail sandboxing:
- Batch execution via `r-execute.ts`
- Real-time streaming via `r-streaming.ts`
- Generated plots as base64-encoded images
- Packages: metafor, mada, netmeta, meta, dmetar

### State Management
- **React Query** - Server state caching
- **Workspace Context** - App-wide state
- **AsyncStorage** - Local persistence
- **Redis** - Server-side caching and pub/sub

## Testing

Tests use Vitest and are located in `__tests__/`:

| Suite | Description |
|-------|-------------|
| `e2e/` | Full workflow tests (onboarding, analysis, R results) |
| `orchestrator/` | MVP Orchestrator and Glass integration |
| `commands/` | Slash command tests |
| `digitizer/` | PlotDigitizer tests |
| `spreadsheet/` | Data entry and validation |
| `collaboration/` | Real-time collaboration |
| `cloud-sync/` | Cloud synchronization |
| `literature-search/` | PubMed/CrossRef integration |

Run specific test file:
```bash
pnpm test __tests__/orchestrator/orchestrator.test.ts
```

Test utilities available in `__tests__/e2e/test-utils.ts`.

## Skills System

Skills in `agentskills/` provide domain-specific capabilities. Each skill has a `SKILL.md` file defining triggers, tools, and implementation:

| Skill | Description |
|-------|-------------|
| `trial-sequential-analysis` | TSA with monitoring boundaries |
| `bayesian-meta-analysis` | Bayesian random effects models |
| `network-meta-analysis` | NMA with netmeta package |
| `diagnostic-meta-analysis` | Bivariate models for DTA |
| `forest-plot-creation` | Forest plot generation |
| `data-extraction` | Automated data extraction |
| `ipd-meta-analysis` | Individual participant data analysis |
| `publication-bias-detection` | Funnel plots, Egger's test |
| `heterogeneity-analysis` | I², τ², prediction intervals |
| `grade-assessment` | GRADE certainty evaluation |
| `meta-analysis-fundamentals` | Core concepts |
| `socratic-teaching` | Socratic dialogue teaching |
| `r-code-generation` | R code generation helpers |

### Slash Commands
| Command | Description |
|---------|-------------|
| `/analyze` | Run full analysis workflow |
| `/detect` | Detect data type from spreadsheet |
| `/suggest` | Get analysis recommendations |
| `/generate-code` | Generate R code |
| `/explain [topic]` | Explain effect measures or concepts |
| `/help` | Show all available commands |
| `/clear` | Clear terminal output |
| `/history` | Show command history |

## Environment Variables

### Required for Server
```bash
DATABASE_URL=              # PostgreSQL connection string
JWT_SECRET=                # JWT signing secret
API_SECRET_KEY=            # Glass API authentication
```

### LLM Integration
```bash
BUILT_IN_FORGE_API_URL=    # Manus LLM API URL
BUILT_IN_FORGE_API_KEY=    # Manus LLM API key
```

### OAuth (Optional)
```bash
OAUTH_CLIENT_ID=           # OAuth client ID
OAUTH_CLIENT_SECRET=       # OAuth client secret
```

### Storage (Optional)
```bash
S3_BUCKET=                 # S3 bucket name
S3_ACCESS_KEY=             # S3 access key
S3_SECRET_KEY=             # S3 secret key
S3_ENDPOINT=               # S3 endpoint URL
```

### Expo Public (Client-side)
```bash
EXPO_PUBLIC_API_BASE_URL=  # API server URL
EXPO_PUBLIC_APP_ID=        # OAuth app ID
```

### Production
```bash
POSTGRES_PASSWORD=         # PostgreSQL password
REDIS_URL=                 # Redis connection URL
CORS_ORIGINS=              # Allowed CORS origins
LOG_LEVEL=                 # Logging level (info, debug, etc.)
```

## Deployment

### Docker Compose (Production)
Located in `deploy/docker-compose.yml`:

**Services:**
- `glass-api` (Port 4000) - REST API for orchestrator, R execution, skills
- `mobile-api` (Port 3000) - tRPC endpoints for mobile app
- `db` (PostgreSQL 16) - Main database
- `redis` (Port 6379) - Cache and pub/sub
- `r-worker` (2+ replicas) - R code execution with Firejail
- `caddy` (Optional) - Reverse proxy with auto SSL/TLS

```bash
# Start all services
cd deploy
docker-compose up -d

# With SSL/TLS via Caddy
docker-compose --profile production up -d
```

### Dockerfiles
- `Dockerfile` - Main production image
- `deploy/Dockerfile.glass-api` - Glass API service
- `deploy/Dockerfile.mobile-api` - Mobile API service
- `deploy/Dockerfile.r-worker` - R worker service

### Railway/Vercel
- `.railwayignore` - Railway-specific ignores
- Build command: `pnpm build`
- Start command: `pnpm start`

## Code Conventions

### TypeScript
- Strict mode enabled
- Path aliases via `@/` (maps to project root)
- Zod for runtime validation

### Styling
- NativeWind (Tailwind CSS for React Native)
- Theme configuration in `theme.config.js`
- Color scheme support (light/dark)

### API Design
- tRPC for type-safe APIs
- Protected procedures for authenticated routes
- Zod schemas for input validation

### Error Handling
- Error boundaries at screen level
- Toast notifications for user feedback
- Logging via server-side middleware

## Important Notes

1. **DO NOT MODIFY** files in `_core/` directories - these are framework infrastructure
2. R code execution requires Firejail sandboxing in production
3. Database migrations should be generated via `pnpm db:push`
4. Test coverage expected for new features
5. All API routes require authentication except health checks
6. Mobile builds use EAS (Expo Application Services) - see `eas.json`
