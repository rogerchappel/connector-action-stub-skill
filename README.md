# connector-action-stub-skill

Generate dry-run stubs and approval checklists for connector actions.

## Quickstart

```bash
npm ci
npm test
npm run smoke
npm run release:check
```

## Verification

Run the canonical release-readiness gate before publishing or opening a release PR:

```bash
npm run release:check
```

## CLI

```bash
node src/cli.js plan examples/crm-manifest.json
node src/cli.js fixture examples/crm-manifest.json
node src/cli.js skill examples/crm-manifest.json
```

Missing or invalid arguments exit `2`. Unreadable or malformed manifests and
unready fixture actions exit `1`; see
[CLI behavior](docs/CLI.md) for the accepted manifest shape, validation
diagnostics, and release-script contract.

Every manifest must have a non-empty, single-line string `name` and at least one
entry in its `actions` array. Invalid connector names and empty action lists are
validation errors and produce no plan, fixture, or skill output. Fixture
response IDs normalize action names to lowercase ASCII letters, digits, and
hyphens, then append the manifest position so normalized duplicates stay unique.
The exact normalization contract is documented in
[CLI behavior](docs/CLI.md#manifest-shape).

The `skill` mode normalizes line breaks and whitespace in connector and action
names and escapes Markdown punctuation. Manifest text stays inside the
generated heading, sentence, or action list item instead of creating new
Markdown structure; see [CLI behavior](docs/CLI.md#manifest-shape).

Read actions may document that approval is not required. Write, send, and
delete actions must instead start approval metadata with an affirmative,
machine-checked human-approval form, such as `Require human approval` or
`Human approval is required`. Missing, denied, false, ambiguous, or other
non-affirmative values leave those high-risk actions unready and prevent
fixture generation. The exact accepted vocabulary and normalization rules are
documented in [CLI behavior](docs/CLI.md#approval-contract).

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
npm run release:check
```

`npm run smoke` exercises the documented `plan`, `fixture`, and `skill` CLI modes against the sample connector manifest. `npm run package:smoke` is self-contained: after `npm ci` it builds twice to verify deterministic output, creates a real tarball in a disposable directory, installs it into a clean prefix, verifies that its declared export and bin point to installed files, imports and calls the installed library, and exercises the installed CLI's help, `plan`, `fixture`, `skill`, and documented failure behavior. The disposable package and installation are removed after either success or failure.

CI installs the committed lockfile with `npm ci` and runs that complete gate on
both Node 20, the minimum supported release, and Node 24. The release-contract
check also guards the workflow's runtime matrix, least-privilege permissions,
immutable action pins, deterministic install, and canonical gate invocation.
The pinned checkout and setup-node v7 actions use the Node 24 action runtime;
self-hosted runners therefore require Actions Runner 2.327.1 or newer.

## Safety Notes

The default workflow is local-first. It does not call external services, read credentials, publish packages, or perform live account writes.

## Limitations

This MVP provides deterministic planning and linting helpers. Human review remains required before trusting output for release, installation, or live connector execution.

## Support

Report public release-readiness issues at https://github.com/rogerchappel/connector-action-stub-skill/issues.
