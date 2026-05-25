# CLAW — COMPREHENSIVE PRODUCT BLUEPRINT
## Hybrid AI Operating Environment
### SESSION: SOLO | DEPTH: MAXIMUM | ALL 13 PHASES

---

## PHASE 1: IDEATION AND VALIDATION

### 1.1 Product Definition

CLAW is a hybrid AI operating environment that splits intelligence (VPS) from interface (local overlay). The user's Windows 11 machine runs a lightweight always-on-top overlay that captures voice commands via wake word detection, while a remote VPS handles all heavy computation, agent execution, model routing, and task orchestration.

This is not a chatbot. This is a persistent AI execution layer that operates independently of the local machine's state.

### 1.2 Core Value Proposition

Problem: Existing AI assistants are session-based, single-model, and cannot execute autonomous multi-step tasks while the user watches or walks away.

Solution: CLAW provides always-available AI execution with real-time observability. The user speaks a command, the system routes it to the right model, executes via agents, and the user can watch the agent work live in a browser tab or receive results via Telegram.

### 1.3 Validation Criteria

Before writing significant code, validate these assumptions:

ASSUMPTION 1: Users want to watch agents work in real time.
Validation method: Build a 60-second screen recording of a mock live view. Post it to relevant communities (r/LocalLLaMA, r/selfhosted, Hacker News Show HN). Track engagement metrics. Target: 100+ upvotes or 50+ comments indicating demand.

ASSUMPTION 2: Wake-word model routing is preferable to manual model selection.
Validation method: Create a 3-question survey. Share with 20+ power users in AI/dev Discord servers. Target: 70%+ prefer voice-triggered routing over dropdown selection.

ASSUMPTION 3: Remote execution (VPS) is acceptable even when local machine is available.
Validation method: Build Phase 1 MVP (VPS brain only). Use it personally for 2 weeks. Log friction points, latency complaints, and moments where local execution was preferred.

ASSUMPTION 4: SaaS demand exists for this type of hybrid AI system.
Validation method: Create a landing page under AIGEEEKHUB. Describe the product. Add an email signup. Run $50 in targeted ads. Target: 200+ signups in 30 days.

### 1.4 Validation Cycles

Cycle 1 (Week 1-2): Build VPS brain MVP. Use personally. Log all friction.
Cycle 2 (Week 3-4): Record demo. Share publicly. Measure interest.
Cycle 3 (Week 5-6): Refine based on feedback. Decide if SaaS track is viable.

### 1.5 Success Metrics for Phase 1 MVP

- /v1/chat responds in under 2 seconds for default_fast profile
- WebSocket events stream with under 500ms latency
- Job cancel halts execution within 3 seconds
- Telegram bot executes commands with under 5 second round-trip
- System runs stable for 72 hours without restart
- RAM usage stays under 2GB idle on VPS
- CPU usage stays under 20% idle on VPS

---

## PHASE 2: MARKET RESEARCH AND COMPETITIVE ANALYSIS

### 2.1 Industry Landscape

The AI assistant space is fragmenting into three categories:

Category A: Cloud-only assistants (ChatGPT, Claude, Gemini)
- Strengths: Best models, zero infrastructure
- Weakness: No local integration, no persistent execution, no observability

Category B: Local-first assistants (LM Studio, Ollama, Jan.ai)
- Strengths: Privacy, no API costs, offline capable
- Weakness: Limited by local hardware, no remote execution, no agent frameworks

Category C: Hybrid/agentic platforms (Open Interpreter, AutoGPT, CrewAI)
- Strengths: Multi-step execution, tool use
- Weakness: No persistent overlay, no live view, no wake word routing, session-based

CLAW occupies a gap: hybrid deployment (local UI + remote brain) with persistent availability, multi-model routing, and real-time agent observability.

### 2.2 Direct Competitor Analysis

COMPETITOR: Open Interpreter
- What it does: Natural language to code execution
- Strength: Simple, works locally
- Gap: No VPS offloading, no live view, no wake word, session-based
- CLAW advantage: Persistent background execution with observability

COMPETITOR: AutoGPT / AgentGPT
- What it does: Autonomous goal-driven agents
- Strength: Fully autonomous execution
- Gap: No local overlay, no voice, no model routing, expensive
- CLAW advantage: Hybrid architecture, cost-optimized routing, user stays in control

COMPETITOR: Rewind.ai / Microsoft Recall
- What it does: Screen recording and search
- Strength: Passive capture, powerful search
- Gap: No execution capability, no agents, no remote operation
- CLAW advantage: Active execution, not just passive recording

COMPETITOR: Copilot (Windows)
- What it does: OS-integrated AI assistant
- Strength: Deep Windows integration
- Gap: Single model, no agent execution, no remote brain, no live view
- CLAW advantage: Multi-model, autonomous agents, works when laptop is off

### 2.3 Target KPIs and Benchmarks

