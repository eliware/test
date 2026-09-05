# CLI commands, lifecycle, limits, and focused tests

## 3. Commands and lifecycle

`eliware-test` runs these stages in order:

1. Scan for disallowed Istanbul-ignore directives.
2. Check workspace setup and warn, without failing, when `.gitignore` is absent.
3. Validate deterministic repository conventions.
4. Validate wrapper-managed and focused-path arguments.
5. Remove stale coverage candidates.
6. Validate source/test architecture mapping.
7. Run Jest with coverage.
8. Select and validate coverage evidence.
9. Run Oxlint with warnings denied.
10. Enforce monolith limits for the normal CLI run.
11. Run configured `audit`, `pack`, `build`, and `typecheck` package scripts.

Pre-test stages stop at the first applicable failure, including source/test
architecture drift. After Jest, coverage failure is deferred while lint,
monolith, and package-check diagnostics are reported; a later post-test
failure takes precedence over the deferred coverage result. `--lint` runs only workspace policy,
setup, and Oxlint. It rejects warnings and test arguments. `--help`/`-h` and
`--version`/`-v` are terminal modes and take precedence over managed-option
validation when combined with other arguments. If invalid options accompany a
terminal mode, the CLI emits a warning and still prints the requested help or
version. Version output comes from
`package.json`.

The continuation after a coverage failure is intentional: coverage evidence
is reported as failed, but the remaining deterministic checks still run so one
invocation exposes all actionable diagnostics. If multiple post-test checks
fail, the first failing stage in this order supplies the final code: package
scripts, monolith validation, lint, then coverage. Coverage therefore remains
deferred, but it is not allowed to replace a later failure.

The lifecycle and lint exports expose internal test seams, not consumer APIs.
The lifecycle accepts its collaborators through the validated toolkit options;
the standalone lint seam accepts its dependency object, including injected
`runLint` and `runChildProcess` collaborators, and must use those collaborators
instead of launching the default processes. Their numeric results
and diagnostics are the supported internal contract; callers must not depend
on additional structured error fields.

Stable wrapper exit codes are:

| Code | Category | Typical remediation |
| ---: | --- | --- |
| 2 | Workspace setup | Add or correct workspace configuration. |
| 3 | Istanbul policy | Remove an invalid ignore directive. |
| 4 | Invalid argument | Remove or correct the unsupported option. |
| 5–6 | Focused-path validation | Correct the focused path or its access. |
| 7 | Coverage cleanup | Resolve coverage filesystem permissions or locks. |
| 8–9 | Test startup/failure | Fix Jest startup or test failures. |
| 10–11 | Coverage failure/gap | Provide usable 100×4 coverage evidence. |
| 12–13 | Lint startup/failure | Fix lint startup or findings. |
| 14 | Internal failure | Review the diagnostic and report a wrapper defect if needed. |
| 15 | Monolith limit | Split the module or use a justified exemption. |
| 16 | Source/test drift | Restore the exact canonical mapping. |
| 17 | Package-script failure | Fix the configured package script. |
| 18 | Repository convention failure | Fix the grouped diagnostics or document an exact path exception. |

Package scripts are checked only when the consuming `package.json` defines the
corresponding script. Missing scripts are skipped silently. Defined scripts run
after the existing test, coverage, lint, and monolith checks; any nonzero exit
code fails the CLI with exit code 17. The package-check set is limited to
`audit`, `pack`, `build`, and `typecheck`; it must never invoke the consumer's
`test` script, so the normal `npm test` command cannot recurse through the
package-check pipeline.

On Windows, package scripts run through the current Node executable. When npm
provides a JavaScript entrypoint through `npm_execpath`, that entrypoint is
used; otherwise the conventional npm CLI beside Node is used. This avoids
invoking `.cmd` files through a non-shell child process.
The supported environment is the internal Node.js/npm installation layout used
by Eliware projects. Alternative package-manager layouts are not a supported
compatibility target; the fallback is not required to locate npm in those
environments.

When `--debug-timing` is enabled, timing-report parsing and cleanup are
best-effort diagnostics. A malformed or locked timing artifact produces a
bounded warning and does not replace the underlying Jest result or block the
remaining validation stages.

## 4. Implementation and test file-size limits

The normal CLI pipeline enforces these monolith limits; they are not general
filesystem restrictions. `--ignore-monolith-limits` temporarily bypasses only
this gate for diagnostic or refactoring work.

- Source modules under `src/` may contain at most 100 lines.
- Test files under `test/`, `tests/`, `spec/`, or `specs/` may contain at most
  200 lines.
- Pure import/export barrels and generated files are exempt from size limits.
  Their source/test mapping and policy-discovery treatment must follow the
  explicit architecture and generated-file rules.
- Other exemptions require a non-empty glob and justification under
  `eliwareTest.monolithLimits.exemptions`.

These exemptions apply only to monolith size limits; they do not exempt files
from source/test mapping or other workspace policies.

Violations report normalized paths, line counts, thresholds, and required
action, and fail with exit code 15. `--ignore-monolith-limits` is a temporary
refactoring bypass; it still runs Jest, coverage, and lint.

The CLI enables this gate for normal test runs. Its argument parsing, lifecycle,
and exit behavior form the consumer contract.

Generated files are identified by a `generated` path segment, a `.generated.`
filename segment, or an `@generated` marker in the file path or source text.
That marker defines a monolith size exemption only. Generated files remain
subject to source/test mapping and Istanbul-ignore policy discovery unless a
directory-level exclusion applies. This keeps generated-file treatment
explicit and consistent across the policy gates.

Diagnostic path flavor is determined by the path contract supplied to the
normalizer: drive-letter and UNC roots use Windows case-insensitive matching;
all other roots use POSIX matching. A Windows-looking path supplied on a POSIX
host is therefore intentionally treated as Windows syntax.

## 5. Arguments and focused tests

- Wrapper-owned options (`--coverage`, `--detectOpenHandles`, `--silent`,
  `--coverageReporters`, and `--runTestsByPath`) are rejected.
- `--runInBand` is accepted and normalized to the default. `--no-runInBand`
  opts out for diagnostics.
- `--ignore-100x4` skips enforcement only; tests, coverage collection, lint,
  and other behavior remain unchanged.
- `--workers=N` overrides the default six monolith-scan measurement workers;
  `N` must be a positive integer and the option is not forwarded to Jest.
- A standalone `--` separator is removed once before Jest invocation.
- Shared Jest value-option metadata prevents option values becoming focused
  paths.
- Conventional paths under `tests/`, `test/`, or `spec/` are checked before
  Jest starts. Missing paths fail clearly and never fall back to the full suite.
  This focused-path recognition is broader than the strict architecture
  bijection, which is limited to `src/**/*.mjs` and `tests/**/*.test.mjs`.

Strict architecture mapping intentionally considers only `src/**/*.mjs` and
`tests/**/*.test.mjs`; broader discovery extensions belong to the independent
monolith and workspace-policy scanners. This is an explicit boundary, not a
claim that all discovery policies are interchangeable.

Mapping discovery is deterministic and bounded: excluded dependency, VCS,
coverage, build, distribution, and test-result directories are skipped,
repeated directory visits are ignored, nesting is
limited to 100 levels, and each tree is limited to 10,000 files. Exceeding a
limit fails validation with a stable diagnostic rather than continuing an
unbounded traversal.
- Any invocation containing a recognized conventional test path uses
  `--runTestsByPath`, including mixed path-and-name filters. Invocations without
  a recognized path retain normal Jest filter semantics.
