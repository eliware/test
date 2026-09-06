import { jest } from '@jest/globals';
import { handleTimingReport } from '../../../src/public/stages/handle-timing-report.mjs';

test('formats an in-memory timing report', () => {
  const write = jest.fn();
  expect(handleTimingReport({ timingOutput: JSON.stringify({ testResults: [] }), write })).toBeNull();
});

test('writes formatted in-memory timing rows', () => {
  const write = jest.fn();
  handleTimingReport({ timingOutput: `prefix\n${JSON.stringify({ testResults: [{ testFilePath: 'tests/a.mjs', perfStats: { start: 0, end: 1000 }, assertionResults: [] }] })}\nsuffix`, write });
  expect(write).toHaveBeenCalledWith(expect.stringContaining('Test file timings:'));
});

test('does nothing when timing is disabled', () => {
  expect(handleTimingReport({ timingOutput: false, write: jest.fn() })).toBeNull();
});

test('keeps optional timing parse failures non-fatal', () => {
  const write = jest.fn();
  expect(handleTimingReport({ timingOutput: '{bad', write })).toBeNull();
  expect(write).toHaveBeenCalledWith(expect.stringContaining('Timing report unavailable'));
});

test('rejects JSON without Jest timing results', () => {
  const write = jest.fn();
  handleTimingReport({ timingOutput: '{"other":true}', write });
  expect(write).toHaveBeenCalledWith(expect.stringContaining('Timing report unavailable'));
});
