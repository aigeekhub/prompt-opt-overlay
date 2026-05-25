---
name: mobu-task-automation
description: Procedural rules for recurring tasks, heartbeats, and automated maintenance.
---

# MOBU Task Automation

## Overview
This skill defines the procedures for MOBU's automated tasks, including daily and weekly "heartbeats" that ensure system health and task progression.

## Automation Routes
- **Daily Heartbeat:** Review daily logs, promote information, and check pending tasks.
- **Weekly Heartbeat:** Review architecture for drift, check secrets compliance, and prioritize the backlog.
- **Task Management:** Use `tasks/NOW.md` for current tasks, `tasks/BACKLOG.md` for deferred work, and `tasks/PARKING_LOT.md` for ideas.

## Implementation Patterns
- **Low-Frequency:** Use `manus-config schedule` for tasks running a few times per day.
- **High-Frequency:** Use persistent sandbox scripts for continuous polling or monitoring.
- **Deterministic:** Use `manus-heartbeat` for web-based cron jobs.

## References
- [Heartbeat Procedures](references/heartbeat_procedures.md)
- [Task Prioritization Logic](references/prioritization.md)
