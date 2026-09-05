import { EventEmitter } from 'node:events';
import { spawnChild } from '../../src/processes/spawn-child.mjs';
import { createOutputCapture } from '../../src/processes/output/capture-output.mjs';
import { monitorChildProcess } from '../../src/processes/monitor-child-process.mjs';
import { jest } from '@jest/globals';

test('delegates spawning with workspace defaults', () => {
  const child = new EventEmitter();
  const calls = [];
  const result = spawnChild('node', ['--version'], { cwd: 'C:/repo', spawn: (...args) => { calls.push(args); return child; } });
  expect(result).toBe(child);
  expect(calls[0][0]).toBe('node');
  expect(calls[0][1]).toEqual(['--version']);
  expect(calls[0][2]).toMatchObject({ cwd: 'C:/repo', windowsHide: true, shell: false });
});

test('uses the default spawn implementation when no override is supplied', () => {
  const child = spawnChild(process.execPath, ['-e', 'process.exit(0)'], { cwd: process.cwd() });
  expect(child).toBeDefined();
  child.kill();
});

test('uses default spawn options', () => {
  const child = spawnChild(process.execPath, ['-e', 'process.exit(0)']);
  expect(child).toBeDefined();
  child.kill();
});

test('detaches on Darwin', () => {
  const originalPlatform = process.platform;
  const calls = [];
  try {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    spawnChild('node', [], { spawn: (...args) => { calls.push(args); return new EventEmitter(); } });
    expect(calls[0][2].detached).toBe(true);
  } finally {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  }
});

test('settles and terminates a child that never closes', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.pid = 999999;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = jest.fn();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(10);
    jest.advanceTimersByTime(2000);
    await expect(resultPromise).resolves.toEqual({ code: 1, output: 'Child process timed out after 10 ms\nChild process remained alive after SIGKILL\n' });
    expect(child.kill).toHaveBeenCalledTimes(3);
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
    jest.advanceTimersByTime(2000);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
    jest.advanceTimersByTime(1000);
  } finally {
    jest.useRealTimers();
  }
});

test('terminates the process group on supported POSIX platforms', async () => {
  jest.useFakeTimers(); const originalKill = process.kill; const originalPlatform = process.platform;
  try { Object.defineProperty(process, 'platform', { value: 'linux', configurable: true }); process.kill = jest.fn();
    const child = new EventEmitter(); child.pid = 1234; child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = jest.fn();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 }); jest.advanceTimersByTime(10); jest.advanceTimersByTime(2000);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 }); expect(process.kill).toHaveBeenCalledWith(-1234, 'SIGTERM');
  } finally { process.kill = originalKill; Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true }); jest.useRealTimers(); }
});
test('stops escalation when SIGTERM closes the child', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.kill = jest.fn(() => child.emit('close', null));
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(10);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  } finally { jest.useRealTimers(); }
});

test('contains kill failures after timeout settlement', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.kill = jest.fn(() => { throw new Error('kill failed'); });
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(10);
    jest.advanceTimersByTime(2000);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
  } finally { jest.useRealTimers(); }
});

test('forces a second termination attempt after timeout', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.kill = jest.fn();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(10);
    jest.advanceTimersByTime(2000);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  } finally { jest.useRealTimers(); }
});

test('stops escalation when the first forced kill closes the child', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.kill = jest.fn((signal) => { if (signal === 'SIGKILL') child.emit('close', null); });
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(1010);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
    expect(child.kill).toHaveBeenCalledTimes(2);
  } finally { jest.useRealTimers(); }
});

test('skips a forced kill when the child closes during the wait', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.kill = jest.fn();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(510);
    child.emit('close', null);
    jest.advanceTimersByTime(1000);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
    expect(child.kill).toHaveBeenCalledTimes(1);
  } finally { jest.useRealTimers(); }
});

test('skips the final kill when the child closes after the first forced kill', async () => {
  jest.useFakeTimers();
  try {
    const child = new EventEmitter();
    child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.kill = jest.fn();
    const resultPromise = monitorChildProcess(child, createOutputCapture(), { timeoutMs: 10 });
    jest.advanceTimersByTime(1010);
    child.emit('close', null);
    jest.advanceTimersByTime(1000);
    await expect(resultPromise).resolves.toMatchObject({ code: 1 });
    expect(child.kill).toHaveBeenCalledTimes(2);
  } finally { jest.useRealTimers(); }
});
