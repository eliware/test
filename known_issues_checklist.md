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

## Checklist maintenance notes

- Add release validation for packed-artifact smoke installation and metadata,
  lockfile, README, SPEC, and release-note consistency.
- The lifecycle wording in `spec/cli.md` must be reconciled with the
  architecture-gate findings before any item is marked resolved.

## Second follow-up CodeScope findings

- [ ] **P1 — Stale valid coverage artifacts can be accepted**
  - Location: `src/coverage/read-coverage.mjs:15-31`
  - A structurally valid report from an older run may be accepted if cleanup or
    report replacement is incomplete.
  - Define freshness/ownership semantics and test stale-candidate behavior.

## Third follow-up CodeScope findings

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
