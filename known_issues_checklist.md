# Known Issues Checklist

Source: `codescope release` run on 2026-09-04. The release verdict was
`block`.

## Correctness and lifecycle

- [ ] **P1 — Architecture drift does not stop execution**
  - Location: `src/public/run-toolkit-preflight.mjs:11-12`
  - Mapping drift is retained, but workspace inspection and test execution can
    continue before the architecture failure is returned.
  - Decide and implement the documented contract: stop at the first applicable
    failure, or explicitly revise the lifecycle contract to allow deferred
    architecture reporting.
  - Add regression coverage for the chosen behavior.

- [ ] **P2 — Architecture failure is reported after other work**
  - Location: `src/public/run-toolkit.mjs:13-29`
  - `runToolkit` can run tests, coverage, lint, and monolith validation before
    returning architecture drift.
  - Make architecture validation a true preflight gate, or document the
    deferred behavior explicitly in the public API contract.

## Reliability

## Architecture policy

- [ ] **P2 — Barrel mapping and barrel exemptions are inconsistent**
  - Location: `src/architecture/validate-source-test-mapping.mjs:21-30`
  - Strict source/test mapping requires a test for every source `.mjs`, while
    monolith policy exempts pure barrels.
  - Either exclude pure barrels from mandatory mirroring or document and test
    the deliberate requirement consistently across policy gates.

## Cross-platform behavior

- [ ] **P2 — Windows paths may be misclassified on non-Windows hosts**
  - Location: `src/testing/validate-focused-paths.mjs:5-7`
  - Workspace containment uses the host platform’s path semantics even when a
    supplied path is Windows-formatted.
  - Select Windows or POSIX path operations based on the supplied path format,
    consistently with `sourcePathForTest`.

## Tests

- [ ] **P2 — Stop-ordering regression coverage is incomplete**
  - Locations: `tests/public/run-toolkit-preflight.test.mjs:19-25` and
    `tests/public/run-toolkit.test.mjs:30-41`
  - Existing tests cover mapping drift, but do not assert whether test execution
    must stop when architecture drift is found.
  - Add an invoked `runTest` spy and assert the chosen lifecycle behavior.

## Review notes

- CodeScope reported no security, performance, or documentation issues.
- No CodeScope ignore is appropriate yet; each finding requires a code,
  contract, or test decision.

## Additional CodeScope review findings

- [ ] **P1 — Malformed architecture results can crash preflight**
  - Location: `src/public/run-toolkit-preflight.mjs:10-12`
  - Validate mapping results before reading `missingTests` or `orphanTests`,
    and convert malformed or rejected checks into the documented setup failure.

- [ ] **P1 — Coverage candidate usability is only partially validated**
  - Location: `src/coverage/is-usable-coverage-report.mjs:4-7`
  - A report with malformed branch or function counters may be selected before
    a later valid report. Define complete usability semantics for all required
    metrics and test malformed-first/valid-later selection.

- [ ] **P1 — Child stream interfaces are assumed without validation**
  - Location: `src/processes/monitor-child-process.mjs:15-25`
  - Missing stdout or stderr objects can throw while listeners are attached.
    Define a stable startup failure and cover malformed child objects.

- [ ] **P2 — Terminal command precedence is undefined**
  - Location: `src/arguments/parse-arguments.mjs:10-13`
  - Define whether `--help` and `--version` take precedence over other
    arguments, then document and test combinations with managed options.

- [ ] **P2 — Mixed Windows/POSIX coverage paths may normalize incorrectly**
  - Location: `src/coverage/normalize-path.mjs:4-15`
  - Determine path flavor from both operands and add mixed-style path fixtures.

- [ ] **P2 — Workspace path redaction is overbroad**
  - Location: `src/processes/output/normalize-output.mjs:9-10`
  - Restrict redaction to path-component boundaries so unrelated words and
    longer path prefixes are not altered.

- [ ] **P2 — Source/test mapping traversal lacks directory exclusions**
  - Location: `src/architecture/validate-source-test-mapping.mjs:4-17`
  - Apply the standard dependency, VCS, coverage, build, and generated-tree
    exclusions and add correctness/scalability validation.

- [ ] **P2 — Direct API and CLI argument behavior may differ**
  - Location: `src/public/run-toolkit.mjs:20-21`
  - Define direct `runToolkit` argument normalization, including separator
    handling, and add parity tests against CLI-parsed arguments.

- [ ] **P2 — Process stream boundary cases lack coverage**
  - Location: `tests/processes/monitor-child-process.test.mjs`
  - Cover split UTF-8 chunks, missing streams, late data, and close ordering.

## Checklist maintenance notes

- Add release validation for packed-artifact smoke installation and metadata,
  lockfile, README, SPEC, and release-note consistency.
- The lifecycle wording in `spec/cli.md` must be reconciled with the
  architecture-gate findings before any item is marked resolved.

## Second follow-up CodeScope findings

- [ ] **P1 — Coverage counters may be semantically invalid**
  - Location: `src/coverage/is-usable-coverage-report.mjs:4-7`
  - A structurally valid report may contain non-finite, negative, string, or
    sparse counters that usability and parsing interpret inconsistently.
  - Validate finite non-negative counters and required map consistency, then
    add malformed-counter regressions.

- [ ] **P1 — Stale valid coverage artifacts can be accepted**
  - Location: `src/coverage/read-coverage.mjs:15-31`
  - A structurally valid report from an older run may be accepted if cleanup or
    report replacement is incomplete.
  - Define freshness/ownership semantics and test stale-candidate behavior.

