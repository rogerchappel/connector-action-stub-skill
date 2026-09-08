# Changelog

## Unreleased

- Upgrade checkout and setup-node to reviewed immutable v7 revisions, enforce
  those exact pins in the release contract, and document their runner baseline.
- Make the standalone package smoke command build and validate its own
  deterministic artifact instead of relying on release-check ordering.
- Make CI installs reproducible from the committed lockfile, test the full
  release gate on Node 20 and 24, and contract-test least-privilege permissions
  plus immutable GitHub Action revisions.
- Contain connector and action names inside generated skill-guide Markdown by
  normalizing line breaks and escaping Markdown punctuation.
- Require affirmative human-approval metadata for high-risk actions, failing
  closed for denial, absence, boolean-like, and ambiguous wording across
  library and CLI fixture generation.
- Validate action field types and non-empty constraints before marking plans,
  fixtures, or generated skill guidance ready.
- Include each action's manifest position in fixture response IDs so duplicate
  action names still produce deterministic, distinct identifiers.

## [Unreleased]

- Require explicit CLI arguments and reject unready fixture generation instead
  of producing false-success output.
- Normalize and validate action side effects, including high-risk delete actions and fail-closed handling for unsupported values.
- Reject non-object action entries with indexed manifest diagnostics and keep
  manifest-controlled text inside generated Markdown table cells.
- Add release-readiness checks for package metadata, pack contents, and CI verification.
## 0.1.0

- Initial release candidate for generating connector dry-run stubs, approval checklists, fixtures, and skill guidance.
- Includes fixture-backed tests, CLI smoke coverage, and npm package smoke verification.
