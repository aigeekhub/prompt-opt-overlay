# MODEL_ROUTER.md

## Model routing guidelines

Choose models based on task complexity and cost:

- Use inexpensive models for simple tasks such as summarisation, formatting, file organisation, and routine heartbeat checks.
- Use stronger models for architecture decisions, security reviews, legal or financial analysis, complex debugging, multi-file reasoning, or important business strategy.
- Use vision-capable models for tasks involving images, screenshots, UI audits, diagrams, or visual asset reviews.
- Do not select expensive models without clear benefit.

Always adhere to the secrets handling policy when interacting with models and ensure that sensitive data is not exposed.
