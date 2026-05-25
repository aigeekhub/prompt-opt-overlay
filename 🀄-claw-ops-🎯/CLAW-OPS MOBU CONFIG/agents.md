# MOBU-to-Manus Refactored Environment

## Overview
This environment is a refactored version of the MOBU (FENIX Operator) workspace, aligned with the Manus AI High-Level Architecture. It preserves the original MOBU identity and mission while leveraging Manus skills and system utilities.

## Directory Structure
- `/home/ubuntu/skills/`: Refactored MOBU capabilities.
    - `mobu-core/`: Identity, mission, and behavior.
    - `mobu-memory-management/`: Persistence and curation.
    - `mobu-task-automation/`: Heartbeats and maintenance.
    - `mobu-agent-coordination/`: Subagent governance.
- `/home/ubuntu/memory/`: Persistent memory logs and curated summaries.
- `/home/ubuntu/tasks/`: Task tracking (NOW, BACKLOG, PARKING_LOT).
- `/home/ubuntu/docs/`: Governance and policy documents.

## MOBU-to-Manus Mapping
| Original MOBU Component | New Manus Component |
|---|---|
| IDENTITY.md, SOUL.md | `skills/mobu-core/` |
| memory/ | `/home/ubuntu/memory/` |
| HEARTBEAT.md | `skills/mobu-task-automation/` |
| SUBAGENT_POLICY.md | `skills/mobu-agent-coordination/` |
| TOOLS.md | Manus System Utilities |

## Persistent Dependencies
- Manus System Utilities (`manus-*`)
- Refactored Skill directories under `/home/ubuntu/skills/`
- Memory and Task structures under `/home/ubuntu/`
