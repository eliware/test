# Migration, fixtures, and release

## Fixtures, artifacts, migration, and release

The repository's `test-fixtures/` tree contains workspace fixtures used to
exercise discovery and policy behavior; it is excluded from source/test
bijection. `bin/` contains the supported CLI entrypoint and is likewise
outside that bijection.

There are no legacy compatibility barrels; new code must import canonical
implementation modules directly. Generated `coverage/`, `coverage.json`,
`.nyc_output/`, `test-results/`, build output, package archives, and debug
logs should be ignored. Ignoring generated output must never
conceal a coverage gap.

Consumer migration removes direct Jest/Oxlint development dependencies unless
they are required by runtime code or a separately documented workflow,
installs `@eliware/test`, updates `test` and `lint`, runs npm install, reviews
the lockfile, and keeps specialized test tiers separate. Separate direct
Jest/Oxlint commands remain the consumer's responsibility.
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

Windows package-script execution uses the documented conventional Node/npm
installation layout. Release evidence identifies commands that were actually
run; an unreported command is not evidence of either success or failure.
