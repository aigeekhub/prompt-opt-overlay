---
description: Core development rules for CLAW hybrid AI operating environment
activation: always_on
---

# CLAW Project Rules

## Project Identity
This is CLAW, a hybrid AI operating environment with a VPS-hosted backend brain and a Windows 11 Electron overlay. All code must serve this architecture. Do not introduce alternative architectures or suggest rewriting the core split between local overlay and remote VPS.

## Build Order Enforcement
Phase 1: VPS Brain MVP (gateway + workers + queue + DB + Telegram + live URL stub)
Phase 2: Windows Overlay MVP
Phase 3: Live View (noVNC browser tab)
Phase 4: Voice + Wake Word (Porcupine)
Phase 5: Full Jarvis Mode (embedded WebRTC)

Never build overlay features before the corresponding VPS endpoint exists and is tested. Never build Phase N+1 features while Phase N has failing tests.

## Tech Stack (Do Not Deviate)
Gateway: Node.js 20+, Fastify 4+, TypeScript strict
Workers: Python 3.11+, Celery 5+, Redis broker
Database: PostgreSQL 16+
Queue/PubSub: Redis 7+
Overlay: Electron 28+, React 18+, TypeScript, Tailwind CSS, Zustand
Wake Word: Picovoice Porcupine
Live View: noVNC (Phase 3), WebRTC (Phase 5)
Telegram: python-telegram-bot 20+

## Multi-Tenancy Rule
Every database table must include a tenant_id UUID column with a foreign key to the tenants table. Never create a table without tenant_id. This applies even though the current deployment is single-user.

## TypeScript Rules (Gateway + Overlay)
Use strict mode. No implicit any. No explicit any without a justification comment.
camelCase for variables and functions. PascalCase for components, interfaces, types.
UPPER_SNAKE_CASE for constants and env vars.
Always use async/await. Never use raw Promise chains or callbacks.
Destructure imports. No namespace imports unless required by the library.
Every React component must have an error boundary above it in the tree.
No inline styles. Use Tailwind utility classes.

## Python Rules (Workers + Telegram)
snake_case for everything except class names (PascalCase).
Type hints required on all function parameters and return types.
Docstrings required on all public functions and classes.
No bare except. Always catch specific exception types.
Use pydantic models for all data that crosses a boundary (API input, queue message, DB row).
Use f-strings for string formatting. No .format() or % formatting.
Use httpx for async HTTP. Do not use requests.

## SQL Rules
All names in snake_case. No camelCase in SQL.
All queries must be parameterized. Zero string concatenation in queries.
Migrations go in gateway/src/db/migrations/ numbered sequentially (001_, 002_).
Every table gets created_at TIMESTAMPTZ DEFAULT now().
Index every foreign key column and any column used in WHERE clauses.

## API Rules
All endpoints require Bearer token auth via Authorization header.
All request bodies validated with JSON Schema (Fastify) or Pydantic (Python).
All responses use consistent envelope: { data, error, meta }.
Rate limits: 60/min for /v1/chat, 10/min for /v1/files/upload, 120/min for WebSocket messages.
HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauthorized, 404 not found, 409 conflict, 413 payload too large, 429 rate limited, 500 internal error.

## Event System Rules
All events flow through Redis pub/sub. Workers publish, gateway subscribes and forwards via WebSocket.
Event types are fixed: job.started, agent.step, tool.called, tool.result, job.completed, job.error, job.cancelled. Do not add new event types without updating the schema.
Every event must include: event_type, job_id, tenant_id, timestamp (ISO 8601), data (JSON object).
Events are persisted to the events table for audit trail.

## Networking Rules (Tailscale-First)
Phase 1-5: All VPS services behind Tailscale mesh. Zero public ports.
Claw3D overlay connects to OpenClaw Gateway via Tailscale IP (100.x.x.x), not a public domain.
noVNC live view served via Tailscale IP. Signed URL tokens still required for job-level access.
xRDP for XFCE desktop accessible via Tailscale IP only.
SSH via Tailscale IP only. Key-based auth. No password auth. No root login.
Telegram bot runs in polling mode (outbound only, no webhook endpoint).
Redis and Postgres bind to 127.0.0.1 only (not even Tailscale interface).
Never hardcode Tailscale IPs in application code. Use environment variables (VPS_HOST in .env).
When Tailscale is unreachable, Claw3D overlay must show "VPS Unreachable" status, not crash.

