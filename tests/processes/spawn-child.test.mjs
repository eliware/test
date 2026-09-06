import { EventEmitter } from 'node:events';
import { spawnChild } from '../../src/processes/spawn-child.mjs';

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

test('does not detach or mark process groups on Windows', () => {
  const originalPlatform = process.platform;
  const calls = [];
  const child = new EventEmitter();
  try {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    expect(spawnChild('node', [], { spawn: (...args) => { calls.push(args); return child; } })).toBe(child);
    expect(calls[0][2].detached).toBe(false);
    expect(child.__eliwareProcessGroup).toBeUndefined();
  } finally {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  }
});
