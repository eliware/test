# `@eliware/test` contributor guidance

## Instruction scope

These instructions apply repository-wide. No subdirectory-specific AGENTS.md
files currently override them.

## Read before changing

Read README.md, AGENTS.md, and applicable documentation before changes. In
particular, read the applicable documentation and specifications under `docs/`
and `specs/` before changing files.

## Authoritative sources

- `eliware/docs` is authoritative for shared documentation content and
  cross-repository ownership.
- `eliware/conventions` is authoritative for repository structure, required
  files, metadata, and committed contents.
- `eliware/operations` is authoritative for release, deployment, and other
  cross-cutting operational procedures.
- Read `../docs/authority-map.json`, `../conventions/specs/`,
  `../operations/specs/directives.json`, and the relevant local specification
  before changing governance files.
- This repository's `specs/directives.json` is authoritative only for the
  validator harness contract; it does not define repository requirements,
  exemptions, publication policy, deployment, or operations.

## Repository identity

- Project: `@eliware/test`
- Purpose: native v8 implementation of the shared Eliware deterministic
  validation CLI.
- Runtime: Node.js 26 with native ESM and `.mjs` source and test files.

## Scope and boundaries

- The older repository is reference material only; Test does not provide a
  compatibility layer.
- The CLI entrypoint is `bin/eliware-test.mjs`.
- This repository performs local and CI validation only. Release, publication,
  deployment, and other operational changes are controlled by Eliware runbooks.
- Do not modify `test/src` or `test/tests` as part of documentation-only or
  instruction-alignment work unless separately authorized.
- Test validates repository directives as a consumer of the authoritative
  Docs/Conventions/Operations policies; it does not own or redefine those
  policies.

## Repository-specific rules

- Runtime commands are the package scripts in `package.json`; `.env.example`
  documents repository environment configuration.
- Application configuration, connection lifecycle, repeatable shutdown, and
  externally observable workflow requirements must remain documented when they
  apply to a consuming application repository.
- Supported modes include the default validation run, `--lint`, `--format`,
  `--format-check`, `--help`, `--version`, focused Jest arguments, and the
  documented diagnostic flags. Usage validation rejects unsupported or missing
  paths before Jest starts.
- Platform-specific process behavior must use Node APIs and argument arrays;
  do not assume a Unix shell or platform-specific executable names.
- Keep new modules single-purpose and keep orchestrators limited to composition.
- Exercise new modules through existing Jest suites where possible; add
  mirrored test files when required by applicable conventions or explicitly
  requested.
- Keep fixtures and source-less test support under one root `artifacts/`
  directory.
- Add new orchestrators, sub-orchestrators, adapters, and registry modules;
  do not add v8 behavior to the older reference repository.
- Preserve stable rule IDs, deterministic diagnostics, and the public CLI
  boundary.
- Keep instructions actionable, current, and concise. Project-specific rules
  may add detail without weakening the shared conventions; record approved
  deviations explicitly.
- Web, library, and application repositories have additional documentation
  requirements described in the applicable conventions.

## Required structure

- Keep the root `README.md`, `AGENTS.md`, `package.json`, `package-lock.json`,
  `LICENSE`, `.env.example`, and `RELEASE_NOTES.md` present.
- Keep `bin/eliware-test.mjs`, `src/`, and `tests/` as the CLI implementation
  and validation suites.
- Keep `docs/README.md` and `specs/README.md` as indexes for documentation and
  Test specifications.
- Keep `.knit/` and the package metadata required by the applicable convention
  profiles present and discoverable from the root README. Use the Tasklist CLI
  for live task-board mutations.

## Security and secrets

- No runtime secret or local `.env` file belongs in version control.
- Do not commit secrets, private runtime state, generated output, credentials,
  or machine state.
- Validation output must not print secrets or arbitrary environment values.

## Validation

- Validation commands are `npm test`, `npm run lint`, `npm run format:check`,
  and `git diff --check`.

## Approved deviations

- The self-hosting scripts use the local CLI because `@eliware/test` cannot
  install itself as its own development dependency. This is an approved
  package exemption and does not change the shared convention authority.

## Change control and authorization

- Do not release, publish, deploy, synchronize, tag, commit, or push without
  explicit authorization for the current task.
- The CLI performs no deploy, publish, release, or destructive repository
  operation.
- Public npm publication requirements are governed by the applied
  `npm-published` convention profile and the Operations release runbook.

## Subdirectory instructions

No subdirectory-specific AGENTS.md files currently override these repository-wide
instructions.
