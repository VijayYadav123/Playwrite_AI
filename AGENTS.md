# AI Learn GROQ - Project Workspace

## Project Overview

This is a **planning and learning workspace** for AI-assisted software development, specifically focused on building an "Intelligent Test Plan Generator" web application. The directory contains methodology guides, project specifications, and tooling installers—but no active implementation yet.

### What This Project Contains

| File | Purpose |
|------|---------|
| `B.L.A.S.T.md` | Master system prompt defining the B.L.A.S.T. development protocol |
| `prompt.md` | Detailed specification for the Intelligent Test Plan Generator application |
| `install.ps1` | PowerShell installer for the OpenCode CLI tool |
| `ProjectNo7` | Empty marker file (purpose unknown) |

---

## The B.L.A.S.T. Protocol

This project follows the **B.L.A.S.T.** methodology (Blueprint, Link, Architect, Stylize, Trigger) for deterministic automation development.

### Protocol Phases

1. **B - Blueprint (Vision & Logic)**
   - Discovery questions for project requirements
   - Data-first rule: Define JSON schemas before coding
   - Research external resources

2. **L - Link (Connectivity)**
   - Verify API connections and `.env` credentials
   - Build minimal handshake scripts in `tools/`

3. **A - Architect (3-Layer Build)**
   - **Layer 1**: `architecture/` - Technical SOPs in Markdown
   - **Layer 2**: Navigation layer for reasoning and routing
   - **Layer 3**: `tools/` - Deterministic Python scripts

4. **S - Stylize (Refinement & UI)**
   - Format outputs for professional delivery
   - Apply UI/UX polish

5. **T - Trigger (Deployment)**
   - Cloud transfer and automation setup
   - Finalize Maintenance Log in `gemini.md`

### Key Operating Principles

- **Data-First Rule**: Define data schemas in `gemini.md` before writing any tool code
- **Self-Annealing**: When errors occur: Analyze → Patch → Test → Update Architecture
- **Deliverables vs Intermediates**: 
  - Local (`.tmp/`): Ephemeral scraped data and logs
  - Global (Cloud): The final "Payload" destination

---

## Target Project: Intelligent Test Plan Generator

The `prompt.md` file contains a complete specification for a full-stack web application that automates test plan creation.

### Planned Architecture

**Frontend**: React (Vite) + TypeScript + Tailwind CSS + shadcn/ui  
**Backend**: Node.js (Express) or Python (FastAPI)  
**Storage**: SQLite (settings/history) + File system (templates)  
**LLM Integration**: Groq API SDK + Ollama local REST API  
**JIRA Integration**: JIRA REST API v3  

### Planned Features

1. **Configuration & Settings Module**
   - JIRA credentials (Base URL, Username, API Token)
   - LLM Provider settings (Groq or Ollama toggle)
   - PDF Template upload and management

2. **Main Workflow Interface**
   - JIRA ticket input (e.g., "VWO-123")
   - Ticket data display (Summary, Description, Acceptance Criteria)
   - Test plan generation with progress indicators
   - Markdown preview and export (PDF, Copy)

3. **LLM Integration Logic**
   - Context construction with system prompts
   - Timeout handling (30s Groq, 120s Ollama)
   - Retry logic (3 attempts with exponential backoff)

### Planned API Endpoints

```
POST /api/settings/jira        // Save JIRA credentials
GET  /api/settings/jira        // Get connection status
POST /api/settings/llm         // Save LLM config
GET  /api/settings/llm/models  // List Ollama models

POST /api/jira/fetch           // Fetch ticket by ID
GET  /api/jira/recent          // Recently fetched tickets

POST /api/testplan/generate    // Generate test plan
GET  /api/testplan/stream      // SSE for streaming (optional)

POST /api/templates/upload     // Upload PDF template
GET  /api/templates            // List templates
```

### Security Requirements (Planned)

- API keys never stored in localStorage; use backend env vars or OS keychain
- CORS restricted to localhost for local deployment
- Input validation: JIRA IDs regex `[A-Z]+-\d+`
- PDF uploads scanned and limited to <5MB

---

## OpenCode CLI Tool

The `install.ps1` script installs the **OpenCode** CLI from GitHub releases.

### Installation Script Features

- Cross-platform support: Linux, macOS, Windows
- Architecture detection: x64, arm64
- Special handling for:
  - Rosetta 2 on Apple Silicon Macs
  - musl libc on Alpine Linux
  - Baseline builds for CPUs without AVX2
- Version selection (latest or specific)
- Local binary installation option
- Shell PATH configuration (.zshrc, .bashrc, .config/fish/config.fish)
- GitHub Actions integration (`$GITHUB_PATH`)

### Supported Platforms

| OS | Architecture | Archive Format |
|----|--------------|----------------|
| Linux | x64, arm64 | .tar.gz |
| macOS | x64, arm64 | .zip |
| Windows | x64 | .zip |

### Installation Command

```powershell
# Download and install latest version
irm https://opencode.ai/install | iex

# Install specific version
irm https://opencode.ai/install | iex -version "1.0.180"

# Install from local binary
./install.ps1 -binary /path/to/opencode
```

---

## Current State

⚠️ **This project is in PLANNING phase.** No active codebase exists yet.

### Missing Implementation

- [ ] Frontend React application
- [ ] Backend API server
- [ ] Database schema and initialization
- [ ] JIRA API integration
- [ ] LLM provider integrations (Groq, Ollama)
- [ ] PDF parsing functionality
- [ ] Template management system

### Next Steps for Implementation

1. Initialize project structure following B.L.A.S.T. protocol
2. Create planning documents (`task_plan.md`, `findings.md`, `progress.md`, `gemini.md`)
3. Answer the 5 Discovery Questions from B.L.A.S.T. Phase 1
4. Define JSON Data Schemas in `gemini.md`
5. Set up development environment with chosen tech stack

---

## Development Workflow

When implementing this project:

1. **Before coding**, initialize project memory:
   ```
   task_plan.md   → Phases, goals, and checklists
   findings.md    → Research and constraints
   progress.md    → Task tracking and errors
   gemini.md      → Data schemas and architecture rules
   ```

2. **Never write tools** until:
   - Discovery questions are answered
   - Data Schema is defined in `gemini.md`
   - `task_plan.md` has an approved Blueprint

3. **File structure to create**:
   ```
   ├── gemini.md          # Project Constitution
   ├── .env               # API Keys/Secrets
   ├── architecture/      # Layer 1: SOPs
   ├── tools/             # Layer 3: Python Scripts
   └── .tmp/              # Temporary workbench
   ```

---

## Notes for AI Agents

- This workspace uses the **B.L.A.S.T. protocol** for deterministic development
- `gemini.md` is considered *law*—schemas and rules defined there must be followed
- Planning files (`task_plan.md`, `findings.md`, `progress.md`) are *memory*
- All code should be deterministic; LLM reasoning belongs in the Navigation layer
- External tools go in `tools/` as atomic, testable Python scripts
- Never guess at business logic—refer to SOPs in `architecture/`
