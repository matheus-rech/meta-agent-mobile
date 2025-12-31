# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Is This App?

**Meta Agent Mobile** is a mobile research assistant for medical professionals conducting systematic reviews and meta-analyses. It brings the power of statistical computing to iOS/Android through a terminal-style interface.

### Core Purpose
- **Systematic Review Workflow**: Search PROSPERO, manage study data, assess risk of bias
- **Meta-Analysis Execution**: Run R-based statistical analyses with real-time output streaming
- **Research Documentation**: Generate PRISMA flowcharts, forest plots, funnel plots
- **AI-Assisted Research**: Natural language interface for complex statistical tasks

### Target Users
- Medical researchers conducting systematic reviews
- Clinicians performing evidence synthesis
- Epidemiologists running meta-analyses
- Academic teams collaborating on research projects

### Key Differentiators
- **Mobile-first**: Full meta-analysis capability on phone/tablet
- **R Integration**: Server-side R execution with Firejail sandboxing
- **PROSPERO Integration**: Import protocols directly from the registry
- **Pedagogical AI**: Agent uses Socratic questioning, shares historical anecdotes, checks on wellbeing

---

## Development Commands

```bash
# Development
pnpm dev                  # Start server + metro concurrently
pnpm dev:server           # Server only (tsx watch)
pnpm dev:metro            # Metro bundler only (expo start --web)

# Quality
pnpm check                # TypeScript type check
pnpm lint                 # ESLint via expo lint
pnpm format               # Prettier formatting

# Testing
pnpm test                 # Run all tests with Vitest

# Database
pnpm db:push              # Generate and run Drizzle migrations

# Build
pnpm build                # Bundle server with esbuild
pnpm start                # Run production server

# Mobile
pnpm ios                  # Run on iOS simulator
pnpm android              # Run on Android emulator
```

---

## Architecture

### App Structure (Expo Router)
```
app/
  _layout.tsx              # Root layout with providers (tRPC, QueryClient, Workspace)
  (tabs)/                  # Tab navigator
    index.tsx              # Terminal screen (main CLI interface)
    history.tsx            # Command history
    settings.tsx           # App settings
  oauth/callback.tsx       # OAuth deep link handler
```

### Agent SDK (`lib/agent/`)
The core agent system for task planning and execution:
- **types.ts** - Message, Plan, Skill, SessionState types
- **planner.ts** - Task decomposition and step planning
- **executor.ts** - Step-by-step execution with tool calls
- **memory.ts** - Conversation history and context management
- **commands.ts** - Slash command registry (/help, /clear, /history)
- **skills.ts** - Domain-specific capabilities (meta-analysis, RoB assessment, PRISMA, etc.)

### Server (`server/`)
tRPC backend with specialized services:
- **routers.ts** - tRPC procedures for chat, R execution, auth
- **r-execute.ts** - R code execution with Firejail sandboxing
- **r-streaming.ts** - Real-time R output streaming
- **db.ts** - Database query helpers
- **storage.ts** - S3 storage via Manus API
- **prospero.ts** - PROSPERO registry integration

### Terminal Components (`components/terminal/`)
CLI-style UI components:
- **terminal-output.tsx** - Scrollable output display
- **terminal-input.tsx** - Command input with send button
- **streaming-output.tsx** - Real-time R execution display
- **autocomplete.tsx** - Slash command suggestions
- **markdown-renderer.tsx** - Agent response rendering
- **csv-picker.tsx** - Data file upload
- **snippets-library.tsx** - R code templates

### Workspace System (`lib/workspace/`)
Persistent project storage:
- **storage.ts** - AsyncStorage-based persistence
- **index.ts** - Workspace context and hooks
- Stores: studies, R scripts, generated plots, meta-analysis results

### PROSPERO Integration (`components/prospero/`)
Systematic review protocol search:
- **prospero-search.tsx** - Search UI with keyword/CRD ID lookup
- PICO extraction from protocols
- Citation generation

