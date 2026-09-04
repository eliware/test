import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';
import { createOutputCapture } from '../../src/processes/output/capture-output.mjs';
import { monitorChildProcess } from '../../src/processes/monitor-child-process.mjs';

test('settles with captured output and exit code', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = monitorChildProcess(child, createOutputCapture());
  child.stdout.emit('data', 'ok');
  child.emit('close', 0);
  await expect(resultPromise).resolves.toEqual({ code: 0, output: 'ok' });
});

test('normalizes process errors', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = monitorChildProcess(child, createOutputCapture());
  child.emit('error', new Error('missing executable'));
  await expect(resultPromise).resolves.toMatchObject({ code: 1, output: 'missing executable\n' });
});

test('ignores late lifecycle events and invalid close codes', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = monitorChildProcess(child, createOutputCapture());
  child.emit('error', new Error('missing executable'));
  child.stdout.emit('data', Buffer.from('late'));
  child.stderr.emit('data', Buffer.from('late error'));
  child.emit('close', null);
  await expect(resultPromise).resolves.toMatchObject({ code: 1, output: expect.stringContaining('missing executable') });
});

test('normalizes an invalid close code without a process error', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = monitorChildProcess(child, createOutputCapture());
  child.emit('close', null);
  await expect(resultPromise).resolves.toMatchObject({ code: 1 });
});

test('settles and terminates a child that never closes', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = jest.fn();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(10);
    await expect(resultPromise).resolves.toEqual({ code: 1, output: 'Child process timed out after 10 ms\n' });
    expect(child.kill).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

test('settles timeout without a kill method', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(10);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
  } finally {
    jest.useRealTimers();
  }
});

test('normalizes a child without output streams', async () => {
  await expect(monitorChildProcess(new EventEmitter(), createOutputCapture())).resolves.toEqual({
    code: 1, output: 'Invalid child process interface\n',
  });
});

test('normalizes listener setup failures', async () => {
  const child = new EventEmitter();
  child.stdout = { on: () => { throw new Error('stream unavailable'); } };
  child.stderr = new EventEmitter();
  await expect(monitorChildProcess(child, createOutputCapture())).resolves.toEqual({
    code: 1, output: 'stream unavailable\n',
  });
});

test('does not duplicate an error already captured on stderr', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = jest.fn();
  const resultPromise = monitorChildProcess(child, createOutputCapture());
  child.stderr.emit('data', 'missing executable\n');
  child.emit('error', new Error('missing executable'));
  await expect(resultPromise).resolves.toEqual({ code: 1, output: 'missing executable\n' });
});
