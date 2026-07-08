# connector-action-stub-skill

Generate dry-run stubs and approval checklists for connector actions.

## Quickstart

```bash
npm install
npm test
npm run smoke
```

## CLI

```bash
node src/cli.js plan examples/crm-manifest.json
```

## Agent Skill

See [SKILL.md](./SKILL.md) for when to use this package, side-effect boundaries, approval requirements, examples, and validation.

## Safety Notes

The default workflow is local-first. It does not call external services, read credentials, publish packages, or perform live account writes.

## Limitations

This MVP provides deterministic planning and linting helpers. Human review remains required before trusting output for release, installation, or live connector execution.
