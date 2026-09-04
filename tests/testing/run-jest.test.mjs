import { resolveJestBin, resolvePackage, runJest } from '../../src/testing/run-jest.mjs';

test('exports the Jest executor', () => {
  expect(runJest).toBeInstanceOf(Function);
});

test('resolves declared Jest bin forms and rejects missing metadata', () => {
  expect(resolveJestBin({ bin: 'bin/jest.js' }, 'C:/repo/node_modules/jest/package.json')).toMatch(/bin[\\/]jest\.js$/);
  expect(() => resolveJestBin({}, 'C:/repo/package.json')).toThrow('does not declare');
  expect(() => resolveJestBin(null, 'C:/repo/package.json')).toThrow(TypeError);
});

test('falls back to package resolution', () => {
  expect(resolvePackage('jest/package.json', { resolve: () => { throw new Error('missing'); } }, { resolve: (name) => `package/${name}` })).toBe('package/jest/package.json');
});

test('rejects malformed invocation options', async () => {
  await expect(runJest(null, { cwd: process.cwd() })).rejects.toThrow('argument array');
  await expect(runJest([], {})).rejects.toThrow('requires cwd');
});

test('runs Jest with in-band execution by default', async () => {
  await expect(runJest(['--version'], { cwd: process.cwd() }))
    .resolves.toMatchObject({ code: 0, output: expect.stringMatching(/\d+\./) });
});

test('preserves explicit execution mode choices', async () => {
  await expect(runJest(['--version', '--runInBand'], { cwd: process.cwd() }))
    .resolves.toMatchObject({ code: 0 });
  await expect(runJest(['--version'], { cwd: process.cwd(), runInBand: false }))
    .resolves.toMatchObject({ code: 0 });
});