- [ ] **P1 — Child monitor setup exceptions are not normalized**
  - Location: `src/processes/monitor-child-process.mjs:14-25`
  - Exceptions while attaching listeners or creating the timeout can escape
    instead of producing a stable startup failure.
  - Validate the child interface and guard setup with malformed-child tests.

- [ ] **P2 — Error handling can lose late process diagnostics**
  - Location: `src/processes/monitor-child-process.mjs:17-21`
  - Settling immediately on an error event can discard output delivered before
    close. Decide whether to drain streams or explicitly document the behavior.

- [ ] **P1 — Diagnostic redaction has resource and evidence risks**
  - Location: `src/processes/output/normalize-output.mjs:9-10`
  - Global regex replacement can perform excessive matching for long paths and
    alter unrelated diagnostic text. Replace with bounded path-component logic.

- [ ] **P2 — Filesystem-root coverage paths are not fully covered**
  - Location: `src/coverage/normalize-path.mjs:9-15`
  - POSIX, Windows, and UNC root paths may produce incorrect containment or
    doubled separators. Add explicit root-directory fixtures.

- [ ] **P2 — Focused symlinks may escape workspace containment**
  - Location: `src/testing/validate-focused-paths.mjs:5-22`
  - Lexical containment can pass a symlink that resolves outside the workspace.
  - Define symlink policy and test realpath containment where appropriate.

- [ ] **P2 — Mapping traversal is not fully bounded or deterministic**
  - Location: `src/architecture/validate-source-test-mapping.mjs:4-17`
  - In addition to exclusions, traversal needs cycle/repeated-entry protection,
    bounded resource use, and sorted output for stable diagnostics.

- [ ] **P2 — Injected collaborators can alter policy defaults**
  - Location: `src/public/resolve-toolkit-options.mjs:16-17`
  - Supplying an unrelated collaborator can silently change workspace-inspection
    behavior. Make policy defaults explicit and test injection combinations.

- [ ] **P2 — Coverage cleanup and stale-artifact tests are incomplete**
  - Location: `tests/coverage/read-coverage.test.mjs:16-36`
  - Add tests proving all candidates are removed, cleanup failures stop safely,
    and stale candidates cannot be selected unexpectedly.

## Third follow-up CodeScope findings

- [ ] **P1 — Coverage maps and counters can be semantically inconsistent**
  - Locations: `src/coverage/is-usable-coverage-report.mjs:4-7` and
    `src/coverage/coverage.mjs:13-24`
  - Reports with inherited, extra, missing, or mismatched map/counter keys may
    be selected or interpreted inconsistently.
  - Define required relationships and missing-map semantics, share validation
    between usability and parsing, and test complete-looking inconsistent data.

- [ ] **P1 — Public orchestration leaks unexpected exceptions**
  - Location: `src/public/run-toolkit.mjs:13-29`
  - Exceptions from injected collaborators or pipeline stages can escape as
    rejected promises instead of stable wrapper exit codes.
  - Normalize unexpected failures to the documented internal/stage result and
    add rejection-path tests.

- [ ] **P1 — Direct API forwards unnormalized CLI arguments**
  - Location: `src/public/run-toolkit.mjs:20-23`
  - Direct callers can forward separators, wrapper-owned flags, or conflicting
    in-band options differently from CLI callers.
  - Share normalization and validation between entrypoints and add exact
    argument-parity tests.

- [ ] **P1 — Diagnostic redaction is not platform-aware**
  - Location: `src/processes/output/normalize-output.mjs:9-10`
  - Case-insensitive global replacement can alter unrelated POSIX diagnostics
    and mislead users about the original output.
  - Use platform-aware, boundary-aware, bounded path redaction.

- [ ] **P2 — Focused source mapping mishandles some Windows paths**
  - Location: `src/testing/source-path-for-test.mjs:15-25`
  - Drive-letter, UNC, and mixed-separator forms are not normalized consistently
    on non-Windows hosts.
  - Centralize path-flavor detection and add representative mapping fixtures.

- [ ] **P2 — Mapping traversal lacks explicit operational limits**
  - Location: `src/architecture/validate-source-test-mapping.mjs:4-17`
  - Traversal needs exclusions, cycle/repeated-entry protection, deterministic
    ordering, file/depth/resource limits, and stable limit failures.

- [ ] **P2 — Packed-install runtime behavior lacks an executable smoke test**
  - Location: `tests/public/run-toolkit.test.mjs:1-133`
  - Unit injection tests do not prove that a packed consumer can resolve the bin,
    bundled Jest, and bundled Oxlint.
  - Add a clean temporary consumer smoke test covering `--version`, a minimal
    test, lint, and bundled/consumer dependency layouts.

- [ ] **P2 — Coverage cleanup/freshness validation is incomplete**
  - Location: `tests/coverage/read-coverage.test.mjs:16-36`
  - Add tests proving every candidate is removed, cleanup failures stop safely,
    and stale valid candidates cannot survive or be selected.

- [ ] **P2 — Generated-file treatment differs across policy gates**
  - Locations: `src/architecture/validate-source-test-mapping.mjs`,
    `src/workspace/policy/discover-policy-sources.mjs`,
    `src/monolith/measure-file.mjs`, `README.md`, and `spec/cli.md`
  - Generated files are exempt from monolith limits, but their treatment in
    mapping and Istanbul policy discovery is not consistently documented.
  - Decide one rule across mapping, policy discovery, linting, and monolith
    validation, then document and test it.

## Release validation additions

- [ ] Pack the package, install the tarball into a clean temporary consumer,
      run `eliware-test --version`, a minimal test command, and lint.
- [ ] Verify consumer-first and bundled fallback resolution for Jest and Oxlint.
