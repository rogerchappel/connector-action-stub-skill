# Release Candidate Notes

## Classification

ship

## Verification

- npm run release:check

`bash scripts/validate.sh` is retained only as a compatibility entry point and
delegates to the same canonical command.

## Safety

Local-first CLI. No external writes, publishing, credentials, telemetry, or live connector calls in default workflows.

## PR Checklist

- Verified from clean local build on 2026-07-08.
- Public repo created under rogerchappel/connector-action-stub-skill.
- Branch protection attempted for main.