## XFCE Remote Desktop Rules
XFCE + xRDP is a debugging and manual inspection tool, not a production runtime surface.
xRDP must listen only on the Tailscale interface, never on 0.0.0.0 or public interfaces.
Use a separate non-root user account for xRDP sessions.
Do not install unnecessary GUI applications on XFCE. Keep it minimal: file manager, terminal, browser.
XFCE is not part of the Docker Compose stack. It runs natively on the VPS host.

## Infrastructure Setup Order
Before any application code:
1. Install and authenticate Tailscale on VPS
2. Install XFCE + xRDP on VPS, bind xRDP to Tailscale interface
3. Install Docker and Docker Compose on VPS
4. Install Tailscale on local Windows machine
5. Verify mesh connectivity: laptop reaches VPS via Tailscale IP
6. Verify xRDP: can remote desktop into XFCE via Tailscale

## Security Rules
All VPS services behind Tailscale mesh during personal use phase. Zero public ports.
Never log secrets, API keys, bearer tokens, or Tailscale auth keys.
Never commit .env files. Always use .env.example with placeholder values.
Redis and PostgreSQL must only bind to 127.0.0.1.
Signed URLs use JWT with 15-minute max expiration.
Telegram bot must use polling mode (no public webhook endpoint behind Tailscale).
Telegram bot must verify user_id against allowlist before processing any command.
Local file access from agents requires explicit user approval via overlay permission modal.
xRDP must only listen on Tailscale interface, never on public interfaces.
Store VPS Tailscale IP as VPS_HOST in .env, never hardcode in application code.
Claw3D overlay stores Tailscale connection info in Windows Credential Manager, never plaintext.

## Error Handling
Gateway: use Fastify error handler. Return structured JSON errors. Never expose stack traces in production.
Workers: catch all exceptions in task execution. Log the error. Emit job.error event. Set job status to failed.
Overlay: React error boundaries catch render errors. WebSocket reconnects with exponential backoff (1s, 2s, 4s, max 30s).
Never swallow errors silently. Every catch block must either log, emit an event, or re-raise.

## State Management (Overlay)
Use Zustand for global state. No Redux. No React Context for frequently changing data.
State shape: { connection, currentJob, events, responses, permissions, settings }.
WebSocket connection state managed in a dedicated store slice.
Never store sensitive data (API keys, tokens) in React state. Use Electron secure storage.

## File Structure
gateway/src/routes/ for API route handlers (one file per endpoint group)
gateway/src/services/ for business logic (router, queue, auth, signing)
gateway/src/db/ for database connection, migrations, and query files
workers/agents/ for agent implementations (one file per agent type)
workers/adapters/ for model provider adapters (one file per provider)
workers/tools/ for tool implementations (one file per tool)
overlay/src/renderer/components/ for React components (one file per component)
overlay/src/renderer/hooks/ for custom React hooks
overlay/src/main/ for Electron main process files

## Git Conventions
Conventional commits required: feat:, fix:, docs:, refactor:, test:, chore:
Branch naming: feature/short-description, hotfix/short-description
Squash merge to main. No merge commits.
Tag releases: v1.0.0, v1.1.0 following semver.
Never push directly to main. Always use feature branches.

## Testing Rules
Gateway: Vitest or Jest with Supertest. Test every route handler.
Workers: pytest. Test every agent with mocked model responses.
Telegram: pytest. Test command parsing and permission checks.
Critical paths (auth, job creation, job cancel, event emission) must have 100% test coverage.
Overall minimum: 80% gateway, 70% workers.
Run all tests before any push to main.

## Performance Targets
API response (excluding model call): under 200ms
WebSocket connection establishment: under 100ms
Event stream latency: under 500ms
Job pickup from queue: under 1 second
Database indexed queries: under 100ms
Idle VPS RAM: under 2GB
Idle VPS CPU: under 20%

## Accessibility
All interactive overlay elements have minimum 44px touch/click targets.
All buttons and inputs have visible focus indicators.
Color is never the only indicator of state (always pair with icon or text).
Keyboard navigation supported for all overlay controls.

## Docker Rules
One Dockerfile per service.
Multi-stage builds to minimize image size.
Non-root user in production containers.
Health checks defined in docker-compose.yml for each service.
docker-compose.yml for production, docker-compose.test.yml for testing.
All environment variables passed via .env file, never hardcoded in Dockerfile.
