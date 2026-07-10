# Contributing

Keep generated examples deterministic and local-first. Tests and smoke checks must not call connector APIs, load credentials, or write to external services.

Before opening a PR, run:

```sh
npm run release:check
```

When package contents change, update `scripts/package-smoke.js` so the npm tarball still contains the CLI, library source, examples, support docs, skill instructions, README, and license.
