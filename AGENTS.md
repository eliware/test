# `@eliware/test` contributor guidance

This repository provides the single bundled Eliware baseline for routine Jest
testing, coverage enforcement, and Oxlint validation. Keep project-specific
smoke, integration, regression, and end-to-end workflows in consuming
repositories.

## Rules

- Use Node.js 26, native ESM, and `.mjs` source and test files.
- Keep Jest and Oxlint bundled as runtime dependencies.
- Keep package metadata, lockfile, exports, declarations, README, release
  notes, and packed files synchronized.
- Use Node.js child-process APIs and argument arrays; do not use shell
  pipelines, `grep`, shell quoting, or platform-specific executable assumptions.
- Preserve useful failure diagnostics and keep successful output concise.
- Enforce statements, branches, functions, and lines independently.
- Do not hide real coverage gaps with ignore comments.

## Consumer migration

1. Remove direct Jest and Oxlint dev dependencies unless required by runtime
   code or a separately documented workflow.
2. Install `@eliware/test` as a development dependency.
3. Set `test` to `eliware-test` and `lint` to `eliware-test --lint`.
4. Run `npm install` and review the lockfile.
5. Run specialized smoke, integration, regression, and E2E checks separately.

## Validation

```text
node bin/eliware-test.mjs
npm test
npm run lint
npm audit --omit=dev --audit-level=moderate
npm pack --dry-run
```

Follow the legacy pre-release and release runbooks before publication. Never
tag, publish, push, or deploy without explicit authorization.
