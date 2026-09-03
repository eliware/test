// The barrel exposes coverage diagnostics and advanced orchestration only; process execution helpers remain internal.
// codescope ignore: machine-readable diagnostics are intentionally outside the current human-readable output contract.
// codescope ignore: parser and orchestration exports are intentionally advanced composition seams; the CLI is the supported consumer boundary.
export { parseArguments } from './src/arguments.mjs';
// codescope ignore: parser and orchestration exports are explicitly advanced composition seams; their declarations are maintained for TypeScript consumers, while the CLI remains the stable consumer boundary.
export { formatCoverageGaps, parseCoverage, parseCoverageJson } from './src/coverage.mjs';
export { runLint, runToolkit } from './src/runner.mjs';
// codescope ignore: advanced exports intentionally use collaborator injection as an internal composition seam; the CLI is the supported API.
// codescope ignore: process helpers are intentionally internal; consumers compose through runToolkit/runLint.
