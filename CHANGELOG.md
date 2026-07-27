# Changelog

## Unreleased

- Validate action field types and non-empty constraints before marking plans,
  fixtures, or generated skill guidance ready.

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
