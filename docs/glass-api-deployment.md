# Glass REST API & Deployment Architecture

This document provides a comprehensive guide to exposing Glass as a REST API and deploying the complete Meta Agent ecosystem.

---

## Table of Contents

1. [Glass REST API Design](#glass-rest-api-design)
2. [API Endpoints Reference](#api-endpoints-reference)
3. [Authentication & Security](#authentication--security)
4. [Deployment Architecture](#deployment-architecture)
5. [Infrastructure Options](#infrastructure-options)
6. [Cost Estimates](#cost-estimates)
7. [Implementation Guide](#implementation-guide)

---

## Glass REST API Design

### Architecture Overview

The Glass API exposes the orchestrator, R execution engine, and AgentSkills as RESTful endpoints that any client (other AI agents, web apps, automation tools) can consume.

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Clients                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Claude  │  │   GPT    │  │  Custom  │  │   n8n    │        │
│  │  Desktop │  │  Agents  │  │   Apps   │  │ Workflows│        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Glass API Gateway                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Rate Limiting                         │    │
│  │                    Authentication                        │    │
│  │                    Request Logging                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Glass API Server                            │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  /orchestrator │  │    /execute   │  │    /skills    │       │
│  │               │  │               │  │               │       │
│  │ POST /detect  │  │ POST /r       │  │ GET /list     │       │
│  │ POST /suggest │  │ POST /python  │  │ GET /:id      │       │
│  │ POST /generate│  │ GET /status   │  │ POST /invoke  │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   /literature │  │  /digitizer   │  │    /chat      │       │
│  │               │  │               │  │               │       │
│  │ GET /pubmed   │  │ POST /extract │  │ POST /message │       │
│  │ GET /crossref │  │ POST /calibr  │  │ GET /history  │       │
│  │ POST /cite    │  │ POST /import  │  │ DELETE /clear │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                            │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  R Runtime    │  │   Database    │  │  File Storage │       │
│  │  (Firejail)   │  │  (PostgreSQL) │  │     (S3)      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Base URL

```
Production: https://api.glass.meta-agent.io/v1
Staging:    https://api-staging.glass.meta-agent.io/v1
```

---

## API Endpoints Reference

### 1. Orchestrator Endpoints

#### POST /orchestrator/detect

Detect the data type from spreadsheet columns.

**Request:**
```json
{
  "columns": ["study", "events_treatment", "n_treatment", "events_control", "n_control"],
  "sample_data": [
    {"study": "Smith 2020", "events_treatment": 15, "n_treatment": 100, "events_control": 25, "n_control": 100}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detected_type": "binary",
    "confidence": 0.95,
    "column_mapping": {
      "study_id": "study",
      "events_exp": "events_treatment",
      "n_exp": "n_treatment",
      "events_ctrl": "events_control",
      "n_ctrl": "n_control"
    },
    "warnings": []
  }
}
```

#### POST /orchestrator/suggest

Get analysis recommendations based on detected data type.

**Request:**
```json
{
  "data_type": "binary",
  "study_count": 12,
  "has_subgroups": true,
  "has_moderators": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "primary_analysis": {
      "effect_measure": "OR",
      "model": "random",
      "method": "REML",
      "rationale": "Odds Ratio with random effects is recommended for binary outcomes with heterogeneous studies"
    },
    "secondary_analyses": [
      {"type": "sensitivity", "method": "leave-one-out"},
      {"type": "subgroup", "variable": "detected from data"},
      {"type": "publication_bias", "tests": ["egger", "trim_fill"]}
    ],
    "heterogeneity": {
      "statistics": ["I2", "tau2", "Q"],
      "interpretation_guide": "I² > 50% indicates substantial heterogeneity"
    }
  }
}
```

#### POST /orchestrator/generate

Generate R code for the analysis.

**Request:**
```json
{
  "data_type": "binary",
  "effect_measure": "OR",
  "model": "random",
  "column_mapping": {
    "study_id": "study",
    "events_exp": "events_treatment",
    "n_exp": "n_treatment",
    "events_ctrl": "events_control",
    "n_ctrl": "n_control"
  },
  "include_plots": ["forest", "funnel"],
  "include_tests": ["egger", "influence"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "r_code": "library(metafor)\n\n# Calculate effect sizes...",
    "packages_required": ["metafor", "meta"],
    "estimated_runtime_seconds": 5,
    "output_files": ["forest_plot.png", "funnel_plot.png", "results.json"]
  }
}
```

### 2. R Execution Endpoints

#### POST /execute/r

Execute R code and return results.

**Request:**
```json
{
  "code": "library(metafor)\ndat <- escalc(measure='OR', ai=events_exp, bi=n_exp-events_exp, ci=events_ctrl, di=n_ctrl-events_ctrl, data=mydata)\nres <- rma(yi, vi, data=dat)\nsummary(res)",
  "data": {
    "mydata": [
      {"study": "Smith 2020", "events_exp": 15, "n_exp": 100, "events_ctrl": 25, "n_ctrl": 100}
    ]
  },
  "timeout_seconds": 30,
  "return_plots": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "console_output": "Random-Effects Model (k = 12; tau^2 estimator: REML)...",
    "results": {
      "estimate": -0.523,
      "se": 0.142,
      "ci_lower": -0.801,
      "ci_upper": -0.245,
      "p_value": 0.0002,
      "I2": 45.3,
      "tau2": 0.089
    },
    "plots": [
      {
        "name": "forest_plot",
        "format": "png",
        "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
        "width": 800,
        "height": 600
      }
    ],
    "execution_time_ms": 2340
  }
}
```

#### POST /execute/r/stream

Stream R execution output in real-time (SSE).

**Request:** Same as `/execute/r`

**Response:** Server-Sent Events stream
```
event: output
data: {"line": "Loading required package: metafor", "type": "message"}

event: output
data: {"line": "Fitting random-effects model...", "type": "message"}

event: progress
data: {"percent": 50, "stage": "calculating effect sizes"}

event: plot
data: {"name": "forest_plot", "base64": "iVBORw0KGgo..."}

event: complete
data: {"success": true, "execution_time_ms": 2340}
```

### 3. Skills Endpoints

#### GET /skills

List all available AgentSkills.

**Response:**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": "meta-analysis",
        "name": "Meta-Analysis",
        "version": "1.0.0",
        "description": "Perform systematic review and meta-analysis",
        "capabilities": ["binary", "continuous", "proportion", "survival"],
        "required_inputs": ["effect_sizes", "standard_errors"],
        "outputs": ["forest_plot", "summary_statistics", "heterogeneity"]
      },
      {
        "id": "risk-of-bias",
        "name": "Risk of Bias Assessment",
        "version": "1.0.0",
        "description": "Assess study quality using RoB 2, ROBINS-I, or NOS",
        "tools": ["rob2", "robins-i", "newcastle-ottawa"]
      }
    ],
    "total": 13
  }
}
```

#### POST /skills/:id/invoke

Invoke a specific skill.

**Request:**
```json
{
  "skill_id": "risk-of-bias",
  "tool": "rob2",
  "inputs": {
    "study_id": "Smith 2020",
    "domains": {
      "randomization": "low",
      "deviations": "some_concerns",
      "missing_data": "low",
      "measurement": "low",
      "selection": "low"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_risk": "some_concerns",
    "domain_scores": {...},
    "justification": "Some concerns due to potential deviations from intended interventions",
    "traffic_light_svg": "<svg>...</svg>"
  }
}
```

### 4. Literature Search Endpoints

#### GET /literature/pubmed

Search PubMed for studies.

**Request:**
```
GET /literature/pubmed?query=meta-analysis+cardiovascular&limit=20&sort=relevance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "pmid": "12345678",
        "title": "Cardiovascular outcomes in diabetes: a meta-analysis",
        "authors": ["Smith J", "Jones A"],
        "journal": "Lancet",
        "year": 2023,
        "abstract": "Background: ...",
        "doi": "10.1016/...",
        "citation_apa": "Smith, J., & Jones, A. (2023). Cardiovascular outcomes..."
      }
    ],
    "total_results": 1523,
    "page": 1
  }
}
```

### 5. Chat Endpoints

#### POST /chat/message

Send a message to Glass and get a response.

**Request:**
```json
{
  "message": "How do I interpret an I² of 75%?",
  "context": {
    "current_analysis": "binary_meta_analysis",
    "data_loaded": true
  },
  "conversation_id": "conv_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "An I² of 75% indicates substantial heterogeneity among your studies...",
    "skills_used": ["meta-analysis"],
    "suggestions": [
      "Run subgroup analysis to explore sources of heterogeneity",
      "Consider meta-regression if you have continuous moderators"
    ],
    "conversation_id": "conv_abc123"
  }
}
```

---

## Authentication & Security

### API Key Authentication

All requests require an API key in the header:

```
Authorization: Bearer glss_sk_live_xxxxxxxxxxxxxxxxxxxx
```

### Rate Limiting

| Tier | Requests/min | R Executions/hour | Concurrent |
|------|--------------|-------------------|------------|
| Free | 60 | 10 | 2 |
| Pro | 300 | 100 | 10 |
| Enterprise | Unlimited | Unlimited | 50 |

### Security Measures

1. **R Sandboxing** - All R code runs in Firejail containers with:
   - No network access (unless explicitly enabled)
   - Read-only filesystem except /tmp
   - CPU and memory limits
   - Execution timeout (max 60 seconds)

2. **Input Validation** - All inputs sanitized and validated
3. **Output Scanning** - Results scanned for sensitive data
4. **Audit Logging** - All API calls logged with timestamps

---

## Deployment Architecture

### Complete Meta Agent Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER DEVICES                                   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   iOS App    │  │ Android App  │  │   Web App    │                  │
│  │ (Expo/RN)    │  │ (Expo/RN)    │  │   (Expo)     │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                           │
└─────────┼─────────────────┼─────────────────┼───────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CDN / EDGE NETWORK                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Cloudflare / Vercel Edge                      │   │
│  │                                                                  │   │
│  │  • Static assets (JS, CSS, images)                              │   │
│  │  • Web app hosting                                               │   │
│  │  • DDoS protection                                               │   │
│  │  • SSL termination                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Kong / AWS API Gateway                       │   │
│  │                                                                  │   │
│  │  • Rate limiting          • Authentication                      │   │
│  │  • Request routing        • API versioning                      │   │
│  │  • Load balancing         • Request/Response logging            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   GLASS API      │    │   MOBILE API     │    │   AUTH SERVICE   │
│   SERVICE        │    │   SERVICE        │    │                  │
│                  │    │                  │    │                  │
│ • Orchestrator   │    │ • tRPC endpoints │    │ • OAuth 2.0      │
│ • R Execution    │    │ • User data      │    │ • JWT tokens     │
│ • Skills         │    │ • Projects       │    │ • API keys       │
│ • Literature     │    │ • Sync           │    │ • Sessions       │
│                  │    │                  │    │                  │
│ Port: 4000       │    │ Port: 3000       │    │ Port: 3001       │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
│  │  PostgreSQL   │  │    Redis      │  │      S3       │               │
│  │               │  │               │  │               │               │
│  │ • Users       │  │ • Sessions    │  │ • Plots       │               │
│  │ • Projects    │  │ • Rate limits │  │ • Exports     │               │
│  │ • Studies     │  │ • Cache       │  │ • Uploads     │               │
│  │ • History     │  │ • Pub/Sub     │  │ • Backups     │               │
│  └───────────────┘  └───────────────┘  └───────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      R EXECUTION CLUSTER                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Kubernetes / ECS Cluster                      │   │
│  │                                                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │  R Worker   │  │  R Worker   │  │  R Worker   │             │   │
│  │  │  (Firejail) │  │  (Firejail) │  │  (Firejail) │             │   │
│  │  │             │  │             │  │             │             │   │
│  │  │ metafor     │  │ metafor     │  │ metafor     │             │   │
│  │  │ meta        │  │ meta        │  │ meta        │             │   │
│  │  │ netmeta     │  │ netmeta     │  │ netmeta     │             │   │
│  │  │ mada        │  │ mada        │  │ mada        │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  │                                                                  │   │
│  │  Auto-scaling: 1-20 workers based on queue depth                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure Options

### Option 1: Fully Managed (Recommended for Start)

| Component | Service | Monthly Cost |
|-----------|---------|--------------|
| Web Hosting | Vercel | $20 |
| API Server | Railway / Render | $25-50 |
| Database | Supabase / Neon | $25 |
| R Workers | Modal.com | $0.10/execution |
| File Storage | Cloudflare R2 | $5 |
| **Total** | | **~$75-100/mo** |

**Pros:** Zero DevOps, auto-scaling, quick setup
**Cons:** Less control, vendor lock-in

### Option 2: Cloud VPS (Best Balance)

| Component | Service | Monthly Cost |
|-----------|---------|--------------|
| API + R Workers | Hetzner CX41 (8 vCPU, 16GB) | $25 |
| Database | Hetzner CX21 (2 vCPU, 4GB) | $7 |
| Load Balancer | Hetzner LB | $6 |
| Object Storage | Hetzner Storage Box | $4 |
| CDN | Cloudflare (Free) | $0 |
| **Total** | | **~$42/mo** |

**Pros:** Cost-effective, full control, EU data residency
**Cons:** Requires DevOps knowledge

### Option 3: AWS/GCP Enterprise

| Component | Service | Monthly Cost |
|-----------|---------|--------------|
| API | ECS Fargate | $50-100 |
| R Workers | ECS + Auto Scaling | $100-300 |
| Database | RDS PostgreSQL | $50 |
| Cache | ElastiCache Redis | $30 |
| Storage | S3 | $10 |
| API Gateway | AWS API Gateway | $20 |
| **Total** | | **~$260-510/mo** |

**Pros:** Enterprise SLAs, compliance, global scale
**Cons:** Complex, expensive

---

## Cost Estimates

### Per-Request Costs

| Operation | Compute Time | Estimated Cost |
|-----------|--------------|----------------|
| Data type detection | 50ms | $0.00001 |
| Analysis suggestion | 100ms | $0.00002 |
| R code generation | 200ms | $0.00004 |
| R execution (simple) | 2s | $0.001 |
| R execution (complex) | 10s | $0.005 |
| Forest plot generation | 5s | $0.002 |

### Monthly Usage Scenarios

| Scenario | API Calls | R Executions | Est. Cost |
|----------|-----------|--------------|-----------|
| Solo researcher | 1,000 | 100 | $5 |
| Research team (5) | 10,000 | 500 | $25 |
| Institution | 100,000 | 5,000 | $150 |
| SaaS platform | 1,000,000 | 50,000 | $1,000 |

---

## Implementation Guide

### Step 1: Create the Glass API Server

```typescript
// server/glass-api/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { orchestratorRouter } from './routes/orchestrator';
import { executeRouter } from './routes/execute';
import { skillsRouter } from './routes/skills';
import { literatureRouter } from './routes/literature';
import { chatRouter } from './routes/chat';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => req.headers['x-api-key'] as string || req.ip,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Authentication
app.use('/v1', authMiddleware);

