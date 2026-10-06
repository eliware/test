# Usage

Use Node.js 26 (`>=26 <27`) and npm 12 or later.
The CLI checks npm before validation.
It stops when it cannot read the npm version or when npm is too old.
`--help` and `--version` do not need this check.
Install `@eliware/test` as a development dependency:

```text
npm install --save-dev @eliware/test
```

Set the shared scripts and profiles in `package.json`:

```json
{
  "scripts": {
    "test": "eliware-test",
    "lint": "eliware-test --lint",
    "audit": "eliware-test --audit",
    "format": "eliware-test --format",
    "format:check": "eliware-test --format-check"
  },
  "eliware": {
    "id": "E-0",
    "apply": ["general"]
  }
}
```

List every applicable profile in `eliware.apply`.
The CLI does not infer profiles.
Package installation does not add these scripts.
Run `eliware-test --help` to see modes and options.

A successful aggregate run prints `Aggregate validation passed.`
Tool modes print their own result.

## Configuration

Set profiles in `package.json.eliware.apply`.
Record approved rule exemptions in `package.json.eliware.exempt`.
Each exemption needs a rule ID, reason, approver, approval time, and expiry.
The CLI does not infer profile applicability from files or dependencies.

`package.json.eliware` has `id`, `apply`, and optional `exempt` keys, in that order.
The CLI checks for `../docs/repo-map.yaml` on each run.
When the map exists, it sets the package ID, description, keywords, and profiles.
The README description must match the package description.
When the map is absent, package metadata sets the README description and rule ID namespace.
Every rule ID under `specs/` must use the assigned repository number.
Author, repository URL, homepage, Node.js engine, and keyword rules always apply.

## Common commands

Shared validation needs `.github/workflows/ci.yaml` and `.knit/deploy.yaml`.
The npm and GHCR profiles also need `.github/workflows/publish.yaml`.
Do not add other workflow YAML files under `.github/workflows/` or `.knit/`.
Each allowed workflow must contain one YAML document and pass its profile checks.
The CLI checks GitHub Actions and Knit files separately.

For `ghcr-published`, document the image in the README `Usage` section.
Use the markers `Image`, `Pull command`, `Supported tags`, and `Deployment boundary`.
Use the exact package version in the pull command.
If the workflow pushes `latest`, describe it as a mutable alias.
Do not use that alias as a release or deployment identity.
The check validates the markers. Owners must confirm meaning and deployment steps.

Run these commands:

```text
eliware-test --help
eliware-test --version
eliware-test
eliware-test --lint
eliware-test --format-check
eliware-test --audit
```

Run `npm test`, `npm run lint`, `npm run format`, `npm run format:check`, and
`npm run audit` from the source checkout.
Run `npm run pack` from this checkout or an installed package directory.
The `--pack` mode is available only with the `npm-published` profile.
That profile also requires the `npm run pack` script.

## Smoke test

Run smoke from this checkout or an installed package directory:

```text
npm run smoke -- --target <path>
```

The target must be an existing, prepared consumer repository.
Smoke does not create or prepare the target.
It packs this package and installs that tarball in the target.
Then it runs the target's `npm test` and restores captured package paths.
Use a disposable consumer copy.
Smoke restores the manifest, lockfiles, installed package, and local executable shims.
Other files created by consumer tests remain in the target.
It snapshots only the exact paths that it replaces.
It does not snapshot ancestor directories.
On Windows, it restores directory links as junctions.
It rejects captured file links before it changes files.
It reports a backup path if restore fails.
It does not touch system-wide links or junctions.
The outdated check omits only the unpublished smoke candidate.
All other packages use the normal registry check.
Prepare the target and install its dependencies first.

## Validation stages

Aggregate validation runs applicable stages in this order:

1. lint
2. format check
3. npm audit
4. npm outdated
5. package check
6. typecheck for libraries
7. build for web applications
8. convention checks
9. Jest and coverage

The CLI runs every enabled stage and convention check before Jest.
It skips Jest if any earlier stage fails.
Convention checks can read completed stage results from the run cache.
The CLI reports all earlier failures and returns the highest failure code.

## Focused tests

Run one `.test.*` or `.spec.*` file under `tests/`:

```text
eliware-test tests/example.test.mjs
```

