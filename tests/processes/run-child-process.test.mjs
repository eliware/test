import { EventEmitter } from 'node:events';
import { runChildProcess } from '../../src/processes/run-child-process.mjs';

test('rejects malformed process arguments before spawning', () => {
  expect(() => runChildProcess('', [])).toThrow(TypeError);
  expect(() => runChildProcess(process.execPath, 'not-an-array')).toThrow(TypeError);
  expect(() => runChildProcess(process.execPath, [], null)).toThrow(TypeError);
});

test('uses default arguments and options', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const resultPromise = runChildProcess('ignored', undefined, { spawn: () => child });
  child.emit('close', 0);
  await expect(resultPromise).resolves.toEqual({ code: 0, output: '' });
});

test('captures a successful child process', async () => {
  await expect(runChildProcess(process.execPath, ['-e', 'process.stdout.write("ok")'], { cwd: process.cwd() }))
    .resolves.toEqual({ code: 0, output: 'ok' });
});

test('normalizes synchronous spawn failures', async () => {
  await expect(runChildProcess('ignored', [], { spawn: () => { throw new Error('spawn failed synchronously'); } }))
    .resolves.toEqual({ code: 1, output: 'spawn failed synchronously\n' });
});
