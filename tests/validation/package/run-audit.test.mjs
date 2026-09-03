import { AUDIT_ARGUMENTS, runAudit } from '../../../src/validation/package/run-audit.mjs';

test('uses a production-only moderate audit', () => {
  expect(AUDIT_ARGUMENTS).toEqual(['audit', '--omit=dev', '--audit-level=moderate', '--ignore-scripts']);
});

test('requires a workspace context', () => {
  expect(() => runAudit({})).toThrow(TypeError);
});

test('exports the npm audit executor', () => {
  expect(runAudit).toBeInstanceOf(Function);
});
