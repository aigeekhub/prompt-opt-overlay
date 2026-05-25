# CLAW — AI BUILDER PROMPT
## Optimized for Google Antigravity
### SESSION_PLATFORM: Antigravity

---

You are building CLAW, a hybrid AI operating environment consisting of a VPS-hosted backend brain and a Windows 11 desktop overlay. Follow this specification exactly. Do not deviate from the architecture unless explicitly instructed.

## PRODUCT OVERVIEW

CLAW is a persistent AI assistant system split into two halves:
1. VPS Brain: handles model routing, agent execution, job queuing, event streaming, file storage, Telegram bot control, and live view serving.
2. Windows Overlay: lightweight Electron + React app that captures user commands (text and voice via wake word), displays agent responses and event timelines, gates local file permissions, and links to browser-based live view.

The system must work even when the local Windows machine is off. The VPS operates independently and accepts commands via API and Telegram.

## USER PERSONAS

Primary User (Current): Solo developer and power user. Uses multiple AI models daily. Wants to dispatch tasks verbally, watch agents work, and control everything remotely. Technical enough to self-host but wants minimal maintenance overhead.

Future User (SaaS): Non-technical power user who wants a managed version. Needs guided setup, clear UI, and reliable execution without touching config files.

## SYSTEM ARCHITECTURE

### VPS Brain (Build First)

Runtime: Node.js 20+ with Fastify for the API gateway.
Workers: Python 3.11+ with Celery for job execution.
Database: PostgreSQL 16+. All tables include tenant_id UUID column for future multi-tenancy.
Queue: Redis 7+ as message broker for Celery and pub/sub for real-time events.
Live View: noVNC initially, WebRTC in a later phase.

### Windows Overlay (Build Second)

Runtime: Electron 28+ with React 18+ and TypeScript.
Wake Word: Picovoice Porcupine SDK.
Styling: Tailwind CSS with custom dark theme tokens.
State: React Context or Zustand for lightweight state management.

### Telegram Bot

Runtime: Python with python-telegram-bot library.
Security: Allowlisted Telegram user IDs. Admin PIN required for destructive commands.

## API CONTRACT

All endpoints require Bearer token authentication via Authorization header.

### POST /v1/chat
Accept a user command and create a job.

Request body:
```json
{
  "client_id": "string",
  "session_id": "string",
  "profile": "string (default_fast | dev_deep | bulk_cheap | private_local | realtime_voice)",
  "input": {
    "type": "text | voice | file",
    "text": "string"
  }
}
```

Response:
```json
{
  "job_id": "string",
  "reply": {
    "text": "string"
  },
  "live_view": {
    "available": "boolean",
    "url": "string (signed URL, 15 min expiry)"
  }
}
```

### WS /v1/events?session_id=SESSION_ID
WebSocket endpoint for real-time event streaming.

Event types:
- job.started: job picked up by worker
- agent.step: agent completed a reasoning/action step
- tool.called: agent invoked a tool (file read, web search, code exec)
- tool.result: tool returned a result
- job.completed: job finished successfully
- job.error: job failed with error
- job.cancelled: job was cancelled by user

Each event payload:
```json
{
  "event_type": "string",
  "job_id": "string",
  "timestamp": "ISO 8601",
  "data": {}
}
```

### POST /v1/jobs/:id/cancel
Cancel a running job. Returns 200 on success, 404 if job not found, 409 if job already completed.

### POST /v1/files/upload
Multipart file upload. Max size: 50MB. Store file to disk. Associate with tenant_id. Return file ID and path.

### GET /live/:job_id?token=SIGNED_TOKEN
Serve the noVNC live view page. Validate signed token. Reject if expired or invalid.

### GET /health
Health check. Returns 200 with JSON containing uptime, database status, redis status, and active job count.

## DATABASE SCHEMA

Use PostgreSQL. Every table includes tenant_id for future multi-tenancy. Use gen_random_uuid() for UUIDs. Use TIMESTAMPTZ for all timestamps. Create indexes on tenant_id, job status, and event job_id.

Tables: tenants, sessions, jobs, events, files, telegram_users.

See the product blueprint (Section 1) for complete schema DDL. Implement exactly as specified.

## MODEL ROUTING

Profiles are stored in a YAML config file:

```yaml
profiles:
  default_fast:
    provider: openai
    model: gpt-4o-mini
    max_tokens: 4096
    temperature: 0.7
    cost_cap_per_job: 0.05
  dev_deep:
    provider: anthropic
    model: claude-sonnet-4-20250514
    max_tokens: 8192
    temperature: 0.3
    cost_cap_per_job: 0.50
  bulk_cheap:
    provider: openai
    model: gpt-4o-mini
    max_tokens: 2048
    temperature: 0.5
    cost_cap_per_job: 0.02
  private_local:
    provider: ollama
    model: llama3.1:8b
    max_tokens: 4096
    temperature: 0.7
    cost_cap_per_job: 0.00
  realtime_voice:
    provider: openai
    model: gpt-4o-realtime
    max_tokens: 1024
    temperature: 0.5
    cost_cap_per_job: 0.10
```

Router logic: receive profile name in request, look up config, select provider adapter, check cost cap, execute, log usage, emit events.

## TECH STACK SPECIFICATIONS

Gateway:
- Node.js 20+
- Fastify 4+ with TypeScript
- @fastify/websocket for WebSocket support
- @fastify/multipart for file uploads
- @fastify/rate-limit (60 req/min chat, 10 req/min upload)
- @fastify/jwt for signed URL generation
- pg (node-postgres) for database
- ioredis for Redis

Workers:
- Python 3.11+
- Celery 5+ with Redis broker
- playwright for browser automation
- httpx for async HTTP calls to model APIs
- pydantic for data validation
- python-dotenv for config

Telegram Bot:
- python-telegram-bot 20+
- Allowlist-based security
- PIN verification for admin commands

Overlay:
- Electron 28+
- React 18+ with TypeScript
- Tailwind CSS
- Zustand for state
- @picovoice/porcupine-web for wake word
- Native WebSocket API for event stream

## UI SPECIFICATIONS

### Windows Overlay
- 380px wide, 600px tall default, resizable
- Always-on-top, adjustable opacity (80% default, 40% unfocused)
- Dark theme: background #1a1a2e, text #e0e0e0, accent #00d4ff
- Components: StatusBar, ResponseArea, EventTimeline, ActionButtons (LiveView, Pause, Kill), CommandInput, PermissionModal
- 8px grid spacing, 8px border radius on panels, 4px on buttons
- Font: system default (Segoe UI)

### Live View (Browser Tab)
- Full viewport noVNC canvas
- Semi-transparent log overlay panel on right side (toggleable)
- Connection status indicator
- Disconnect button

## EDGE CASE HANDLING

- If model API returns 429 (rate limited): wait 5 seconds, retry once, then fail the job with rate_limit error
- If model API returns 500: retry once after 3 seconds, then fail with provider_error
- If WebSocket disconnects: overlay auto-reconnects with exponential backoff (1s, 2s, 4s, max 30s)
- If job exceeds timeout (30 min default): cancel automatically, emit job.error with timeout reason
- If file upload exceeds 50MB: reject immediately with 413 response
- If signed live view token is expired: return 401 with clear error message
- If Telegram command from non-allowlisted user: silently ignore
- If local file permission denied by user: agent receives "permission_denied" tool result and must work without the file

## NETWORKING MODEL

Phase 1-5 (Personal Use): Fully private behind Tailscale mesh networking.
- All VPS services accessible only via Tailscale IP. Zero public ports.
- Claw3D (overlay) connects to OpenClaw Gateway via Tailscale.
- noVNC live view accessed via Tailscale IP with signed URL tokens.
- xRDP for XFCE desktop access via Tailscale only.
- SSH via Tailscale only.
- Telegram bot runs in polling mode (outbound only, no webhook endpoint needed).

Future SaaS: Open port 443 with HTTPS for public API. Switch Telegram to webhook mode. xRDP/SSH remain Tailscale-only.

The Claw3D overlay must be configured to connect to the VPS Tailscale IP (e.g., 100.x.x.x) rather than a public domain. Store this IP in the encrypted local config. If Tailscale is not connected, show a "VPS Unreachable" status in the overlay status bar.

## INFRASTRUCTURE SETUP (VPS)

