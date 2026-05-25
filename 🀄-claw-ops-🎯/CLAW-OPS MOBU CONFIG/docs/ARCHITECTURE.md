# ARCHITECTURE.md

## Workspace structure

The OpenClaw workspace is the agent’s home and should be kept private. Tools operate relative to this directory, and it serves as persistent memory for the agent.

## Core layers

1. **Identity layer:** `IDENTITY.md` – defines who the agent is.
2. **Personality layer:** `SOUL.md` – sets the agent’s mission, tone, and boundaries.
3. **Command layer:** `AGENTS.md` – contains procedural rules and workflow instructions.
4. **Tooling layer:** `TOOLS.md` – documents tools and how to use them.
5. **Startup layer:** `BOOTSTRAP.md` – first-run ritual to set up the agent.
6. **Memory layer:** `memory/` – stores daily logs and curated long-term memory.
7. **Task layer:** `tasks/` – organises current tasks, backlog, and parking lot.
8. **Governance layer:** documents under `docs/` such as `SECRETS.md`, `MODEL_ROUTER.md`, `SUBAGENT_POLICY.md` provide policies and guidelines.

## Workspace file map

Refer to `Agent Workspace` documentation for definitions of each file. Key files include `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `TOOLS.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, and daily memory logs `memory/YYYY-MM-DD.md`.

## Sandboxing and security

The workspace is the default current working directory for tools, but absolute paths can access other parts of the host machine unless sandboxing is enabled. Consider enabling sandboxing for isolation.

Keep the workspace in a private git repository and do not commit secrets.
