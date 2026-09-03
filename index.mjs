// The barrel exposes coverage diagnostics and advanced orchestration only; process execution helpers remain internal.
export { parseArguments } from './src/arguments.mjs';
export { VALUE_OPTIONS } from './src/arguments.mjs';
export { formatCoverageGaps, parseCoverage, parseCoverageJson } from './src/coverage.mjs';
export { runLint, runToolkit } from './src/runner.mjs';
export { findIstanbulIgnoreViolations } from './src/istanbul.mjs';
export { isPureBarrelFile, isPureBarrelSource } from './src/istanbul.mjs';
export { percentageWithUnknowns } from './src/coverage.mjs';
export { EXIT_CODES } from './src/exit-codes.mjs';
