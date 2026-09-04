import { resolveOxlintBin, resolveOxlintRuntime } from '../../../src/validation/lint/resolve-oxlint-runtime.mjs';

test('resolves the workspace Oxlint executable', () => {
  expect(resolveOxlintRuntime(process.cwd())).toMatch(/oxlint[\\/]bin[\\/]oxlint(?:\.js)?$/i);
});

test('resolves declared Oxlint bin forms and rejects missing metadata', () => {
  expect(resolveOxlintBin({ bin: 'bin/oxlint' }, 'C:/repo/node_modules/oxlint/package.json')).toMatch(/bin[\\/]oxlint$/);
  expect(() => resolveOxlintBin({}, 'C:/repo/package.json')).toThrow('does not declare');
  expect(() => resolveOxlintBin(null, 'C:/repo/package.json')).toThrow(TypeError);
});

test('accepts an injected package resolver', () => {
  const calls = [];
  const executable = resolveOxlintRuntime(process.cwd(), (name, consumer, bundled) => {
    calls.push([name, consumer, bundled]);
    return consumer.resolve(name);
  });
  expect(executable).toMatch(/node_modules[\\/]oxlint[\\/]bin[\\/]oxlint/i);
  expect(calls[0][0]).toBe('oxlint/package.json');
});
