# 4.0.0 Release Readiness Checklist

This is the single working checklist for bringing `@eliware/test` to 4.0.0.
Items are ordered by release risk. Record commit or validation evidence when completing each item.

Baseline reference: `1905c06` (`remove out of scope checks from ci`)

## Scope and explicit exclusions

- [x] Keep Node.js 26, native ESM, and the thin CLI launcher; breaking-change
      approval remains a release gate.
- [x] Preserve the full inherited child-process environment; sanitized
      environments are explicitly excluded.
- [x] Do not restore audit, build, typecheck, or pack application features.
- [x] Do not add backwards-compatibility shims or fallback implementations.
- [x] Keep pure barrels exempt from size limits, but require source/test pairs.

## Milestone 1: focused execution and mapping

- [x] Use one canonical focused-path predicate for parsing, validation, strict Jest selection, and focused coverage; committed in
      `8cdeee9` with `.cts`/`.mts` matcher coverage.
- [x] Document the narrower architecture scope: `src/**/*.mjs` pairs only with
      canonical `tests/**/*.test.mjs`; focused Jest paths may use other supported
      extensions. Clarified in `f445d7b6b31657d85b16503a119f85b1fb75e8e8`.
- [x] Parse Jest value options consistently, including equals forms, without mistaking option values for test paths; committed in
      `a61b0f721251514abaca0d9ac41dd3960d569d74`.
- [x] Reject every missing concrete focused path before starting Jest, including
      paths outside the workspace; committed in `42233d7b73dc61df8d58b7b4beb80d3bfc7121d6`.
- [x] Treat missing `src/` or `tests/` roots as mapping drift, not workspace
      setup errors; committed in `0837cabc0b36ced7d446572777a5e9b81a5780c9`.
- [x] Report mapping drift while still allowing developers to run tests; apply
      the nonzero mapping result only in the release-enforcement gate.
- [x] Bound and deduplicate mapping diagnostics; the formatter implementation
      and regression are recorded in `270d9156128d54e567013cf45394d4209fd9ebf7`.
- [x] Ensure the mapping formatter itself applies deterministic bounds and
      deduplication, not only its callers; committed in
      `270d9156128d54e567013cf45394d4209fd9ebf7`.
- [x] Disposition: `.spec.mjs` is intentionally non-canonical and is reported as
      an orphan rather than merged with `.test.mjs`; documented in `f445d7b`.
- [x] Define the supported source/test extensions explicitly in `spec/coverage.md`.
- [x] Add regression tests for the focused-path and mapping cases completed so
      far; remaining release-platform evidence is tracked below.
- [x] Cover Jest equals-form/value-bearing options and document the supported
      option grammar in the focused-path tests and CLI specification.
- [x] Verify focused-path mappings cannot escape the workspace root for both
      test validation and coverage mapping.
- [x] Apply workspace-containment checks to focused `collectCoverageFrom` source
      candidates; committed in `74a3ec834084c75165d5bd9fdffbfd21f7bc32da`.

## Milestone 2: coverage correctness

- [x] Disposition: empty or structurally unusable Istanbul candidates advance
      to the next candidate by contract; existing tests cover this behavior.
- [x] Ensure incomplete counter maps cannot be accepted as authoritative;
      committed in `1c8ea9ae2956ab3855ba1c7450cbd95bf72d5072`.
- [x] Disposition: empty instrumented candidates are intentionally structurally
      unusable and advance to the next report; read-coverage tests cover this.
- [x] Make malformed coverage candidates fall through while preserving genuine
      filesystem failures; permission-error regression committed in
      `30783e108f626c8daeee894b798a690f0699545a`.
- [x] Require complete Jest text-report evidence before text fallback is used;
      tightened with lookalike-table regressions in `69be0c8bb5c64d8a0e9f77d68be28da6570632f2`.
- [x] Reject focused coverage mappings that escape the workspace root in
      `74a3ec834084c75165d5bd9fdffbfd21f7bc32da`.
- [x] Add regression tests for the completed coverage evidence, fallback, and
      mapping edge cases; remaining coverage semantics are explicitly noted.
- [x] Define focused-coverage fallback diagnostics as debug-only; implementation
      and test are in `8bc4528a170dcd714633142de289b6e15c3c32e2`.

## Milestone 3: diagnostics and subprocess behavior

- [x] Normalize ANSI sequences and whitespace before deduplicating diagnostics in
      `100842f1638b4c93fc1769db411199188f33343f`; workspace-path normalization
      in failure output is committed in `d4ea4f07b64bc0968801b199000d6e99511f431a`.
- [x] Filter ANSI-colored coverage noise; `normalizeDiagnostics` strips ANSI
      before the existing coverage-noise predicates.
- [x] Preserve stdout/stderr arrival ordering; the shared bounded buffer already
      does this and is covered by `f74b41e891059e98f87c2fa51208221ac18e552c`.
- [x] Prevent duplicate child-process error messages; committed with regression
      coverage in `d4c918d216b78989a049e9124444dec8a7b97eba`.
- [x] Set `shell: false` explicitly for child processes; committed in
      `323046a6299ba4e7f68a8d438f022c28b2c47bec`.
- [x] Verify timeout cleanup and termination when children never close; covered
      by the monitor fake-timer regression.
- [x] Add environment and argument-array regression coverage; child spawning
      and inherited-environment tests cover the contract.
- [x] Give Jest and Oxlint runtime resolution equivalent injectable test seams;
      committed in `3d72870a382e64af7d4bf6d30c41688b13e9e637`.
- [x] Disposition: bundled runtime fallback is required by the contract because
      Jest and Oxlint are shipped runtime dependencies; no removal is needed.
