# connector-action-stub-skill

Generate dry-run stubs and approval checklists for connector actions.

## Quickstart

```bash
npm install
npm test
npm run smoke
npm run release:check
```

## Verification

Run the same checks used for release-readiness before publishing or opening a release PR:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run release:check
npm pack --dry-run
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

Every manifest must contain at least one entry in its `actions` array. Empty
action lists are validation errors and produce no plan, fixture, or skill output.

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
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

`npm run smoke` exercises the documented `plan`, `fixture`, and `skill` CLI modes against the sample connector manifest. `npm run package:smoke` creates a real tarball in a disposable directory, installs it into a clean prefix, verifies that its declared export and bin point to installed files, imports and calls the installed library, and exercises the installed CLI's help, `plan`, `fixture`, `skill`, and documented failure behavior. The disposable package and installation are removed after either success or failure.

## Safety Notes

The default workflow is local-first. It does not call external services, read credentials, publish packages, or perform live account writes.

## Limitations

This MVP provides deterministic planning and linting helpers. Human review remains required before trusting output for release, installation, or live connector execution.

## Support

Report public release-readiness issues at https://github.com/rogerchappel/connector-action-stub-skill/issues.
