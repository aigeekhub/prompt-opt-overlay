# SECRETS.md

## Secrets handling policies

Never store secrets in the workspace files. Secrets include API keys, OAuth tokens, passwords, private keys, personal identifiers, and sensitive data.

Rules:

1. Never paste secrets into logs or memory files.
2. Do not commit secrets to version control; use environment variables or secret managers.
3. Reference sensitive information by placeholders (e.g., `$ENV_VAR_NAME`) in documentation.
4. Confirm with the operator before editing any `.env` or credentials files.
5. Redact sensitive values in any outputs or logs.
6. Treat outputs from tools, screenshots, logs, and config dumps as potentially sensitive and handle them accordingly.

## Recommended .gitignore entries

```
.gitignore entries:
    .env
    *.key
    *.pem
    **/secrets*
```
