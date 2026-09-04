import { jest } from '@jest/globals';
import { handleTimingReport } from '../../../src/public/stages/handle-timing-report.mjs';

test('formats and removes a timing report', async () => {
  const write = jest.fn();
  const readFilePath = jest.fn(async () => JSON.stringify({ testResults: [] }));
  const removePath = jest.fn(async () => {});
  await expect(handleTimingReport({ cwd: 'repo', timingOutput: 'timings.json', readFilePath, removePath, write })).resolves.toBeNull();
  expect(removePath).toHaveBeenCalled();
});

test('keeps cleanup failure non-fatal', async () => {
  const error = new Error('locked');
  await expect(handleTimingReport({ cwd: 'repo', timingOutput: 'timings.json', readFilePath: async () => '{}', removePath: async () => { throw error; }, write: jest.fn() }))
    .resolves.toBeNull();
});

test('keeps optional timing failures non-fatal', async () => {
  const write = jest.fn();
  await expect(handleTimingReport({ cwd: 'repo', timingOutput: 'timings.json', readFilePath: async () => '{bad', removePath: async () => {}, write })).resolves.toBeNull();
  expect(write).toHaveBeenCalledWith(expect.stringContaining('Timing report unavailable'));
});

test('keeps combined timing parse and cleanup failures non-fatal', async () => {
  await expect(handleTimingReport({ cwd: 'repo', timingOutput: 'timings.json', readFilePath: async () => '{bad', removePath: async () => { throw new Error('locked'); }, write: jest.fn() }))
    .resolves.toBeNull();
});