// Routes
app.use('/v1/orchestrator', orchestratorRouter);
app.use('/v1/execute', executeRouter);
app.use('/v1/skills', skillsRouter);
app.use('/v1/literature', literatureRouter);
app.use('/v1/chat', chatRouter);

// Health check (no auth)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Error handling
app.use(errorHandler);

const PORT = process.env.GLASS_API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Glass API server running on port ${PORT}`);
});
```

### Step 2: Orchestrator Route Implementation

```typescript
// server/glass-api/routes/orchestrator.ts
import { Router } from 'express';
import { detectDataType } from '@/lib/glass/orchestrator/data-type-detector';
import { suggestAnalysis } from '@/lib/glass/orchestrator/analysis-suggester';
import { generateRCode } from '@/lib/glass/orchestrator/r-code-generator';

export const orchestratorRouter = Router();

orchestratorRouter.post('/detect', async (req, res, next) => {
  try {
    const { columns, sample_data } = req.body;
    
    const result = detectDataType(columns, sample_data);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

orchestratorRouter.post('/suggest', async (req, res, next) => {
  try {
    const { data_type, study_count, has_subgroups, has_moderators } = req.body;
    
    const suggestion = suggestAnalysis({
      dataType: data_type,
      studyCount: study_count,
      hasSubgroups: has_subgroups,
      hasModerators: has_moderators,
    });
    
    res.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
});

orchestratorRouter.post('/generate', async (req, res, next) => {
  try {
    const { data_type, effect_measure, model, column_mapping, include_plots, include_tests } = req.body;
    
    const code = generateRCode({
      dataType: data_type,
      effectMeasure: effect_measure,
      model: model,
      columnMapping: column_mapping,
      includePlots: include_plots,
      includeTests: include_tests,
    });
    
    res.json({
      success: true,
      data: {
        r_code: code,
        packages_required: ['metafor', 'meta'],
        estimated_runtime_seconds: 5,
      },
    });
  } catch (error) {
    next(error);
  }
});
```

