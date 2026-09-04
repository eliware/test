# CLI commands, lifecycle, limits, and focused tests

## 3. Commands and lifecycle

`eliware-test` runs these stages in order:

1. Scan for disallowed Istanbul-ignore directives.
2. Check workspace setup and warn, without failing, when `.gitignore` is absent.
3. Validate wrapper-managed and focused-path arguments.
4. Remove stale coverage candidates.
5. Run Jest with coverage.
6. Select and validate coverage evidence.
7. Run Oxlint with warnings denied.
8. Enforce monolith limits for the normal CLI run.

Stages stop at the first applicable failure. `--lint` runs only workspace
policy, setup, and Oxlint. It rejects warnings and test arguments. `--help`/
`-h` and `--version`/`-v` are terminal modes. Version output comes from
`package.json`.

Stable wrapper exit codes are: workspace setup `2`, Istanbul policy `3`,
invalid argument `4`, focused-path validation `5`, missing focused path `6`,
coverage cleanup `7`, test startup `8`, test failure `9`, coverage failure
`10`, coverage gap `11`, lint startup `12`, lint failure `13`, internal failure
`14`, monolith limit failure `15`, and source/test architecture drift `16`.

## 4. Implementation and test file-size limits

- Source modules under `src/` may contain at most 100 lines.
- Test files under `test/` or `tests/` may contain at most 200 lines.
- Pure import/export barrels and generated files are exempt from size limits,
  but both remain subject to exact source/test pairing.
- Other exemptions require a non-empty glob and justification under
  `eliwareTest.monolithLimits.exemptions`.

Violations report normalized paths, line counts, thresholds, and required
action, and fail with exit code 15. `--ignore-monolith-limits` is a temporary
refactoring bypass; it still runs Jest, coverage, and lint.

The CLI enables this gate for normal test runs. Direct `runToolkit` callers
must opt in with `enforceMonolithLimits: true`; this keeps the public API
explicit for embedding and testing.

Generated files are identified by a `generated` path segment, a `.generated.`
filename segment, or an `@generated` marker in the file path or source text.

## 5. Arguments and focused tests

- Wrapper-owned options (`--coverage`, `--detectOpenHandles`, `--silent`,
  `--coverageReporters`, and `--runTestsByPath`) are rejected.
- `--runInBand` is accepted and normalized to the default. `--no-runInBand`
  opts out for diagnostics.
- `--ignore-100x4` skips enforcement only; tests, coverage collection, lint,
  and other behavior remain unchanged.
- A standalone `--` separator is removed once before Jest invocation.
- Shared Jest value-option metadata prevents option values becoming focused
  paths.
- Conventional paths under `tests/`, `test/`, or `spec/` are checked before
  Jest starts. Missing paths fail clearly and never fall back to the full suite.
  This focused-path recognition is broader than the strict architecture
  bijection, which is limited to `src/**/*.mjs` and `tests/**/*.test.mjs`.
- File-only conventional selections use `--runTestsByPath`; mixed filters retain
  Jest semantics.
