# Task Plan - Intelligent Test Plan Generator

> **Project:** Intelligent Test Plan Generator (Full-Stack Web Application)  
> **Protocol:** B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger)  
> **Created:** Phase 0 - Initialization  

---

## Phase 1: B - Blueprint (Vision & Logic) 🟡 IN PROGRESS

### Goals
- [ ] Answer the 5 Discovery Questions
- [ ] Define JSON Data Schemas in `gemini.md`
- [ ] Research existing implementations and libraries
- [ ] Get user approval on Blueprint

### Discovery Questions Status
| Question | Status | Answer |
|----------|--------|--------|
| North Star (singular outcome) | ⏳ Pending | TBD |
| Integrations (APIs/Keys ready?) | ⏳ Pending | TBD |
| Source of Truth (primary data) | ⏳ Pending | TBD |
| Delivery Payload (final output) | ⏳ Pending | TBD |
| Behavioral Rules (constraints) | ⏳ Pending | TBD |

---

## Phase 2: L - Link (Connectivity) 🔴 NOT STARTED

### Goals
- [ ] Verify JIRA API credentials and connection
- [ ] Verify Groq API access
- [ ] Verify Ollama local installation (if applicable)
- [ ] Build minimal handshake scripts in `tools/`

### Required API Keys
| Service | Key Location | Status |
|---------|--------------|--------|
| JIRA Base URL | `.env` | ⏳ Pending |
| JIRA API Token | `.env` | ⏳ Pending |
| Groq API Key | `.env` | ⏳ Pending |
| Ollama Base URL | `.env` (default: localhost) | ⏳ Pending |

---

## Phase 3: A - Architect (The 3-Layer Build) 🔴 NOT STARTED

### Layer 1: Architecture SOPs (`architecture/`)
- [ ] `architecture/01-data-schema.md` - Data models and flow
- [ ] `architecture/02-jira-integration.md` - JIRA API SOP
- [ ] `architecture/03-llm-integration.md` - LLM providers SOP
- [ ] `architecture/04-pdf-parsing.md` - PDF template SOP
- [ ] `architecture/05-api-endpoints.md` - Backend API specification

### Layer 2: Navigation (Routing Logic)
- [ ] Design decision flow for ticket → test plan generation
- [ ] Error handling and retry strategies
- [ ] State management between frontend and backend

### Layer 3: Tools (`tools/`)
- [ ] `tools/jira_client.py` - JIRA API client
- [ ] `tools/llm_groq.py` - Groq LLM interface
- [ ] `tools/llm_ollama.py` - Ollama LLM interface
- [ ] `tools/pdf_parser.py` - PDF template parser
- [ ] `tools/testplan_generator.py` - Core generation engine

---

## Phase 4: S - Stylize (Refinement & UI) 🔴 NOT STARTED

### Frontend Polish
- [ ] Implement clean sidebar navigation
- [ ] Apply blue/gray professional QA aesthetic
- [ ] Add toast notifications for feedback
- [ ] Implement loading skeletons
- [ ] Keyboard shortcuts (Ctrl+Enter, Ctrl+Shift+S)

### Output Formatting
- [ ] Markdown preview styling
- [ ] PDF export formatting
- [ ] Side-by-side template vs generated view

---

## Phase 5: T - Trigger (Deployment) 🔴 NOT STARTED

### Local Deployment
- [ ] SQLite database initialization
- [ ] Backend server startup script
- [ ] Frontend build and serve
- [ ] Docker compose setup (optional)

### Documentation
- [ ] Finalize Maintenance Log in `gemini.md`
- [ ] README with setup instructions
- [ ] Ollama installation guide
- [ ] JIRA API token setup guide
- [ ] Groq API key setup guide

---

## Success Criteria Checklist

- [ ] User can input JIRA credentials and successfully fetch ticket "VWO-1"
- [ ] User can upload `testplan.pdf` and system extracts structure
- [ ] User can generate test plan using both Groq (cloud) and Ollama (local) modes
- [ ] Generated content follows template structure while incorporating JIRA specifics
- [ ] All API keys persist securely between sessions

---

## Notes
- **Data-First Rule:** No tools until schemas are defined in `gemini.md`
- **Self-Annealing:** All errors must be analyzed, patched, tested, and documented
- **Deliverables:** Final payload is a running local web app at `http://localhost:3000`
