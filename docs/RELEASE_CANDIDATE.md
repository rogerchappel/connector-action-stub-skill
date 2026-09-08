# Release Candidate Notes

## Classification

ship

## Verification

- npm ci
- npm run release:check

`bash scripts/validate.sh` is retained only as a compatibility entry point and
delegates to the same canonical command.

CI repeats the full gate after a lockfile-backed install on Node 20 and Node 24.
Its workflow contract enforces read-only repository permissions and immutable
action revisions. The pinned v7 actions require Actions Runner 2.327.1 or newer
when the workflow runs on a self-hosted runner.

## Safety

Local-first CLI. No external writes, publishing, credentials, telemetry, or live connector calls in default workflows.

## PR Checklist

- Verified from clean local build on 2026-07-08.
- Public repo created under rogerchappel/connector-action-stub-skill.
- Branch protection attempted for main.
