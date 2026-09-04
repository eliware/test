export const HELP_TEXT = `Usage:
  eliware-test                         Run Jest with coverage, then lint
  eliware-test --lint                  Run lint only
  eliware-test --version              Show the package version
  eliware-test --ignore-100x4          Run tests without coverage enforcement
  eliware-test --ignore-monolith-limits Run tests while refactoring large files
  eliware-test --debug-timing          Show elapsed time between pipeline steps
  npm test -- <Jest arguments>         Forward arguments to Jest
  npm test -- --no-runInBand           Allow Jest's default parallel execution
`;
