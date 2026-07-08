# connector-action-stub-skill

## When To Use

Use this skill before enabling an agent to perform connector-backed actions such as posting a message, creating a CRM note, updating a ticket, or sending a follow-up.

## Inputs And Tools

Provide a local JSON connector manifest with an `actions` array. Each action should include `name`, `description`, `scopes`, `sideEffect`, `approval`, and `sampleInput`.

## Side-Effect Boundaries

The CLI generates plans and fixtures only. It never calls a live connector, reads credentials, or posts externally.

## Approval Requirements

Require explicit human approval before converting a generated dry-run plan into live connector execution.

## Examples

`connector-action-stub plan examples/crm-manifest.json`
`connector-action-stub fixture examples/crm-manifest.json`
`connector-action-stub skill examples/crm-manifest.json`

## Validation

Run `npm test`, `npm run smoke`, and `bash scripts/validate.sh`.

## Limitations

The tool validates manifest shape and planning hygiene; it is not a runtime permission sandbox.
