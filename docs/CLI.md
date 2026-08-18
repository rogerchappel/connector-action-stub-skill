# CLI Behavior

`connector-action-stub` accepts one mode and one manifest path:

```bash
connector-action-stub plan examples/crm-manifest.json
connector-action-stub fixture examples/crm-manifest.json
connector-action-stub skill examples/crm-manifest.json
```

## Exit Codes

- `0` - the selected mode rendered successfully.
- `1` - the manifest could not be read or parsed, or fixture generation found
  an unready action.
- `2` - the command or manifest path was missing, the mode was unknown, or
  extra positional arguments were provided.

Argument errors print the usage line to stderr and do not render output.
Manifest and readiness errors print an actionable error to stderr and likewise
leave stdout empty, so release scripts, CI jobs, and agent dry runs cannot
mistake a fallback or partial result for success.

## Manifest Shape

The manifest must be a JSON object with a non-empty `actions` array. An empty
array is rejected before plan, fixture, or skill output is rendered. Every entry in
`actions` must be a non-null JSON object; `null`, scalar values, and arrays are
rejected before planning. Invalid entries produce a stable diagnostic that
identifies the array index and received type, for example:

```text
Failed to read manifest "manifest.json": manifest actions[0] must be a non-null object (received null)
```

Action fields use the following validation contract:

- `name`, `description`, and `approval` are non-empty strings.
- `scopes` is a non-empty array whose entries are non-empty strings.
- `sampleInput` is a non-null JSON object (not an array).
- `idempotencyKey`, when present, is a non-empty string and is required for
  every non-read action.
- `sideEffect` is a non-empty string with the supported values described
  below.

Malformed fields leave an action unready in plan and skill output. Fixture
generation fails closed when any action is unready.

Every generated fixture response has a deterministic ID in the form
`dryrun-<action-name>-<position>`, where positions start at `1` in manifest
order. Including the position keeps IDs distinct when multiple ready actions
share a name while producing identical output for repeated runs.

Generated plan tables escape Markdown cell delimiters and convert embedded line
breaks to `<br>`, so connector and action text cannot add rows or columns.

## Manifest Side Effects

Each action's `sideEffect` must be one of `read`, `write`, `send`, or `delete`.
Values are trimmed and matched case-insensitively. `read` actions are low risk
and do not require an idempotency key. `write`, `send`, and `delete` actions are
high risk and require `idempotencyKey`. Unsupported values are reported as
high risk and leave the action unready. Plan and skill modes report that
readiness state. Fixture mode exits `1` instead of emitting an `ok: true`,
`status: planned` response for an action that cannot be safely stubbed.

## Approval Contract

Every action must provide non-empty approval metadata. For a `read`, that text
may document that approval is not required or describe an account-boundary
check. For `write`, `send`, and `delete`, the text must describe an explicit
human approval requirement.

For a high-risk action, the normalized approval text must start with one of
these affirmative forms (the bracketed words show the permitted options):

- `require[s] [explicit] human approval`
- `human approval [is] required`
- `must obtain [explicit] human approval`
- `must receive [explicit] human approval`

Normalization trims surrounding whitespace, collapses internal whitespace,
and ignores case. More detail may follow the accepted prefix, separated by
whitespace or punctuation. All other wording fails closed, including missing
text, denial values such as `denied`, `false`, or `no`, and arbitrary prose
that does not begin with an accepted form. Plan and skill output mark the
action unready, while fixture mode exits `1` without emitting an `ok: true`
planned response. This affirmative allowlist applies only to `write`, `send`,
and `delete`; documented read-action behavior is unchanged.
