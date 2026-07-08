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
