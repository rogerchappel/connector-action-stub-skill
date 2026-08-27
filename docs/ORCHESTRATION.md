# Orchestration

Read a local connector manifest, generate a dry-run plan, inspect missing approvals or idempotency keys, and require human approval before any live execution in a separate system.

Verification: `npm run release:check`. The legacy `bash scripts/validate.sh`
entry point delegates to that same complete gate.
