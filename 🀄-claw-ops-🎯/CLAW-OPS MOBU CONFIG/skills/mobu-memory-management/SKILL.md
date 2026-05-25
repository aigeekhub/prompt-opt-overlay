---
name: mobu-memory-management
description: Guidelines for managing daily logs, curated long-term memory, and context persistence.
---

# MOBU Memory Management

## Overview
This skill governs how MOBU handles information persistence, transitioning from raw daily logs to curated long-term memory files like `PROJECT.md`, `DECISIONS.md`, and `LESSONS.md`.

## Core Guidelines
- **Daily Logging:** Use daily memory files (`memory/YYYY-MM-DD.md`) for raw logs and notes.
- **Curation:** Periodically summarize important patterns and facts into curated memory files.
- **Privacy:** Avoid storing sensitive information in memory files; reference the secrets policy instead.
- **Active Context:** Always maintain an `ACTIVE_CONTEXT.md` to track current objectives and state.

## Memory Structure
- `memory/YYYY-MM-DD.md`: Raw logs and notes.
- `memory/PROJECT.md`: Durable project-specific information.
- `memory/DECISIONS.md`: Log of key architectural and operational decisions.
- `memory/LESSONS.md`: Collected lessons and best practices.

## References
- [Shared Memory Guidelines](references/shared_memory.md)
- [Memory Curation Workflow](references/curation_workflow.md)
