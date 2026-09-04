import { jest } from '@jest/globals';
import { handleTimingReport } from '../../../src/public/stages/handle-timing-report.mjs';

test('formats and removes a timing report', async () => {
  const write = jest.fn();
  const readFilePath = jest.fn(async () => JSON.stringify({ testResults: [] }));
  const removePath = jest.fn(async () => {});
  await expect(handleTimingReport({ cwd: 'repo', timingOutput: 'timings.json', readFilePath, removePath, write })).resolves.toBeNull();
  expect(removePath).toHaveBeenCalled();
});

test('returns cleanup failure', async () => {
  const error = new Error('locked');
  await expect(handleTimingReport({ cwd: 'repo', timingOutput: 'timings.json', readFilePath: async () => '{}', removePath: async () => { throw error; }, write: jest.fn() }))
    .resolves.toEqual({ code: 7 });
});
