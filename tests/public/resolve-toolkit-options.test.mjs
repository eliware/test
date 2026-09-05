import { resolveToolkitOptions } from '../../src/public/resolve-toolkit-options.mjs';

test('preserves supplied collaborators and defaults', () => {
  const write = () => {};
  const runTest = () => {};
  const options = resolveToolkitOptions({ cwd: '.', runnerArguments: [], write, runTest });
  expect(options).toMatchObject({ cwd: '.', runnerArguments: [], write, runTest, runInBand: true, ignoreCoverage: false, enforceMonolithLimits: false });
  expect(options.runLintCommand).toEqual(expect.any(Function));
  expect(options.inspectWorkspace).toEqual(expect.any(Function));
});

test('preserves debug timing for the toolkit stages', () => {
  expect(resolveToolkitOptions({ cwd: '.', runnerArguments: [], write: () => {}, debugTiming: true }).debugTiming).toBe(true);
});