Before any application code, the VPS requires:
1. Tailscale installed and authenticated (tailscale up)
2. XFCE desktop environment installed (apt install xfce4 xfce4-goodies)
3. xRDP installed and configured (apt install xrdp), bound to Tailscale IP only
4. Docker and Docker Compose installed
5. Postgres and Redis running via Docker Compose
6. Chromium or Firefox installed (for XFCE manual browser use and Playwright)

Create infra/ directory with setup scripts:
- tailscale-setup.sh: install Tailscale, authenticate, enable IP forwarding
- xfce-setup.sh: install XFCE, xRDP, configure xRDP to listen on Tailscale IP only
- vps-bootstrap.sh: run both scripts plus Docker install in sequence

## SECURITY PROTOCOLS

- All VPS services behind Tailscale mesh (no public ports during personal use)
- Bearer token auth on all API endpoints (defense in depth, even behind Tailscale)
- Signed URLs (JWT, 15-min expiry) for live view
- Redis and Postgres bound to 127.0.0.1 only
- SSH accessible only via Tailscale IP, key-based auth, no password auth
- xRDP accessible only via Tailscale IP, separate non-root user account
- .env for secrets, never committed to git
- Rate limiting on all API endpoints
- Telegram bot: polling mode, allowlist user IDs, admin PIN for destructive commands
- Local overlay: encrypted config via Windows Credential Manager, explicit permission prompts for file access
- Tailscale auth key stored in encrypted local config (overlay), never in plaintext

## DEVELOPMENT PRACTICES

- TypeScript strict mode for all Node.js/React code
- Python type hints on all function signatures
- ESLint + Prettier for JS/TS
- Black + isort for Python
- All SQL queries parameterized
- Database migrations numbered sequentially
- Git: conventional commits (feat:, fix:, docs:, refactor:)
- Docker Compose for local development and production deployment
- Health check endpoint for monitoring

## PERFORMANCE TARGETS

- API response (excluding model call): under 200ms
- WebSocket connection: under 100ms
- Event stream latency: under 500ms
- Job pickup from queue: under 1 second
- Agent step timeout: 5 minutes (configurable)
- Total job timeout: 30 minutes (configurable)
- Database queries: under 100ms for indexed queries
- Idle VPS RAM: under 2GB
- Idle VPS CPU: under 20%

## BUILD ORDER (MANDATORY)

Phase 0: VPS Infrastructure Setup
1. Install Tailscale on VPS and authenticate
2. Install XFCE + xRDP, bind xRDP to Tailscale IP
3. Install Docker and Docker Compose
4. Install Tailscale on local Windows machine
5. Verify Tailscale mesh: laptop can reach VPS via Tailscale IP
6. Verify xRDP: can remote desktop into XFCE via Tailscale

Phase 1: VPS Brain MVP
1. Postgres schema + migrations
2. Fastify server with /health endpoint
3. /v1/chat route + job creation
4. Redis + Celery worker setup
5. Simple chat agent (echo or single model call)
6. WebSocket /v1/events endpoint
7. Event emission from worker
8. /v1/jobs/:id/cancel
9. /v1/files/upload
10. Telegram bot with /run, /status, /kill
11. Signed live view URL generation (stub page)
12. Integration testing of full flow

Phase 2: Windows Overlay MVP (only after Phase 1 is stable)
Phase 3: Live View with noVNC
Phase 4: Voice + Wake Word
Phase 5: Full Jarvis Mode (embedded WebRTC live view)

## ANTIGRAVITY-SPECIFIC INSTRUCTIONS

When working in Google Antigravity:
- Use Plan mode for complex tasks (full features, architecture changes)
- Use Fast mode for quick fixes (typos, small edits, single-file changes)
- Create Skills for repetitive CLAW-specific tasks:
  - Skill: "claw-migrate" for database migrations
  - Skill: "claw-test" for running the test suite
  - Skill: "claw-deploy" for Docker rebuild and restart
- Store project-level rules in .agents/rules/claw-rules.md
- Use Workflows for multi-step operations:
  - Workflow: /claw-setup for initial project scaffolding
  - Workflow: /claw-add-endpoint for adding a new API route
  - Workflow: /claw-add-agent for creating a new agent type
- Let the agent access the terminal for running tests, migrations, and Docker commands
- Use the browser sub-agent for testing the live view page and overlay

---

END OF SECTION 2: AI BUILDER PROMPT (ANTIGRAVITY)