For personal use validation:
- Daily active usage: 10+ commands per day
- Task completion rate: 80%+ of commands result in successful execution
- Latency: Under 2 seconds for chat response, under 500ms for event stream

For SaaS validation (future):
- Landing page conversion: 5%+ visitor-to-signup
- Beta waitlist: 500+ in first 60 days
- Willingness to pay: 30%+ of beta users willing to pay $20+/month

### 2.4 Differentiation Matrix

| Feature              | ChatGPT | Open Interpreter | AutoGPT | CLAW |
|----------------------|---------|------------------|---------|------|
| Persistent overlay   | No      | No               | No      | Yes  |
| Wake word routing    | No      | No               | No      | Yes  |
| Multi-model router   | No      | Limited           | Limited | Yes  |
| Live agent view      | No      | No               | No      | Yes  |
| Works laptop off     | N/A     | No               | Limited | Yes  |
| Remote via Telegram  | No      | No               | No      | Yes  |
| Local file perms     | N/A     | Auto             | Auto    | Gated|
| SaaS-ready arch      | N/A     | No               | No      | Yes  |

---

## PHASE 3: ROADMAP, PLANNING AND RESOURCE MANAGEMENT

### 3.1 Build Phases with Solo Timelines

PHASE 1: VPS BRAIN MVP (Weeks 1-4)
- Week 1: Project scaffolding, Postgres schema with tenant_id, Redis setup
- Week 2: /v1/chat endpoint, model router, job queue (BullMQ)
- Week 3: WebSocket event stream, file upload, job cancel
- Week 4: Telegram bot, signed live URL stub, integration testing

PHASE 2: WINDOWS OVERLAY MVP (Weeks 5-8)
- Week 5: Electron + React app shell, always-on-top config
- Week 6: Text command input, API integration with VPS brain
- Week 7: Event timeline UI, response display
- Week 8: Live view button, pause/kill controls, basic styling

PHASE 3: LIVE VIEW — BROWSER TAB (Weeks 9-11)
- Week 9: noVNC server setup on VPS
- Week 10: Signed URL generation, token expiration
- Week 11: Logs overlay, cursor tracking, testing

PHASE 4: VOICE + WAKE WORD (Weeks 12-14)
- Week 12: Porcupine integration in Electron
- Week 13: Voice capture pipeline, profile routing by wake word
- Week 14: Edge case handling, noise rejection, testing

PHASE 5: FULL JARVIS MODE (Weeks 15-18)
- Week 15: Embedded live view in overlay (WebRTC)
- Week 16: Picture-in-picture mode
- Week 17: Full integration testing across all components
- Week 18: Polish, optimization, documentation

TOTAL ESTIMATED TIMELINE: 18 weeks (solo, part-time ~20hrs/week)
If full-time: compress to 10-12 weeks.

### 3.2 Resource Allocation

Infrastructure (already owned):
- VPS: existing server (2 vCPU, 8GB RAM, 100GB NVMe)
- Domain: use subdomain of existing domain or allocate new

Software costs:
- Porcupine wake word: Free tier for personal use
- AI model API keys: variable, budget $50-100/month during dev
- Postgres + Redis: runs on existing VPS, no additional cost
- Electron: free
- noVNC: open source, free
- Tailscale: free tier (up to 100 devices, sufficient for solo use)
- XFCE + xRDP: free, open source

Development tools:
- Google Antigravity: free during preview
- Cursor/Windsurf/Bolt.new: per your existing subscriptions
- GitHub: free tier sufficient

VPS Resource Budget (2 vCPU, 8GB RAM):
- OpenClaw Gateway (Fastify): ~100-200MB RAM
- Hermes Workers (Celery): ~200-500MB RAM (depends on active agents)
- Postgres: ~200-400MB RAM
- Redis: ~50-100MB RAM
- Telegram bot: ~50MB RAM
- XFCE + xRDP (when active): ~300-500MB RAM
- noVNC (when streaming): ~100-200MB RAM
- Playwright (per browser instance): ~200-400MB RAM
- Tailscale daemon: ~30MB RAM
- TOTAL ESTIMATED IDLE: ~1.0-1.5GB
- TOTAL ESTIMATED ACTIVE (1 job + XFCE): ~2.0-3.0GB
- HEADROOM: 5-6GB available for spikes and multiple concurrent jobs

### 3.3 Budget Tracking Recommendations

Create a simple spreadsheet or Notion page tracking:
- Monthly API costs by provider (OpenAI, Anthropic, Google, local)
- VPS resource usage (RAM, CPU, disk) weekly snapshots
- Time invested per phase (hours per week)
- Total cumulative spend

Set alert thresholds:
- API spend exceeds $150/month: review routing efficiency
- VPS RAM exceeds 80%: optimize or plan upgrade
- Any phase exceeds estimated timeline by 50%: reassess scope

---

## PHASE 4: ITERATIVE UI/UX DESIGN (MOBILE-FIRST APPROACH)

### 4.1 Design Philosophy

