# Project Constitution - Intelligent Test Plan Generator

> **Status:** Phase 0 - Initialized  
> **Role:** This file is *LAW*. All schemas, rules, and architectural invariants defined here must be followed.  
> **Update Policy:** Only update when schemas change, rules are added, or architecture is modified.

---

## Project Identity

| Attribute | Value |
|-----------|-------|
| **Name** | Intelligent Test Plan Generator |
| **Type** | Full-Stack Web Application |
| **Protocol** | B.L.A.S.T. |
| **Phase** | 0 - Initialization |

---

## Data Schemas

> ⚠️ **Data-First Rule:** These schemas must be finalized before any tools are written.

### Schema 1: JIRA Ticket Data
```json
{
  "ticket_id": "VWO-123",
  "summary": "string",
  "description": "string (markdown/html)",
  "acceptance_criteria": ["string"],
  "priority": "Highest|High|Medium|Low|Lowest",
  "status": "string",
  "assignee": "string|null",
  "labels": ["string"],
  "attachments": [
    {
      "filename": "string",
      "size": "number",
      "url": "string"
    }
  ],
  "fetched_at": "ISO8601 timestamp"
}
```

### Schema 2: JIRA Configuration
```json
{
  "base_url": "https://company.atlassian.net",
  "username": "string",
  "api_token": "string (encrypted)",
  "is_validated": "boolean"
}
```

### Schema 3: LLM Configuration
```json
{
  "provider": "groq|ollama",
  "groq": {
    "api_key": "string (encrypted)",
    "model": "llama3-70b|mixtral-8x7b|gemma-7b-it",
    "temperature": "number (0-1)"
  },
  "ollama": {
    "base_url": "http://localhost:11434",
    "model": "string"
  }
}
```

### Schema 4: Template
```json
{
  "id": "uuid",
  "filename": "string",
  "content": "string (extracted text)",
  "structure": {
    "sections": ["string"]
  },
  "is_default": "boolean",
  "uploaded_at": "ISO8601 timestamp"
}
```

### Schema 5: Test Plan Generation Request
```json
{
  "ticket_id": "string",
  "template_id": "uuid|null",
  "provider": "groq|ollama",
  "options": {
    "include_edge_cases": "boolean",
    "detail_level": "high|medium|low"
  }
}
```

### Schema 6: Test Plan Output
```json
{
  "id": "uuid",
  "ticket_id": "string",
  "template_id": "uuid|null",
  "content": "string (markdown)",
  "provider_used": "groq|ollama",
  "model_used": "string",
  "generated_at": "ISO8601 timestamp",
  "tokens_used": "number|null"
}
```

---

## Behavioral Rules

### Rule 1: Security
- API keys must NEVER be stored in localStorage
- Use OS keychain (keytar) or encrypted backend storage
- CORS restricted to localhost only
- All inputs validated (JIRA ID regex: `[A-Z]+-\d+`)

### Rule 2: Timeouts
- Groq API: 30 seconds
- Ollama API: 120 seconds

### Rule 3: Retry Logic
- Maximum 3 attempts with exponential backoff
- Backoff formula: `delay = 2^attempt * 1000ms`

### Rule 4: File Handling
- PDF uploads limited to 5MB
- Scan uploads for malicious content
- Store templates in SQLite, not filesystem

### Rule 5: Error Handling
- All errors logged to `progress.md`
- User-friendly error messages
- Fallback to default template if custom fails

---

## Architectural Invariants

### Invariant 1: 3-Layer Architecture
```
Layer 1: architecture/   → SOPs (Markdown)
Layer 2: Navigation      → Decision making (AI)
Layer 3: tools/          → Deterministic Python scripts
```

### Invariant 2: Self-Annealing
When errors occur:
1. **Analyze** → Read stack trace, don't guess
2. **Patch** → Fix in `tools/`
3. **Test** → Verify fix works
4. **Update Architecture** → Document in `architecture/`

### Invariant 3: No Tools Before Schema
No Python scripts in `tools/` until:
- Discovery Questions answered ✓
- Data Schema defined in this file ✓
- `task_plan.md` has approved Blueprint ✓

---

## Environment Variables

```bash
# JIRA Configuration
JIRA_BASE_URL=https://company.atlassian.net
JIRA_USERNAME=email@example.com
JIRA_API_TOKEN=your_token_here

# LLM Configuration
GROQ_API_KEY=your_groq_key_here
OLLAMA_BASE_URL=http://localhost:11434

# App Configuration
NODE_ENV=development
PORT=3001
DB_PATH=./data/app.db
```

---

## API Endpoint Contract

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/settings/jira` | POST | JIRA Config | `{success: boolean}` |
| `/api/settings/jira` | GET | - | Connection status |
| `/api/settings/llm` | POST | LLM Config | `{success: boolean}` |
| `/api/settings/llm/models` | GET | - | List of Ollama models |
| `/api/jira/fetch` | POST | `{ticketId}` | Ticket data (Schema 1) |
| `/api/jira/recent` | GET | - | Recent tickets array |
| `/api/testplan/generate` | POST | Generation Request | Test Plan (Schema 6) |
| `/api/testplan/stream` | GET | SSE | Streaming chunks |
| `/api/templates` | GET | - | Template list |
| `/api/templates/upload` | POST | Multipart (PDF) | Template metadata |

---

## Maintenance Log

| Date | Event | Notes |
|------|-------|-------|
| 2026-02-15 | Phase 0 Complete | Project initialized, constitution created |

---

## Pending Approvals

- [x] Discovery Questions answered - ASSUMED for fast build
- [x] Data Schemas finalized
- [x] Blueprint approved - USER REQUESTED BUILD

---

## Build Phase Initiated

**Date:** 2026-02-15
**Reason:** User explicitly requested to start building the full application
**Status:** Proceeding with implementation
