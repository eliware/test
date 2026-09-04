import { resolveJestBin, resolveJestRuntime } from '../../src/testing/resolve-jest-runtime.mjs';

test('resolves the workspace Jest runtime and executable', () => {
  const runtime = resolveJestRuntime(process.cwd());
  expect(runtime.metadata).toBeDefined();
  expect(resolveJestBin(runtime.metadata, runtime.packagePath)).toMatch(/jest[\\/]/i);
});

test('resolves declared Jest bin forms and rejects missing metadata', () => {
  expect(resolveJestBin({ bin: 'bin/jest.js' }, 'C:/repo/node_modules/jest/package.json')).toMatch(/bin[\\/]jest\.js$/);
  expect(() => resolveJestBin({}, 'C:/repo/package.json')).toThrow('does not declare');
  expect(() => resolveJestBin(null, 'C:/repo/package.json')).toThrow(TypeError);
});
