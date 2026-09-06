import { jest } from '@jest/globals';
import { scheduleChildTimeout } from '../../src/processes/schedule-child-timeout.mjs';

test('escalates and reports an unkillable child', () => {
  jest.useFakeTimers();
  try {
    const child = {};
    const terminate = jest.fn();
    const finish = jest.fn();
    scheduleChildTimeout(child, { timeoutMs: 10, terminate, getErrorMessage: () => 'error\n', finish });
    jest.advanceTimersByTime(2010);
    expect(terminate).toHaveBeenCalledWith(child, 'SIGTERM');
    expect(terminate).toHaveBeenCalledWith(child, 'SIGKILL');
    expect(finish).toHaveBeenCalledWith(expect.stringContaining('error'));
  } finally { jest.useRealTimers(); }
});

test('cancels all pending escalation timers', () => {
  jest.useFakeTimers();
  try {
    const terminate = jest.fn();
    const cancel = scheduleChildTimeout({}, { timeoutMs: 10, terminate, finish: () => {} });
    cancel();
    jest.advanceTimersByTime(3000);
    expect(terminate).not.toHaveBeenCalled();
  } finally { jest.useRealTimers(); }
});

test('uses the default termination collaborator', () => {
  jest.useFakeTimers();
  try {
    const finish = jest.fn();
    const cancel = scheduleChildTimeout({}, { timeoutMs: 10, getErrorMessage: undefined, terminate: undefined, finish });
    jest.advanceTimersByTime(2010);
    expect(finish).toHaveBeenCalled();
    cancel();
  } finally { jest.useRealTimers(); }
});
