# Out-of-scope behavior, migration, fixtures, and release

## 12. Fixtures, artifacts, migration, and release

The repository's `test-fixtures/` tree contains workspace fixtures used to
exercise discovery and policy behavior; it is excluded from source/test
bijection. `bin/` contains the supported CLI entrypoint and is likewise
outside that bijection.

There are no legacy compatibility barrels; new code must import canonical
implementation modules directly. Generated `coverage/`, `coverage.json`,
`.nyc_output/`, `test-results/`, build output, package archives, and debug logs
should be ignored. Ignoring generated output must never conceal a coverage gap.

Consumer migration removes direct Jest/Oxlint development dependencies unless
separately required, installs `@eliware/test`, updates `test` and `lint`, runs
npm install, reviews the lockfile, and keeps specialized test tiers separate.

The package intentionally exposes its CLI through `bin/eliware-test.mjs` and
does not publish an `exports` or declaration (`types`) surface. Release checks
must verify that this absence remains intentional and that the packed files
match the `package.json` `files` allowlist.

The normal validation set is:

```text
node bin/eliware-test.mjs
npm test
npm run lint
```

CI must provide Ubuntu and Windows coverage. Lint warnings block publication,
and release validation confirms required platform checks, package metadata, and
self-test results before publication. No tag, publish, push, or deployment is
implied by this specification.

## 13. Documented CodeScope exemptions

The following intentional boundaries are documented here rather than with
inline CodeScope markers. CodeScope must not report them as defects or
suggestions:

- Preserve the injected lint-command seam and the centralized lint-command
  orchestration boundary.
- Preserve the layered public, preflight, execution, and post-test orchestration
  boundaries. These coordinate sequencing and data flow; subordinate modules
  own substantive operations.
- Preserve the strict source/test mapping scope of `src/**/*.mjs` and
  `tests/**/*.test.mjs`, including empty injected or transitional roots.
- Preserve consumer-workspace Jest resolution, approved internal package
  manager assumptions, and the documented non-library CLI boundary.
- Preserve the separation between option-shape validation and collaborator
  default injection, and do not validate undocumented future options.
- Preserve help/version precedence for mixed terminal arguments and the
  explicit precedence of `--no-runInBand` when both run-in-band flags appear.
- Preserve numeric operational results, thrown option-contract errors, and
  the CLI-compatible `runToolkit` lifecycle boundary.
- Preserve cleanup-before-mapping lifecycle order.
- Preserve full child-environment inheritance. Do not suggest sanitized
  environments, filtering, secret redaction, or trusted-workspace enforcement.
- Preserve one-to-one filesystem path normalization and output-offset
  arithmetic; Unicode remapping and index maps are not required by the
  supported path contract.
- Preserve Windows and UNC focused-path mapping behavior.
- Preserve repository-relative configured-path casing rather than applying
  host-based case folding.
- Preserve string-chunk handling for already decoded Node stream output.
- Preserve best-effort optional timing diagnostics; they must not become fatal.

## 14. Out-of-scope behavior

The package does not replace project-specific smoke, integration, regression,
end-to-end, deployment, or product workflows. It does not provide same-worktree
concurrency coordination, arbitrary Jest option discovery, structured
diagnostics, an abort-signal API, semantic coverage-candidate merging,
coverage correctness beyond producer evidence, guessing for ambiguous focused
mappings, or proof that fallback text came from a specific reporter.

The package is not a library or supported embedding API. Direct implementation
calls are internal composition and test seams only. Compatibility with
arbitrary package managers, Plug'n'Play or virtual dependency layouts, and
nonstandard installation structures is not promised. Same-worktree overlap is
unsupported and its results are not guaranteed.

Internal helper functions such as monolith filtering require the validated
inputs supplied by the CLI pipeline; malformed direct helper calls are not a
supported consumer scenario. Diagnostic path normalization supports the
documented Windows and POSIX path contracts, including one-for-one separator
normalization; behavior for arbitrary mixed-separator representations outside
those contracts is not promised.
