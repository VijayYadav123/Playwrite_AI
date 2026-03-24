# Findings - Research & Constraints Log

> **Purpose:** Store research discoveries, constraints, and reference materials  
> **Updated:** Throughout project lifecycle  

---

## Test Plan Template Analysis

### Source File
- **File:** `Test Plan - Template.pdf` (458KB)
- **Origin:** Created by Pramod Dutta - TheTestingAcademy.com
- **Sample Context:** VWO.com (A/B testing platform)

### Template Structure Identified

| Section | Description |
|---------|-------------|
| **1. Objective** | Overview of testing goals, technology stack |
| **2. Scope** | Features to test, testing types, environments, criteria |
| **3. Inclusions** | Specific modules/pages to test (Login, Dashboard, etc.) |
| **4. Test Environments** | OS, browsers, devices, network configs |
| **5. Defect Reporting Procedure** | Criteria, tools (JIRA), roles, metrics |
| **6. Test Strategy** | Test design techniques, smoke/regression testing flow |
| **7. Test Schedule** | Task durations and sprint planning |
| **8. Test Deliverables** | Documents to be produced |
| **9. Entry and Exit Criteria** | For each SDLC phase (Req Analysis, Execution, Closure) |
| **10. Test Execution** | Criteria to start/complete testing |
| **11. Test Closure** | Final reports and sign-off |
| **12. Tools** | JIRA, Mind maps, Screenshot tools, Office docs |
| **13. Risks and Mitigations** | Resource, build, time risks |
| **14. Approvals** | Documents requiring client sign-off |

### Key Data Points to Extract from JIRA
- Ticket summary → Maps to "Objective"
- Description → Maps to "Scope" and "Inclusions"
- Acceptance Criteria → Maps to "Test Strategy" and "Inclusions"
- Priority → Maps to "Risks" severity
- Labels/Components → Maps to "Test Environments"

---

## External Resources & References

### JIRA REST API v3
- Documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- Authentication: Basic Auth with API Token
- Key endpoints:
  - `GET /rest/api/3/issue/{issueIdOrKey}` - Fetch issue details
  - `GET /rest/api/3/myself` - Test connection

### Groq API
- Documentation: https://console.groq.com/docs
- SDK: `groq` npm package or REST API
- Models: llama3-70b, mixtral-8x7b, gemma-7b-it, etc.
- Timeout: 30 seconds recommended

### Ollama API
- Documentation: https://github.com/ollama/ollama/blob/main/docs/api.md
- Local REST endpoint: `http://localhost:11434`
- Endpoints:
  - `GET /api/tags` - List available models
  - `POST /api/generate` - Generate text
  - `POST /api/chat` - Chat completions
- Timeout: 120 seconds recommended (local inference)

### PDF Parsing Libraries
- **Node.js:** `pdf-parse`, `pdfjs-dist`
- **Python:** `PyPDF2`, `pdfplumber`, `pymupdf`
- Recommendation: `pdfplumber` (Python) for better text extraction

### Tech Stack Decisions

| Component | Options | Considerations |
|-----------|---------|----------------|
| Backend | Node.js/Express vs Python/FastAPI | Python has better PDF libs |
| Database | SQLite | Good for local desktop app |
| Frontend | React + Vite + Tailwind + shadcn/ui | Modern, fast, clean UI |
| PDF Parsing | Python `pdfplumber` | Best extraction quality |

---

## Constraints Discovered

### Security
- API keys must never be stored in localStorage
- Use OS keychain (node-keytar) or encrypted config files
- CORS restricted to localhost for local deployment
- PDF uploads limited to <5MB
- JIRA ID validation: regex `[A-Z]+-\d+`

### Performance
- Groq timeout: 30 seconds
- Ollama timeout: 120 seconds
- Retry logic: 3 attempts with exponential backoff
- File size limit: 5MB for PDFs

### UI/UX
- Minimum width: 1024px (desktop-first)
- Theme: Blue/gray professional QA aesthetic
- Keyboard shortcuts required

---

## Discovery Questions - Answers

### Q1: North Star ✅ ANSWERED
**Question:** What is the singular desired outcome?

**Answer:**
> As a QA Engineer, I want to paste a JIRA ticket ID (e.g., 'PROJ-123') into a web interface, click 'Generate', and within 30-60 seconds receive a complete test plan document that follows the 14-section structure from the PDF template, which I can then copy to clipboard or export as Markdown/PDF.

**Key Requirements Derived:**
- Input: JIRA Ticket ID
- Processing: AI-powered generation using Groq OR Ollama
- Output format: Markdown preview + PDF export option
- Time expectation: 30-60 seconds
- Structure: Must follow the 14-section template from `Test Plan - Template.pdf`

### Q2: Integrations ✅ ASSUMED (User requested fast build)
**Question:** Which external services do we need, and are API keys ready?

**Assumed Configuration:**
| Service | Assumption |
|---------|------------|
| JIRA | User will provide credentials via `.env` file |
| Groq | User will provide API key via `.env` file |
| Ollama | Local fallback at `http://localhost:11434` |

### Q3: Source of Truth ✅ ASSUMED
**Question:** Where does the primary data live?

**Answer:** JIRA Cloud is the primary source. Ticket data (summary, description, acceptance criteria) is fetched in real-time.

### Q4: Delivery Payload ✅ ASSUMED
**Question:** How and where should the final result be delivered?

**Answer:** 
- Primary: Markdown preview in browser with copy-to-clipboard
- Secondary: Export as PDF or Markdown file download
- Storage: Local SQLite for history/recent tickets

### Q5: Behavioral Rules ✅ ASSUMED
**Question:** How should the system "act"?

**Answer:**
- Professional QA tone in generated test plans
- Never expose API keys in frontend
- Validate all inputs (JIRA ID format)
- Retry failed LLM calls up to 3 times
- Always show clear error messages

---

## Architecture Decisions ✅ FINALIZED

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **Backend** | Node.js + Express | Better integration with React frontend, easier deployment |
| **Frontend** | React + Vite + Tailwind + shadcn/ui | As specified in prompt.md |
| **Database** | SQLite | Local storage for settings and history |
| **PDF Parsing** | `pdf-parse` (Node.js) | Single runtime, no Python needed |
| **LLM Providers** | Groq (primary) + Ollama (fallback) | Cloud + local options |

---

## Open Questions

*None - proceeding with build phase*

---

## Error Log

*Empty - will be populated during development*

| Date | Phase | Error | Resolution |
|------|-------|-------|------------|
| - | - | - | - |

---

## Architecture Decisions

*Pending discovery phase completion*
