import { runJest } from '../../src/testing/run-jest.mjs';

test('exports the Jest executor', () => {
  expect(runJest).toBeInstanceOf(Function);
});

test('rejects malformed invocation options', async () => {
  await expect(runJest([], {})).rejects.toThrow('requires cwd');
});