### Database (`drizzle/`)
MySQL/TiDB via Drizzle ORM:
- **schema.ts** - Table definitions (users, studies, outcomes, meta-analyses)
- **relations.ts** - Table relationships
- **migrations/** - Auto-generated migrations

### Framework Code (DO NOT MODIFY)
Files in `_core/` directories are framework-level infrastructure:
- `lib/_core/` - Auth, API, NativeWind setup
- `server/_core/` - tRPC context, LLM helpers, env config
- `shared/_core/` - Shared framework types

---

## Authentication System

### Dual-Platform Strategy
- **Web**: Cookie-based auth (Set-Cookie from backend)
- **Native (iOS/Android)**: Token-based auth via SecureStore

### Key Files
- `lib/_core/auth.ts` - Storage abstraction (SecureStore/localStorage)
- `hooks/use-auth.ts` - Auth state hook with token validation
- `lib/_core/api.ts` - API client with auth header injection
- `constants/oauth.ts` - OAuth URLs and deep link config

### Auth Flow
1. User opens OAuth portal via `getLoginUrl()`
2. OAuth callback receives token (deep link or URL param)
3. Token stored in SecureStore (native) or cookie established (web)
4. `useAuth()` validates token on every mount via `Api.getMe()`
5. Invalid tokens auto-cleared with `clearCredentials()`

### useAuth() API
```typescript
const {
  user,              // Auth.User | null
  loading,           // boolean
  error,             // Error | null
  isAuthenticated,   // boolean
  refresh,           // () => Promise<void>
  logout,            // () => Promise<void> - with retry logic
  logoutState,       // { inProgress, failed, error }
  clearLogoutError,  // () => void
} = useAuth();
```

---

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
1. User input → Terminal Input
2. Parse slash commands or send to agent
3. Agent plans task decomposition
4. Executor runs steps with tool calls
5. Response streamed to Terminal Output
6. History persisted to AsyncStorage

### R Integration
R code runs server-side with Firejail sandboxing. Use `r-execute.ts` for batch execution or `r-streaming.ts` for real-time output. Generated plots are base64-encoded and returned to the client.

---

## Testing

Tests use Vitest and are located in `tests/`:
- **agent.test.ts** - Agent SDK unit tests
- **r-integration.test.ts** - R execution tests
- **markdown.test.ts** - Markdown rendering tests
- **v1.5-features.test.ts** - Streaming and workspace tests
- **v1.6-features.test.ts** - SQLite and PROSPERO tests
- **auth.hooks.test.ts** - Authentication bug fix documentation
- **e2e/** - End-to-end meta-analysis tests (122 tests)

Run specific test file:
```bash
pnpm test tests/agent.test.ts
```

---

## Skills System

Skills in `lib/agent/skills.ts` provide domain-specific capabilities:

### Meta-Analysis Skills
- **meta-analysis** - Binary (OR, RR, RD), continuous (SMD, MD), proportion, survival
- **network-meta-analysis** - Network comparisons with netmeta
- **tsa** - Trial Sequential Analysis
- **meta-regression** - Moderator analysis

### Risk of Bias Skills
- **rob2** - Cochrane RoB 2 for RCTs
- **nos** - Newcastle-Ottawa Scale for observational studies
- **robins-i** - ROBINS-I for non-randomized studies

### Research Skills
- **prisma** - PRISMA 2020 flowchart generation
- **prospero** - Protocol search and import
- **data-extraction** - Study data extraction guidance
- **manuscript** - Research manuscript sections
- **neuro-literature** - Neurosurgery literature search

Each skill has triggers (keywords) and optional tools for execution.

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/clear` | Clear terminal output |
| `/history` | Show command history |
| `/r <code>` | Execute R code |
| `/r-status` | Check R service status |
| `/meta` | Meta-analysis templates |
| `/forest` | Generate forest plot |
| `/funnel` | Generate funnel plot |
| `/prisma` | Open PRISMA flowchart builder |
| `/prospero` | Search PROSPERO registry |
| `/workspace` | Manage project files |

---

## Environment Variables

Required for full functionality:
- `DATABASE_URL` - MySQL/TiDB connection
- `JWT_SECRET` - Session signing
- `BUILT_IN_FORGE_API_URL/KEY` - Manus LLM API

Expo public vars (prefixed `EXPO_PUBLIC_`):
- `EXPO_PUBLIC_API_BASE_URL` - API server URL
- `EXPO_PUBLIC_APP_ID` - OAuth app ID
- `EXPO_PUBLIC_OAUTH_PORTAL_URL` - OAuth portal
- `EXPO_PUBLIC_OAUTH_SERVER_URL` - OAuth server

---

## Version History

| Version | Key Features |
|---------|--------------|
| v1.7 | Auth bug fixes (token validation, logout retry), pedagogical AI enhancements |
| v1.6 | SQLite database, PROSPERO integration, CSV import/export |
| v1.5 | Real-time R streaming, workspace persistence, PRISMA flowchart builder |
| v1.4 | E2E testing suite, publication-quality plots |
| v1.3 | CSV upload, R snippets library, export functionality, 15 skills |
| v1.2 | R integration with Firejail sandboxing |
