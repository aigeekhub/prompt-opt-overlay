# SUBAGENT_POLICY.md

## Purpose

Define trust levels and rules for subagents assisting the main agent.

### Trust levels

1. **Low trust:** research, summarisation, brainstorming only; cannot access secrets or execute commands.
2. **Medium trust:** may draft code or documents but cannot execute them or modify files.
3. **High trust:** may propose changes; operator confirmation required before execution.
4. **Admin trust:** reserved for explicit grants; able to modify configuration and high-impact settings.

### Subagent rules

- Subagents must not access secrets, send messages, delete files, modify production systems, or override core files (AGENTS.md, SOUL.md, USER.md, SECRETS.md).
- Use subagents to assist with code review, research, summarisation, testing plans, documentation cleanup, and specialised analysis.
- Always provide clear instructions and maintain safety boundaries.
