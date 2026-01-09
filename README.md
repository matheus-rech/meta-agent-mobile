# Meta Agent Mobile

A comprehensive mobile application for conducting meta-analyses with AI assistance. Built with React Native, Expo, and powered by Glass AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)
![Tests](https://img.shields.io/badge/tests-901%20passing-brightgreen.svg)

## Features

### Core Meta-Analysis Capabilities

- **Data Entry & Validation** - Spreadsheet-based data entry with real-time validation for binary, continuous, and pre-calculated effect sizes
- **Automatic Data Type Detection** - MVP Orchestrator detects your data type and suggests appropriate analyses
- **R Code Generation** - Generates publication-ready R code using metafor, mada, and netmeta packages
- **Forest Plots** - Interactive forest plot visualization with customizable options
- **Funnel Plots** - Publication bias assessment with Egger's test and trim-and-fill analysis

### Glass AI Assistant

- **13+ AgentSkills** - Specialized skills for TSA, Bayesian meta-analysis, network meta-analysis, diagnostic accuracy, ROB assessment, GRADE, and more
- **Natural Language Interface** - Ask questions and get guidance in plain language
- **Slash Commands** - Quick access via `/analyze`, `/detect`, `/suggest`, `/generate-code`, `/explain`
- **Multilingual Support** - English, Portuguese, and Spanish

### Research Tools

- **PubMed/CrossRef Integration** - Search and import study metadata directly from literature databases
- **PlotDigitizer** - Extract data points from published figures with axis calibration
- **PROSPERO Integration** - Import systematic review protocols
- **Citation Formatting** - Automatic APA citation generation

### Collaboration & Sync

- **Cloud Backup** - Automatic backup of spreadsheets and progress
- **Real-time Collaboration** - Share projects with collaborators
- **Offline Support** - Works without internet connection

## Architecture

```
meta-agent-mobile/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx             # Home screen with Glass chat
│   │   ├── my-progress.tsx       # Learning progress tracking
│   │   └── settings.tsx          # App settings
│   ├── onboarding.tsx            # First-launch onboarding
│   └── tutorial.tsx              # Interactive tutorials
├── components/
│   ├── glass/                    # Glass AI mascot and animations
│   ├── spreadsheet/              # Data entry components
│   ├── visualization/            # Charts and plots
│   ├── digitizer/                # PlotDigitizer tool
│   └── terminal/                 # Chat interface
├── lib/
│   ├── agent/                    # Glass AI agent system
│   │   ├── skills/               # AgentSkills definitions
│   │   └── commands.ts           # Slash command handlers
│   ├── glass/
│   │   └── orchestrator/         # MVP Orchestrator
│   │       ├── data-type-detector.ts
│   │       ├── analysis-suggester.ts
│   │       ├── r-code-generator.ts
│   │       └── use-orchestrator.ts
│   ├── spreadsheet/              # Spreadsheet logic
│   └── literature-search/        # PubMed/CrossRef APIs
├── hooks/                        # React hooks
├── server/                       # Backend API (tRPC)
├── drizzle/                      # Database schema
├── agentskills/                  # SKILL.md files for Glass
└── __tests__/                    # Test suites
    ├── e2e/                      # End-to-end tests
    ├── orchestrator/             # Orchestrator tests
    └── ...
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/meta-agent-mobile.git
cd meta-agent-mobile

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Running on Different Platforms

```bash
# Web
pnpm dev:metro

# iOS Simulator
pnpm ios

# Android Emulator
pnpm android

# Generate QR code for Expo Go
pnpm qr
```

## Testing

The project includes comprehensive test coverage with 901 tests across unit, integration, and E2E test suites.

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test -- __tests__/e2e/

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage
```

### Test Structure

| Suite | Tests | Description |
|-------|-------|-------------|
| E2E | 90 | Full workflow tests |
| Orchestrator | 75 | Data detection & analysis |
| Glass Integration | 49 | AI assistant tests |
| Commands | 18 | Slash command tests |
| R Integration | 50+ | R code generation |
| Spreadsheet | 100+ | Data entry & validation |

## MVP Orchestrator

The Orchestrator automatically detects data types and suggests appropriate analyses:

### Supported Data Types

| Type | Detection Pattern | Suggested Analysis |
|------|-------------------|-------------------|
| Binary | events_*, n_* columns | OR, RR, RD with metafor |
| Continuous | mean_*, sd_*, n_* columns | SMD, MD with metafor |
| Pre-calculated | yi, vi or effect_size, se columns | Generic with metafor |
| Diagnostic | tp, fp, fn, tn columns | Bivariate with mada |
| Correlation | r, n columns | Fisher's z transformation |
| Hazard Ratio | hr, ci_lower, ci_upper columns | Log HR with metafor |

### Slash Commands

| Command | Description |
|---------|-------------|
| `/analyze` | Run full analysis workflow |
| `/detect` | Detect data type from spreadsheet |
| `/suggest` | Get analysis recommendations |
| `/generate-code` | Generate R code |
| `/explain [topic]` | Explain effect measures or concepts |
| `/help` | Show all available commands |

## AgentSkills

Glass AI has access to 13+ specialized skills:

- `trial-sequential-analysis` - TSA with monitoring boundaries
- `bayesian-meta-analysis` - Bayesian random effects models
- `network-meta-analysis` - NMA with netmeta package
- `diagnostic-meta-analysis` - Bivariate models for DTA
- `risk-of-bias` - RoB 2, ROBINS-I, NOS, QUADAS-2
- `grade-assessment` - GRADE certainty of evidence
- `ipd-meta-analysis` - Individual participant data
- `publication-bias` - Funnel plots, Egger's test, trim-and-fill
- `heterogeneity` - I², τ², prediction intervals
- `sensitivity-analysis` - Leave-one-out, influence diagnostics
- `subgroup-analysis` - Moderator analysis
- `meta-regression` - Continuous moderators
- `prisma-flowchart` - PRISMA 2020 flow diagrams

## Database Schema

The app uses PostgreSQL with Drizzle ORM:

```typescript
// Key tables
- users              // User accounts
- spreadsheets       // Meta-analysis data
- collaborators      // Shared access
- spreadsheet_history // Version control
- user_progress      // Learning tracking
- rob_assessments    // Risk of bias data
```

## API Routes

Backend API built with tRPC:

```typescript
// Key routes
- auth.*             // Authentication
- spreadsheet.*      // CRUD operations
- sync.*             // Cloud sync
- collaboration.*    // Real-time editing
- progress.*         // Learning progress
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev/) - React Native framework
- [metafor](https://www.metafor-project.org/) - R package for meta-analysis
- [mada](https://cran.r-project.org/package=mada) - R package for diagnostic accuracy
- [netmeta](https://cran.r-project.org/package=netmeta) - R package for network meta-analysis
- [Cochrane Handbook](https://training.cochrane.org/handbook) - Meta-analysis methodology

## Support

For questions or issues, please open a GitHub issue or contact the maintainers.