Put the test path before an optional `--` separator.
Only supported non-path Jest options may follow `--`.
The CLI rejects test paths after `--`.
Focused validation runs that test with applicable coverage, formatting, lint,
mirroring, and convention checks.
It maps `.mts` and `.cts` tests to `.mjs` sources.
It maps other supported extensions to the same source extension.
This mapping does not change the source mirror rule.
Every maintained `.mjs` source still needs one matching `.test.mjs` file.
Application coverage applies to production `.mjs` files.
In libraries, a `.d.ts` file must sit beside an `.mjs` source with the same base name.
The typecheck script must validate that declaration.
Each mirror test needs an executable Jest `test` or `it` declaration.
It must import its exact source module.
The syntax check ignores comments and strings.
Focused checks may read repository metadata beyond the selected test.

## Tool options

Each public tool mode has an argument allowlist.
Audit accepts only `--no-fund` and `--no-progress`.
Lint accepts only `--threads=<positive-count>`.
The CLI rejects options such as `--omit` because they change audit scope.
Pack has its own allowlist.
The CLI rejects wrapper settings that weaken required checks.

Put tool arguments after the mode or after `--`.
The CLI removes `--` before it forwards arguments.
It keeps each argument group's order.
For example, `eliware-test --audit --no-fund -- --no-progress` forwards both flags.
`--debug-timing` may appear once before a path or mode.
It may also run alone for aggregate validation.
Do not put it after `--`.
Prettier arguments cannot replace the selected mode, required config, or file scope.

```text
eliware-test --lint --threads=2
eliware-test --format
eliware-test --format-check
eliware-test --audit --no-fund
```

Run audit and pack scripts from the `@eliware/test` checkout.
Consumers use `eliware-test --audit` and, when applicable, `eliware-test --pack`.
The CLI does not accept npm script names as positional arguments.
Do not combine tool modes with a focused Jest path.
The CLI rejects missing focused paths.
Focused coverage uses the matching source when the mapping is clear.
The CLI checks only the selected source and test pair for lint and format.
It still runs safe convention checks.
Repository-wide convention checks and aggregate audit and pack stages stay skipped.

## Jest timing and limits

`--debug-timing` streams stage times and suite start, finish, and duration.
It does not write a separate Jest timing report after validation.
Programmatic callers must supply a writer to receive timing output.
Jest runs in-band by default.
The CLI forwards supported Jest options and values unchanged.
It does not treat an option value as a test path.
Each suite has a five-second runtime limit, even when it prints output.
A separate 15-second watchdog covers startup and pauses between suites.
These limits apply without `--debug-timing`.
On timeout, the CLI requests graceful stop.
It forces stop after one second and checks for child close.
If close does not occur, it reports an unconfirmed timeout.
The CLI cannot guarantee cleanup of every child process.
Captured child output has a one-million-character limit.

## Development boundaries

Give each module one contract or workflow.
A coordinator may select helpers, sequence them, and combine their results.
Split a policy or operation when it has a separate reason to change.
Give each new source module a mirrored test.
Keep coordinator tests on wiring and workflow results.
Test helper behavior in the helper's own test.

Repository input caches keep the last successful file content after a failed refresh.
This keeps the byte budget consistent.
A caller may receive an AST from its own source snapshot.
A later read cannot replace a newer cached parse.
Tests cover failed refreshes, eviction, retry, and out-of-order reads.
Line counting uses the shared cached repository reader.

## Compatibility boundaries

The CLI resolves Jest, Oxlint, Prettier, and npm from the consumer or supported
Node.js and Windows executable paths.
Workflow parsing normalizes YAML 1.1 `true` keys and equivalent runner values.
Profile checks resolve declared local file references inside the consumer.
General README checks do not treat arbitrary JSON or YAML `path` values as links.
Reject local paths that leave the repository.
Resolve external references by URI scheme, not as local files.
Git checks use Git metadata when available.
They use filesystem discovery for non-Git fixtures.
The symlink check reads Git index mode `120000`.
It rejects tracked file and directory links without resolving their targets.
Validation fails if it cannot read the Git index.

## README link validation

The general profile checks every `README.md`.
Supported links include inline links and images, full reference links, quoted
HTML `href` and `src` attributes, and HTTP, HTTPS, or `mailto` autolinks.
Inline destinations cannot contain spaces or a closing parenthesis.
The check ignores links in code spans and fenced code blocks.
It does not parse shortcut or collapsed references, other HTML links, or extensions.
Local links must point to files or directories in the checkout.
Local Markdown fragments must match a heading or HTML `id`.
The check does not validate fragments on local non-Markdown files.
HTTP and HTTPS links need a hostname and cannot contain credentials.
Mail links need an email address.
Cross-repository GitHub links need a full HTTPS URL with owner and repository.
The check does not fetch external links or fragments.
