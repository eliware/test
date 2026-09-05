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
If the consumer defines `audit`, `pack`, `build`, or `typecheck` scripts, the
normal `eliware-test` run executes them after the routine validation stages;
undefined scripts are skipped.

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

The normal `npm test` command already runs lint after Jest and coverage.
Standalone lint is therefore redundant for ordinary validation and is needed
only when diagnosing lint independently.

CI must provide Ubuntu and Windows coverage. Lint warnings block publication,
and release validation confirms required platform checks, package metadata, and
self-test results before publication. No tag, publish, push, or deployment is
implied by this specification.

## 13. Out-of-scope behavior

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

Source/test architecture mapping intentionally skips symbolic links; supported
internal projects use ordinary files and directories for the canonical `src/`
and `tests/` trees. Timeout escalation uses the supported Node child-process
termination contract; guaranteed descendant cleanup across arbitrary child
trees and platforms is outside the release contract. Sanitized environment
mode is also out of scope because full inheritance is required for the
supported internal projects.
