import { EventEmitter } from 'node:events';
import { spawnChild } from '../../src/processes/spawn-child.mjs';

test('delegates spawning with workspace defaults', () => {
  const child = new EventEmitter();
  const calls = [];
  const result = spawnChild('node', ['--version'], { cwd: 'C:/repo', spawn: (...args) => { calls.push(args); return child; } });
  expect(result).toBe(child);
  expect(calls[0][0]).toBe('node');
  expect(calls[0][1]).toEqual(['--version']);
  expect(calls[0][2]).toMatchObject({ cwd: 'C:/repo', windowsHide: true });
});
