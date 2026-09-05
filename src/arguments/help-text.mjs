export const HELP_TEXT = `Usage:
  eliware-test                          Run validation (policy, Jest, coverage, lint, architecture, scripts)
  eliware-test --lint                   Run lint and workspace policy checks only
  eliware-test --version | -v            Show the package version
  eliware-test --help | -h               Show this help
  eliware-test --ignore-100x4             Diagnostic run without coverage enforcement
  eliware-test --ignore-monolith-limits  Diagnostic run without size enforcement
  eliware-test --workers=6               Set monolith-scan measurement workers
  eliware-test --debug-timing             Show pipeline and best-effort Jest timing
  eliware-test tests/foo.test.mjs        Run a focused test path
  eliware-test --runInBand                 Use the default in-band execution
  eliware-test --no-runInBand              Allow Jest's parallel execution
  npm test -- <Jest filters>              Forward supported filters to Jest
  npm test -- tests/foo.test.mjs         Run a focused test path
  npm test -- --no-runInBand              Allow Jest's default parallel execution

Node.js 26+ is required. Focused paths are checked before Jest and never fall
back to the full suite. Normal validation also enforces source/test mapping and
monolith limits, then runs defined audit, pack, build, and typecheck scripts;
missing scripts are skipped. Wrapper flags are consumed by eliware-test;
managed Jest options such as --coverage, --silent, and --runTestsByPath are
rejected. Jest runs in-band by default; --no-runInBand opts out. The
--ignore-100x4 flag collects coverage without enforcing its thresholds, while
--ignore-monolith-limits reports but does not fail on size violations. Normal
validation enforces source/test mapping and monolith limits. Diagnostic bypasses still
run tests and lint. Wrapper flags may be passed after npm test --. Recognized
test paths use strict path selection, even with mixed name filters; missing
paths fail without falling back to the full suite. Set
ELIWARE_TEST_DEBUG=1 to show the fixed coverage-fallback diagnostic; this is
separate from --debug-timing.
See specs/cli.md for the stable exit-code meanings used by CI.
Defined audit, pack, build, and typecheck scripts run after validation; missing
scripts are skipped and any failing check returns wrapper exit code 17.
Configure consumer scripts as test=eliware-test and lint=eliware-test --lint;
see README.md for migration details.
`;
