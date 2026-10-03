# Usage

Use Node.js 26 (`>=26 <27`) and npm 12 or later. The `eliware-test` CLI checks
the active npm version before validation and stops with a diagnostic when it
cannot determine the version or finds an older npm. `--help` and `--version`
remain available independently. Install `@eliware/test` as a development
dependency with `npm install --save-dev @eliware/test`. Configure the consumer
repository to select its applicable profiles and expose the shared validation
commands through `package.json`:

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

Add every profile that applies to the repository to `eliware.apply`; profile
selection is explicit and is not inferred. Installing the package does not add
these scripts automatically. Use `eliware-test --help` for the supported CLI
modes, including linting, formatting, timing diagnostics, and focused Jest
execution.

The application profile requires runtime launchers and package entrypoints
under `bin/`, with application implementation under `src/`. CLI repositories
inherit this layout through the application profile. Libraries keep public
runtime entrypoints and optional TypeScript declaration files under `src/`.
For npm-published applications, the exact package allowlist includes `bin/`;
the `src/` entry covers library runtime code and declarations.

Run a focused `.test.*` or `.spec.*` suite with
`eliware-test tests/example.test.mjs`; put the test path before an optional `--`
separator. Arguments after `--` are forwarded to Jest and do not select focused
validation. It runs that test with focused coverage,
formatting, lint, source-mirroring, and selected safe convention checks. Focused
coverage maps `.mts` and `.cts` invocations to `.mjs` source files and maps other
supported extensions to the same source extension. This focused-invocation mapping
does not change the application and library convention: maintained source modules
still require exactly one corresponding `.test.mjs` file. `.mts` and `.cts` are
focused-invocation extensions only; they do not change the required mirrored test
filename. Application profile coverage enforcement remains limited to native
`.mjs` production files.
The source/test mirror inventory includes all files. In library repositories,
a `.d.ts` declaration is valid only beside a same-basename `.mjs` implementation
in `src/`; it is grouped with that module's `.test.mjs` mirror and checked by
the required typecheck script.
Each mirrored `.test.mjs` must contain an executable Jest `test` or `it`
declaration and reference its exact source module; syntax-aware validation
ignores comments and strings and rejects unrelated imports.
Test files under `tests/` use
`.test.*` or `.spec.*` names with `.js`, `.jsx`, `.ts`,
`.tsx`, `.mjs`, `.cjs`, `.mts`, or `.cts` extensions.
Focused validation also runs selected safe convention checks; those checks can
inspect repository metadata beyond the selected test file.

## Configuration

Repositories declare their applicable convention documents in
`package.json.eliware.apply`. Authorized rule exemptions are recorded in
`package.json.eliware.exempt` with the rule ID, reason, approver, approval
timestamp, and expiry.

The validator uses the repository's declared configuration and does not infer
applicability from its files, dependencies, or project shape.

`package.json.eliware` contains exactly `id`, `apply`, and optional `exempt`, in
that order. On each run, the validator checks for `../docs/repo-map.yaml`. When
present, that map is authoritative for the package ID, description, keywords,
and applied profiles; the README description is checked through the existing
README-to-package description validation. When the map is absent, package
metadata supplies the README description and specification ID namespace.
Specification rule IDs in every YAML file under `specs/`, including
subfolders, must use the repository's assigned E-number. Canonical author,
repository URL/object, homepage, Node.js engine, and distinct keyword
requirements apply whether or not the map is available.

## Common commands

Shared validation requires exactly `.github/workflows/ci.yaml` and
`.knit/deploy.yaml`. The npm and GHCR publication profiles add one shared
`.github/workflows/publish.yaml`; no other GitHub Actions or Knit workflow YAML
files are allowed. Each allowed workflow must contain one YAML document and
must satisfy its profile-specific checks. GitHub Actions and Knit inventories
are validated separately.

Repositories that select `ghcr-published` document their image in the existing
README `Usage` section using the canonical `Image`, `Pull command`, `Supported
tags`, and `Deployment boundary` markers defined in
`specs/conventions/ghcr-published.yaml`. The pull command uses the exact package
version tag. If the publication workflow also pushes `latest`, document it as a
mutable convenience alias that is never the release or deployment identity.
The automated check validates these markers; project owners remain responsible
for the semantic accuracy of image purpose, architecture support, and deployment
instructions.

```text
eliware-test --help
eliware-test --version
eliware-test
eliware-test --lint
eliware-test --format-check
eliware-test --audit
```

The following npm scripts are available only in this package's own repository:
`npm test`, `npm run lint`, `npm run format`, `npm run format:check`,
`npm run audit`, and `npm run pack`. The `--pack` mode selects package
validation only when the `npm-published` profile is selected. Without that
profile, the command has no applicable package check and does not run `npm pack`.

The normal test command runs the configured validation stages. Each public
tool mode has its own accepted arguments. Audit accepts only `--no-fund` and
`--no-progress`; lint accepts only `--threads=<positive-count>`. Options such
as `--omit` that narrow the dependency scope are rejected. Pack also has its
own allowlist. Wrapper-owned settings and arguments
that weaken required checks are rejected:

