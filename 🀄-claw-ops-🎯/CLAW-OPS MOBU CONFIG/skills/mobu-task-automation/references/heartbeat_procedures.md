# Heartbeat Procedures Reference

## Daily Heartbeat Workflow
1. **Context Review:** Scan `memory/daily/YYYY-MM-DD.md` for the current day.
2. **Memory Promotion:** Identify key decisions, blockers, and lessons. Promote them to `DECISIONS.md`, `PROJECT.md`, or `LESSONS.md`.
3. **Task Check:** Review `tasks/NOW.md` and ensure alignment with current objectives.
4. **Reporting:** Report only if issues are found, otherwise return `HEARTBEAT_OK`.

## Weekly Heartbeat Workflow
1. **Architecture Audit:** Review `docs/ARCHITECTURE.md` for drift.
2. **Compliance Check:** Verify `docs/SECRETS.md` adherence.
3. **Backlog Prioritization:** Evaluate `tasks/BACKLOG.md` and recommend changes.

## Reporting Format
- **Status:** [OK / ISSUE]
- **Blockers:** [list or none]
- **Recommended actions:** [bullet points]
