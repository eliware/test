# Release notes

## 8.0.0

### Added

- Created the native v8 implementation with machine-readable test specifications.
- Added the native ESM Jest CLI for Node.js 26 with stable informational
  commands, validation modes, focused test paths, in-band execution, progress
  timing, bounded output, timeout diagnostics, and stable failure codes.
- Added 100×4 coverage enforcement for statements, branches, functions, and
  lines, including detailed file-level gaps and remediation guidance.
- Added integrated Jest, Oxlint, Prettier, audit, pack, build, and typecheck
  validation stages where the selected convention documents require them.
- Added versioned convention-check discovery from the bundled `src/checks`
  tree, with no runtime dependency on the private conventions repository.
- Added explicit `package.json.eliware.apply` applicability selection and
  rule-level exemptions with metadata validation and ancestor-aware skipping.
- Added fail-fast validation for missing or malformed package configuration,
  unknown convention groups, unknown exemption IDs, and invalid check modules.
- Added strict source/test mirror enforcement: every source module has exactly
  one matching test module, directory and file structures match exactly, and
  test artifacts belong under the root `artifacts/` directory.
- Added deterministic checks for package metadata, native ESM usage, direct
  Jest/Oxlint/Prettier invocation, lockfiles, scripts, workflows, README and
  documentation surfaces, structured references, contracts, authority data,
  publication metadata, and repository safety.
- Added concise successful output, actionable failure diagnostics, bounded
  subprocess handling, and protected handling of secrets and local machine
  state.

### Fixed

- Corrected validation output and tightened standardized repository-content
  enforcement for the v8 conventions.
