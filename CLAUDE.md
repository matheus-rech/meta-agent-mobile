# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meta Agent Mobile is a mobile CLI terminal-like agent SDK built with Expo/React Native. It brings NeuroResearch Agent patterns to mobile, featuring a command-line interface for AI agents with R integration for meta-analysis workflows.

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

### Terminal Components (`components/terminal/`)
CLI-style UI components:
- **terminal-output.tsx** - Scrollable output display
- **terminal-input.tsx** - Command input with send button
- **streaming-output.tsx** - Real-time R execution display
- **autocomplete.tsx** - Slash command suggestions
- **markdown-renderer.tsx** - Agent response rendering
- **csv-picker.tsx** - Data file upload
- **snippets-library.tsx** - R code templates

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

## Testing

Tests use Vitest and are located in `tests/`:
- **agent.test.ts** - Agent SDK unit tests
- **r-integration.test.ts** - R execution tests
- **markdown.test.ts** - Markdown rendering tests
- **v1.5-features.test.ts** - Streaming and workspace tests
- **v1.6-features.test.ts** - SQLite and PROSPERO tests
- **e2e/** - End-to-end meta-analysis tests

Run specific test file:
```bash
pnpm test tests/agent.test.ts
```

## Skills System

Skills in `lib/agent/skills.ts` provide domain-specific capabilities:
- **meta-analysis** - Binary, continuous, proportion, survival analysis
- **risk-of-bias** - RoB2, NOS, ROBINS-I assessment
- **network-meta-analysis** - Network comparisons
- **tsa** - Trial Sequential Analysis
- **prisma** - PRISMA 2020 flowchart generation
- **manuscript** - Research manuscript sections
- **neuro-literature** - Neurosurgery literature search

Each skill has triggers (keywords) and optional tools for execution.

## Environment Variables

Required for full functionality:
- `DATABASE_URL` - MySQL/TiDB connection
- `JWT_SECRET` - Session signing
- `BUILT_IN_FORGE_API_URL/KEY` - Manus LLM API

Expo public vars (prefixed `EXPO_PUBLIC_`):
- `EXPO_PUBLIC_API_BASE_URL` - API server URL
- `EXPO_PUBLIC_APP_ID` - OAuth app ID
