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
The `audit`, `pack`, `build`, and `typecheck` scripts are optional. When a
consumer defines any of them, each must be nonempty and valid. The normal
`eliware-test` run executes defined scripts after the routine validation
stages; a missing or invalid defined script fails the package-check stage.

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

CI provides Ubuntu and Windows coverage in this repository's workflow. Lint
warnings block publication, and release validation confirms the configured
platform checks, package metadata, and self-test results before publication. No
tag, publish, push, or deployment is implied by this specification.

Windows package-script execution uses the documented conventional Node/npm
installation layout. Release evidence identifies commands that were actually
run; an unreported command is not evidence of either success or failure.
If the supported npm launcher is unavailable or cannot be started, validation
fails with an explicit npm-unavailable diagnostic rather than passing.
