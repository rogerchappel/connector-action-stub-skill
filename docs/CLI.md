# CLI Behavior

`connector-action-stub` accepts one mode and one manifest path:

```bash
connector-action-stub plan examples/crm-manifest.json
connector-action-stub fixture examples/crm-manifest.json
connector-action-stub skill examples/crm-manifest.json
```

## Exit Codes

- `0` - the selected mode rendered successfully.
- `2` - the command used an unknown mode or provided extra positional
  arguments.

Extra positional arguments are rejected instead of ignored so release scripts,
CI jobs, and agent dry runs fail loudly when they pass the wrong manifest path
or include a stale argument.

## Manifest Side Effects

Each action's `sideEffect` must be one of `read`, `write`, `send`, or `delete`.
Values are trimmed and matched case-insensitively. `read` actions are low risk
and do not require an idempotency key. `write`, `send`, and `delete` actions are
high risk and require `idempotencyKey`. Unsupported values are reported as
high risk and leave the action unready.
