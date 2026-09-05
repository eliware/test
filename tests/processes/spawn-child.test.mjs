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
