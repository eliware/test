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
  child.emit('close', 0);
});

test('normalizes process errors', async () => {
  const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
  const resultPromise = monitorChildProcess(child, createOutputCapture());
  child.emit('error', new Error('missing executable'));
  child.stdout.emit('data', 'late diagnostic\n');
  child.emit('close', null);
  await expect(resultPromise).resolves.toEqual({ code: 1, output: 'late diagnostic\nmissing executable\n' });
});

test('preserves the first process error when multiple errors occur', async () => { const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); const resultPromise = monitorChildProcess(child, createOutputCapture()); child.emit('error', new Error('first failure')); child.emit('error', new Error('second failure')); child.emit('close', null); await expect(resultPromise).resolves.toMatchObject({ output: 'first failure\n' }); });

test('uses the existing timeout path when an error has no close', async () => {
  jest.useFakeTimers();
  try { const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); const result = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 }); child.emit('error', new Error('spawn failed')); jest.advanceTimersByTime(2010); await expect(result).resolves.toMatchObject({ code: 1 }); }
  finally { jest.useRealTimers(); }
});

test('normalizes an invalid close code without a process error', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = monitorChildProcess(child, createOutputCapture());
  child.emit('close', null);
  await expect(resultPromise).resolves.toMatchObject({ code: 1 });
});

test('normalizes a child without output streams', async () => {
  await expect(monitorChildProcess(new EventEmitter(), createOutputCapture())).resolves.toEqual({
    code: 1, output: 'Invalid child process interface\n',
  });
});

test('rejects invalid timeout values', async () => {
  const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
  await expect(monitorChildProcess(child, createOutputCapture(), { timeoutMs: 0 })).resolves.toEqual({ code: 1, output: 'Invalid child process timeout\n' });
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
  child.emit('close', 1);
  await expect(resultPromise).resolves.toEqual({ code: 1, output: 'missing executable\n' });
});

test('terminates the process group on Darwin', async () => {
  jest.useFakeTimers();
  const originalPlatform = process.platform;
  const originalKill = process.kill;
  try {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    process.kill = jest.fn();
    const child = new EventEmitter();
    child.pid = 1234;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = jest.fn();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(2010);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
    expect(process.kill).toHaveBeenCalledWith(-1234, 'SIGTERM');
  } finally {
    process.kill = originalKill;
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    jest.useRealTimers();
  }
});

test('clears pending escalation when the child closes after timeout', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = jest.fn();
    const result = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(10);
    child.emit('close', 0);
    jest.advanceTimersByTime(2000);
    await expect(result).resolves.toMatchObject({ code: 0 });
    expect(child.kill).toHaveBeenCalledTimes(1);
  } finally { jest.useRealTimers(); }
});

test('clears final escalation when the child closes after force kill', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = jest.fn();
    const result = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(1010);
    child.emit('close', 0);
    jest.advanceTimersByTime(1000);
    await expect(result).resolves.toMatchObject({ code: 0 });
    expect(child.kill).toHaveBeenCalledTimes(2);
  } finally { jest.useRealTimers(); }
});
