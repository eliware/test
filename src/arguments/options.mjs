export const HELP_TEXT = `Usage:
  eliware-test                         Run Jest with coverage, then lint
  eliware-test --lint                  Run lint only
  eliware-test --version              Show the package version
  eliware-test --ignore-100x4          Run tests without coverage enforcement
  eliware-test --ignore-monolith-limits Run tests while refactoring large files
  eliware-test --sanitize-env          Run child tools with a minimal environment
  npm test -- <Jest arguments>         Forward arguments to Jest
  npm test -- --no-runInBand           Allow Jest's default parallel execution
`;

export const MANAGED_OPTIONS = Object.freeze(['--coverage', '--detectOpenHandles', '--silent', '--coverageReporters', '--runTestsByPath']);
export const VALUE_OPTIONS = Object.freeze(['-t', '--testNamePattern', '--config', '--rootDir', '--testMatch', '--testPathPattern', '--selectProjects', '--projects', '--runTestsByPath', '--env', '--watchPathIgnorePatterns', '--moduleNameMapper', '--outputFile']);