- [x] Add a regression proving incomplete Istanbul counter maps are not accepted
      as authoritative coverage in `1c8ea9ae2956ab3855ba1c7450cbd95bf72d5072`.

## Milestone 4: policy and architecture

- [x] Disposition: no implementation change required for malformed exemption
      regex syntax; glob metacharacters are escaped before `RegExp` creation.
- [x] Disposition: exemption glob syntax is escaped before regex construction;
      no separate syntax validator is required.
- [x] Make pure-barrel detection work for valid semicolon-free and multiline
      import/export modules; committed in `1b15587a086c1f24a06d0467feeb6fc211d6247c`.
- [x] Define and test the boundary: the CLI enables monolith enforcement, while
      direct `runToolkit` callers opt in; documented in `spec/cli.md` and
      committed in `7235a40d5b018924171b1e39b8a4687f5a82b4ff`.
- [x] Document and test generated-file detection boundaries in
      `0f9f74290acbf6509848f2b3d55a30850f109f16`.
- [x] Confirm the current source/test trees have exactly one canonical pair; the
      validator regression covers the bijection and barrel case.
- [x] Review found no unpaired implementation files, obsolete fixtures, duplicate
      tests, or compatibility shims; source and test trees each contain 99 files.
- [x] Keep orchestrators thin and responsibilities split into focused modules;
      all source modules are under the 100-line policy limit.
- [x] Complete the repository inventory review; no additional unreachable or
      obsolete artifacts were identified.

## Milestone 5: documentation consistency

- [x] Add monolith enforcement to the lifecycle documented in `spec/cli.md`;
      committed in `0f9f74290acbf6509848f2b3d55a30850f109f16`.
- [x] Resolve `test/`, `tests/`, and `spec/` policy differences by distinguishing
      broad focused-path recognition from strict mapping in `7e33b0e`.
- [x] State clearly that barrel/generated-file size exemptions do not remove
      source/test mapping requirements in `spec/cli.md`.
- [x] Implement the documented focused-coverage debug fallback in
      `8bc4528a170dcd714633142de289b6e15c3c32e2`.
- [x] Update `AGENTS.md` so audit, typecheck, and pack are clearly external or
      out of scope; committed with package script cleanup in `3d60b5f65c839921f6d11d254efb9c45d91ea3aa`.
- [x] Label historical audit/pack references in `RELEASE_NOTES.md` clearly in
      `c3ce2a01dbce4c1d4a07e5a3436fe0d2e7d3245d`.
- [x] Align README, SPEC, `spec/*.md`, and release-note scope language; the
      historical validation clarification is in `c3ce2a0`.
- [x] Document the explicit monolith-policy boundary: normal CLI runs enforce
      monolith limits, while pure barrels remain size-exempt but still mapped.

## Milestone 6: release evidence and metadata

- [ ] Await explicit maintainer approval for the 4.0.0 breaking-change contract;
      no version bump is made without that approval.
- [ ] After approval, update `package.json` and `package-lock.json` to 4.0.0.
- [ ] After approval, add complete 4.0.0 release notes.
- [x] Explicitly record that exports and declarations are intentionally absent
      in `spec/migration-and-release.md`, committed in `3dc61a84bd4b58e5e75e455171c8aee09881b281`.
- [x] Explicitly label historical audit, pack, and typecheck references as
      historical or external rather than current application requirements.
- [x] Verify current package metadata, lockfile synchronization, and packed
      contents with `npm ci --dry-run` and `npm pack --dry-run`; 4.0.0 version
      approval remains pending.
- [x] Reconcile repository scripts and `AGENTS.md` with the out-of-scope status
      of audit, typecheck, and pack in `3d60b5f65c839921f6d11d254efb9c45d91ea3aa`.
- [x] Run the default suite with genuine independent 100×4 coverage.
- [x] Run lint with warnings denied.
- [x] Validate focused tests and mapping-drift behavior.
- [ ] Collect Node 26 Ubuntu and Windows CI evidence; the workflow matrix is
      configured in `.github/workflows/nodejs.yml` after `1905c06`, and the
      current Windows/Node 26 host passes locally, but remote execution evidence
      remains pending.
- [ ] After the approved metadata commit, record its exact SHA and confirm a
      clean worktree.
- [ ] After remote CI and approval, complete preflight, publication,
      verification, and rollback records.
- [x] Verify that the package script surface matches the approved scope; the
      out-of-scope `pack` script was removed in `3d60b5f65c839921f6d11d254efb9c45d91ea3aa`.

## Commit points

- [x] Commit mapping behavior with matching tests in `6b4cd180caacba9a6f79ec64a0c0eb98fb9d6cc4`.
- [x] Commit coverage correctness with matching tests across `1c8ea9a`,
      `69be0c8`, and related focused coverage commits.
- [x] Commit diagnostics and subprocess hardening with matching tests across
      `d4ea4f0`, `100842f`, `f74b41e`, and `323046a`.
- [x] Commit policy/architecture cleanup with matching tests across `0837cab`,
      `1b15587`, `0f9f742`, `3d72870`, and `7235a40`.
- [x] Commit documentation alignment in `c3ce2a0` and `7e33b0e`.
- [ ] Commit approved 4.0.0 metadata and release notes after maintainer approval.
- [ ] Make the final release-evidence commit only after remote checks pass.

## Final release gate

- [ ] No unresolved P0/P1 findings remain.
- [ ] All P2/P3 findings are fixed, documented, or explicitly accepted.
- [x] `npm test` passes with 100×4 coverage; latest validation completed after
      `3dc61a8`.
- [x] `npm run lint` passes with zero warnings; latest validation completed after
      `3dc61a8`.
- [ ] CI passes on Node 26 for Ubuntu and Windows.
- [ ] The committed worktree is clean.
- [ ] Release approval is recorded before any tag, push, publish, or deploy.
