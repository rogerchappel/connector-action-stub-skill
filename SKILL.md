# connector-action-stub-skill

## When To Use

Use this skill before enabling an agent to perform connector-backed actions such as posting a message, creating a CRM note, updating a ticket, or sending a follow-up.

## Inputs And Tools

Provide a local JSON connector manifest with an `actions` array. Each action should include `name`, `description`, `scopes`, `sideEffect`, `approval`, and `sampleInput`.

## Side-Effect Boundaries

The CLI generates plans and fixtures only. It never calls a live connector, reads credentials, or posts externally.

Set each action's `sideEffect` to `read`, `write`, `send`, or `delete` (matching
is case-insensitive). Reads are low risk. Writes, sends, and deletes are high
risk and require an `idempotencyKey`. Any other value fails closed as an
unready, high-risk action.

## Approval Requirements

Every action needs non-empty approval metadata. A read may state that approval
is not required or name a boundary check. A write, send, or delete must
describe explicit human approval before live execution.

For high-risk actions, approval values that normalize to `not required`,
`approval not required`, `no approval required`, `none`, `absent`,
`approval absent`, or `approval is absent` are unready. Normalization ignores
case, trims the value, and collapses whitespace. Fixture generation then fails
without producing an `ok: true` planned response.

## Examples

`connector-action-stub plan examples/crm-manifest.json`
`connector-action-stub fixture examples/crm-manifest.json`
`connector-action-stub skill examples/crm-manifest.json`

## Validation

Run `npm run release:check`. It includes syntax, library and CLI regression,
build, documented sample-manifest smoke, and package-content checks.

## Limitations

The tool validates manifest shape and planning hygiene; it is not a runtime permission sandbox.
