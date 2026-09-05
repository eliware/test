import { createToolkitContext } from '../../src/public/create-toolkit-context.mjs';

test('creates shared lifecycle state and preserves injected options', () => {
  const write = () => {};
  const context = createToolkitContext({ cwd: '.', runnerArguments: ['--no-runInBand'], write, debugTiming: false });
  expect(context).toMatchObject({ cwd: '.', runnerArguments: ['--no-runInBand'], write, disableInBand: true });
  expect(context.timing).toEqual(expect.any(Object));
  expect(context.startedAt).toEqual(expect.any(Number));
});