### Step 3: Docker Configuration

```dockerfile
# Dockerfile.glass-api
FROM node:22-slim AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-slim AS runner

# Install R and required packages
RUN apt-get update && apt-get install -y \
    r-base \
    r-base-dev \
    firejail \
    && rm -rf /var/lib/apt/lists/*

# Install R packages
RUN R -e "install.packages(c('metafor', 'meta', 'netmeta', 'mada', 'robvis', 'ggplot2'), repos='https://cloud.r-project.org/')"

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server/glass-api/index.js"]
```

### Step 4: Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  glass-api:
    build:
      context: .
      dockerfile: Dockerfile.glass-api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/glass
      - REDIS_URL=redis://redis:6379
      - R_EXECUTION_TIMEOUT=60
    depends_on:
      - db
      - redis

  mobile-api:
    build:
      context: .
      dockerfile: Dockerfile.mobile-api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/glass
      - GLASS_API_URL=http://glass-api:4000
    depends_on:
      - db
      - glass-api

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=glass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## Quick Start Deployment

### Deploy to Railway (Fastest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Deploy to Hetzner (Most Cost-Effective)

```bash
# Create server via Hetzner Cloud Console or CLI
# SSH into server

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
git clone https://github.com/matheus-rech/meta-agent-mobile.git
cd meta-agent-mobile

# Start services
docker compose up -d

# Set up Caddy for SSL
sudo apt install caddy
cat > /etc/caddy/Caddyfile << EOF
api.glass.yourdomain.com {
    reverse_proxy localhost:4000
}
app.yourdomain.com {
    reverse_proxy localhost:3000
}
EOF
sudo systemctl reload caddy
```

---

## References

1. [Express.js Documentation](https://expressjs.com/)
2. [Docker Compose Documentation](https://docs.docker.com/compose/)
3. [Railway Deployment Guide](https://docs.railway.app/)
4. [Hetzner Cloud Documentation](https://docs.hetzner.com/cloud/)
5. [Firejail Security Sandboxing](https://firejail.wordpress.com/)

---

*Document Version: 1.0.0*
*Last Updated: January 2025*
*Author: Manus AI*
