# connector-action-stub-skill

Generate dry-run stubs and approval checklists for connector actions.

## Quickstart

```bash
npm install
npm test
npm run smoke
npm run release:check
```

## CLI

```bash
node src/cli.js plan examples/crm-manifest.json
node src/cli.js fixture examples/crm-manifest.json
node src/cli.js skill examples/crm-manifest.json
```

## Agent Skill

See [SKILL.md](./SKILL.md) for when to use this package, side-effect boundaries, approval requirements, examples, and validation.

## Library

```js
import { buildPlan, renderPlan } from "connector-action-stub-skill";
```

The package smoke check verifies this export alongside the CLI files.

## Release Verification

Run the full local gate before publishing, tagging, or handing the package to another agent:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

`npm run package:smoke` performs an `npm pack --dry-run` and verifies that the packed tarball contains the CLI source, library source, sample connector manifest, skill guide, README, license, and package metadata.

## Safety Notes

The default workflow is local-first. It does not call external services, read credentials, publish packages, or perform live account writes.

## Limitations

This MVP provides deterministic planning and linting helpers. Human review remains required before trusting output for release, installation, or live connector execution.

## Support

Report public release-readiness issues at https://github.com/rogerchappel/connector-action-stub-skill/issues.