CLAW's UI is split across three surfaces:
1. Windows Overlay: compact, always-on-top, minimal footprint
2. Browser Live View: full-screen agent observation
3. Telegram: text-based command interface

Each surface has different design constraints.

### 4.2 Windows Overlay Design

Layout: Vertical strip, docked to right edge of screen by default.
Default size: 380px wide, 600px tall (resizable).
Always-on-top with adjustable opacity (80% default, 40% when not focused).

Components (top to bottom):
- Status bar: connection indicator (green/yellow/red), current profile name
- Response area: scrollable, shows latest AI response
- Event timeline: compact list of agent actions with timestamps
- Action buttons: Open Live View, Pause, Kill Job
- Input area: text field + mic icon for voice activation
- Permission prompts: modal overlay when agent requests file access

Design tokens:
- Background: dark (#1a1a2e) with subtle transparency
- Text: light (#e0e0e0)
- Accent: electric blue (#00d4ff)
- Warning: amber (#ffb700)
- Error: red (#ff4444)
- Success: green (#00cc88)
- Font: system default (Segoe UI on Windows)
- Border radius: 8px on panels, 4px on buttons
- Spacing: 8px grid system

### 4.3 Live View Design

Full browser tab or embedded panel.
Primary content: remote desktop stream (noVNC).
Optional overlay: semi-transparent log panel on right side (toggleable).
Controls: zoom, connection status, disconnect button.
URL format: https://your-vps.com/live/JOB_ID?token=SIGNED_TOKEN

### 4.4 Telegram Interface

Text-based. No custom UI needed.
Commands use slash prefix: /run, /status, /stream, /pause, /kill
Responses should be formatted with Telegram markdown (bold, code blocks).
Include inline keyboard buttons for common actions (Pause, Kill, Status).

### 4.5 Responsive Considerations

The overlay is Windows-only in Phase 2. However, design the component library with future web/mobile dashboard in mind:
- Use React component architecture that can be extracted to web
- Define all sizing in rem/em, not px where possible
- Event timeline component should work at any width (300px to 1200px)
- Response display should handle both short replies and long-form output

### 4.6 User Feedback Integration

Phase 1-2 (personal use): Keep a friction log. Every time something feels wrong, note it.
Phase 3+ (if SaaS): Add a feedback button in overlay that sends a tagged message to a dedicated Telegram channel or Discord webhook.

### 4.7 Prototyping Strategy

Do NOT build full Figma mockups before coding. For a solo build:
1. Sketch the overlay layout on paper or whiteboard (30 minutes max)
2. Build the UI directly in React with Tailwind
3. Iterate in-browser
4. Screenshot and share for feedback if needed

This saves weeks of design-to-code translation overhead.

---

## PHASE 5: TECHNICAL ARCHITECTURE, SECURITY AND COMPLIANCE

### 5.1 System Architecture Overview

NETWORKING MODEL (Phase 1-5, Personal Use):
All VPS services are fully private behind Tailscale mesh networking.
No public ports exposed. No public HTTPS endpoint.
Claw3D (overlay) connects to OpenClaw Gateway via Tailscale IP.
Telegram bot uses polling mode (bot reaches out to Telegram, not reverse).
XFCE + xRDP available via Tailscale for manual VPS debugging/access.

NETWORKING MODEL (Future SaaS):
Open port 443 with HTTPS (Let's Encrypt) for public API access.
Switch Telegram bot from polling to webhook mode.
xRDP and SSH remain Tailscale-only (admin access).

```
[Windows 11 Machine]                         [Tailscale Mesh]
+-------------------+                        (private network,
| Claw3D            |                         no public ports)
| - Electron + React|                              |
| - Porcupine       |-------- Tailscale ---------->|
| - Voice Capture   |                              |
| - Permission Gate |                              v
+-------------------+                    [VPS — fully private]
                                   +---------------------------+
                                   | OpenClaw Gateway (Fastify) |
                                   | - /v1/chat                |
                                   | - /v1/events (WS)         |
                                   | - /v1/jobs/:id/cancel     |
                                   | - /v1/files/upload        |
                                   | - /live/:job_id           |
                                   +---------------------------+
                                            |
                                   +--------+--------+
                                   |                 |
                              +----v----+     +------v------+
                              | Redis   |     | Postgres    |
                              | Celery  |     | (tenant_id) |
                              | Queue   |     | Jobs, Events|
                              +---------+     | Files, Logs |
                                   |          +-------------+
                              +----v-----------+
                              | Hermes Workers  |
                              | (Python/Celery) |
                              | - Playwright    |
                              | - Agent logic   |
                              | - Tool calling  |
                              | - Model adapters|
                              +-----------------+
                                   |
                              +----v-----------+
                              | noVNC Server    |
                              | (live view)     |
                              +-----------------+
                                   |
                              +----v-----------+
                              | XFCE Desktop    |
                              | + xRDP          |
                              | (debug/manual   |
                              |  VPS access)    |
                              +-----------------+

[Telegram — outbound polling only]
+-------------------+
| Telegram Bot      |--- polls Telegram API (no inbound webhook)
| - /run            |    allowlisted user IDs
| - /status         |    admin PIN required
| - /kill           |
+-------------------+
```

COMPONENT NAME MAPPING:
- OpenClaw Gateway = Node.js Fastify API layer
- Hermes = Python Celery workers (agents, tools, model adapters)
- Claw3D = Windows Electron + React overlay
- Orchestrator = Job queue and routing logic inside OpenClaw Gateway

### 5.2 Gateway Layer (Node.js / Fastify)

Responsibilities:
- Request validation and auth (Bearer token)
- Rate limiting (per tenant_id, per endpoint)
- Request routing to appropriate model adapter
- Job creation in Postgres
- Event publishing to Redis pub/sub
- WebSocket connection management
- Signed URL generation for live view
- File upload handling (multipart, stored to disk or S3-compatible)

Tech decisions:
- Fastify over Express: faster, built-in validation with JSON Schema, better plugin system
- Use @fastify/websocket for WS support
- Use @fastify/multipart for file uploads
- Use @fastify/rate-limit for throttling
- Use @fastify/jwt or simple Bearer token check for auth

### 5.3 Worker Layer (Python)

Responsibilities:
- Pull jobs from BullMQ (via bridge) or Celery queue
- Execute agent logic (LangChain, CrewAI, or custom)
- Call model APIs (OpenAI, Anthropic, Google, local)
- Run Playwright for browser automation tasks
- Emit events back to Redis pub/sub
- Store artifacts to disk
- Handle tool calling (file read, web search, code execution)

Queue choice:
- Option A: BullMQ (Node) + Python bridge via Redis directly
- Option B: Celery (Python-native) with Redis backend
- Recommendation: Use Celery for workers since workers are Python. Gateway publishes to Redis, Celery workers consume. Events flow back through Redis pub/sub.

### 5.4 Database Schema (Postgres)

```sql
-- All tables include tenant_id for future multi-tenancy

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY, -- sess_xxx
    tenant_id UUID REFERENCES tenants(id),
    profile TEXT NOT NULL DEFAULT 'default_fast',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE jobs (
    id TEXT PRIMARY KEY, -- job_xxx
    tenant_id UUID REFERENCES tenants(id),
    session_id TEXT REFERENCES sessions(id),
    profile TEXT NOT NULL,
    input_type TEXT NOT NULL, -- text, voice, file
    input_text TEXT,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, running, completed, failed, cancelled
    result_text TEXT,
    live_view_token TEXT,
    live_view_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    job_id TEXT REFERENCES jobs(id),
    event_type TEXT NOT NULL, -- job.started, agent.step, tool.called, tool.result, job.completed, job.error, job.cancelled
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    job_id TEXT REFERENCES jobs(id),
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size_bytes BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE telegram_users (
    telegram_user_id BIGINT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    is_admin BOOLEAN DEFAULT false,
    pin_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_events_job ON events(job_id);
CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_files_job ON files(job_id);
```

### 5.5 Model Routing System

```
Wake Word → Profile → Provider Selection → Token Cap Enforcement → Execution

Profiles stored in config (YAML or JSON):

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

Router logic:
1. Receive request with profile name
2. Look up profile config
3. Select provider adapter
4. Check token/cost caps
5. Execute call
6. Log usage (tokens, cost estimate, latency)
7. Emit events

### 5.6 Security Architecture

Network Security (Tailscale-First Model):
- ALL VPS services behind Tailscale mesh. Zero public ports during personal use phase.
- No UFW/iptables port openings needed. Tailscale handles access control.
- SSH: accessible only via Tailscale IP. Key-based auth only, password auth disabled, root login disabled.
- xRDP: accessible only via Tailscale IP. For manual VPS desktop access.
- OpenClaw Gateway API: accessible only via Tailscale IP. Claw3D connects via Tailscale.
- noVNC live view: accessible only via Tailscale IP. Signed URLs still enforced for job-level access control.
- Redis: bind to 127.0.0.1 only.
- Postgres: bind to 127.0.0.1 only.
- Telegram bot: runs in polling mode (outbound only, no inbound webhook needed). No public endpoint required.

Future SaaS Network Changes:
- Open port 443 with HTTPS via Let's Encrypt for public API access.
- Switch Telegram bot to webhook mode.
- xRDP and SSH remain Tailscale-only.

API Security:
- All API endpoints require Bearer token via Authorization header.
- Signed URLs for live view: JWT with 15-minute expiration.
- Rate limiting: 60 requests/minute per tenant for chat, 10/minute for file upload.
- Secrets: stored in .env file, never committed to git.

Local Security:
- Electron config file encrypted with OS keychain (Windows Credential Manager)
- No auto-grant file access. Every file read requires user approval via overlay prompt
- Screenshot/clipboard access requires explicit permission per session
- API key stored in encrypted local store, never in plaintext config
- Tailscale auth key stored in encrypted local store

XFCE Desktop Security:
- xRDP accessible only via Tailscale (no public exposure).
- Separate user account for xRDP login (not root).
- Session timeout after 30 minutes of inactivity.
- Used for debugging and manual inspection only, not for production workflows.

### 5.7 Compliance Considerations

For personal use: minimal compliance requirements.
For future SaaS:
- GDPR: implement data deletion endpoints, consent tracking, data export
- Data residency: document where VPS is located, offer region selection
- Encryption at rest: enable Postgres encryption, encrypt stored files
- Audit log: events table already captures all actions
- The tenant_id architecture supports per-user data isolation from day one

---

## PHASE 6: DEVELOPMENT AND AUTOMATION

### 6.1 Project Structure

```
claw/
├── gateway/                    # Node.js (Fastify)
│   ├── src/
│   │   ├── server.ts           # Fastify app entry
│   │   ├── routes/
│   │   │   ├── chat.ts         # POST /v1/chat
│   │   │   ├── events.ts       # WS /v1/events
│   │   │   ├── jobs.ts         # POST /v1/jobs/:id/cancel
│   │   │   ├── files.ts        # POST /v1/files/upload
│   │   │   └── live.ts         # GET /live/:job_id
│   │   ├── services/
│   │   │   ├── router.ts       # Model routing logic
│   │   │   ├── queue.ts        # Redis/BullMQ integration
│   │   │   ├── auth.ts         # Bearer token validation
│   │   │   └── signing.ts      # JWT signed URL generation
│   │   ├── db/
│   │   │   ├── connection.ts   # Postgres pool
│   │   │   ├── migrations/     # SQL migration files
│   │   │   └── queries/        # Parameterized queries
│   │   └── config/
│   │       ├── profiles.yaml   # Model routing profiles
│   │       └── env.ts          # Environment config loader
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── workers/                    # Python
│   ├── agents/
│   │   ├── base_agent.py       # Base agent class
│   │   ├── chat_agent.py       # Simple chat handler
│   │   ├── browser_agent.py    # Playwright-based agent
│   │   └── tool_agent.py       # Tool-calling agent
│   ├── adapters/
│   │   ├── openai_adapter.py
│   │   ├── anthropic_adapter.py
│   │   ├── google_adapter.py
│   │   └── ollama_adapter.py
│   ├── tools/
│   │   ├── file_reader.py
│   │   ├── web_search.py
│   │   ├── code_executor.py
│   │   └── screenshot.py
│   ├── tasks.py                # Celery task definitions
│   ├── config.py               # Worker config
│   ├── requirements.txt
│   └── Dockerfile
│
├── telegram/                   # Python
│   ├── bot.py                  # Telegram bot logic
│   ├── commands.py             # Command handlers
│   ├── security.py             # Allowlist + PIN validation
│   └── requirements.txt
│
├── overlay/                    # Electron + React
│   ├── src/
│   │   ├── main/               # Electron main process
│   │   │   ├── main.ts
│   │   │   ├── tray.ts
│   │   │   └── wake-word.ts    # Porcupine integration
│   │   ├── renderer/           # React UI
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── StatusBar.tsx
│   │   │   │   ├── ResponseArea.tsx
│   │   │   │   ├── EventTimeline.tsx
│   │   │   │   ├── ActionButtons.tsx
│   │   │   │   ├── CommandInput.tsx
│   │   │   │   └── PermissionModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   └── useApi.ts
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   └── preload.ts
│   ├── package.json
│   └── electron-builder.yml
│
├── live-view/                  # noVNC config
│   ├── nginx.conf
│   └── setup.sh
│
├── infra/                      # Infrastructure setup scripts
│   ├── tailscale-setup.sh      # Tailscale installation and auth
│   ├── xfce-setup.sh           # XFCE + xRDP installation
│   └── vps-bootstrap.sh        # Full VPS initial setup (Tailscale + XFCE + Docker)
│
├── docker-compose.yml          # Full stack orchestration
├── .env.example
├── .agents/                    # Antigravity rules
│   └── rules/
│       └── claw-rules.md
└── README.md
```

### 6.2 Coding Conventions

JavaScript/TypeScript (Gateway + Overlay):
- TypeScript strict mode
- ESLint + Prettier
- camelCase for variables and functions
- PascalCase for React components and types
- UPPER_SNAKE_CASE for constants
- Async/await over callbacks or raw promises
- No any type without explicit justification comment
- Error boundaries in React components

Python (Workers + Telegram):
- Python 3.11+
- Black formatter, isort for imports
- snake_case for everything except class names (PascalCase)
- Type hints on all function signatures
- Docstrings on all public functions
- No bare except clauses
- Pydantic for data models

SQL:
- All table and column names in snake_case
- All queries parameterized (never string concatenation)
- Migrations numbered sequentially (001_initial.sql, 002_add_events.sql)
- Every table has created_at TIMESTAMPTZ

### 6.3 AI-Powered Automation Tools

For development:
- Google Antigravity: primary IDE for agent-driven development
- Cursor: secondary for focused editing tasks
- GitHub Copilot or equivalent: inline completions

For CI/CD:
- GitHub Actions for automated testing on push
- Docker builds automated via docker-compose
- Database migrations run automatically on deploy

For monitoring:
- Simple health check endpoint: GET /health
- Cron job that pings /health every 5 minutes, alerts via Telegram if down
- pg_stat_activity monitoring for slow queries

### 6.4 Performance Standards

Gateway:
- /v1/chat response time: under 200ms (excluding model API call)
- WebSocket connection establishment: under 100ms
- File upload: handle up to 50MB files
- Concurrent WebSocket connections: support 50 minimum

Workers:
- Job pickup from queue: under 1 second
- Event emission latency: under 500ms
- Agent step timeout: 5 minutes per step, configurable
- Total job timeout: 30 minutes default, configurable per profile

Database:
- Query execution: under 100ms for indexed queries
- Connection pool: 10 connections minimum, 20 maximum
- Vacuum schedule: weekly

---

## PHASE 7: TESTING, QUALITY ASSURANCE AND USER FEEDBACK INTEGRATION

### 7.1 Testing Strategy

Unit Tests:
- Gateway routes: test each endpoint with mock data
- Model router: test profile selection, token cap enforcement
- Auth: test valid/invalid/expired tokens
- Workers: test each agent type with mocked model responses
- Telegram: test command parsing, permission checks

Integration Tests:
- Full flow: chat request > job created > events emitted > job completed
- File upload > agent uses file > result returned
- Telegram command > job triggered > result sent back
- WebSocket connection > receives events in real time
- Job cancel > worker stops > cancel event emitted

Tools:
- Gateway: Vitest or Jest with Supertest for HTTP testing
- Workers: pytest with fixtures for mocked APIs
- Docker: use docker-compose test profile for integration tests

### 7.2 QA Standards

Acceptance criteria template for every feature:
- GIVEN: preconditions
- WHEN: action taken
- THEN: expected result
- AND: side effects verified

Minimum coverage targets:
- Gateway: 80% line coverage
- Workers: 70% line coverage (agent logic is harder to unit test)
- Critical paths (auth, job creation, cancel): 100% coverage

### 7.3 Feedback Loops

Personal use phase:
- Keep a markdown file: FRICTION.md
- After each session, note what broke, what was slow, what felt wrong
- Review weekly. Prioritize fixes by frequency.

SaaS phase (future):
- In-app feedback widget (overlay button)
- Error reporting: automatic, anonymized
- Usage analytics: which profiles used most, average job duration, failure rate

---

## PHASE 8: RISK ASSESSMENT AND MITIGATION STRATEGIES

### 8.1 Technical Risks

RISK: VPS goes down, entire system is offline.
Impact: High. All intelligence is server-side.
Mitigation: Health monitoring via Telegram alerts. Automated restart via systemd. Consider backup VPS or failover later.
Contingency: Telegram bot sends "VPS DOWN" alert. Manual SSH restart.

RISK: Model API keys compromised.
Impact: High. Financial exposure.
Mitigation: Keys in .env only, never in code. Rotate keys quarterly. Set usage caps at provider level.
Contingency: Revoke keys immediately via provider dashboard. Rotate.

RISK: noVNC stream exposes sensitive data.
Impact: Medium. Live view shows agent's screen.
Mitigation: Signed URLs with 15-minute expiry. Stream only accessible with valid token. No public access.
Contingency: Kill switch in gateway to disable all live view URLs instantly.

RISK: Porcupine wake word false triggers.
Impact: Low. Sends unintended command.
Mitigation: Add confirmation step after wake word detection before sending command. Adjust sensitivity threshold.
Contingency: Disable wake word temporarily via overlay toggle.

### 8.2 Market Risks

RISK: Major player (Microsoft, Google) ships similar hybrid AI assistant.
Impact: Medium for SaaS viability.
Mitigation: Focus on customization, open architecture, and multi-model support as differentiators.

RISK: No SaaS demand materializes.
Impact: Low (system is still valuable for personal use).
Mitigation: Validate early with landing page and waitlist before investing in multi-tenant features.

### 8.3 Regulatory Risks

RISK: AI regulation changes require audit trails or model disclosure.
Impact: Low currently. Medium if SaaS.
Mitigation: Events table already logs all model interactions. Add model name and version to every event.

### 8.4 Monitoring Cadence

Weekly: Review VPS resource usage, API costs, uptime logs.
Monthly: Review friction log, prioritize improvements.
Quarterly: Review security (rotate keys, check firewall rules, update dependencies).

---

## PHASE 9: PRICING MODELS AND MONETIZATION STRATEGIES

### 9.1 Personal Use Phase (No Revenue)

CLAW starts as a personal tool. No monetization needed in Phase 1-5.
Track costs obsessively during this phase to understand unit economics.

Key metrics to track:
- Cost per job (API + compute)
- Cost per day of idle VPS operation
- Time saved per day using CLAW vs manual workflow

### 9.2 SaaS Pricing Analysis

When ready to monetize, consider three tiers:

TIER 1: FREE (Bait)
- 50 jobs/month
- default_fast profile only
- No live view
- Community support only
- Purpose: get users hooked, build habit

TIER 2: PRO ($29/month)
- 1,000 jobs/month
- All profiles
- Live view access
- Telegram integration
- Email support
- Purpose: core revenue driver

TIER 3: POWER ($79/month)
- Unlimited jobs
- Custom model routing profiles
- Priority queue processing
- API access for custom integrations
- White-label option
- Dedicated support channel
- Purpose: power users, small teams

### 9.3 Alternative Monetization Approaches

Approach A: Template/Starter Kit
- Sell a "CLAW Starter Kit" on Gumroad through AIGEEEKHUB
- Includes: pre-configured Docker setup, video walkthrough, custom agent templates
- Price: $49-99 one-time
- Advantage: immediate revenue, no recurring infrastructure costs

Approach B: Managed Hosting
- Offer to set up and manage CLAW on user's VPS
- Price: $199 setup + $49/month management fee
- Advantage: service revenue without building full SaaS

Approach C: Course/Tutorial Series
- "Build Your Own AI Operating System" course under AIGEEEKHUB
- Price: $149-299
- Advantage: leverages your build journey as content

Approach D: Affiliate Integration
- Bundle AIGEEEKHUB affiliate links for VPS providers, API credits, etc.
- Fits perfectly with JEDI MIND MARKETING recurring revenue model
- Users need VPS + API keys = natural affiliate opportunity

### 9.4 Pricing Adjustment Framework

Review pricing quarterly based on:
- User acquisition rate
- Churn rate
- API cost trends (models get cheaper over time)
- Feature additions that increase value
- Competitor pricing moves

---

## PHASE 10: MARKETING, PRODUCT LAUNCH AND GROWTH STRATEGY

### 10.1 Go-to-Market Strategy

CLAW launches under the AIGEEEKHUB brand as a flagship product.

Target audience segments:
1. Solo developers who use multiple AI tools daily
2. Power users frustrated with AI chat limitations
3. Self-hosted enthusiasts (r/selfhosted, r/homelab)
4. AI automation builders

### 10.2 Pre-Launch (Weeks before public release)

Actions:
- Build demo video showing full CLAW workflow (wake word > command > live view)
- Create landing page on aigeeekhub domain
- Write 3 blog posts: "Why I Built My Own AI OS", "Hybrid AI Architecture Explained", "Watch Your AI Work in Real Time"
- Share progress clips on Twitter/X with #BuildInPublic
- Post to relevant subreddits: r/LocalLLaMA, r/selfhosted, r/artificial, r/SideProject
- Set up email list with lead magnet (architecture diagram PDF)

### 10.3 Launch Day

Actions:
- Submit to Hacker News (Show HN: CLAW - A Hybrid AI Operating Environment)
- Submit to Product Hunt
- Post full demo video to YouTube
- Cross-post to LinkedIn
- Notify email list
- Share in relevant Discord servers (AI, dev, indie hacker)

### 10.4 Post-Launch Growth

Content engine (ongoing):
- Weekly YouTube video or blog post documenting CLAW development
- Monthly "what's new" update to email list
- Engage with every comment, DM, and issue

Growth levers:
- Open source core components to drive adoption (if path C selected later)
- Affiliate program: users get 20% recurring commission for referrals
- Integration partnerships with VPS providers (DigitalOcean, Hetzner)
- Guest appearances on AI/dev podcasts

### 10.5 Channel-Specific Strategy

Twitter/X: Daily build updates, short video clips, memes about AI workflow pain points
YouTube: Longer tutorials, live coding sessions, "building CLAW in public"
Reddit: Value-first posts with genuine technical content, not self-promotion
Discord: Community server for CLAW users (when user base reaches 50+)
Telegram: Bot-driven community updates

---

## PHASE 11: CUSTOMER SUPPORT, ONBOARDING AND KNOWLEDGE DOCUMENTATION

### 11.1 Onboarding Flow (SaaS Phase)

Step 1: Sign up with email
Step 2: Choose plan (or start free)
Step 3: Guided setup wizard:
  - Connect VPS (provide SSH access or use managed hosting)
  - Configure model API keys
  - Download and install Windows overlay
  - Run first test command
  - Watch first live view
Step 4: Interactive tutorial showing core features
Step 5: "You're ready" confirmation with link to docs

### 11.2 Self-Service Documentation

Docs site structure:
- Getting Started (5-minute quickstart)
- Architecture Overview (with diagrams)
- VPS Setup Guide (step by step)
- Overlay Installation Guide
- Model Routing Configuration
- Telegram Bot Setup
- API Reference (all endpoints)
- Troubleshooting FAQ
- Security Best Practices

Host on: GitHub Pages or Docusaurus, free.

### 11.3 Support Channels

Personal use: self-support (you know the codebase).
SaaS phase:
- Tier 1: Documentation + FAQ (handles 70% of questions)
- Tier 2: GitHub Issues for bug reports
- Tier 3: Discord community for general help
- Tier 4: Email support for Pro/Power users
- Tier 5: Direct support for white-label/enterprise (future)

### 11.4 Training Materials Plan

Create progressively as user base grows:
- Phase 1: README.md with setup instructions
- Phase 2: Docs site with guides
- Phase 3: Video tutorials (YouTube, free)
- Phase 4: Interactive onboarding wizard (in-app)

---

## PHASE 12: RETENTION ANALYTICS AND ENGAGEMENT STRATEGIES

### 12.1 Retention Strategy

Core retention mechanic: CLAW becomes more valuable over time as the user builds custom profiles, agents, and workflows. Switching cost increases naturally.

Retention levers:
- Job history and event logs provide institutional memory
- Custom model profiles are portable but effort to recreate elsewhere
- Telegram integration creates habitual remote access pattern
- Live view creates "sticky" observation behavior

### 12.2 Analytics Framework

Track these metrics from day one (even for personal use):

Usage metrics:
- Jobs per day / week / month
- Most used profile
- Average job duration
- Job success rate
- Most used tools (file read, web search, code exec)

Health metrics:
- API response latency (p50, p95, p99)
- Job failure rate
- WebSocket connection drops
- Event stream latency

Cost metrics:
- Cost per job by profile
- Total API spend per day/week/month
- Cost per token by provider

Implementation:
- Store all metrics in the events table (already designed for this)
- Build a simple /admin/dashboard endpoint that aggregates stats
- Or query Postgres directly with a SQL client

### 12.3 Engagement Strategies (SaaS Phase)

Weekly usage summary email: "You ran 47 jobs this week. Your favorite profile was dev_deep. You saved approximately 6 hours."
New feature announcements via in-app notification
Community showcase: highlight interesting use cases from users
Referral program: "Share CLAW, get a free month"

---

## PHASE 13: LONG-TERM GROWTH AND SCALABILITY PLANNING

### 13.1 Post-Launch Feature Expansion Roadmap

WAVE 1 (Month 1-3 after launch):
- Custom agent templates (users define their own agent workflows)
- Agent chaining (output of one agent feeds into another)
- Scheduled jobs (cron-style recurring tasks)
- Mobile overlay (Android/iOS companion app)

WAVE 2 (Month 4-6):
- Multi-user collaboration (team workspaces)
- Agent marketplace (share/sell agent templates)
- Plugin system for community-built tools
- Advanced analytics dashboard

WAVE 3 (Month 7-12):
- Self-healing agents (auto-retry with adjusted parameters on failure)
- Memory system (agent remembers past interactions per user)
- Voice personality customization
- Enterprise features (SSO, audit logs, compliance reports)

### 13.2 Infrastructure Scaling

Personal/Early SaaS (1-50 users):
- Single VPS: gateway + workers + DB on one machine
- Vertical scaling: upgrade VPS RAM/CPU as needed
- Estimated resource: 4GB RAM, 2 vCPU minimum

Growth Phase (50-500 users):
- Separate DB to managed Postgres (e.g., Supabase, Neon, or self-hosted replica)
- Separate Redis to dedicated instance
- Add second worker node for parallel job processing
- Add CDN for static assets

Scale Phase (500+ users):
- Kubernetes or Docker Swarm for container orchestration
- Horizontal worker scaling (auto-scale based on queue depth)
- Read replicas for Postgres
- Redis Cluster for pub/sub at scale
- Geographic distribution (multiple VPS regions)

### 13.3 Strategic Partnership Opportunities

VPS Providers:
- Partner with Hetzner, DigitalOcean, or Vultr for "1-click CLAW deploy"
- Affiliate revenue from referred signups

AI Model Providers:
- Negotiate volume discounts as user base grows
- Explore partnership programs (Anthropic, OpenAI partner ecosystems)

Tool/Integration Partners:
- Integrate with popular dev tools (GitHub, Linear, Notion)
- Each integration increases switching cost and stickiness

Community:
- Open source selective components to build ecosystem
- Accept community-built agents and tools
- Build under AIGEEEKHUB umbrella for brand consolidation

### 13.4 Revenue Scaling Targets

Month 1-3: $0 (personal use + validation)
Month 4-6: $500/month (early SaaS adopters + starter kit sales)
Month 7-12: $2,000-5,000/month (growing SaaS + course revenue)
Year 2: $10,000+/month (mature SaaS + ecosystem revenue)

These are targets, not guarantees. Adjust based on actual market response.

---

END OF SECTION 1: COMPREHENSIVE PRODUCT BLUEPRINT
