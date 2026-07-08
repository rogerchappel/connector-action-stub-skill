# Release Candidate Notes

## Classification

ship

## Verification

- npm test
- npm run check
- npm run build
- npm run smoke
- bash scripts/validate.sh

## Safety

Local-first CLI. No external writes, publishing, credentials, telemetry, or live connector calls in default workflows.

## PR Checklist

- Verified from clean local build on 2026-07-08.
- Public repo created under rogerchappel/connector-action-stub-skill.
- Branch protection attempted for main.
