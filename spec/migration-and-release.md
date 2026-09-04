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
