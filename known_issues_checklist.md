# Known Issues Checklist

Source: `codescope release` run on 2026-09-04. The release verdict was
`block`.

## Correctness and lifecycle

## Reliability

## Architecture policy

## Cross-platform behavior

## Tests

## Review notes

- CodeScope reported no security, performance, or documentation issues.
- No CodeScope ignore is appropriate yet; each finding requires a code,
  contract, or test decision.

## Additional CodeScope review findings

- [ ] **P1 — Coverage candidate usability is only partially validated**
  - Location: `src/coverage/is-usable-coverage-report.mjs:4-7`
  - A report with malformed branch or function counters may be selected before
    a later valid report. Define complete usability semantics for all required
    metrics and test malformed-first/valid-later selection.

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

- [ ] **P1 — Diagnostic redaction has resource and evidence risks**
  - Location: `src/processes/output/normalize-output.mjs:9-10`
  - Global regex replacement can perform excessive matching for long paths and
    alter unrelated diagnostic text. Replace with bounded path-component logic.

- [ ] **P2 — Focused symlinks may escape workspace containment**
  - Location: `src/testing/validate-focused-paths.mjs:5-22`
  - Lexical containment can pass a symlink that resolves outside the workspace.
  - Define symlink policy and test realpath containment where appropriate.

- [ ] **P2 — Mapping traversal is not fully bounded or deterministic**
  - Location: `src/architecture/validate-source-test-mapping.mjs:4-17`
  - In addition to exclusions, traversal needs cycle/repeated-entry protection,
    bounded resource use, and sorted output for stable diagnostics.

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
