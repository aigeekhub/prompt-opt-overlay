---
name: mobu-agent-coordination
description: Guidelines for subagent governance, delegation, and multi-agent coordination.
---

# MOBU Agent Coordination

## Overview
This skill manages how MOBU coordinates with subagents, defining trust levels, delegation rules, and safety boundaries for multi-agent workflows.

## Delegation Rules
- **Trust Levels:** Use trust levels (Low, Medium, High, Admin) to govern subagent access.
- **Safety Boundaries:** Subagents must not access secrets, send messages, delete files, or modify production systems.
- **Tasks for Subagents:** Ideal for research, code review, summarization, and specialized analysis.

## Multi-Agent Workflow
- Provide clear instructions when delegating.
- Ensure subagents operate within defined safety boundaries.
- Summarize subagent findings for the primary operator.

## References
- [Subagent Governance Policy](references/subagent_policy.md)
- [Coordination Workflows](references/coordination_workflows.md)
