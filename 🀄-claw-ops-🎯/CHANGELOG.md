# Changelog

All notable changes to the CLAW operating environment (VPS Brain & Gateway) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-05-24
### Added
- **Python Celery Worker ("Hermes"):** Implemented `worker/celery_app.py` and `worker/tasks.py` to run model execution.
- **Model Routing Adapter:** Configured OpenAI model router supporting `default_fast` (`gpt-4o-mini`), `dev_deep` (`gpt-4o`), and `bulk_cheap` (`gpt-4o-mini`) profiles.
- **Observability Events:** Implemented event publishers to emit `job.started`, `agent.step` (for timeline steps), `job.completed`, and `job.error`.
- **Cancellation Listener:** Created background thread using Redis Pub/Sub to catch cancellation signals on `claw_ops_jobs_cancel:{jobId}` in real-time, cleanly aborting LLM execution and updating the DB.
- **Queue Bridge:** Developed `worker/main.py` to bridge Fastify's simple Redis list-based queue (`blpop`) to Celery task queueing (`delay`).
- **Compose Multi-Container Stack:** Added `worker` and `worker_bridge` to `docker-compose.yml` to package and build the Python worker environment.
- **Integration Test Suite:** Implemented `test_integration.py` to automatically validate full execution pipeline (queue -> run -> complete with output) and cancel interrupt logic.

### Fixed
- **OpenAI and HTTPX Compatibility:** Upgraded `openai>=1.56.1` in `worker/requirements.txt` to fix a breaking compatibility error with `httpx` (missing `proxies` argument).
- **Fastify Cancel Body validation:** Fixed `FST_ERR_CTP_EMPTY_JSON_BODY` by sending empty JSON body (`{}`) for cancel requests in the test client.

---

## [1.2.0] - 2026-05-24
### Added
- **Fastify API Gateway:** Implemented containerized Gateway supporting:
  - Bearer token authentication mapped to SHA-256 API key hashes in PostgreSQL.
  - Multi-tenant query routing and job creation.
  - WebSockets endpoint (`/v1/events`) for real-time client event subscription.
  - Rate limiting (100 req/min) and Multipart file uploads up to 50MB.
- **API Endpoints:** `/health`, `/v1/chat`, and `/v1/jobs/:id/cancel`.

---

## [1.1.0] - 2026-05-24
### Added
- **VPS Infrastructure Setup:** tailscale private VPN configuration restrict all ports except SSH to Tailscale IP (UFW rules).
- **Database Layer:** PostgreSQL 16 schema containing `tenants`, `sessions`, `jobs`, `events`, `files`, and `telegram_users` tables.
- **Queue Layer:** Redis 7 configuration with password authentication.
- **Tenant Seeding:** Seeded Default Fenix Tenant (`00000000-0000-0000-0000-000000000000`) and associated developer tokens.

---

## [1.0.0] - 2026-05-24
### Added
- **Ideation & Architecture:** Drafted Product Blueprint and AI Builder specs.
