import { PACK_ARGUMENTS, runPack } from '../../../src/validation/package/run-pack.mjs';

test('uses a dry-run package command with scripts disabled', () => {
  expect(PACK_ARGUMENTS).toEqual(['pack', '--dry-run', '--ignore-scripts']);
});

test('exposes the package invocation as an immutable argument list', () => {
  expect(Object.isFrozen(PACK_ARGUMENTS)).toBe(true);
});

test('exports the npm pack executor', () => {
  expect(runPack).toBeInstanceOf(Function);
});
