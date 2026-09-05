# `@eliware/test` contributor guidance

Applies to: repository-wide.

## Repository contributors

This repository provides the single Eliware baseline for routine Jest
testing, coverage enforcement, and Oxlint validation. Keep project-specific
smoke, integration, regression, and end-to-end workflows in consuming
repositories.

The supported public interface is the CLI command `eliware-test`; internal
structured toolkit results and source modules are implementation seams, not a
consumer runtime API. The v5 package publishes the CLI, `src/`, `specs/`,
README, specification overview, license, and release notes. Validate changes
with `npm test`, `npm run lint`, `npm run check:docs`, `npm audit`, and
`npm run pack` as applicable;
keep package metadata, lockfiles, documentation, examples, and release notes
synchronized.

## Intentional deviations

- This repository self-hosts its validation through `node bin/eliware-test.mjs`
  because the package cannot install itself as its own development dependency.
  Consumers must use the standard `eliware-test` and `eliware-test --lint`
  scripts described below.

## Rules

- Use Node.js 26, native ESM, and `.mjs` source and test files.
- Keep Jest and Oxlint as npm runtime dependencies.
- Keep package metadata, lockfile, README, release notes, and packed files
  synchronized. If an exports or declaration surface exists, keep it
  synchronized too; this package intentionally publishes neither.
- Use Node.js child-process APIs and argument arrays; do not use shell
  pipelines, `grep`, shell quoting, or platform-specific executable assumptions.
- Preserve useful failure diagnostics and keep successful output concise.
- Bound subprocess output, deduplicate repeated diagnostics, and normalize
  workspace paths in user-facing output.
- Keep the fixed coverage-fallback diagnostic opt-in through
  `ELIWARE_TEST_DEBUG=1`; it does not expose forwarded arguments or arbitrary
  values. Do not add debug output to normal runs.
- Preserve focused test paths and reject missing paths before invoking Jest;
  never silently fall back to the full suite.
- Use strict path selection when an invocation contains only focused test
  paths, and keep the selection behavior covered by regression tests.
- Scope coverage to mirrored focused source files when they map unambiguously;
  retain broad enforcement for unmappable paths.
- Exclude dependency, VCS, coverage, build, and test-result directories from
  discovery and linting by default.
- Enforce statements, branches, functions, and lines independently.
- Treat zero-valued text coverage and missing usable JSON coverage as gaps;
  fall back to the Jest text report when JSON has no instrumented entries.
- Invoke Oxlint with warnings denied so warning-level findings fail validation.
- Run Jest in-band by default; support `--no-runInBand` as an explicit
  diagnostic opt-out.
- Support `--ignore-100x4` only as an explicit coverage-enforcement opt-out;
  tests, lint, and coverage collection still run.
- Do not hide real coverage gaps with ignore comments.
- Run the deterministic repository-convention validator; use only exact,
  documented path exceptions for requirements a repository genuinely cannot
  satisfy.

## Consumer migration

The following applies to projects consuming the published CLI; the repository
rules above describe this package's own source and tests.

1. Remove direct Jest and Oxlint dev dependencies unless required by runtime
   code or a separately documented workflow.
2. Install `@eliware/test` as a development dependency.
3. Set `test` to `eliware-test` and `lint` to `eliware-test --lint`.
4. Run `npm install` and review the lockfile.
5. Run specialized smoke, integration, regression, and E2E checks separately.
6. Run `npm run typecheck` when the project defines that script or its
   TypeScript workflow requires it.

## Validation

```text
npm test
```

`npm test` is the primary full validation command and already includes lint,
monolith enforcement, and defined package-script checks. Use
`node bin/eliware-test.mjs` to exercise the repository-local executable
directly, or `npm run lint` for standalone lint/policy diagnostics.

Normal validation uses `npm test`, which runs defined consumer `audit`, `pack`,
`build`, and `typecheck` scripts after the normal stages. Use `npm run <script>`
only to isolate a failing package check; missing scripts are skipped.

Use `eliware-test --help` for the supported command forms. When invoking via
npm, pass Jest options after `npm test --`. Use `eliware-test --version` to
verify the installed package version without starting validation.
Use `eliware-test --ignore-100x4` or `eliware-test --ignore-monolith-limits`
only for diagnostic or transitional runs; the latter skips only monolith
enforcement while tests, coverage collection, and lint still run.

Follow the pre-release and release runbooks before publication. Never
tag, publish, push, or deploy without explicit authorization.