During aggregate or focused validation, checks that do not depend on Jest
results or coverage run first. A failure in those checks prevents Jest and its
result or coverage checks from starting. When they pass, Jest runs before its
dependent checks. With `--debug-timing`, skipped checks are identified when a
prerequisite failure prevents them from running.

```text
eliware-test --lint --fix
eliware-test --format --log-level=warn
eliware-test --format-check --log-level=debug
eliware-test --audit --no-fund
```

Lint argument forwarding is limited to a positive Oxlint thread count. Other
lint options are rejected before Oxlint starts. Validation modes select the
applicable check; repository inventory remains lazy and traverses the paths
requested by that check when it asks for repository-wide entries.

The `--pack` mode runs `npm pack` validation for repositories that select the
`npm-published` profile. Other repositories have no applicable pack check.

Tool modes may not be combined with a focused Jest test path. Paths supplied
to a tool mode are forwarded as tool arguments; focused paths are reserved for
the unscoped Jest validation command. Wrapper tool arguments before `--` precede
forwarded arguments after `--`, and each group preserves its original order. The
separator itself is removed before forwarding. For example,
`eliware-test --audit --no-fund -- --no-progress` forwards
`--no-fund --no-progress` to npm.
`--debug-timing` is wrapper-owned, may appear once before a focused path or tool mode (or alone for aggregate validation), and is
rejected after `--`.
Prettier arguments that override the selected mode, canonical formatting
configuration, or required maintained-file coverage are rejected.

The normal test command runs the configured validation stages. In the
`@eliware/test` repository checkout only, use `npm run audit` and
`npm run pack` for the isolated audit and package validation stages. Consumer
repositories use `eliware-test --audit` and, when they select the
`npm-published` profile, `eliware-test --pack` (or the corresponding
`node bin/eliware-test.mjs` commands); npm script names are not accepted as
direct CLI arguments.

To validate one focused Jest path, pass its repository-relative path to
`eliware-test`. Focused
paths are rejected when they do not exist, and coverage is narrowed to an
unambiguous mirrored source module when possible. Focused validation also
checks the selected Jest run's coverage and output, runs Oxlint and Prettier
only on the selected source/test pair, and validates that pair's mirroring and
test contract. It also runs convention checks explicitly marked safe for focused
validation. Those checks may inspect repository-level configuration or
metadata, so a focused run does not mean every repository-wide check is skipped.
Convention checks not marked safe for focused validation, including the
aggregate audit and pack stages, remain skipped:

```text
eliware-test tests/example.test.mjs
```

`--debug-timing` streams completed stage timing and one start/completion line
with elapsed time for each Jest suite while validation is running. It does not
write a separate Jest timing report after validation completes. The timing
stream is written to the CLI writer supplied by the invocation; programmatic
callers that omit a writer receive no live timing stream. Jest runs in-band by
default. Jest option/value pairs are forwarded
unchanged, and a value is not interpreted as a focused path. Each test suite
has a five-second maximum total runtime, even when it produces output. A separate
15-second no-progress watchdog covers Jest startup and pauses between suites.
These safeguards apply without `--debug-timing`. On timeout, the harness requests graceful child termination,
escalates to forced termination after a one-second grace period, and reports
whether the child's close was observed. It returns an unconfirmed timeout
diagnostic if close is still not observed after the bounded confirmation
period; cleanup of every descendant process cannot be guaranteed.

Coverage and monolith checks are always enforced by the public validation
commands; no public ignore flags bypass them.

## Compatibility boundaries

The validator resolves Jest, Oxlint, Prettier, and npm from the consumer
repository or supported Node.js/Windows executable locations. Workflow parsing
normalizes YAML 1.1 `true` keys and equivalent runner/input spellings before
domain checks consume them. Structured references to local files must resolve
within the consumer repository when a profile-owned check declares those fields.
General README link validation does not interpret arbitrary JSON or YAML `path`
values. Local paths that escape the repository are rejected; external URI
references are handled by their URI scheme and are not resolved as repository
files.
Git-sensitive checks use Git
metadata when available and retain filesystem discovery only for non-Git test
fixtures. The tracked-symlink check reads Git index mode `120000` and rejects
all tracked symlink entries, including links to files or directories. It does
not inspect untracked paths or resolve targets; validation fails if it cannot
read the Git index.

## README link validation

Every `README.md` in a repository is checked under the general profile,
regardless of its other profiles. Validation supports inline Markdown links and
images, full reference links with matching definitions, quoted HTML `href` and
`src` attributes, and angle-bracket HTTP, HTTPS, and `mailto` autolinks. Inline
destinations cannot contain whitespace or a closing parenthesis. Links inside
code spans and fenced code blocks are ignored; shortcut and collapsed reference
links, raw HTML links outside `href` and `src`, and other Markdown extensions
are outside the supported syntax.

Local relative links must resolve to files or directories inside the checkout.
Fragments are checked against headings and explicit HTML `id` attributes in
local Markdown targets. Fragments on local non-Markdown targets are not checked.
HTTP and HTTPS URLs must contain a hostname and must not contain credentials;
`mailto` links must contain an email address. Links to another GitHub repository
must use a full HTTPS URL with owner and repository path. External and
cross-repository fragments are not checked because doing so would require
fetching their targets.
